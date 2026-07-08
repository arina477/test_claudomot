/**
 * PresenceService — in-memory presence + typing state
 *
 * Presence ref-counting:
 *   Map<userId, Set<socketId>> — a user is "online" while their Set is non-empty.
 *   connect() returns wentOnline=true only on the 0→1 transition.
 *   disconnect() returns wentOffline=true only on the →0 transition.
 *   Multi-tab safe: each tab is a distinct socketId in the Set.
 *
 * Co-member resolution:
 *   getServerIdsForUser(userId) — SELECT DISTINCT server_id FROM server_members.
 *   getCoMemberUserIds(userId) — all user_ids sharing at least one server with userId
 *   (excludes userId itself).
 *
 * Typing state:
 *   Map<channelId, Map<userId, { displayName, timer }>>
 *   startTyping() sets / resets a 5 s TTL timer that auto-calls stopTyping().
 *   stopTyping() cancels the timer and removes the entry.
 *   getTypers() returns the current typers list for a channel.
 *
 * Single-pod in-memory only (no Redis). Consistent with the messaging gateway.
 */

import { Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../db/index';
import { server_members, users } from '../db/schema/index';

/** How long a typing indicator persists without renewal (ms). */
const TYPING_TTL_MS = 5_000;

interface TypingEntry {
  displayName: string;
  timer: NodeJS.Timeout;
}

@Injectable()
export class PresenceService {
  // ---------------------------------------------------------------------------
  // Presence state
  // ---------------------------------------------------------------------------

  /** userId → Set<socketId> (ref-count per socket). */
  private readonly presenceMap = new Map<string, Set<string>>();

  // ---------------------------------------------------------------------------
  // Typing state
  // ---------------------------------------------------------------------------

  /** channelId → userId → TypingEntry (with TTL timer). */
  private readonly typingMap = new Map<string, Map<string, TypingEntry>>();

  // ---------------------------------------------------------------------------
  // Presence: connect / disconnect
  // ---------------------------------------------------------------------------

  /**
   * Register a new socket for a user.
   * @returns wentOnline — true if this is the user's first socket (0→1).
   */
  connect(userId: string, socketId: string): { wentOnline: boolean } {
    let sockets = this.presenceMap.get(userId);
    const wentOnline = !sockets || sockets.size === 0;

    if (!sockets) {
      sockets = new Set();
      this.presenceMap.set(userId, sockets);
    }
    sockets.add(socketId);

    return { wentOnline };
  }

  /**
   * Deregister a socket for a user.
   * @returns wentOffline — true if the user has no remaining sockets (→0).
   */
  disconnect(userId: string, socketId: string): { wentOffline: boolean } {
    const sockets = this.presenceMap.get(userId);
    if (!sockets) return { wentOffline: false };

    sockets.delete(socketId);

    const wentOffline = sockets.size === 0;
    if (wentOffline) {
      this.presenceMap.delete(userId);
    }

    return { wentOffline };
  }

  /** Return true if userId currently has at least one connected socket. */
  isOnline(userId: string): boolean {
    const sockets = this.presenceMap.get(userId);
    return sockets !== undefined && sockets.size > 0;
  }

  // ---------------------------------------------------------------------------
  // Co-member resolution (DB queries against server_members)
  // ---------------------------------------------------------------------------

  /**
   * Return all server IDs that userId belongs to.
   * Used to build the room-join list on connection.
   */
  async getServerIdsForUser(userId: string): Promise<string[]> {
    const rows = await db
      .select({ server_id: server_members.server_id })
      .from(server_members)
      .where(eq(server_members.user_id, userId));

    return rows.map((r) => r.server_id);
  }

  /**
   * Return all userIds that share at least one server with userId (excluding userId).
   * Used to build the presence:snapshot on connection.
   */
  async getCoMemberUserIds(userId: string): Promise<string[]> {
    const serverIds = await this.getServerIdsForUser(userId);
    if (serverIds.length === 0) return [];

    const rows = await db
      .select({ user_id: server_members.user_id })
      .from(server_members)
      .where(inArray(server_members.server_id, serverIds));

    const seen = new Set<string>();
    for (const r of rows) {
      if (r.user_id !== userId) seen.add(r.user_id);
    }
    return Array.from(seen);
  }

  // ---------------------------------------------------------------------------
  // Presence-visibility honor (wave-80 — show_presence gate)
  //
  // show_presence governs whether the user's own online/offline status is
  // broadcast to co-members. It is OUTBOUND only: a hidden user still receives
  // co-members' presence (the inbound view is unaffected).
  // ---------------------------------------------------------------------------

  /**
   * Return the user's show_presence flag (users.show_presence, NOT NULL DEFAULT true).
   * Used at connect to cache the flag on socket.data and to gate the online emit.
   * Defensive default true if the row is somehow absent (matches column default).
   */
  async getShowPresence(userId: string): Promise<boolean> {
    const rows = await db
      .select({ show_presence: users.show_presence })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return rows[0]?.show_presence ?? true;
  }

  /**
   * Batch-resolve show_presence for a set of co-member userIds.
   * Used by the snapshot-on-join path to EXCLUDE co-members whose show_presence
   * is false from the snapshot sent to a connecting peer (honor requires the
   * CO-MEMBERS' flags, not the connecting user's flag).
   *
   * @returns Map<userId, show_presence>. userIds absent from the DB default to
   *          true (matches the column default), so the caller can look up safely.
   */
  async getShowPresenceBatch(userIds: string[]): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>();
    if (userIds.length === 0) return result;

    const rows = await db
      .select({ id: users.id, show_presence: users.show_presence })
      .from(users)
      .where(inArray(users.id, userIds));

    for (const r of rows) {
      result.set(r.id, r.show_presence);
    }
    // Any userId not returned defaults to visible (true).
    for (const uid of userIds) {
      if (!result.has(uid)) result.set(uid, true);
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Typing
  // ---------------------------------------------------------------------------

  /**
   * Record that userId started typing in channelId.
   * Resets the 5 s TTL on each call (debounced per-user).
   *
   * @param onExpiry - Callback invoked on TTL expiry so the gateway can
   *                   emit typing:active to the room without polling.
   */
  startTyping(
    channelId: string,
    userId: string,
    displayName: string,
    onExpiry: (channelId: string) => void,
  ): void {
    let channelTypers = this.typingMap.get(channelId);
    if (!channelTypers) {
      channelTypers = new Map();
      this.typingMap.set(channelId, channelTypers);
    }

    // Cancel any existing timer for this user in this channel
    const existing = channelTypers.get(userId);
    if (existing) {
      clearTimeout(existing.timer);
    }

    const timer = setTimeout(() => {
      this.stopTyping(channelId, userId);
      onExpiry(channelId);
    }, TYPING_TTL_MS);

    channelTypers.set(userId, { displayName, timer });
  }

  /**
   * Record that userId stopped typing in channelId.
   * Cancels the TTL timer and removes the entry.
   */
  stopTyping(channelId: string, userId: string): void {
    const channelTypers = this.typingMap.get(channelId);
    if (!channelTypers) return;

    const existing = channelTypers.get(userId);
    if (existing) {
      clearTimeout(existing.timer);
      channelTypers.delete(userId);
    }

    if (channelTypers.size === 0) {
      this.typingMap.delete(channelId);
    }
  }

  /**
   * Return the current list of typers for channelId (self excluded).
   *
   * @param excludeUserId - The requesting user's userId (never appears in output).
   */
  getTypers(
    channelId: string,
    excludeUserId: string,
  ): Array<{ userId: string; displayName: string }> {
    const channelTypers = this.typingMap.get(channelId);
    if (!channelTypers) return [];

    const result: Array<{ userId: string; displayName: string }> = [];
    for (const [uid, entry] of channelTypers) {
      if (uid !== excludeUserId) {
        result.push({ userId: uid, displayName: entry.displayName });
      }
    }
    return result;
  }
}
