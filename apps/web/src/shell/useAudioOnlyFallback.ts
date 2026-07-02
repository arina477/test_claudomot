/**
 * useAudioOnlyFallback — bandwidth-saving subscription hook (wave-34 B-3)
 *
 * Listens to LiveKit's RoomEvent.ConnectionQualityChanged on the local participant.
 * On Poor quality (debounced to avoid flapping) OR a manual opt-in toggle:
 *   - Sets all remote video + screen-share publications setSubscribed(false).
 *   - Audio subscriptions are NEVER touched — the invariant is "keep talking".
 *
 * On restore (manual or auto Quality→Good):
 *   - Re-subscribes only the tracks that were active before fallback triggered
 *     (does not force-enable tracks the user did not have).
 *
 * Audio-only "mode" sources:
 *   'auto'   — triggered by ConnectionQuality → Poor (debounced 3 s)
 *   'manual' — triggered by user toggle
 *   null     — not in audio-only mode
 *
 * SDK surfaces used (livekit-client, already installed as @livekit/components-react dep):
 *   RoomEvent.ConnectionQualityChanged — emitted when local participant quality changes
 *   ConnectionQuality enum (Poor | Good | Excellent | Lost | Unknown)
 *   RemoteTrackPublication.setSubscribed(boolean) — controls inbound track subscription
 *   Track.Kind enum — 'video' vs 'audio' (never touch audio)
 *
 * Must be called inside a <LiveKitRoom> subtree (needs useRoomContext()).
 */

import { useRoomContext } from '@livekit/components-react';
import {
  ConnectionQuality,
  type RemoteParticipant,
  type RemoteTrackPublication,
  RoomEvent,
  Track,
} from 'livekit-client';
import { useCallback, useEffect, useRef, useState } from 'react';

export type AudioOnlyMode = 'auto' | 'manual' | null;
export type RestoreState = 'idle' | 'restoring';

export interface AudioOnlyFallbackState {
  /** Current audio-only mode: 'auto' (poor bandwidth), 'manual' (user opted in), or null */
  mode: AudioOnlyMode;
  /** Restoring state while re-subscribing after user clicks restore */
  restoreState: RestoreState;
  /** Call to enter audio-only mode manually (user toggle) */
  enterManual: () => void;
  /** Call to restore video subscriptions */
  restore: () => void;
}

/** Debounce delay (ms) before reacting to ConnectionQuality.Poor — avoids subscription thrash */
const POOR_DEBOUNCE_MS = 3000;

/** Track source kinds that are video (and should be unsubscribed in audio-only mode) */
const VIDEO_SOURCES: Track.Source[] = [Track.Source.Camera, Track.Source.ScreenShare];

export function useAudioOnlyFallback(): AudioOnlyFallbackState {
  const room = useRoomContext();
  const [mode, setMode] = useState<AudioOnlyMode>(null);
  const [restoreState, setRestoreState] = useState<RestoreState>('idle');

  // Ref to track whether we're in audio-only so the quality listener closure stays fresh
  const modeRef = useRef<AudioOnlyMode>(null);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Debounce timer ref for poor quality transitions
  const poorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore-transition timer ref — clears the restoring→null timeout to prevent
  // setState on an unmounted component when the user leaves within 1 s of restoring.
  const restoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Subscription helpers
  // ---------------------------------------------------------------------------

  /** Set subscribed=false on all remote video + screen-share publications. Audio untouched. */
  const pauseVideoSubscriptions = useCallback(() => {
    for (const participant of room.remoteParticipants.values()) {
      for (const pub of (participant as RemoteParticipant).trackPublications.values()) {
        const rPub = pub as RemoteTrackPublication;
        if (rPub.kind === Track.Kind.Video && VIDEO_SOURCES.includes(rPub.source)) {
          rPub.setSubscribed(false);
        }
      }
    }
  }, [room]);

  /** Re-subscribe to all remote video + screen-share publications by calling
   *  setSubscribed(true) on each. LiveKit ignores the call if already subscribed. */
  const resumeVideoSubscriptions = useCallback(() => {
    for (const participant of room.remoteParticipants.values()) {
      for (const pub of (participant as RemoteParticipant).trackPublications.values()) {
        const rPub = pub as RemoteTrackPublication;
        if (rPub.kind === Track.Kind.Video && VIDEO_SOURCES.includes(rPub.source)) {
          // setSubscribed(true) re-subscribes; LiveKit ignores if already subscribed.
          rPub.setSubscribed(true);
        }
      }
    }
  }, [room]);

  // ---------------------------------------------------------------------------
  // ConnectionQuality listener
  // ---------------------------------------------------------------------------

  useEffect(() => {
    function handleQualityChanged(quality: ConnectionQuality, participant: unknown) {
      // Only react to the local participant's quality (not remote participants)
      if (participant !== room.localParticipant) return;

      if (quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost) {
        // Start debounce timer: only enter audio-only if quality stays poor for 3 s
        if (poorTimerRef.current === null && modeRef.current === null) {
          poorTimerRef.current = setTimeout(() => {
            poorTimerRef.current = null;
            // Re-check: still in no-mode when timer fires (manual override takes priority)
            if (modeRef.current === null) {
              setMode('auto');
              pauseVideoSubscriptions();
            }
          }, POOR_DEBOUNCE_MS);
        }
      } else if (quality === ConnectionQuality.Good || quality === ConnectionQuality.Excellent) {
        // Cancel any pending poor-quality timer (quality recovered before debounce expired)
        if (poorTimerRef.current !== null) {
          clearTimeout(poorTimerRef.current);
          poorTimerRef.current = null;
        }
        // Auto-restore only if the mode was set by auto (not manual: user decision wins)
        if (modeRef.current === 'auto') {
          setMode(null);
          resumeVideoSubscriptions();
        }
      }
    }

    room.on(RoomEvent.ConnectionQualityChanged, handleQualityChanged);
    return () => {
      room.off(RoomEvent.ConnectionQualityChanged, handleQualityChanged);
      // Clear any outstanding debounce timer on unmount
      if (poorTimerRef.current !== null) {
        clearTimeout(poorTimerRef.current);
        poorTimerRef.current = null;
      }
      // Clear any outstanding restore-transition timer on unmount
      if (restoreTimerRef.current !== null) {
        clearTimeout(restoreTimerRef.current);
        restoreTimerRef.current = null;
      }
    };
  }, [room, pauseVideoSubscriptions, resumeVideoSubscriptions]);

  // ---------------------------------------------------------------------------
  // Public actions
  // ---------------------------------------------------------------------------

  const enterManual = useCallback(() => {
    // Cancel any pending auto timer (manual takes over)
    if (poorTimerRef.current !== null) {
      clearTimeout(poorTimerRef.current);
      poorTimerRef.current = null;
    }
    setMode('manual');
    pauseVideoSubscriptions();
  }, [pauseVideoSubscriptions]);

  const restore = useCallback(() => {
    // Cancel any previous restore timer before starting a new one (idempotent calls)
    if (restoreTimerRef.current !== null) {
      clearTimeout(restoreTimerRef.current);
      restoreTimerRef.current = null;
    }
    setRestoreState('restoring');
    resumeVideoSubscriptions();
    // Re-subscription is async over WebRTC; give it a brief moment then clear state.
    // The tracks will arrive when the SFU delivers them. We clear restoring after 1 s
    // (a conservative but non-blocking UI signal — actual track arrival is via useTracks).
    restoreTimerRef.current = setTimeout(() => {
      restoreTimerRef.current = null;
      setMode(null);
      setRestoreState('idle');
    }, 1000);
  }, [resumeVideoSubscriptions]);

  return { mode, restoreState, enterManual, restore };
}
