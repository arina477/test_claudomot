/**
 * StudyRoomService — wave-52 M8 joinable focus-room backend
 * Tasks: d123d9e0 (rooms+presence) + ef84b378 (room-timer)
 *
 * BINDING MODEL (non-negotiable):
 *   ALL state is EPHEMERAL IN-MEMORY. No DB table, no migration, no Drizzle.
 *   Rooms, rosters, and room-timer anchors live in Maps only (MUST-LOCK 1).
 *
 *   Room-timer state lives in roomTimers Map keyed by roomId (MUST-LOCK 3).
 *   Auto-advance: ONE-SHOT setTimeout per room, keyed by roomId, distinct from
 *   the serverId-keyed server-timer map in StudyTimerService (MUST-LOCK 3).
 *   FORBIDDEN: per-room setInterval / @nestjs/schedule tick loop.
 *
 * CAS idempotency (karen-1):
 *   The wave-49 doPhaseAdvance CAS guard is `UPDATE WHERE ends_at=$expected` on
 *   the server_study_timer DB row. We CANNOT reuse that mechanism — there is no
 *   DB row here. Instead we implement in-memory CAS: on the armed setTimeout
 *   firing, compare the current roomTimers Map entry's ends_at against the
 *   expected ends_at captured at arm time; only advance if they match.
 *   This is idempotent: double-firing (test or actual) where the Map entry was
 *   already advanced produces a mismatch and no-ops.
 *
 * Pure formula reuse:
 *   computeCurrentPhase() + phaseDurationMs() are imported from study-timer.service
 *   unchanged. These are the ONLY pieces reused from wave-49 — all DB-coupled
 *   logic (doPhaseAdvance, selfHealIfOverdue) is NOT reused (MUST-LOCK 3).
 *
 * Namespace separation (MUST-LOCK 2):
 *   This service has ZERO imports from study-timer.gateway, does not touch
 *   timerPresence, /study-timer namespace, or server_study_timer table.
 *
 * Timer config validation:
 *   Work: 1-120 min (wave-50 range); Break: 1-60 min. Default 25/5.
 *
 * Timeout leak prevention (karen-4):
 *   roomTimeouts entries are cleared + deleted on room removal, pause, reset,
 *   and onModuleDestroy.
 *
 * Auth/IDOR:
 *   assertMember → 403 for non-server-member (queries server_members via DB).
 *   assertRoomMember → 403 for timer control when not joined to the room.
 *   serverId + roomId from client message; userId from socket.data.userId.
 */

import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  type OnModuleDestroy,
} from '@nestjs/common';
import type {
  FocusRoom,
  FocusRoomViewer,
  StudyRoomTimer,
  StudyRoomTimerUpdateEvent,
} from '@studyhall/shared';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index';
import { server_members, users } from '../db/schema/index';
import {
  BREAK_DURATION_MS,
  WORK_DURATION_MS,
  computeCurrentPhase,
  phaseDurationMs,
} from '../study-timer/study-timer.service';

// ---------------------------------------------------------------------------
// Duration validation constants — mirrors wave-50 validated ranges
// ---------------------------------------------------------------------------

const MIN_WORK_MS = 1 * 60_000;
const MAX_WORK_MS = 120 * 60_000;
const MIN_BREAK_MS = 1 * 60_000;
const MAX_BREAK_MS = 60 * 60_000;

// ---------------------------------------------------------------------------
// In-memory room descriptor
// ---------------------------------------------------------------------------

interface FocusRoomEntry {
  id: string;
  serverId: string;
  name: string;
  /** Map<userId, PresenceEntry> — deduplicated per userId, multi-tab via sockets Set */
  roster: Map<string, RosterEntry>;
}

interface RosterEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  /** All socket IDs from this user that have joined this room */
  sockets: Set<string>;
}

// ---------------------------------------------------------------------------
// In-memory room-timer anchor (MUST-LOCK 3 — keyed by roomId, not serverId)
// ---------------------------------------------------------------------------

interface RoomTimerAnchor {
  phase: 'work' | 'break';
  /** 'idle' | 'running' | 'paused' */
  run_state: 'idle' | 'running' | 'paused';
  started_at: Date | null;
  ends_at: Date | null;
  paused_remaining_ms: number | null;
  work_duration_ms: number;
  break_duration_ms: number;
  updated_by: string | null;
}

// ---------------------------------------------------------------------------
// Emitter callback type for gateway fan-out (avoids circular DI)
// ---------------------------------------------------------------------------

export type RoomTimerUpdateCallback = (payload: StudyRoomTimerUpdateEvent) => void;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class StudyRoomService implements OnModuleDestroy {
  private readonly logger = new Logger(StudyRoomService.name);

  // MUST-LOCK 1: rooms in-memory only. Map<serverId, Map<roomId, FocusRoomEntry>>
  private readonly rooms = new Map<string, Map<string, FocusRoomEntry>>();

  // MUST-LOCK 3: room-timer anchors in-memory only. Map<roomId, RoomTimerAnchor>
  private readonly roomTimers = new Map<string, RoomTimerAnchor>();

  // karen-4: one-shot auto-advance timeouts, keyed by roomId
  private readonly roomTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  // Gateway registers this callback so we can emit timer updates without circular DI
  private timerUpdateCallback: RoomTimerUpdateCallback | null = null;

  // -------------------------------------------------------------------------
  // Lifecycle — clean up all pending timeouts on module destroy (karen-4)
  // -------------------------------------------------------------------------

  onModuleDestroy(): void {
    for (const handle of this.roomTimeouts.values()) {
      clearTimeout(handle);
    }
    this.roomTimeouts.clear();
    this.logger.debug('StudyRoomService destroyed — all room timeouts cleared');
  }

  // -------------------------------------------------------------------------
  // registerTimerCallback — gateway registers its fan-out handler
  // Called once by StudyRoomGateway.afterInit to avoid circular DI.
  // -------------------------------------------------------------------------

  registerTimerCallback(cb: RoomTimerUpdateCallback): void {
    this.timerUpdateCallback = cb;
  }

  // =========================================================================
  // Auth helpers
  // =========================================================================

  /**
   * assertMember — gate on server_members (no role required).
   * Throws 403 on failure. IDOR-safe: userId from session, serverId from payload.
   */
  async assertMember(userId: string, serverId: string): Promise<void> {
    const [member] = await db
      .select({ id: server_members.id })
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, userId)))
      .limit(1);

    if (!member) {
      throw new ForbiddenException('You are not a member of this server');
    }
  }

  /**
   * assertRoomMember — gate on being JOINED to a specific focus room.
   * Throws 403 if the user is not in the room's roster.
   * Used for room-timer control (must be joined, not just a server member).
   */
  assertRoomMember(userId: string, serverId: string, roomId: string): void {
    const room = this.getRoom(serverId, roomId);
    if (!room || !room.roster.has(userId)) {
      throw new ForbiddenException('You must be in the focus room to control its timer');
    }
  }

  // =========================================================================
  // Room helpers (internal)
  // =========================================================================

  private getServerRooms(serverId: string): Map<string, FocusRoomEntry> {
    if (!this.rooms.has(serverId)) {
      this.rooms.set(serverId, new Map());
    }
    return this.rooms.get(serverId) as Map<string, FocusRoomEntry>;
  }

  private getRoom(serverId: string, roomId: string): FocusRoomEntry | undefined {
    return this.rooms.get(serverId)?.get(roomId);
  }

  private roomsListFor(serverId: string): FocusRoom[] {
    const serverRooms = this.rooms.get(serverId);
    if (!serverRooms) return [];
    return Array.from(serverRooms.values()).map((r) => ({
      id: r.id,
      serverId: r.serverId,
      name: r.name,
      count: r.roster.size,
    }));
  }

  private rosterFor(room: FocusRoomEntry): FocusRoomViewer[] {
    return Array.from(room.roster.values()).map((e) => ({
      userId: e.userId,
      displayName: e.displayName,
      avatarUrl: e.avatarUrl,
    }));
  }

  // =========================================================================
  // User profile helper — for displayName + avatarUrl resolution
  // =========================================================================

  async resolveUserProfile(
    userId: string,
  ): Promise<{ displayName: string; avatarUrl: string | null }> {
    try {
      const [row] = await db
        .select({
          display_name: users.display_name,
          email: users.email,
          avatar_url: users.avatar_url,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const displayName = row?.display_name ?? row?.email?.split('@')[0] ?? userId;
      const avatarUrl = row?.avatar_url ?? null;
      return { displayName, avatarUrl };
    } catch {
      return { displayName: userId, avatarUrl: null };
    }
  }

  // =========================================================================
  // Room lifecycle
  // =========================================================================

  /**
   * createRoom — create a new ephemeral focus room in a server.
   * Returns the updated rooms list for broadcasting.
   */
  async createRoom(
    userId: string,
    serverId: string,
    name: string,
  ): Promise<{ roomId: string; rooms: FocusRoom[] }> {
    await this.assertMember(userId, serverId);

    const trimmed = name.trim();
    if (trimmed.length === 0) {
      throw new Error('Room name cannot be empty');
    }

    const roomId = randomUUID();
    const serverRooms = this.getServerRooms(serverId);
    serverRooms.set(roomId, {
      id: roomId,
      serverId,
      name: trimmed,
      roster: new Map(),
    });

    this.logger.debug(`Room created: serverId=${serverId} roomId=${roomId} name=${trimmed}`);
    return { roomId, rooms: this.roomsListFor(serverId) };
  }

  /**
   * joinRoom — add user to a room's roster (multi-tab deduped per userId).
   * Returns the updated roster and rooms list.
   */
  async joinRoom(
    userId: string,
    serverId: string,
    roomId: string,
    socketId: string,
    displayName: string,
    avatarUrl: string | null,
  ): Promise<{
    roster: FocusRoomViewer[];
    rooms: FocusRoom[];
    roomName: string;
    timer: StudyRoomTimer;
  }> {
    await this.assertMember(userId, serverId);

    const room = this.getRoom(serverId, roomId);
    if (!room) {
      throw new ForbiddenException('Focus room not found or has been removed');
    }

    const entry = room.roster.get(userId);
    if (entry) {
      // Multi-tab dedup: just add the socket to the existing entry
      entry.sockets.add(socketId);
    } else {
      room.roster.set(userId, {
        userId,
        displayName,
        avatarUrl,
        sockets: new Set([socketId]),
      });
    }

    this.logger.debug(
      `User ${userId} joined room ${roomId} in server ${serverId} (socket=${socketId})`,
    );

    return {
      roster: this.rosterFor(room),
      rooms: this.roomsListFor(serverId),
      roomName: room.name,
      timer: this.getRoomTimer(roomId),
    };
  }

  /**
   * leaveRoom — remove a socket from a room's roster.
   * If the user has no remaining sockets, remove them from the roster.
   * If the roster becomes empty, remove the room entirely + clean up its timer.
   * Returns updated roster, rooms list, and whether the room was removed.
   */
  leaveRoom(
    userId: string,
    serverId: string,
    roomId: string,
    socketId: string,
  ): {
    roster: FocusRoomViewer[];
    rooms: FocusRoom[];
    roomRemoved: boolean;
    roomName: string | null;
  } {
    const room = this.getRoom(serverId, roomId);
    if (!room) {
      return { roster: [], rooms: this.roomsListFor(serverId), roomRemoved: false, roomName: null };
    }

    const roomName = room.name;
    const entry = room.roster.get(userId);
    if (entry) {
      entry.sockets.delete(socketId);
      if (entry.sockets.size === 0) {
        room.roster.delete(userId);
      }
    }

    // If the room is now empty, remove it (MUST-LOCK 1: no orphaned empty rooms)
    if (room.roster.size === 0) {
      this.removeRoom(serverId, roomId);
      return {
        roster: [],
        rooms: this.roomsListFor(serverId),
        roomRemoved: true,
        roomName,
      };
    }

    this.logger.debug(`User ${userId} left room ${roomId} (socket=${socketId})`);
    return {
      roster: this.rosterFor(room),
      rooms: this.roomsListFor(serverId),
      roomRemoved: false,
      roomName,
    };
  }

  /**
   * removeRoom — internal cleanup when a room becomes empty or is explicitly removed.
   * Clears the room-timer and its armed timeout (karen-4: no leaked timers).
   */
  private removeRoom(serverId: string, roomId: string): void {
    // karen-4: clear the timeout before deleting anchor
    this.clearRoomAutoAdvance(roomId);
    this.roomTimers.delete(roomId);

    const serverRooms = this.rooms.get(serverId);
    if (serverRooms) {
      serverRooms.delete(roomId);
      if (serverRooms.size === 0) {
        this.rooms.delete(serverId);
      }
    }

    this.logger.debug(`Room removed: serverId=${serverId} roomId=${roomId}`);
  }

  /**
   * leaveAllRoomsForSocket — called on socket disconnect to remove all traces
   * of a socket from every room it joined in a given server.
   * Returns per-room updates for gateway to broadcast.
   */
  leaveAllRoomsForSocket(
    userId: string,
    serverId: string,
    roomIds: string[],
    socketId: string,
  ): Array<{
    roomId: string;
    roster: FocusRoomViewer[];
    rooms: FocusRoom[];
    roomRemoved: boolean;
    roomName: string | null;
  }> {
    return roomIds.map((roomId) => {
      const result = this.leaveRoom(userId, serverId, roomId, socketId);
      return { roomId, ...result };
    });
  }

  /**
   * getOpenRooms — return current open rooms list for a server.
   * Used to push the initial rooms list on server-room join.
   */
  async getOpenRooms(userId: string, serverId: string): Promise<FocusRoom[]> {
    await this.assertMember(userId, serverId);
    return this.roomsListFor(serverId);
  }

  // =========================================================================
  // Room-timer — MUST-LOCK 3: in-memory anchors keyed by roomId
  // =========================================================================

  /**
   * getOrCreateTimerAnchor — returns the existing anchor or creates an idle one.
   * Default durations: 25/5 (mirrors wave-49 defaults).
   */
  private getOrCreateTimerAnchor(roomId: string): RoomTimerAnchor {
    if (!this.roomTimers.has(roomId)) {
      this.roomTimers.set(roomId, {
        phase: 'work',
        run_state: 'idle',
        started_at: null,
        ends_at: null,
        paused_remaining_ms: null,
        work_duration_ms: WORK_DURATION_MS,
        break_duration_ms: BREAK_DURATION_MS,
        updated_by: null,
      });
    }
    return this.roomTimers.get(roomId) as RoomTimerAnchor;
  }

  /**
   * getRoomTimer — compute-on-read DTO from the in-memory anchor.
   * Mirrors study-timer rowToDto: remaining derived from ends_at − now when running.
   */
  getRoomTimer(roomId: string): StudyRoomTimer {
    const anchor = this.roomTimers.get(roomId) ?? {
      phase: 'work' as const,
      run_state: 'idle' as const,
      started_at: null,
      ends_at: null,
      paused_remaining_ms: null,
      work_duration_ms: WORK_DURATION_MS,
      break_duration_ms: BREAK_DURATION_MS,
      updated_by: null,
    };

    const now = Date.now();
    let remainingMs = 0;

    if (anchor.run_state === 'running' && anchor.ends_at !== null) {
      remainingMs = Math.max(0, anchor.ends_at.getTime() - now);
    } else if (anchor.run_state === 'paused') {
      remainingMs = anchor.paused_remaining_ms ?? 0;
    }

    return {
      roomId,
      phase: anchor.phase,
      runState: anchor.run_state,
      endsAt: anchor.ends_at !== null ? anchor.ends_at.toISOString() : null,
      remainingMs,
      running: anchor.run_state === 'running',
      updatedBy: anchor.updated_by,
      workDurationMs: anchor.work_duration_ms,
      breakDurationMs: anchor.break_duration_ms,
    };
  }

  /**
   * startRoomTimer — start or restart the room's Pomodoro from work phase.
   * assertRoomMember: only joined members can control the timer.
   */
  startRoomTimer(userId: string, serverId: string, roomId: string): StudyRoomTimer {
    this.assertRoomMember(userId, serverId, roomId);

    const anchor = this.getOrCreateTimerAnchor(roomId);
    const now = new Date();
    const endsAt = new Date(now.getTime() + anchor.work_duration_ms);

    anchor.phase = 'work';
    anchor.run_state = 'running';
    anchor.started_at = now;
    anchor.ends_at = endsAt;
    anchor.paused_remaining_ms = null;
    anchor.updated_by = userId;

    this.armRoomAutoAdvance(roomId, endsAt);

    const timer = this.getRoomTimer(roomId);
    this.emitTimerUpdate(roomId, timer);

    this.logger.debug(
      `Room timer started: roomId=${roomId} workDurationMs=${anchor.work_duration_ms} endsAt=${endsAt.toISOString()}`,
    );
    return timer;
  }

  /**
   * pauseRoomTimer — freeze the timer; capture paused_remaining_ms.
   * No-ops gracefully if not running.
   */
  pauseRoomTimer(userId: string, serverId: string, roomId: string): StudyRoomTimer {
    this.assertRoomMember(userId, serverId, roomId);

    const anchor = this.roomTimers.get(roomId);
    if (!anchor || anchor.run_state !== 'running') {
      return this.getRoomTimer(roomId);
    }

    const now = new Date();
    const remainingMs =
      anchor.ends_at !== null ? Math.max(0, anchor.ends_at.getTime() - now.getTime()) : 0;

    anchor.run_state = 'paused';
    anchor.ends_at = null;
    anchor.paused_remaining_ms = remainingMs;
    anchor.updated_by = userId;

    // karen-4: clear the auto-advance timeout on pause
    this.clearRoomAutoAdvance(roomId);

    const timer = this.getRoomTimer(roomId);
    this.emitTimerUpdate(roomId, timer);

    this.logger.debug(`Room timer paused: roomId=${roomId} remainingMs=${remainingMs}`);
    return timer;
  }

  /**
   * resetRoomTimer — return timer to idle state; clear the armed timeout.
   */
  resetRoomTimer(userId: string, serverId: string, roomId: string): StudyRoomTimer {
    this.assertRoomMember(userId, serverId, roomId);

    const anchor = this.getOrCreateTimerAnchor(roomId);

    // karen-4: clear timeout before modifying anchor
    this.clearRoomAutoAdvance(roomId);

    anchor.phase = 'work';
    anchor.run_state = 'idle';
    anchor.started_at = null;
    anchor.ends_at = null;
    anchor.paused_remaining_ms = null;
    anchor.updated_by = userId;

    const timer = this.getRoomTimer(roomId);
    this.emitTimerUpdate(roomId, timer);

    this.logger.debug(`Room timer reset: roomId=${roomId}`);
    return timer;
  }

  /**
   * configureRoomTimer — set custom work/break durations (idle-only, wave-50 pattern).
   * Validated ranges: work 1-120 min, break 1-60 min.
   * Throws ConflictException if timer is running or paused.
   */
  configureRoomTimer(
    userId: string,
    serverId: string,
    roomId: string,
    workMinutes: number,
    breakMinutes: number,
  ): StudyRoomTimer {
    this.assertRoomMember(userId, serverId, roomId);

    const anchor = this.getOrCreateTimerAnchor(roomId);

    if (anchor.run_state !== 'idle') {
      throw new ConflictException('Reset the room timer to change durations');
    }

    const workMs = workMinutes * 60_000;
    const breakMs = breakMinutes * 60_000;

    if (workMs < MIN_WORK_MS || workMs > MAX_WORK_MS) {
      throw new Error('Work duration must be between 1 and 120 minutes');
    }
    if (breakMs < MIN_BREAK_MS || breakMs > MAX_BREAK_MS) {
      throw new Error('Break duration must be between 1 and 60 minutes');
    }

    anchor.work_duration_ms = workMs;
    anchor.break_duration_ms = breakMs;
    anchor.updated_by = userId;

    const timer = this.getRoomTimer(roomId);
    this.emitTimerUpdate(roomId, timer);

    this.logger.debug(
      `Room timer configured: roomId=${roomId} work=${workMinutes}min break=${breakMinutes}min`,
    );
    return timer;
  }

  // =========================================================================
  // Room-timer auto-advance — in-memory CAS (MUST-LOCK 3 + karen-1)
  // =========================================================================

  /**
   * armRoomAutoAdvance — arm ONE-SHOT setTimeout for the next phase transition.
   *
   * The expected ends_at is CAPTURED AT ARM TIME. On firing, the handler
   * compares the live Map entry's ends_at against this captured value.
   * Only advances if they match — this IS the in-memory CAS guard:
   *
   *   if (currentAnchor.ends_at?.getTime() !== capturedEndsAtMs) return; // no-op
   *
   * This replaces the wave-49 `UPDATE WHERE ends_at=$expected` DB guard.
   * Two concurrent fires (test double-fire or real race) where the first
   * already advanced the Map entry produce a mismatch on the second → no-op.
   */
  private armRoomAutoAdvance(roomId: string, endsAt: Date): void {
    // Clear any existing timeout for this room before scheduling the new one
    this.clearRoomAutoAdvance(roomId);

    const capturedEndsAtMs = endsAt.getTime();
    const delayMs = Math.max(0, capturedEndsAtMs - Date.now());

    const handle = setTimeout(() => {
      this.doRoomPhaseAdvance(roomId, capturedEndsAtMs);
    }, delayMs);

    this.roomTimeouts.set(roomId, handle);
    this.logger.debug(`Armed room auto-advance: roomId=${roomId} in ${delayMs}ms`);
  }

  /**
   * clearRoomAutoAdvance — cancel the pending auto-advance for a room.
   * Called on pause, reset, and room removal (karen-4: no leaked timers).
   */
  private clearRoomAutoAdvance(roomId: string): void {
    const existing = this.roomTimeouts.get(roomId);
    if (existing !== undefined) {
      clearTimeout(existing);
      this.roomTimeouts.delete(roomId);
      this.logger.debug(`Cleared room auto-advance: roomId=${roomId}`);
    }
  }

  /**
   * doRoomPhaseAdvance — IDEMPOTENT in-memory phase transition.
   *
   * IN-MEMORY CAS guard (karen-1 — re-implemented from wave-49 DB CAS):
   *   Check current anchor.ends_at against capturedEndsAtMs.
   *   If mismatch → another control op (pause/reset/re-start) already changed
   *   the state; this fire is stale → no-op.
   *   If match → advance the phase in-memory, re-arm for next phase, broadcast.
   *
   * Public for testability — unit tests call it directly to verify idempotency
   * without waiting for the real setTimeout delay (mirrors study-timer pattern).
   */
  doRoomPhaseAdvance(roomId: string, capturedEndsAtMs: number): void {
    const anchor = this.roomTimers.get(roomId);

    // No anchor or not running → room was removed or timer was paused/reset
    if (!anchor || anchor.run_state !== 'running') {
      this.roomTimeouts.delete(roomId);
      this.logger.debug(
        `doRoomPhaseAdvance no-op: roomId=${roomId} (anchor missing or not running)`,
      );
      return;
    }

    // IN-MEMORY CAS: compare current ends_at against the captured value at arm time.
    // This is the idempotency guard — replaces the wave-49 UPDATE WHERE ends_at=$expected.
    // If another control op changed ends_at since we armed, this is a stale fire → no-op.
    if (anchor.ends_at === null || anchor.ends_at.getTime() !== capturedEndsAtMs) {
      this.roomTimeouts.delete(roomId);
      this.logger.debug(
        `doRoomPhaseAdvance no-op: roomId=${roomId} (ends_at mismatch — stale fire or concurrent advance)`,
      );
      return;
    }

    // Advance the phase using the PURE formula from wave-49 (reuse only the pure part)
    const newPhase = anchor.phase === 'work' ? 'break' : 'work';
    const now = new Date();
    const duration = phaseDurationMs(newPhase, {
      work_duration_ms: anchor.work_duration_ms,
      break_duration_ms: anchor.break_duration_ms,
    });
    const newEndsAt = new Date(now.getTime() + duration);

    // Mutate the in-memory anchor in-place
    anchor.phase = newPhase;
    anchor.started_at = now;
    anchor.ends_at = newEndsAt;
    anchor.paused_remaining_ms = null;

    // Re-arm for the next phase transition
    this.armRoomAutoAdvance(roomId, newEndsAt);

    // Broadcast the updated timer to all joined members
    const timer = this.getRoomTimer(roomId);
    this.emitTimerUpdate(roomId, timer);

    this.logger.debug(
      `Room phase advanced: roomId=${roomId} → phase=${newPhase} endsAt=${newEndsAt.toISOString()}`,
    );
  }

  // =========================================================================
  // Self-healing on reconnect — compute-on-read (MUST-LOCK 3)
  // =========================================================================

  /**
   * selfHealRoomTimerIfOverdue — called on room-join for reconnect reconciliation.
   *
   * If run_state='running' and ends_at < now(), the service missed one or more
   * phase transitions (e.g. process restart). Re-derives the correct current
   * phase using the SAME computeCurrentPhase() formula as wave-49, updates the
   * in-memory anchor, and re-arms the timeout.
   *
   * Pure compute-on-read — mirrors wave-49's selfHealIfOverdue but against
   * the in-memory Map anchor instead of the DB row.
   */
  selfHealRoomTimerIfOverdue(roomId: string): void {
    const anchor = this.roomTimers.get(roomId);
    if (
      !anchor ||
      anchor.run_state !== 'running' ||
      anchor.ends_at === null ||
      anchor.started_at === null ||
      anchor.ends_at.getTime() > Date.now()
    ) {
      return; // Nothing to heal
    }

    const now = new Date();
    const { phase: healedPhase, newEndsAt } = computeCurrentPhase(
      anchor.phase,
      anchor.started_at,
      now,
      { work_duration_ms: anchor.work_duration_ms, break_duration_ms: anchor.break_duration_ms },
    );

    anchor.phase = healedPhase;
    anchor.started_at = new Date(newEndsAt.getTime() - phaseDurationMs(healedPhase, anchor));
    anchor.ends_at = newEndsAt;

    this.armRoomAutoAdvance(roomId, newEndsAt);

    this.logger.debug(
      `Self-healed room timer: roomId=${roomId} → phase=${healedPhase} endsAt=${newEndsAt.toISOString()}`,
    );
  }

  // =========================================================================
  // Timer update fan-out (avoids circular DI)
  // =========================================================================

  private emitTimerUpdate(roomId: string, timer: StudyRoomTimer): void {
    if (this.timerUpdateCallback) {
      this.timerUpdateCallback({ roomId, timer });
    }
  }

  // =========================================================================
  // Reverse index support — for disconnect cleanup
  // =========================================================================

  /**
   * getRoomIdsForSocket — returns all roomIds a socket is in, within a server.
   * Used by gateway to clean up on disconnect without maintaining a separate index.
   */
  getRoomIdsForSocket(serverId: string, socketId: string): string[] {
    const serverRooms = this.rooms.get(serverId);
    if (!serverRooms) return [];

    const result: string[] = [];
    for (const [roomId, room] of serverRooms) {
      for (const entry of room.roster.values()) {
        if (entry.sockets.has(socketId)) {
          result.push(roomId);
          break;
        }
      }
    }
    return result;
  }
}
