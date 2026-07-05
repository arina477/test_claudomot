/**
 * StudyTimerService — wave-49 M8 shared study timer
 * Tasks: 1387d845 (compute-on-read service) + 832b83b7 (auto-advance + reconnect)
 * Extended: wave-50 task f4b3659e (per-server configurable work/break durations)
 *
 * BINDING MODEL (non-negotiable):
 *   Persist ANCHORS ONLY (phase, run_state, started_at, ends_at, paused_remaining_ms).
 *   Derive remaining/phase COMPUTE-ON-READ from ends_at − now().
 *   Auto-advance = ONE-SHOT setTimeout per server (cleared on pause/reset/re-arm).
 *   FORBIDDEN: per-server setInterval / @nestjs/schedule tick loop.
 *
 * Durations: per-server work_duration_ms / break_duration_ms columns (migration 0023).
 *   Constants below are ONLY the column DEFAULT fallback semantics — rows always carry
 *   their own values (NOT NULL DEFAULT). Every read/compute path receives the row's
 *   actual durations via phaseDurationMs(phase, row) — never the bare constants.
 *
 * Idempotency: doPhaseAdvance uses UPDATE WHERE ends_at = expectedEndsAt so concurrent
 *   or double-fired triggers produce exactly one DB write.
 *
 * Self-healing: if run_state='running' and ends_at < now() on getTimerRow/GET,
 *   computeCurrentPhase() re-derives the correct phase by walking forward from
 *   started_at — phase always re-derivable from anchors (self-healing on next read).
 *   Uses the row's own work_duration_ms / break_duration_ms so a custom-duration timer
 *   heals with its configured lengths, not the 25/5 defaults.
 *
 * Fan-out: emits 'study-timer.updated' via EventEmitter2 — StudyTimerGateway handles
 *   @OnEvent and broadcasts to the server room. No direct gateway injection (no circular dep).
 */

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  type OnModuleDestroy,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  StudyTimer,
  StudyTimerConfig,
  StudyTimerPhase,
  StudyTimerUpdateEvent,
} from '@studyhall/shared';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index';
import { server_members, server_study_timer } from '../db/schema/index';
import type { ServerStudyTimer } from '../db/schema/index';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { RbacService } from '../rbac/rbac.service';

// ---------------------------------------------------------------------------
// Duration constants — HARDCODED for MVP
// ---------------------------------------------------------------------------

export const WORK_DURATION_MS = 25 * 60 * 1000; // 25 minutes
export const BREAK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Domain event name (internal EventEmitter2 — NOT a Socket.IO event name)
// ---------------------------------------------------------------------------

export const STUDY_TIMER_UPDATED_EVENT = 'study-timer.updated' as const;

// ---------------------------------------------------------------------------
// Pure helpers — no side effects, fully unit-testable
// ---------------------------------------------------------------------------

/**
 * Duration for a given phase using the row's own configured durations.
 *
 * Every call site (start, phase-advance, self-heal, compute-on-read) passes the
 * row so a custom-duration server always uses its configured lengths, never the
 * bare constants.  The bare constants are only column DEFAULT fallback semantics.
 */
export function phaseDurationMs(
  phase: string,
  durations: { work_duration_ms: number; break_duration_ms: number },
): number {
  return phase === 'break' ? durations.break_duration_ms : durations.work_duration_ms;
}

function advancePhase(phase: string): StudyTimerPhase {
  return phase === 'work' ? 'break' : 'work';
}

/**
 * Compute the authoritative current phase and its newEndsAt from anchors.
 *
 * Self-healing: walks forward through work/break cycles from `initialPhase` at
 * `startedAt` until the active phase's end is in the future.  This is the
 * compute-on-read formula that re-derives phase when the service missed one or
 * more phase-transition emits (e.g. after a process restart).
 *
 * Uses the row's own durations so a restarted process heals a custom-duration
 * timer with the CONFIGURED lengths, not the 25/5 defaults (karen-2 fix).
 */
export function computeCurrentPhase(
  initialPhase: StudyTimerPhase,
  startedAt: Date,
  now: Date,
  durations: { work_duration_ms: number; break_duration_ms: number },
): { phase: StudyTimerPhase; newEndsAt: Date } {
  let phase: StudyTimerPhase = initialPhase;
  let phaseStartMs = startedAt.getTime();
  const nowMs = now.getTime();

  // Each iteration advances by at least break_duration_ms; bounded by elapsed time.
  let iterations = 0;
  const maxIterations = 10_000; // safety guard (years of drift even at 1-min cadence)
  while (iterations < maxIterations) {
    iterations++;
    const duration = phaseDurationMs(phase, durations);
    const phaseEndMs = phaseStartMs + duration;
    if (phaseEndMs > nowMs) {
      return { phase, newEndsAt: new Date(phaseEndMs) };
    }
    phase = advancePhase(phase);
    phaseStartMs = phaseEndMs;
  }

  // Unreachable in practice; defensive fallback uses row's work duration
  return { phase: 'work', newEndsAt: new Date(nowMs + durations.work_duration_ms) };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class StudyTimerService implements OnModuleDestroy {
  private readonly logger = new Logger(StudyTimerService.name);

  /**
   * One-shot auto-advance timeouts, keyed by serverId.
   * Cleared on pause/reset; re-armed on start/resume/phase-transition.
   * NEVER a repeating interval — one entry per server, replaced on each arm.
   */
  private readonly timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly emitter: EventEmitter2,
    private readonly rbacService: RbacService,
  ) {}

  // -------------------------------------------------------------------------
  // Lifecycle — clean up all pending timeouts on module destroy
  // -------------------------------------------------------------------------

  onModuleDestroy(): void {
    for (const handle of this.timeouts.values()) {
      clearTimeout(handle);
    }
    this.timeouts.clear();
  }

  // -------------------------------------------------------------------------
  // assertMember — gate on server_members membership (no role needed).
  // Mirrors scheduling.service.ts pattern. Throws 403 on failure.
  // IDOR-safe: serverId from route, userId from session — never client-supplied.
  // -------------------------------------------------------------------------

  private async assertMember(userId: string, serverId: string): Promise<void> {
    const [member] = await db
      .select({ id: server_members.id })
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, userId)))
      .limit(1);

    if (!member) {
      throw new ForbiddenException('You are not a member of this server');
    }
  }

  // -------------------------------------------------------------------------
  // rowToDto — COMPUTE-ON-READ derived DTO from persisted anchors.
  //
  // remainingMs:
  //   running → max(0, ends_at - now)
  //   paused  → paused_remaining_ms (frozen at pause time)
  //   idle    → 0
  // running: convenience boolean alias for run_state === 'running'
  // endsAt: ISO 8601 string when running/paused; null when idle
  // -------------------------------------------------------------------------

  private rowToDto(row: ServerStudyTimer): StudyTimer {
    const now = Date.now();
    let remainingMs = 0;

    if (row.run_state === 'running' && row.ends_at !== null) {
      remainingMs = Math.max(0, row.ends_at.getTime() - now);
    } else if (row.run_state === 'paused') {
      remainingMs = row.paused_remaining_ms ?? 0;
    }

    const phase = (row.phase === 'break' ? 'break' : 'work') as StudyTimerPhase;
    const runState =
      row.run_state === 'running'
        ? 'running'
        : row.run_state === 'paused'
          ? 'paused'
          : ('idle' as const);

    return {
      serverId: row.server_id,
      phase,
      runState,
      endsAt: row.ends_at !== null ? row.ends_at.toISOString() : null,
      remainingMs,
      running: row.run_state === 'running',
      updatedBy: row.updated_by ?? null,
      workDurationMs: row.work_duration_ms,
      breakDurationMs: row.break_duration_ms,
    };
  }

  // -------------------------------------------------------------------------
  // idleDto — calm idle DTO for servers with no timer row yet
  // -------------------------------------------------------------------------

  private idleDto(serverId: string): StudyTimer {
    return {
      serverId,
      phase: 'work',
      runState: 'idle',
      endsAt: null,
      remainingMs: 0,
      running: false,
      updatedBy: null,
      workDurationMs: WORK_DURATION_MS,
      breakDurationMs: BREAK_DURATION_MS,
    };
  }

  // -------------------------------------------------------------------------
  // getTimerRow — fetch the server_study_timer row (null = no row)
  // -------------------------------------------------------------------------

  private async getTimerRow(serverId: string): Promise<ServerStudyTimer | null> {
    const [row] = await db
      .select()
      .from(server_study_timer)
      .where(eq(server_study_timer.server_id, serverId))
      .limit(1);
    return row ?? null;
  }

  // -------------------------------------------------------------------------
  // selfHealIfOverdue — SELF-HEALING (832b83b7 acceptance criteria)
  //
  // If run_state='running' and ends_at < now(), the service missed one or more
  // phase transitions (e.g. after a process restart). Re-derive the authoritative
  // phase using computeCurrentPhase(), UPDATE the row, re-arm the timeout, and
  // broadcast the corrected state so all connected clients reconcile.
  //
  // The UPDATE WHERE run_state='running' AND ends_at = $observed makes this
  // genuinely single-writer (matching doPhaseAdvance's guard): exactly one
  // concurrent request writes the healed row; the rest return the original row
  // and their callers resolve via the guarded-UPDATE retry path in pauseTimer.
  // -------------------------------------------------------------------------

  private async selfHealIfOverdue(row: ServerStudyTimer): Promise<ServerStudyTimer> {
    if (
      row.run_state !== 'running' ||
      row.ends_at === null ||
      row.started_at === null ||
      row.ends_at.getTime() > Date.now()
    ) {
      return row; // Nothing to heal
    }

    // ends_at is non-null here — guarded above
    const observedEndsAt = row.ends_at as Date;

    const now = new Date();
    const phase = (row.phase === 'break' ? 'break' : 'work') as StudyTimerPhase;
    const { phase: healedPhase, newEndsAt } = computeCurrentPhase(phase, row.started_at, now, row);

    const [updated] = await db
      .update(server_study_timer)
      .set({
        phase: healedPhase,
        started_at: new Date(newEndsAt.getTime() - phaseDurationMs(healedPhase, row)),
        ends_at: newEndsAt,
        updated_at: now,
      })
      .where(
        and(
          eq(server_study_timer.server_id, row.server_id),
          eq(server_study_timer.run_state, 'running'),
          eq(server_study_timer.ends_at, observedEndsAt),
        ),
      )
      .returning();

    if (updated) {
      this.armAutoAdvance(row.server_id, newEndsAt);
      const timer = this.rowToDto(updated);
      const payload: StudyTimerUpdateEvent = { serverId: row.server_id, timer };
      this.emitter.emit(STUDY_TIMER_UPDATED_EVENT, payload);
      this.logger.debug(
        `Self-healed timer for server=${row.server_id} → phase=${healedPhase} endsAt=${newEndsAt.toISOString()}`,
      );
      return updated;
    }

    return row;
  }

  // -------------------------------------------------------------------------
  // armAutoAdvance — schedule ONE-SHOT phase transition at ends_at.
  //
  // Clears any existing timeout for this server before scheduling the new one.
  // Only one timeout per server exists at any time.
  // FORBIDDEN: do NOT convert this to a repeating interval.
  // -------------------------------------------------------------------------

  private armAutoAdvance(serverId: string, endsAt: Date): void {
    // Clear any previously-scheduled transition for this server
    const existing = this.timeouts.get(serverId);
    if (existing !== undefined) {
      clearTimeout(existing);
    }

    const delayMs = Math.max(0, endsAt.getTime() - Date.now());
    const handle = setTimeout(() => {
      void this.doPhaseAdvance(serverId, endsAt.getTime());
    }, delayMs);

    this.timeouts.set(serverId, handle);
    this.logger.debug(`Armed auto-advance for server=${serverId} in ${delayMs}ms`);
  }

  // -------------------------------------------------------------------------
  // clearAutoAdvance — cancel the pending auto-advance for a server.
  //
  // Called on pause and reset to prevent a stale transition from firing.
  // -------------------------------------------------------------------------

  private clearAutoAdvance(serverId: string): void {
    const existing = this.timeouts.get(serverId);
    if (existing !== undefined) {
      clearTimeout(existing);
      this.timeouts.delete(serverId);
      this.logger.debug(`Cleared auto-advance for server=${serverId}`);
    }
  }

  // -------------------------------------------------------------------------
  // doPhaseAdvance — IDEMPOTENT one-shot phase transition (832b83b7)
  //
  // Public for testability (unit + integration tests call it directly to verify
  // idempotency without waiting for the real setTimeout delay).
  //
  // Idempotency mechanism:
  //   UPDATE WHERE server_id = $id AND ends_at = $expectedEndsAt AND run_state = 'running'
  //   If ends_at has already changed (another advance ran) or state changed
  //   (pause/reset), the UPDATE returns 0 rows → this call is a no-op.
  //   Two concurrent triggers at the same ends_at → only one UPDATE succeeds.
  //
  // Self-healing: even if this emit was missed, the next GET/reconnect will
  //   call selfHealIfOverdue which re-derives state from anchors.
  // -------------------------------------------------------------------------

  async doPhaseAdvance(serverId: string, expectedEndsAtMs: number): Promise<void> {
    const now = new Date();
    const expectedEndsAt = new Date(expectedEndsAtMs);

    // Fetch the row so we have its configured durations for the next phase length.
    const row = await this.getTimerRow(serverId);
    if (!row || row.run_state !== 'running') {
      this.logger.debug(
        `doPhaseAdvance no-op for server=${serverId} expectedEndsAt=${expectedEndsAt.toISOString()} (row missing or not running)`,
      );
      this.timeouts.delete(serverId);
      return;
    }
    if (row.ends_at === null || row.ends_at.getTime() !== expectedEndsAtMs) {
      this.logger.debug(
        `doPhaseAdvance no-op for server=${serverId} expectedEndsAt=${expectedEndsAt.toISOString()} (row changed or missing)`,
      );
      this.timeouts.delete(serverId);
      return;
    }

    const newPhase = advancePhase(row.phase);
    // Use the row's configured durations — not the bare constants.
    const duration = phaseDurationMs(newPhase, row);
    const newEndsAt = new Date(now.getTime() + duration);

    // Idempotent UPDATE: WHERE ends_at = expectedEndsAt guards against double-fire.
    // A concurrent trigger finds a different ends_at and returns [] → no-op.
    const [updated] = await db
      .update(server_study_timer)
      .set({
        phase: newPhase,
        started_at: now,
        ends_at: newEndsAt,
        paused_remaining_ms: null,
        updated_at: now,
      })
      .where(
        and(
          eq(server_study_timer.server_id, serverId),
          eq(server_study_timer.run_state, 'running'),
          eq(server_study_timer.ends_at, expectedEndsAt),
        ),
      )
      .returning();

    if (!updated) {
      this.logger.debug(
        `doPhaseAdvance UPDATE no-op for server=${serverId} (race condition resolved correctly)`,
      );
      // Concurrent trigger already advanced; remove our spent entry from the Map.
      this.timeouts.delete(serverId);
      return;
    }

    // Re-arm for the next phase transition
    this.armAutoAdvance(serverId, newEndsAt);

    // Broadcast the updated state to all connected members
    const timer = this.rowToDto(updated);
    const payload: StudyTimerUpdateEvent = { serverId, timer };
    this.emitter.emit(STUDY_TIMER_UPDATED_EVENT, payload);

    this.logger.debug(
      `Phase advanced for server=${serverId}: ${updated.phase} → endsAt=${newEndsAt.toISOString()}`,
    );
  }

  // =========================================================================
  // Public API — all require assertMember (serverId from route, userId from session)
  // =========================================================================

  // -------------------------------------------------------------------------
  // getTimerForRoom — fetch current timer DTO without membership check.
  //
  // Used by StudyTimerGateway on join_timer_room to send authoritative state
  // to the (re)joining socket for reconciliation. Membership was already
  // verified by the gateway before calling this.
  // -------------------------------------------------------------------------

  async getTimerForRoom(serverId: string): Promise<StudyTimer> {
    const row = await this.getTimerRow(serverId);
    if (!row) return this.idleDto(serverId);
    const healed = await this.selfHealIfOverdue(row);
    return this.rowToDto(healed);
  }

  // -------------------------------------------------------------------------
  // getTimer — GET /servers/:serverId/study-timer
  //
  // assertMember → fetch row → self-heal if overdue → COMPUTE-ON-READ DTO.
  // No row → calm idle DTO.
  // -------------------------------------------------------------------------

  async getTimer(serverId: string, userId: string): Promise<StudyTimer> {
    await this.assertMember(userId, serverId);
    return this.getTimerForRoom(serverId);
  }

  // -------------------------------------------------------------------------
  // startTimer — POST /servers/:serverId/study-timer/start
  //
  // Upserts the row: run_state='running', phase='work', started_at=now,
  // ends_at=now+work_duration_ms. Starting a running or paused timer restarts
  // it fresh. Clears any pending auto-advance (via upsert + re-arm).
  //
  // Reads the existing row first (if any) to obtain the configured work_duration_ms
  // so a custom-duration timer uses its configured length even on restart.
  // -------------------------------------------------------------------------

  async startTimer(serverId: string, userId: string): Promise<StudyTimer> {
    await this.assertMember(userId, serverId);

    // Read the existing row (if any) to get the server's configured work duration.
    // Falls back to the column default (WORK_DURATION_MS) when no row exists yet.
    const existing = await this.getTimerRow(serverId);
    const workDurationMs = existing?.work_duration_ms ?? WORK_DURATION_MS;
    const breakDurationMs = existing?.break_duration_ms ?? BREAK_DURATION_MS;

    const now = new Date();
    const endsAt = new Date(now.getTime() + workDurationMs);

    const [row] = await db
      .insert(server_study_timer)
      .values({
        server_id: serverId,
        phase: 'work',
        run_state: 'running',
        started_at: now,
        ends_at: endsAt,
        paused_remaining_ms: null,
        updated_by: userId,
        // Preserve configured durations on first insert (default values already on column)
        work_duration_ms: workDurationMs,
        break_duration_ms: breakDurationMs,
      })
      .onConflictDoUpdate({
        target: server_study_timer.server_id,
        set: {
          phase: 'work',
          run_state: 'running',
          started_at: now,
          ends_at: endsAt,
          paused_remaining_ms: null,
          updated_by: userId,
          updated_at: now,
          // Do NOT overwrite work_duration_ms / break_duration_ms on start —
          // they are sticky config, not reset by starting the timer.
        },
      })
      .returning();

    if (!row) throw new Error('Study timer start upsert failed unexpectedly');

    this.armAutoAdvance(serverId, endsAt);

    const timer = this.rowToDto(row);
    const payload: StudyTimerUpdateEvent = { serverId, timer };
    this.emitter.emit(STUDY_TIMER_UPDATED_EVENT, payload);

    this.logger.debug(
      `Timer started for server=${serverId} endsAt=${endsAt.toISOString()} workDurationMs=${workDurationMs}`,
    );
    return timer;
  }

  // -------------------------------------------------------------------------
  // pauseTimer — POST /servers/:serverId/study-timer/pause
  //
  // Freezes run_state='paused', paused_remaining_ms = max(0, ends_at - now).
  // Clears the auto-advance timeout (no transition while paused).
  // No-ops gracefully if the timer is not running.
  //
  // Self-healing: calls selfHealIfOverdue before computing paused_remaining_ms
  //   so a running row whose ends_at is already in the past (missed phase
  //   transition after a process restart) is re-derived to the correct current
  //   phase first.  Without this, paused_remaining_ms would freeze at 0 and a
  //   subsequent resume would set ends_at = now + 0, losing the active session.
  //
  // Idempotency guard: UPDATE WHERE ends_at = observedEndsAt so a concurrent
  //   doPhaseAdvance that changes ends_at turns this pause into a retryable
  //   no-op rather than overwriting the just-advanced row with remaining_ms=0.
  // -------------------------------------------------------------------------

  async pauseTimer(serverId: string, userId: string): Promise<StudyTimer> {
    await this.assertMember(userId, serverId);

    const row = await this.getTimerRow(serverId);
    if (!row || row.run_state !== 'running') {
      return row ? this.rowToDto(row) : this.idleDto(serverId);
    }

    // Heal any overdue running row first so ends_at reflects the correct current
    // phase before we compute paused_remaining_ms.
    const healed = await this.selfHealIfOverdue(row);
    const observedEndsAt = healed.ends_at;

    const now = new Date();
    const pausedRemainingMs =
      observedEndsAt !== null ? Math.max(0, observedEndsAt.getTime() - now.getTime()) : 0;

    // Guard with run_state='running' AND ends_at = observedEndsAt so a concurrent
    // doPhaseAdvance (or winning concurrent selfHeal) that changed ends_at turns
    // this pause into a no-op rather than writing paused_remaining_ms=0.
    const [updated] = await db
      .update(server_study_timer)
      .set({
        run_state: 'paused',
        ends_at: null,
        paused_remaining_ms: pausedRemainingMs,
        updated_by: userId,
        updated_at: now,
      })
      .where(
        and(
          eq(server_study_timer.server_id, serverId),
          eq(server_study_timer.run_state, 'running'),
          observedEndsAt !== null ? eq(server_study_timer.ends_at, observedEndsAt) : undefined,
        ),
      )
      .returning();

    if (!updated) {
      // Concurrent advance or heal changed ends_at before our pause landed.
      // Re-read and return current state; the caller may retry if still needed.
      this.logger.debug(
        `pauseTimer no-op for server=${serverId} (concurrent advance; caller may retry)`,
      );
      const current = await this.getTimerRow(serverId);
      return current ? this.rowToDto(current) : this.idleDto(serverId);
    }

    this.clearAutoAdvance(serverId);

    const timer = this.rowToDto(updated);
    const payload: StudyTimerUpdateEvent = { serverId, timer };
    this.emitter.emit(STUDY_TIMER_UPDATED_EVENT, payload);

    this.logger.debug(`Timer paused for server=${serverId} remainingMs=${pausedRemainingMs}`);
    return timer;
  }

  // -------------------------------------------------------------------------
  // resumeTimer — POST /servers/:serverId/study-timer/resume
  //
  // Restores run_state='running', ends_at = now + paused_remaining_ms.
  // Re-arms the auto-advance timeout.
  // No-ops gracefully if the timer is not paused.
  // -------------------------------------------------------------------------

  async resumeTimer(serverId: string, userId: string): Promise<StudyTimer> {
    await this.assertMember(userId, serverId);

    const row = await this.getTimerRow(serverId);
    if (!row || row.run_state !== 'paused') {
      return row ? this.rowToDto(row) : this.idleDto(serverId);
    }

    const now = new Date();
    const remainingMs = row.paused_remaining_ms ?? 0;
    const newEndsAt = new Date(now.getTime() + remainingMs);

    const [updated] = await db
      .update(server_study_timer)
      .set({
        run_state: 'running',
        ends_at: newEndsAt,
        paused_remaining_ms: null,
        updated_by: userId,
        updated_at: now,
      })
      .where(eq(server_study_timer.server_id, serverId))
      .returning();

    if (!updated) throw new Error('Study timer resume update failed unexpectedly');

    this.armAutoAdvance(serverId, newEndsAt);

    const timer = this.rowToDto(updated);
    const payload: StudyTimerUpdateEvent = { serverId, timer };
    this.emitter.emit(STUDY_TIMER_UPDATED_EVENT, payload);

    this.logger.debug(`Timer resumed for server=${serverId} endsAt=${newEndsAt.toISOString()}`);
    return timer;
  }

  // -------------------------------------------------------------------------
  // resetTimer — POST /servers/:serverId/study-timer/reset
  //
  // Upserts the row to idle state: run_state='idle', phase='work', all
  // time anchors null. Clears the auto-advance timeout.
  // -------------------------------------------------------------------------

  async resetTimer(serverId: string, userId: string): Promise<StudyTimer> {
    await this.assertMember(userId, serverId);

    const now = new Date();

    const [row] = await db
      .insert(server_study_timer)
      .values({
        server_id: serverId,
        phase: 'work',
        run_state: 'idle',
        started_at: null,
        ends_at: null,
        paused_remaining_ms: null,
        updated_by: userId,
      })
      .onConflictDoUpdate({
        target: server_study_timer.server_id,
        set: {
          phase: 'work',
          run_state: 'idle',
          started_at: null,
          ends_at: null,
          paused_remaining_ms: null,
          updated_by: userId,
          updated_at: now,
        },
      })
      .returning();

    if (!row) throw new Error('Study timer reset upsert failed unexpectedly');

    this.clearAutoAdvance(serverId);

    const timer = this.rowToDto(row);
    const payload: StudyTimerUpdateEvent = { serverId, timer };
    this.emitter.emit(STUDY_TIMER_UPDATED_EVENT, payload);

    this.logger.debug(`Timer reset for server=${serverId}`);
    return timer;
  }

  // -------------------------------------------------------------------------
  // configureDurations — PATCH /servers/:serverId/study-timer/config
  // wave-50 task f4b3659e
  //
  // Persists per-server work/break durations (in minutes, converted to ms).
  // Requirements:
  //   - assertMember → 403 on non-member
  //   - run_state MUST be 'idle' → 409 ConflictException otherwise
  //   - Updates work_duration_ms + break_duration_ms on the existing row
  //     (upserts idle row if none exists — idempotent for fresh servers)
  //   - Emits STUDY_TIMER_UPDATED_EVENT (karen-1: via EventEmitter2, not direct wire)
  //     so the gateway re-broadcasts the extended DTO to the server room
  // -------------------------------------------------------------------------

  async configureDurations(
    serverId: string,
    userId: string,
    config: StudyTimerConfig,
  ): Promise<StudyTimer> {
    await this.assertMember(userId, serverId);

    const { workMinutes, breakMinutes } = config;
    const newWorkMs = workMinutes * 60_000;
    const newBreakMs = breakMinutes * 60_000;

    const now = new Date();

    // Guard: durations may only be changed while the timer is idle.
    // Fetch (or upsert-idle) first to check run_state.
    const existing = await this.getTimerRow(serverId);

    if (existing && existing.run_state !== 'idle') {
      throw new ConflictException('Reset the timer to change durations');
    }

    // Upsert idle row carrying the new durations.
    // If no row exists yet we INSERT it (new server, first config before first start).
    // If a row exists and is idle we UPDATE only the duration columns (run_state
    // stays idle, time anchors stay null).
    const [row] = await db
      .insert(server_study_timer)
      .values({
        server_id: serverId,
        phase: 'work',
        run_state: 'idle',
        started_at: null,
        ends_at: null,
        paused_remaining_ms: null,
        updated_by: userId,
        work_duration_ms: newWorkMs,
        break_duration_ms: newBreakMs,
      })
      .onConflictDoUpdate({
        target: server_study_timer.server_id,
        set: {
          work_duration_ms: newWorkMs,
          break_duration_ms: newBreakMs,
          updated_by: userId,
          updated_at: now,
        },
      })
      .returning();

    if (!row) throw new Error('Study timer configureDurations upsert failed unexpectedly');

    // karen-1: emit the INTERNAL event — the gateway @OnEvent handler broadcasts
    // the wire study-timer:update to the server room with the extended DTO.
    const timer = this.rowToDto(row);
    const payload: StudyTimerUpdateEvent = { serverId, timer };
    this.emitter.emit(STUDY_TIMER_UPDATED_EVENT, payload);

    this.logger.debug(
      `Timer durations configured for server=${serverId} work=${workMinutes}min break=${breakMinutes}min`,
    );
    return timer;
  }
}
