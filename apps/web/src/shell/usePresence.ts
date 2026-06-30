/**
 * usePresence — hook exposing presence status for a set of userIds.
 *
 * Subscribes to the presence store in presenceSocket.ts and triggers a
 * re-render whenever any presence event arrives (online/offline/snapshot).
 *
 * Returns a function getStatus(userId) rather than a plain map so that
 * callers don't need to manage Map copies — they read status at render time.
 *
 * Design: call once at MemberListPanel level and pass getStatus down to list
 * items, keeping subscription count at 1 regardless of member count.
 */

import { useCallback, useEffect, useState } from 'react';
import type { PresenceStatus } from '@studyhall/shared';
import { getPresenceStatus, subscribePresence } from './presenceSocket';

export type UsePresenceResult = {
  /** Get the current online/offline status for a userId. */
  getStatus: (userId: string) => PresenceStatus;
  /**
   * Tick counter — incremented on every presence change.
   * Useful as a dependency to force re-renders in child components.
   */
  tick: number;
};

export function usePresence(): UsePresenceResult {
  // Use a tick counter to trigger re-renders on any presence change.
  // Avoids re-creating the Map on every event.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribePresence(() => {
      setTick((n) => n + 1);
    });
    return unsub;
  }, []);

  const getStatus = useCallback((userId: string): PresenceStatus => {
    return getPresenceStatus(userId);
  }, []);

  return { getStatus, tick };
}
