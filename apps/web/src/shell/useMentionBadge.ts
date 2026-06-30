/**
 * useMentionBadge — client-side store for per-channel unread mention counts.
 *
 * The store is driven by two inputs:
 *  1. Realtime: incoming message:new socket events whose mentions[] contains
 *     the current viewer (identified by viewerUsername).
 *  2. Bootstrap: GET /me/mentions on mount to catch mentions that arrived
 *     while the viewer was offline (only the most-recent page is used to
 *     seed the badge — stale unread is acceptable at bootstrap).
 *
 * Counts are cleared when the viewer opens a channel (call markChannelRead).
 *
 * Self-mention detection:
 *   MentionRef has userId + username. ProfileResponse has username (no userId
 *   on the current /profile response). We match on username equality, which
 *   is a stable, unique identifier in this project.
 *   If /me adds a uuid in a future wave, callers can switch to userId matching
 *   without changing this hook's interface.
 *
 * Singleton pattern: the hook state is module-level so all consumers share
 * the same counts (avoids double-counting from multiple hook instances).
 */

import type { MessageResponse } from '@studyhall/shared';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { api } from '../auth/api';
import { onMessageNew } from './messagingSocket';

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
// Bootstrap (runs once per app session)
// ---------------------------------------------------------------------------

let _bootstrapped = false;

function bootstrap(viewerUsername: string | null) {
  if (_bootstrapped || !viewerUsername) return;
  _bootstrapped = true;

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

  // Bootstrap on first call with a known viewer
  useEffect(() => {
    bootstrap(viewerUsername);
  }, [viewerUsername]);

  // Real-time: listen for message:new and check if viewer is mentioned
  useEffect(() => {
    if (!viewerUsername) return;
    const unsub = onMessageNew((msg: MessageResponse) => {
      const isSelf = msg.mentions.some((m) => m.username === viewerUsername);
      if (!isSelf) return;
      // Don't increment for the currently open channel (user sees it live)
      if (msg.channelId === activeChannelId) return;
      increment(msg.channelId);
    });
    return unsub;
  }, [viewerUsername, activeChannelId]);

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
