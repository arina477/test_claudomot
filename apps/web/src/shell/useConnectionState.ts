/**
 * useConnectionState — derive live 'online' | 'reconnecting' | 'offline'
 * from the messaging socket lifecycle + window network events.
 *
 * SOURCE-PRIORITY contract (mandatory):
 *   offline     IF window.navigator.onLine === false OR socket is 'offline'
 *   reconnecting IF socket.active && !socket.connected  (trying to reconnect)
 *   online      ONLY when both window is online AND socket is connected
 *
 * window 'online' is a RE-EVALUATION TRIGGER only — it NEVER overrides to
 * 'online' while the socket isn't connected yet (regained network +
 * still-reconnecting socket → 'reconnecting').
 *
 * Debounce: rapid flap suppression via a 150 ms trailing-edge timer so a
 * momentary offline/online blip doesn't thrash the indicator.
 */

import { useEffect, useRef, useState } from 'react';
import type { ConnectionState } from './ConnectionStateIndicator';
import { getMessagingSocket, getSocketState } from './messagingSocket';

/** Derive the canonical state from both signal sources (no side effects). */
function deriveState(): ConnectionState {
  // Window offline is absolute — no network means offline regardless of socket.
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'offline';
  }

  const socketState = getSocketState();

  // Socket offline (not active / no socket) — treat as offline.
  if (socketState === 'offline') {
    return 'offline';
  }

  // Socket is actively trying to reconnect.
  if (socketState === 'reconnecting') {
    return 'reconnecting';
  }

  // socketState === 'online' AND window.onLine — truly connected.
  return 'online';
}

const DEBOUNCE_MS = 150;

export function useConnectionState(): ConnectionState {
  const [state, setState] = useState<ConnectionState>(() => deriveState());

  // Stable reference to the debounce timer id.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const socket = getMessagingSocket();

    /** Schedule a state update using the current source-priority derivation. */
    function scheduleUpdate() {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setState(deriveState());
      }, DEBOUNCE_MS);
    }

    // Socket events.
    socket.on('connect', scheduleUpdate);
    socket.on('disconnect', scheduleUpdate);
    socket.on('reconnecting', scheduleUpdate);
    socket.on('reconnect_attempt', scheduleUpdate);
    socket.on('reconnect_failed', scheduleUpdate);
    socket.on('reconnect', scheduleUpdate);

    // Window network events (re-evaluation trigger only — SOURCE-PRIORITY applies).
    window.addEventListener('online', scheduleUpdate);
    window.addEventListener('offline', scheduleUpdate);

    // Ensure the initial value is current (the socket may have changed state
    // between the first render and the time this effect mounted).
    setState(deriveState());

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      socket.off('connect', scheduleUpdate);
      socket.off('disconnect', scheduleUpdate);
      socket.off('reconnecting', scheduleUpdate);
      socket.off('reconnect_attempt', scheduleUpdate);
      socket.off('reconnect_failed', scheduleUpdate);
      socket.off('reconnect', scheduleUpdate);
      window.removeEventListener('online', scheduleUpdate);
      window.removeEventListener('offline', scheduleUpdate);
    };
  }, []);

  return state;
}
