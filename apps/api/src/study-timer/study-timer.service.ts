/**
 * StudyTimerService — wave-49 M8 shared study timer
 * Tasks: 1387d845 (compute-on-read service) + 832b83b7 (auto-advance + reconnect)
 *
 * BINDING MODEL (non-negotiable):
 *   Persist ANCHORS ONLY (phase, run_state, started_at, ends_at, paused_remaining_ms).
 *   Derive remaining/phase COMPUTE-ON-READ from ends_at − now().
 *   Auto-advance = ONE-SHOT setTimeout per server (cleared on pause/reset/re-arm).
 *   FORBIDDEN: per-server setInterval / @nestjs/schedule tick loop.
 *
 * Durations HARDCODED: 25 min work / 5 min break (custom durations DEFERRED seed f4b3659e).
 *
 * Idempotency: doPhaseAdvance uses UPDATE WHERE ends_at = expectedEndsAt so concurrent
 *   or double-fired triggers produce exactly one DB write.
 *
 * Self-healing: if run_state='running' and ends_at < now() on getTimerRow/GET,
 *   computeCurrentPhase() re-derives the correct phase by walking forward from
 *   started_at — phase always re-derivable from anchors (self-healing on next read).
 *
 * Fan-out: emits 'study-timer.updated' via EventEmitter2 — StudyTimerGateway handles
 *   @OnEvent and broadcasts to the server room. No direct gateway injection (no circular dep).
 */

import { ForbiddenException, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { StudyTimer, StudyTimerPhase, StudyTimerUpdateEvent } from '@studyhall/shared';
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

function phaseDurationMs(phase: string): number {
  return phase === 'break' ? BREAK_DURATION_MS : WORK_DURATION_MS;
}

function advancePhase(phase: string): StudyTimerPhase {
  return phase === 'work' ? 'break' : 'work';
}

/**
 * Compute the authoritative current phase and its newEndsAt from anchors.
 *
 * Self-healing: walks forward through 25/5 cycles from `initialPhase` at
 * `startedAt` until the active phase's end is in the future.  This is the
 * compute-on-read formula that re-derives phase when the service missed one or
 * more phase-transition emits (e.g. after a process restart).
 */
export function computeCurrentPhase(
  initialPhase: StudyTimerPhase,
  startedAt: Date,
  now: Date,
): { phase: StudyTimerPhase; newEndsAt: Date } {
  let phase: StudyTimerPhase = initialPhase;
  let phaseStartMs = startedAt.getTime();
  const nowMs = now.getTime();

  // Each iteration advances by ≥5 min; bounded by elapsed time.
  let iterations = 0;
  const maxIterations = 10_000; // safety guard (years of drift at 5-min cadence)
  while (iterations < maxIterations) {
    iterations++;
    const duration = phaseDurationMs(phase);
    const phaseEndMs = phaseStartMs + duration;
    if (phaseEndMs > nowMs) {
      return { phase, newEndsAt: new Date(phaseEndMs) };
    }
    phase = advancePhase(phase);
    phaseStartMs = phaseEndMs;
  }

  // Unreachable in practice; defensive fallback
  return { phase: 'work', newEndsAt: new Date(nowMs + WORK_DURATION_MS) };
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
    const { phase: healedPhase, newEndsAt } = computeCurrentPhase(phase, row.started_at, now);

    const [updated] = await db
      .update(server_study_timer)
      .set({
        phase: healedPhase,
        started_at: new Date(newEndsAt.getTime() - phaseDurationMs(healedPhase)),
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
    const newPhase = await this.getTimerRow(serverId).then((row) => {
      if (!row) return null;
      if (row.run_state !== 'running') return null;
      if (row.ends_at === null || row.ends_at.getTime() !== expectedEndsAtMs) return null;
      return advancePhase(row.phase);
    });

    if (newPhase === null) {
      this.logger.debug(
        `doPhaseAdvance no-op for server=${serverId} expectedEndsAt=${expectedEndsAt.toISOString()} (row changed or missing)`,
      );
      return;
    }

    const duration = phaseDurationMs(newPhase);
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
  // ends_at=now+25min. Starting a running or paused timer restarts it fresh.
  // Clears any pending auto-advance (via upsert + re-arm).
  // -------------------------------------------------------------------------

  async startTimer(serverId: string, userId: string): Promise<StudyTimer> {
    await this.assertMember(userId, serverId);

    const now = new Date();
    const endsAt = new Date(now.getTime() + WORK_DURATION_MS);

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
        },
      })
      .returning();

    if (!row) throw new Error('Study timer start upsert failed unexpectedly');

    this.armAutoAdvance(serverId, endsAt);

    const timer = this.rowToDto(row);
    const payload: StudyTimerUpdateEvent = { serverId, timer };
    this.emitter.emit(STUDY_TIMER_UPDATED_EVENT, payload);

    this.logger.debug(`Timer started for server=${serverId} endsAt=${endsAt.toISOString()}`);
    return timer;
  }

  // -------------------------------------------------------------------------
  // pauseTimer — POST /servers/:serverId/study-timer/pause
  //
  // Freezes run_state='paused', paused_remaining_ms = max(0, ends_at - now).
  // Clears the auto-advance timeout (no transition while paused).
  // No-ops gracefully if the timer is not running.
  // -------------------------------------------------------------------------

  async pauseTimer(serverId: string, userId: string): Promise<StudyTimer> {
    await this.assertMember(userId, serverId);

    const row = await this.getTimerRow(serverId);
    if (!row || row.run_state !== 'running') {
      return row ? this.rowToDto(row) : this.idleDto(serverId);
    }

    const now = new Date();
    const pausedRemainingMs =
      row.ends_at !== null ? Math.max(0, row.ends_at.getTime() - now.getTime()) : 0;

    const [updated] = await db
      .update(server_study_timer)
      .set({
        run_state: 'paused',
        paused_remaining_ms: pausedRemainingMs,
        updated_by: userId,
        updated_at: now,
      })
      .where(eq(server_study_timer.server_id, serverId))
      .returning();

    if (!updated) throw new Error('Study timer pause update failed unexpectedly');

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
}
