/**
 * useVoiceToken — on-demand hook that fetches a LiveKit access token from
 * POST /channels/:channelId/voice/token.
 *
 * Usage contract:
 *   - Does NOT auto-fetch on mount (pre-join state is explicit — user must click Join).
 *   - `fetchToken()` triggers the fetch; callers must handle the returned promise
 *     or use the returned state fields.
 *   - Status resets to 'idle' on channelId change, so the pre-join view is clean
 *     after navigating between voice channels.
 *
 * wave-31 B-3 (Refs: 1dd1f2ca). Token is consumed by VoiceStudyRoom.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';

export type VoiceTokenStatus = 'idle' | 'loading' | 'ready' | 'error';

export type VoiceTokenState = {
  status: VoiceTokenStatus;
  token: string | null;
  url: string | null;
  /** Human-readable error message (never exposes the API secret or raw SDK error). */
  errorMessage: string | null;
  /** Trigger a token fetch. Safe to call multiple times — debounces in-flight. */
  fetchToken: () => void;
  /** Reset back to 'idle' (clears token + error). Used by Leave to go back to pre-join. */
  reset: () => void;
  /**
   * Transition to the 'error' state with the given message.
   * Used by LiveKitRoom's onError to show the error view instead of silently
   * falling back to pre-join — an involuntary connect failure must be visible.
   */
  setError: (message: string) => void;
};

export function useVoiceToken(channelId: string | null): VoiceTokenState {
  const [status, setStatus] = useState<VoiceTokenStatus>('idle');
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Track mount state to avoid setting state after unmount
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Use a ref for the in-flight guard so fetchToken's useCallback
  // doesn't need `status` as a dependency (avoids stale-closure re-creation
  // on every state update while still correctly blocking double-fetches).
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Reset state when the channel changes so pre-join view is clean.
  // biome-ignore lint/correctness/useExhaustiveDependencies: channelId is the intentional trigger; setter fns are stable but the effect must rerun on channel change.
  useEffect(() => {
    setStatus('idle');
    setToken(null);
    setUrl(null);
    setErrorMessage(null);
  }, [channelId]);

  const fetchToken = useCallback(() => {
    if (!channelId) return;
    // Prevent double-fetch if already in flight — read via ref, not state,
    // so this callback is stable across status changes.
    if (statusRef.current === 'loading') return;

    setStatus('loading');
    setErrorMessage(null);

    api
      .getVoiceToken(channelId)
      .then(({ token: t, url: u }) => {
        if (!mounted.current) return;
        setToken(t);
        setUrl(u);
        setStatus('ready');
      })
      .catch((err: unknown) => {
        if (!mounted.current) return;
        setToken(null);
        setUrl(null);
        setStatus('error');
        setErrorMessage(classifyVoiceTokenError(err));
      });
  }, [channelId]);

  const reset = useCallback(() => {
    setStatus('idle');
    setToken(null);
    setUrl(null);
    setErrorMessage(null);
  }, []);

  const setError = useCallback((message: string) => {
    setStatus('error');
    setToken(null);
    setUrl(null);
    setErrorMessage(message);
  }, []);

  return { status, token, url, errorMessage, fetchToken, reset, setError };
}

/**
 * Map API error messages to user-friendly copy.
 * Never surfaces the raw error (which may contain SDK hints or the API key fragment).
 */
function classifyVoiceTokenError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.startsWith('401') || msg.includes('401')) {
      return 'You need to be logged in to join a voice room.';
    }
    if (msg.startsWith('403') || msg.includes('403')) {
      return "You don't have permission to join this voice channel.";
    }
    // Unreachable for a missing channel: the API returns 403 (uniform default-deny),
    // not 404, so a non-existent channel maps to the 403 branch above. Kept as a
    // defensive fallthrough only; no live server path emits 404 for this endpoint.
    if (msg.startsWith('404') || msg.includes('404')) {
      return 'This voice channel no longer exists.';
    }
    if (msg.startsWith('400') || msg.includes('400')) {
      return 'This channel is not a voice channel.';
    }
    if (msg.startsWith('503') || msg.includes('503')) {
      return 'Voice is not available right now. Try again in a moment.';
    }
  }
  return 'Couldn’t connect to the study room. Please check your network and try again.';
}
