/**
 * useMentionBadge — client-side store for per-channel unread mention counts.
 *
 * The store is driven by two inputs:
 *  1. Realtime: the `mention` socket event emitted to the current user's
 *     per-user room ('user:<userId>') by the /messaging gateway.  The server
 *     excludes the author so callers never receive self-mention events.
 *  2. Bootstrap: GET /me/mentions on mount to catch mentions that arrived
 *     while the viewer was offline (only the most-recent page is used to
 *     seed the badge — stale unread is acceptable at bootstrap).
 *
 * Counts are cleared when the viewer opens a channel (call markChannelRead).
 *
 * Singleton reset (H-2):
 *   The module-level `_bootstrapped`/`_counts` survive between React render
 *   trees. When the current viewer's username changes (logout → another user
 *   logs in in the same tab), both are reset so the next user starts clean.
 *
 * Active-channel suppression:
 *   A `mention` event whose channelId matches the currently open channel is
 *   silently dropped — the user is already reading that channel.
 */

import type { MentionEvent } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { api } from '../auth/api';
import { onMention } from './messagingSocket';

// ---------------------------------------------------------------------------
// Module-level singleton store
// ---------------------------------------------------------------------------

type UnreadCounts = Record<string, number>; // channelId → count

let _counts: UnreadCounts = {};
const _listeners = new Set<() => void>();

function notify() {
  for (const cb of _listeners) cb();
}

function getSnapshot(): UnreadCounts {
  return _counts;
}

function subscribe(cb: () => void) {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

function increment(channelId: string) {
  _counts = { ..._counts, [channelId]: (_counts[channelId] ?? 0) + 1 };
  notify();
}

function clearChannel(channelId: string) {
  if (!_counts[channelId]) return;
  const next = { ..._counts };
  delete next[channelId];
  _counts = next;
  notify();
}

// ---------------------------------------------------------------------------
// Bootstrap (runs once per user session)
// ---------------------------------------------------------------------------

let _bootstrapped = false;
/** The username for which the singleton was last bootstrapped. */
let _bootstrappedForUser: string | null = null;

/**
 * Reset all singleton state.  Called when the viewer identity changes
 * (logout or cross-user tab reuse) so the incoming user starts with a
 * clean store.
 */
export function resetMentionBadges(): void {
  _bootstrapped = false;
  _bootstrappedForUser = null;
  _counts = {};
  notify();
}

function bootstrap(viewerUsername: string | null) {
  if (!viewerUsername) return;
  // If already bootstrapped for this exact user, skip.
  if (_bootstrapped && _bootstrappedForUser === viewerUsername) return;

  _bootstrapped = true;
  _bootstrappedForUser = viewerUsername;

  api
    .getMyMentions()
    .then((res) => {
      // Accumulate per-channel counts from the bootstrap page.
      const accumulated: UnreadCounts = {};
      for (const msg of res.items) {
        const isSelf = msg.mentions.some((m) => m.username === viewerUsername);
        if (isSelf) {
          accumulated[msg.channelId] = (accumulated[msg.channelId] ?? 0) + 1;
        }
      }
      // Merge into the store (don't overwrite counts that may have arrived
      // via socket between mount and the fetch resolving).
      if (Object.keys(accumulated).length > 0) {
        _counts = { ..._counts };
        for (const [ch, n] of Object.entries(accumulated)) {
          _counts[ch] = (_counts[ch] ?? 0) + n;
        }
        notify();
      }
    })
    .catch(() => {
      // Bootstrap failure is non-fatal — realtime socket still works.
    });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

type UseMentionBadgeResult = {
  /** Unread mention count for a given channel (0 if none). */
  getCount: (channelId: string) => number;
  /** Call when the viewer opens a channel to clear its badge. */
  markChannelRead: (channelId: string) => void;
};

/**
 * @param viewerUsername  The current viewer's username from ProfileContext.
 * @param activeChannelId The channel currently open (auto-clears its badge).
 */
export function useMentionBadge(
  viewerUsername: string | null,
  activeChannelId: string | null,
): UseMentionBadgeResult {
  // Subscribe to external store so the component re-renders on count changes.
  const counts = useSyncExternalStore(subscribe, getSnapshot);

  // Keep a stable ref to activeChannelId for use inside the socket handler
  // without re-subscribing on every active-channel change.
  const activeChannelRef = useRef<string | null>(activeChannelId);
  useEffect(() => {
    activeChannelRef.current = activeChannelId;
  }, [activeChannelId]);

  // H-2: Reset singleton when the viewer identity changes (logout / user switch).
  const prevUsernameRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    // undefined means first run — skip the reset on initial mount.
    if (prevUsernameRef.current !== undefined && prevUsernameRef.current !== viewerUsername) {
      resetMentionBadges();
    }
    prevUsernameRef.current = viewerUsername;
  }, [viewerUsername]);

  // Bootstrap on first call with a known viewer (after any reset).
  useEffect(() => {
    bootstrap(viewerUsername);
  }, [viewerUsername]);

  // H-1: Real-time: listen for the `mention` event on the /messaging socket.
  // The server emits this event only to the mentioned user's per-user room
  // and already excludes self-mentions, so no username check is needed here.
  useEffect(() => {
    if (!viewerUsername) return;
    const unsub = onMention((e: MentionEvent) => {
      // Active-channel suppression: skip if the user is already viewing the channel.
      if (e.channelId === activeChannelRef.current) return;
      increment(e.channelId);
    });
    return unsub;
  }, [viewerUsername]);

  // Auto-clear when the active channel changes
  useEffect(() => {
    if (activeChannelId) {
      clearChannel(activeChannelId);
    }
  }, [activeChannelId]);

  const getCount = useCallback((channelId: string) => counts[channelId] ?? 0, [counts]);

  const markChannelRead = useCallback((channelId: string) => {
    clearChannel(channelId);
  }, []);

  return { getCount, markChannelRead };
}
