/**
 * useTyping — typing indicator hook for the active channel.
 *
 * Responsibilities:
 *   - On mount / active-channel change: emit join_channel to subscribe to
 *     typing:active events for that channel (server-gates via canViewChannelById).
 *   - Expose notifyTyping(channelId?) for the composer to call on each keypress.
 *     Internally throttles typing:start to at most once per 333 ms.
 *     Emits typing:stop immediately on message send, blur, or idle timeout.
 *   - Expose typers: the current list of typers in the active channel, with self
 *     excluded (server already excludes self in TYPING_ACTIVE broadcasts).
 *   - Returns the aggregated display string for the typing indicator line.
 *
 * Throttle strategy:
 *   - First keypress: emit typing:start immediately.
 *   - Subsequent keypresses within 333 ms: suppress (ref tracks last emit time).
 *   - typing:stop on: send(), blur (stopTyping()), or 4 s idle (local timer).
 *     The server has its own 5 s TTL per the gateway; we stop at 4 s to stay
 *     slightly ahead of the server TTL so the UI clears before the server times out.
 *
 * Self-exclusion: handled server-side — getTypers(excludeUserId) strips the
 * emitting user before broadcasting typing:active. No client-side filter needed.
 */

import type { TypingActive } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  emitTypingStart,
  emitTypingStop,
  getTypers,
  joinPresenceChannel,
  subscribeTyping,
} from './presenceSocket';

/** ms between typing:start emissions (throttle window). */
const TYPING_THROTTLE_MS = 333;

/** Local idle timeout before emitting typing:stop (ms). */
const TYPING_IDLE_TIMEOUT_MS = 4_000;

export type UseTypingResult = {
  /**
   * Call on every composer keypress.
   * Throttles typing:start; resets the idle timer.
   */
  onComposerKeyPress: () => void;
  /**
   * Call when the composer sends or blurs.
   * Immediately emits typing:stop and cancels the idle timer.
   */
  stopTyping: () => void;
  /** Current typers in the active channel (self excluded). */
  typers: TypingActive['typers'];
  /**
   * Aggregated display string for the typing line.
   * "" when no one is typing.
   * "<name> is typing" for 1 typer.
   * "<a> and <b> are typing" for 2 typers.
   * "<a>, <b> and <c> are typing" for 3 typers.
   * "Several people are typing" for 4+.
   */
  typingLabel: string;
};

function buildTypingLabel(typers: TypingActive['typers']): string {
  if (typers.length === 0) return '';
  if (typers.length === 1) return `${typers[0]!.displayName} is typing`;
  if (typers.length === 2)
    return `${typers[0]!.displayName} and ${typers[1]!.displayName} are typing`;
  if (typers.length === 3)
    return `${typers[0]!.displayName}, ${typers[1]!.displayName} and ${typers[2]!.displayName} are typing`;
  return 'Several people are typing';
}

export function useTyping(channelId: string | null): UseTypingResult {
  const [typers, setTypers] = useState<TypingActive['typers']>([]);

  const lastEmitRef = useRef<number>(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const channelIdRef = useRef(channelId);

  // Keep ref in sync with current channelId for use inside callbacks
  useEffect(() => {
    channelIdRef.current = channelId;
  }, [channelId]);

  // ── Join channel + subscribe to typing events on channel change ──────────
  useEffect(() => {
    if (!channelId) {
      setTypers([]);
      return;
    }

    // Join the presence channel room for typing events
    joinPresenceChannel(channelId);

    // Sync current typers from store (may already have state if navigating back).
    // Self-exclusion is enforced server-side via getTypers(excludeUserId).
    setTypers(getTypers(channelId));

    // Subscribe to future typing:active events
    const unsub = subscribeTyping((updatedChannelId) => {
      if (updatedChannelId !== channelId) return;
      // Self-exclusion is enforced server-side via getTypers(excludeUserId).
      setTypers(getTypers(channelId));
    });

    return () => {
      unsub();
      // Stop typing when leaving a channel
      if (isTypingRef.current) {
        emitTypingStop(channelId);
        isTypingRef.current = false;
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [channelId]);

  // ── stopTyping ────────────────────────────────────────────────────────────
  const stopTyping = useCallback(() => {
    const ch = channelIdRef.current;
    if (!ch) return;
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (isTypingRef.current) {
      emitTypingStop(ch);
      isTypingRef.current = false;
    }
    lastEmitRef.current = 0;
  }, []);

  // ── onComposerKeyPress — throttled typing:start + idle reset ─────────────
  const onComposerKeyPress = useCallback(() => {
    const ch = channelIdRef.current;
    if (!ch) return;

    const now = Date.now();

    // Reset idle timer on every keypress
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        emitTypingStop(ch);
        isTypingRef.current = false;
      }
    }, TYPING_IDLE_TIMEOUT_MS);

    // Throttle: emit typing:start at most once per TYPING_THROTTLE_MS
    if (now - lastEmitRef.current >= TYPING_THROTTLE_MS) {
      emitTypingStart(ch);
      isTypingRef.current = true;
      lastEmitRef.current = now;
    }
  }, []);

  const typingLabel = buildTypingLabel(typers);

  return { onComposerKeyPress, stopTyping, typers, typingLabel };
}
