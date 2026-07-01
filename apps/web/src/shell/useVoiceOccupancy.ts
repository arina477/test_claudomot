/**
 * useVoiceOccupancy — bounded-poll hook for voice room occupancy (wave-32, M6).
 *
 * Fetches GET /channels/:channelId/voice/participants on mount and on a bounded
 * interval (~10s) while `enabled` is true. Stops on unmount or when enabled
 * flips false (e.g. user has joined the room — occupancy display is then moot).
 *
 * Design contract (spec wave-32, AC-6):
 *   - BOUNDED poll: setInterval at POLL_INTERVAL_MS; cleared on unmount AND
 *     when `enabled` changes to false. NOT a standing websocket.
 *   - In-flight coalescing (BUILD-PRINCIPLES rule 5): AbortController per tick;
 *     if a new tick fires before the previous request resolves the previous
 *     request is aborted so it cannot settle after the new one already did.
 *   - Returns { count, participants, status: 'loading'|'loaded'|'error' }.
 *   - On fetch error → status 'error'; last-known data is preserved (fail-soft).
 *   - Never throws.
 *
 * API convention (mirrors useVoiceToken / api.ts):
 *   - Uses the shared `request` pattern via the api object (credentials:include,
 *     BASE prefix) — but fetch is called inline here since the api module uses
 *     a module-private `request` helper. We replicate the same headers/credentials.
 *   - Error message format from api.ts: `${status} ${statusText}: ${body}`.
 *     We treat any non-ok response as an error and preserve stale data.
 *
 * Security note:
 *   - GET — no body, credentials:include (SuperTokens cookie auth).
 *   - No livekit-server-sdk import (server-only SDK; never in apps/web).
 */

import { useEffect, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VoiceParticipant {
  userId: string;
  displayName: string;
}

export type VoiceOccupancyStatus = 'loading' | 'loaded' | 'error';

export interface VoiceOccupancyState {
  count: number;
  participants: VoiceParticipant[];
  status: VoiceOccupancyStatus;
}

interface UseVoiceOccupancyOptions {
  /** When false, polling stops and any running interval is cleared. */
  enabled: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Poll interval: 10 s. Within the bounded 10–15 s spec window. */
const POLL_INTERVAL_MS = 10_000;

const BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_API_ORIGIN ?? '';

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useVoiceOccupancy(
  channelId: string,
  { enabled }: UseVoiceOccupancyOptions,
): VoiceOccupancyState {
  const [state, setState] = useState<VoiceOccupancyState>({
    count: 0,
    participants: [],
    status: 'loading',
  });

  // Ref for the in-flight AbortController so the interval tick can abort the
  // previous request before starting the next one (coalescing guard).
  const abortRef = useRef<AbortController | null>(null);

  // Track mount state to avoid setting state after unmount.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Reset to loading state when channelId changes so the new channel shows
  // the loading skeleton while the first poll is in flight.
  // biome-ignore lint/correctness/useExhaustiveDependencies: channelId is the intentional trigger; setState is stable.
  useEffect(() => {
    setState({ count: 0, participants: [], status: 'loading' });
  }, [channelId]);

  useEffect(() => {
    if (!enabled) {
      // Stop any in-flight request and cancel the interval.
      abortRef.current?.abort();
      abortRef.current = null;
      return;
    }

    /**
     * Single poll tick.
     * Aborts the previous in-flight request (if any) before starting a new one
     * so a slow response from tick N cannot clobber the result from tick N+1.
     */
    function poll() {
      // Abort previous in-flight request (coalescing guard).
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      fetch(`${BASE}/channels/${encodeURIComponent(channelId)}/voice/participants`, {
        credentials: 'include',
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok) {
            const body = await res.text().catch(() => '');
            throw new Error(`${res.status} ${res.statusText}: ${body}`);
          }
          return res.json() as Promise<{ count: number; participants: VoiceParticipant[] }>;
        })
        .then(({ count, participants }) => {
          if (!mountedRef.current) return;
          setState({ count, participants, status: 'loaded' });
        })
        .catch((err: unknown) => {
          // AbortError is not a real error — the next tick will handle it.
          if (err instanceof DOMException && err.name === 'AbortError') return;
          if (!mountedRef.current) return;
          // Fail-soft: preserve last-known data; only change status to error.
          setState((prev) => ({ ...prev, status: 'error' }));
        });
    }

    // Fire immediately on mount / when enabled flips true.
    poll();

    // Then poll on the bounded interval.
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      // Stop polling and abort in-flight request on unmount or enabled=false.
      clearInterval(intervalId);
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [channelId, enabled]);

  return state;
}
