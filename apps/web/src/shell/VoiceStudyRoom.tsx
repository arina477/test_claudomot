/**
 * VoiceStudyRoom — audio-first LiveKit voice channel surface. (wave-34 extended)
 *
 * Implements the 5 states from design/voice-study-room.html (D-3 adopted):
 *   1. Pre-join   — "Join voice" CTA; no auto-connect on mount.
 *   2. Connecting — spinner while fetching token + LiveKit connect.
 *   3. In-room (populated) — participant tile grid + mic toggle + Leave.
 *   4. In-room (alone)     — own tile + empty-state prompt + controls.
 *   5. Error       — danger icon + message + "Try again" CTA.
 *
 * Wave-34 additions (screen-share + audio-only fallback):
 *   - Screen-share publish/subscribe: share button → setScreenShareEnabled();
 *     remote screen-share rendered as a DISTINCT PROMINENT tile per design/screen-share-tile.html.
 *     Layout: prominent area (max-w-[1000px] mx-auto) + demoted avatar strip.
 *   - Audio-only fallback: useAudioOnlyFallback() hook; on Poor quality (debounced) OR
 *     manual toggle → inbound video/screen-share setSubscribed(false); audio untouched.
 *     Surface: amber banner (auto mode) or neutral banner (manual) per design/audio-only-state.html.
 *     Restore button re-subscribes video. a11y: role=status aria-live=polite.
 *   - Screen-share live region: sr-only aria-live=polite announces start/stop.
 *
 * Design constraints:
 *   - Camera OFF: `video={false}` on LiveKitRoom — audio-first, no camera.
 *   - Single LiveKitRoom per session; unmount → room.disconnect().
 *   - livekit-server-sdk is NOT imported here (server-only).
 *
 * Screen-share states (design/screen-share-tile.html):
 *   State 1: No share      — baseline avatar grid, share button idle.
 *   State 2: Sharing active (remote) — prominent tile + avatar strip.
 *   State 3: Loading (subscribing) — skeleton prominent area.
 *   State 4: Own share active — own-share prominent panel + stop button.
 *
 * Audio-only states (design/audio-only-state.html):
 *   State: Auto (poor bandwidth) — amber banner + wifi-low icon + restore.
 *   State: Manual (opted in)     — neutral banner + video-slash icon + restore.
 *   State: Restoring             — emerald spinner banner + disabled button.
 */

import {
  LiveKitRoom,
  VideoTrack,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ProfileContext } from './ProfileContext';
import { VoiceOccupancyIndicator } from './VoiceOccupancyIndicator';
import {
  ArrowCounterClockwiseIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  MonitorIcon,
  ScreencastIcon,
  SignOutIcon,
  SpeakerHighIcon,
  StopIcon,
  UsersIcon,
  VideoCameraIcon,
  WifiLowIcon,
} from './icons';
import { useAudioOnlyFallback } from './useAudioOnlyFallback';
import { useVoiceOccupancy } from './useVoiceOccupancy';
import { useVoiceToken } from './useVoiceToken';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  channelId: string;
  channelName: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Public component — state machine wrapper
// ─────────────────────────────────────────────────────────────────────────────

export function VoiceStudyRoom({ channelId, channelName }: Props) {
  const { status, token, url, errorMessage, fetchToken, reset, setError } =
    useVoiceToken(channelId);

  // Occupancy polling: active only on the pre-join surface (status === 'idle').
  const occupancy = useVoiceOccupancy(channelId, { enabled: status === 'idle' });

  return (
    <div
      data-testid="voice-study-room"
      className="flex flex-col flex-1 min-h-0 relative"
      style={{ backgroundColor: '#1c1c1f' }}
    >
      {/* Channel header — always visible */}
      <header
        className="flex h-14 shrink-0 items-center px-4 gap-3"
        style={{
          backgroundColor: '#1c1c1f',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 24px -8px rgba(0,0,0,0.5)',
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.40)' }} aria-hidden="true">
          <SpeakerHighIcon size={18} />
        </span>
        <h2
          className="text-[15px] font-semibold tracking-tight"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          {channelName}
        </h2>
      </header>

      {/* State views */}
      {status === 'idle' && (
        <PreJoinView
          channelName={channelName}
          onJoin={fetchToken}
          occupancyCount={occupancy.count}
          occupancyParticipants={occupancy.participants}
          occupancyStatus={occupancy.status}
        />
      )}

      {status === 'loading' && <ConnectingView channelName={channelName} />}

      {status === 'error' && <ErrorView message={errorMessage} onRetry={fetchToken} />}

      {status === 'ready' && token && url && (
        <LiveKitRoom
          serverUrl={url}
          token={token}
          connect={true}
          audio={true}
          video={false}
          onDisconnected={() => {
            // Involuntary network drop → show pre-join
            reset();
          }}
          onError={(err) => {
            const message =
              err instanceof Error ? err.message : 'Connection to the voice room failed.';
            setError(message);
          }}
          style={{ display: 'contents' }}
        >
          <RoomView onLeave={reset} />
        </LiveKitRoom>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// State 1: Pre-join
// ─────────────────────────────────────────────────────────────────────────────

type PreJoinViewProps = {
  channelName: string;
  onJoin: () => void;
  occupancyCount: number;
  occupancyParticipants: import('./useVoiceOccupancy').VoiceParticipant[];
  occupancyStatus: import('./useVoiceOccupancy').VoiceOccupancyStatus;
};

function PreJoinView({
  channelName,
  onJoin,
  occupancyCount,
  occupancyParticipants,
  occupancyStatus,
}: PreJoinViewProps) {
  const isEmptyRoom = occupancyStatus === 'loaded' && occupancyCount === 0;
  const joinLabel = isEmptyRoom ? 'Be the First to Join' : 'Join voice';

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div
        className="flex h-[88px] w-[88px] items-center justify-center rounded-full mb-6"
        style={{
          backgroundColor: '#121214',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}
        aria-hidden="true"
      >
        <SpeakerHighIcon size={36} style={{ color: '#10b981' }} />
      </div>

      <h3
        className="text-2xl font-semibold tracking-tight mb-2"
        style={{ color: 'rgba(255,255,255,0.92)' }}
      >
        {channelName}
      </h3>
      <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.60)' }}>
        Drop in to connect via audio. The door is always open.
      </p>

      <div
        data-testid="voice-occupancy-panel"
        className="w-full max-w-sm mb-6 pt-5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <VoiceOccupancyIndicator
          count={occupancyCount}
          participants={occupancyParticipants}
          status={occupancyStatus}
        />
      </div>

      <button
        type="button"
        data-testid="join-voice-btn"
        onClick={onJoin}
        className="flex items-center justify-center gap-2 rounded-md px-8 py-3 text-base font-semibold transition-colors duration-150 focus-visible:outline-none"
        style={
          isEmptyRoom
            ? {
                backgroundColor: '#27272a',
                color: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(255,255,255,0.10)',
                minWidth: 200,
                boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
              }
            : {
                backgroundColor: '#10b981',
                color: '#0a0a0b',
                minWidth: 160,
                boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
              }
        }
        onMouseEnter={(e) => {
          if (isEmptyRoom) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
          } else {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(16,185,129,0.90)';
          }
        }}
        onMouseLeave={(e) => {
          if (isEmptyRoom) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
          } else {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981';
          }
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.4)';
        }}
      >
        {joinLabel}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// State 2: Connecting (loading transient)
// ─────────────────────────────────────────────────────────────────────────────

type ConnectingViewProps = { channelName: string };

function ConnectingView({ channelName }: ConnectingViewProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div
        className="flex h-[88px] w-[88px] items-center justify-center rounded-full mb-6"
        style={{
          backgroundColor: '#121214',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}
        aria-hidden="true"
      >
        <SpeakerHighIcon size={36} style={{ color: '#10b981' }} />
      </div>

      <h3
        className="text-2xl font-semibold tracking-tight mb-2"
        style={{ color: 'rgba(255,255,255,0.92)' }}
      >
        {channelName}
      </h3>
      <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.60)' }}>
        Drop in to connect via audio. The door is always open.
      </p>

      <div
        aria-busy="true"
        aria-label="Connecting to voice channel…"
        className="flex items-center justify-center rounded-md"
        style={{
          backgroundColor: 'rgba(16,185,129,0.90)',
          width: 160,
          height: 48,
          opacity: 0.9,
          boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}
      >
        <SpinnerSVG />
        <span className="sr-only">Connecting to voice channel…</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// State 5: Error
// ─────────────────────────────────────────────────────────────────────────────

type ErrorViewProps = {
  message: string | null;
  onRetry: () => void;
};

function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center" role="alert">
      <div
        className="flex h-[88px] w-[88px] items-center justify-center rounded-full mb-6"
        style={{
          backgroundColor: 'rgba(239,68,68,0.10)',
          border: '1px solid rgba(239,68,68,0.20)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}
        aria-hidden="true"
      >
        <svg
          width={36}
          height={36}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f87171"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h3
        className="text-xl font-semibold tracking-tight mb-2"
        style={{ color: 'rgba(255,255,255,0.92)' }}
      >
        Couldn't connect to the study room
      </h3>
      <p
        className="text-sm mb-8 max-w-sm"
        style={{ color: 'rgba(255,255,255,0.60)' }}
        data-testid="voice-error-message"
      >
        {message ??
          'The connection attempt timed out or was denied. Please ensure you have network access.'}
      </p>

      <button
        type="button"
        data-testid="voice-retry-btn"
        onClick={onRetry}
        className="flex items-center justify-center gap-2 rounded-md border font-medium text-sm transition-colors duration-150 focus-visible:outline-none"
        style={{
          backgroundColor: '#27272a',
          color: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(255,255,255,0.10)',
          minWidth: 140,
          height: 44,
          paddingLeft: 24,
          paddingRight: 24,
          boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.4)';
        }}
      >
        <ArrowCounterClockwiseIcon size={16} />
        Try again
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// States 3 + 4: In-room (populated / alone) — must be inside LiveKitRoom
// ─────────────────────────────────────────────────────────────────────────────

type RoomViewProps = { onLeave: () => void };

function RoomView({ onLeave }: RoomViewProps) {
  const participants = useParticipants();
  const { localParticipant, isScreenShareEnabled } = useLocalParticipant();
  const room = useRoomContext();
  const { profile } = useContext(ProfileContext);

  // Audio-only fallback hook (wave-34)
  const { mode: audioOnlyMode, restoreState, restore, enterManual } = useAudioOnlyFallback();

  // Screen-share tracks from all participants (wave-34)
  // useTracks with ScreenShare source returns TrackReference[] for all screen-share publishers
  const screenShareTracks = useTracks([Track.Source.ScreenShare]);

  // Local screen-share sharing state (for loading skeleton: track requested but not yet published)
  const [shareRequested, setShareRequested] = useState(false);

  // Screen-share live-region announcer text (wave-34 a11y)
  const [screenShareAnnouncement, setScreenShareAnnouncement] = useState('');

  // Track mic muted state from local participant
  const isMuted = !localParticipant?.isMicrophoneEnabled;

  // Derive the active screen-share track (first in list; design shows one prominent at a time)
  // Exclude own share from the "remote subscriber" display path when local is sharing.
  const remoteScreenShareTracks = screenShareTracks.filter(
    (t) => t.participant?.identity !== localParticipant?.identity,
  );
  const activeRemoteShare = remoteScreenShareTracks[0] ?? null;

  // Whether a screen-share region should be shown (own share or remote share)
  const hasActiveShare = isScreenShareEnabled || activeRemoteShare !== null;

  // Announce screen-share start/stop (wave-34 a11y live region)
  const prevShareRef = useRef<string | null>(null);
  useEffect(() => {
    const sharerIdentity = activeRemoteShare?.participant?.identity ?? null;
    const sharerName = activeRemoteShare?.participant?.name ?? sharerIdentity ?? 'Someone';
    if (sharerIdentity !== null && prevShareRef.current === null) {
      setScreenShareAnnouncement(`${sharerName} started sharing their screen`);
    } else if (sharerIdentity === null && prevShareRef.current !== null) {
      setScreenShareAnnouncement('Screen share ended');
    }
    prevShareRef.current = sharerIdentity;
  }, [activeRemoteShare]);

  // ── Screen-share controls ──────────────────────────────────────────────────

  const toggleScreenShare = useCallback(async () => {
    if (!localParticipant) return;
    if (isScreenShareEnabled) {
      // Stop sharing
      setShareRequested(false);
      await localParticipant.setScreenShareEnabled(false).catch(() => {
        // Stop failure is safe to ignore; the button reverts to idle state
        setShareRequested(false);
      });
    } else {
      // Start sharing — browser native picker; permission denial or cancel is graceful
      setShareRequested(true);
      await localParticipant.setScreenShareEnabled(true).catch(() => {
        // User cancelled picker or permission denied → revert to idle, no error state
        setShareRequested(false);
      });
      // If the publish succeeded, LiveKit fires a track publication event and
      // isScreenShareEnabled updates via useLocalParticipant; shareRequested becomes
      // irrelevant as we transition to the own-share state.
      setShareRequested(false);
    }
  }, [localParticipant, isScreenShareEnabled]);

  // ── Mic + leave ───────────────────────────────────────────────────────────

  const toggleMic = useCallback(() => {
    if (!localParticipant) return;
    localParticipant.setMicrophoneEnabled(isMuted).catch(() => {
      // Device permission denial handled gracefully; mic stays muted
    });
  }, [localParticipant, isMuted]);

  const handleLeave = useCallback(() => {
    room.disconnect();
    onLeave();
  }, [room, onLeave]);

  // Disconnect on unmount (no leaked LiveKit connection / mic-hot-after-leave)
  const roomRef = useRef(room);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);
  useEffect(() => {
    return () => {
      roomRef.current.disconnect();
    };
  }, []);

  // ── Layout ────────────────────────────────────────────────────────────────

  const participantCount = participants.length;
  const isAlone = participantCount <= 1;

  function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || '?';
  }

  const myDisplayName =
    profile?.displayName ?? profile?.username ?? localParticipant?.identity ?? 'You';

  return (
    <>
      {/* Screen-share live region (wave-34 a11y) — sr-only, aria-live=polite */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
        data-testid="screen-share-announcer"
      >
        {screenShareAnnouncement}
      </div>

      {/* Participant count badge — header right when populated */}
      {!isAlone && !hasActiveShare && (
        <div
          className="absolute top-3.5 right-4 flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium"
          style={{
            backgroundColor: '#121214',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.60)',
          }}
          aria-label={`${participantCount} participant${participantCount !== 1 ? 's' : ''}`}
        >
          <UsersIcon size={12} />
          <span aria-hidden="true">{participantCount}</span>
        </div>
      )}

      {/* Main content area — switches between avatar grid and screen-share layout */}
      <div
        className="flex-1 overflow-y-auto p-6 pb-24 flex flex-col gap-4"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#3f3f46 transparent',
        }}
      >
        {/* ── Audio-only fallback banner (wave-34) ── */}
        {audioOnlyMode !== null && (
          <AudioOnlyBanner mode={audioOnlyMode} restoreState={restoreState} onRestore={restore} />
        )}

        {/* ── Screen-share layout vs avatar grid ── */}
        {isScreenShareEnabled ? (
          /* State 4: Own share active — design/screen-share-tile.html §04 */
          <OwnShareView
            onStopShare={toggleScreenShare}
            avatarStrip={
              <AvatarStrip
                participants={participants}
                localIdentity={localParticipant?.identity}
                myDisplayName={myDisplayName}
              />
            }
          />
        ) : shareRequested ? (
          /* State 3: Loading (subscribing to own share in progress) — design §03 */
          <ScreenShareLoading
            avatarStrip={
              <AvatarStrip
                participants={participants}
                localIdentity={localParticipant?.identity}
                myDisplayName={myDisplayName}
              />
            }
          />
        ) : activeRemoteShare !== null ? (
          /* State 2: Sharing active (remote) — design/screen-share-tile.html §02 */
          <RemoteShareView
            trackRef={activeRemoteShare}
            avatarStrip={
              <AvatarStrip
                participants={participants}
                localIdentity={localParticipant?.identity}
                myDisplayName={myDisplayName}
              />
            }
          />
        ) : isAlone ? (
          /* State 4: alone (no share) */
          <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
            <ParticipantTile
              initials={getInitials(myDisplayName)}
              name={`${myDisplayName} (You)`}
              isLocal={true}
              isMuted={isMuted}
            />
            <div
              className="flex items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.60)' }}
              aria-live="polite"
            >
              <UsersIcon size={16} />
              <p className="text-sm">No one else here yet — the door's open.</p>
            </div>
          </div>
        ) : (
          /* State 3: populated (no share) */
          <ul
            className="w-full max-w-[800px] mx-auto grid gap-4"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
            aria-label="Participants in voice room"
          >
            {participants.map((p) => {
              const isLocalP = p.identity === localParticipant?.identity;
              const displayName = isLocalP ? `${myDisplayName} (You)` : (p.name ?? p.identity);
              const participantMuted = !p.isMicrophoneEnabled;

              return (
                <li key={p.identity}>
                  <ParticipantTile
                    initials={getInitials(displayName ?? '')}
                    name={displayName ?? p.identity}
                    isLocal={isLocalP}
                    isMuted={participantMuted}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Control cluster — anchored bottom center */}
      <div
        data-testid="voice-controls"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-md p-1.5"
        style={{
          backgroundColor: '#121214',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        {/* Mic toggle */}
        <button
          type="button"
          aria-pressed={isMuted}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          data-testid="mic-toggle-btn"
          onClick={toggleMic}
          className="flex h-[40px] w-[42px] items-center justify-center rounded transition-colors duration-150 focus-visible:outline-none"
          style={
            isMuted
              ? {
                  backgroundColor: 'rgba(239,68,68,0.10)',
                  color: '#f87171',
                  border: '1px solid rgba(239,68,68,0.10)',
                }
              : {
                  backgroundColor: 'transparent',
                  color: 'rgba(255,255,255,0.92)',
                }
          }
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = isMuted
              ? '0 0 0 2px rgba(239,68,68,0.4)'
              : '0 0 0 2px rgba(16,185,129,0.4)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {isMuted ? <MicrophoneSlashIcon size={20} /> : <MicrophoneIcon size={20} />}
        </button>

        {/* Divider */}
        <div
          className="h-6 w-px mx-1"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
          aria-hidden="true"
        />

        {/* Screen-share toggle (wave-34) */}
        <button
          type="button"
          aria-pressed={isScreenShareEnabled}
          aria-label={isScreenShareEnabled ? 'Stop screen sharing' : 'Share screen'}
          data-testid="screen-share-btn"
          onClick={toggleScreenShare}
          className="flex h-[40px] w-[42px] items-center justify-center rounded transition-colors duration-150 focus-visible:outline-none"
          style={
            isScreenShareEnabled
              ? {
                  // Active state: emerald filled (design §04 control cluster)
                  backgroundColor: '#10b981',
                  color: '#0a0a0b',
                }
              : {
                  backgroundColor: 'transparent',
                  color: 'rgba(255,255,255,0.92)',
                }
          }
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <ScreencastIcon size={20} />
        </button>

        {/* Divider */}
        <div
          className="h-6 w-px mx-1"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
          aria-hidden="true"
        />

        {/* Audio-only toggle — V-3 fast-fix: wire enterManual() to a reachable control */}
        <button
          type="button"
          aria-pressed={audioOnlyMode === 'manual'}
          aria-label={audioOnlyMode === 'manual' ? 'Restore video' : 'Switch to audio-only'}
          data-testid="audio-only-toggle-btn"
          onClick={audioOnlyMode === 'manual' ? restore : enterManual}
          className="flex h-[40px] w-[42px] items-center justify-center rounded transition-colors duration-150 focus-visible:outline-none"
          style={
            audioOnlyMode === 'manual'
              ? {
                  // Active (in manual audio-only) — neutral pressed state
                  backgroundColor: '#27272a',
                  color: 'rgba(255,255,255,0.92)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }
              : {
                  backgroundColor: 'transparent',
                  color: 'rgba(255,255,255,0.92)',
                }
          }
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Video-slash icon — signals "no video" / audio-only */}
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M7 7h6l7.5-4.5v13" />
          </svg>
        </button>

        {/* Divider */}
        <div
          className="h-6 w-px mx-1"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
          aria-hidden="true"
        />

        {/* Leave button */}
        <button
          type="button"
          data-testid="leave-voice-btn"
          onClick={handleLeave}
          className="flex h-[40px] items-center justify-center gap-2 rounded border font-medium text-sm transition-colors duration-150 focus-visible:outline-none"
          style={{
            backgroundColor: 'rgba(239,68,68,0.10)',
            color: '#f87171',
            border: '1px solid rgba(239,68,68,0.20)',
            paddingLeft: 12,
            paddingRight: 12,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ef4444';
            (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
            (e.currentTarget as HTMLButtonElement).style.border = '1px solid #ef4444';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.10)';
            (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
            (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(239,68,68,0.20)';
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(239,68,68,0.4)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <SignOutIcon size={16} />
          Leave
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen-share sub-views (wave-34)
// ─────────────────────────────────────────────────────────────────────────────

/** State 2: Remote screen-share active — prominent tile + avatar strip */
function RemoteShareView({
  trackRef,
  avatarStrip,
}: {
  trackRef: import('@livekit/components-react').TrackReference;
  avatarStrip: React.ReactNode;
}) {
  // Use || (not ??) to catch empty-string identity in addition to null/undefined
  const sharerName = trackRef.participant?.name || trackRef.participant?.identity || 'Someone';

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Prominent screen-share region — design §02, max-w-[1000px] mx-auto */}
      <div
        className="w-full max-w-[1000px] mx-auto flex-1 min-h-0 rounded-lg relative overflow-hidden"
        aria-label={`Screen shared by ${sharerName}`}
        role="region"
        style={{
          backgroundColor: '#0a0a0b',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}
      >
        {/* LiveKit VideoTrack — SDK-managed attach/detach lifecycle; no manual ref needed */}
        <VideoTrack
          trackRef={trackRef}
          className="w-full h-full object-contain"
          aria-label={`Screen shared by ${sharerName}`}
        />

        {/* Live share indicator — top-left */}
        <div className="absolute top-4 left-4 z-10">
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide"
            style={{
              backgroundColor: 'rgba(10,10,11,0.90)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#10b981',
            }}
          >
            {/* Subtle pulse dot */}
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: '#10b981',
                animation: 'subtle-pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
              }}
              aria-hidden="true"
            />
            Live Share
          </div>
        </div>

        {/* Sharer name tag — bottom-left */}
        <div className="absolute bottom-4 left-4 z-10">
          <div
            className="flex items-center gap-2 rounded-md pl-2 pr-3 py-1.5"
            style={{
              backgroundColor: 'rgba(18,18,20,0.90)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}
          >
            <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {sharerName}
            </span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Presenting
            </span>
          </div>
        </div>
      </div>

      {avatarStrip}
    </div>
  );
}

/** State 3: Screen-share loading skeleton */
function ScreenShareLoading({ avatarStrip }: { avatarStrip: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div
        className="w-full max-w-[1000px] mx-auto flex-1 min-h-0 rounded-lg relative overflow-hidden flex flex-col items-center justify-center"
        aria-label="Loading screen share..."
        aria-busy="true"
        aria-live="polite"
        style={{
          backgroundColor: '#121214',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex flex-col items-center gap-4 z-10">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: '#27272a',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}
          >
            <SpinnerSVG />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
              Loading presentation feed...
            </span>
          </div>
        </div>
      </div>
      {avatarStrip}
    </div>
  );
}

/** State 4: Own share active — self-monitor panel + stop button */
function OwnShareView({
  onStopShare,
  avatarStrip,
}: {
  onStopShare: () => void;
  avatarStrip: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Own share prominent area — design §04, emerald border glow */}
      <div
        className="w-full max-w-[1000px] mx-auto flex-1 min-h-0 rounded-lg relative overflow-hidden flex flex-col items-center justify-center"
        data-testid="own-share-panel"
        style={{
          backgroundColor: '#0a0a0b',
          border: '1px solid rgba(16,185,129,0.20)',
          boxShadow: '0 0 15px rgba(255,255,255,0.05)',
        }}
      >
        {/* Subtle emerald glow */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: 400,
            height: 400,
            backgroundColor: 'rgba(16,185,129,0.05)',
            filter: 'blur(120px)',
          }}
          aria-hidden="true"
        />

        <div className="z-10 flex flex-col items-center text-center max-w-sm w-full px-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{
              backgroundColor: '#121214',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <MonitorIcon size={28} style={{ color: '#10b981' }} />
          </div>

          <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.92)' }}>
            You are sharing your screen
          </h3>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Participants in the room are currently viewing your stream. Audio is picked up from your
            room mic.
          </p>

          {/* In-canvas stop control */}
          <button
            type="button"
            data-testid="stop-share-canvas-btn"
            onClick={onStopShare}
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none"
            style={{
              backgroundColor: '#27272a',
              color: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(239,68,68,0.4)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.4)';
            }}
          >
            <StopIcon size={14} style={{ color: 'rgba(255,255,255,0.60)' }} />
            Stop Presenting
          </button>
        </div>
      </div>

      {avatarStrip}
    </div>
  );
}

/** Avatar strip — demoted participant list shown below screen-share prominent tile */
function AvatarStrip({
  participants,
  localIdentity,
  myDisplayName,
}: {
  participants: (
    | import('livekit-client').LocalParticipant
    | import('livekit-client').RemoteParticipant
  )[];
  localIdentity: string | undefined;
  myDisplayName: string;
}) {
  function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || '?';
  }

  return (
    <div
      className="h-[64px] shrink-0 rounded-lg px-4 flex items-center gap-3 overflow-x-auto"
      style={{
        backgroundColor: 'rgba(18,18,20,0.50)',
        border: '1px solid rgba(255,255,255,0.06)',
        scrollbarWidth: 'thin',
        scrollbarColor: '#3f3f46 transparent',
      }}
      aria-label="Participants"
    >
      {participants.map((p) => {
        const isLocalP = p.identity === localIdentity;
        const displayName = isLocalP ? `${myDisplayName} (You)` : (p.name ?? p.identity);
        const isMutedP = !p.isMicrophoneEnabled;

        return (
          <div
            key={p.identity}
            className="relative shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
            title={displayName}
            aria-label={`${displayName}${isMutedP ? ' (muted)' : ''}`}
            style={{
              backgroundColor: '#3f3f46',
              color: 'rgba(255,255,255,0.92)',
              border: isLocalP ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.10)',
            }}
          >
            {getInitials(displayName ?? '')}
            {isMutedP && !isLocalP && (
              <span
                className="absolute -bottom-1 -right-1 flex items-center justify-center rounded"
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: '#121214',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                aria-hidden="true"
              >
                <MicrophoneSlashIcon size={9} style={{ color: '#f87171' }} />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Audio-only fallback banner (wave-34) — design/audio-only-state.html
// ─────────────────────────────────────────────────────────────────────────────

type AudioOnlyBannerProps = {
  mode: 'auto' | 'manual';
  restoreState: 'idle' | 'restoring';
  onRestore: () => void;
};

function AudioOnlyBanner({ mode, restoreState, onRestore }: AudioOnlyBannerProps) {
  const isRestoring = restoreState === 'restoring';
  const isAuto = mode === 'auto';

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="audio-only-banner"
      className="w-full flex items-center justify-between gap-3 rounded-lg p-2.5"
      style={
        isRestoring
          ? {
              // Restoring state — emerald-tinted border
              backgroundColor: '#121214',
              border: '1px solid rgba(16,185,129,0.20)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }
          : isAuto
            ? {
                // Auto (poor bandwidth) — amber-tinted border (design §State Auto)
                backgroundColor: '#121214',
                border: '1px solid rgba(245,158,11,0.30)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
              }
            : {
                // Manual — neutral border (design §State Manual)
                backgroundColor: '#121214',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
              }
      }
    >
      {/* Left: icon + text */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Status icon */}
        <div
          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full"
          style={
            isRestoring
              ? {
                  backgroundColor: 'rgba(16,185,129,0.10)',
                  border: '1px solid rgba(16,185,129,0.20)',
                  color: '#10b981',
                }
              : isAuto
                ? {
                    backgroundColor: 'rgba(245,158,11,0.10)',
                    border: '1px solid rgba(245,158,11,0.20)',
                    color: '#f59e0b',
                  }
                : {
                    backgroundColor: '#27272a',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.60)',
                  }
          }
          aria-hidden="true"
        >
          {isRestoring ? (
            <SpinnerSVG />
          ) : isAuto ? (
            <WifiLowIcon size={14} />
          ) : (
            /* video-slash for manual opt-in */
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M7 7h6l7.5-4.5v13" />
            </svg>
          )}
        </div>

        {/* Text */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-semibold whitespace-nowrap"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              {isRestoring ? 'Restoring video...' : 'Audio-only'}
            </span>
            {/* Mic-active reassurance pill — shown in all states including restoring (design build-fold note) */}
            <span
              className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider"
              style={{
                backgroundColor: '#27272a',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.60)',
              }}
              aria-label="Microphone still active"
            >
              <MicrophoneIcon size={10} />
              Mic active
            </span>
          </div>
          {!isRestoring && (
            <span className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.60)' }}>
              {isAuto
                ? 'Video paused locally to protect call quality'
                : 'You manually paused your video stream'}
            </span>
          )}
          {isRestoring && (
            <span className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Re-establishing video connection
            </span>
          )}
        </div>
      </div>

      {/* Right: mic-active icon (mobile) + restore button */}
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {/* Mobile mic-active badge */}
        {!isRestoring && (
          <div
            className="sm:hidden flex items-center justify-center w-8 h-8 rounded"
            style={{
              backgroundColor: '#27272a',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.60)',
            }}
            aria-label="Microphone active"
          >
            <MicrophoneIcon size={14} />
          </div>
        )}

        {/* Restore / restoring button */}
        <button
          type="button"
          data-testid="audio-only-restore-btn"
          onClick={isRestoring ? undefined : onRestore}
          disabled={isRestoring}
          aria-disabled={isRestoring}
          className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none"
          style={
            isRestoring
              ? {
                  backgroundColor: 'rgba(16,185,129,0.05)',
                  border: '1px solid rgba(16,185,129,0.05)',
                  color: '#10b981',
                  opacity: 0.5,
                  cursor: 'not-allowed',
                }
              : isAuto
                ? {
                    backgroundColor: 'rgba(16,185,129,0.10)',
                    border: '1px solid rgba(16,185,129,0.20)',
                    color: '#10b981',
                  }
                : {
                    backgroundColor: '#27272a',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: 'rgba(255,255,255,0.92)',
                  }
          }
          onMouseEnter={(e) => {
            if (!isRestoring) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = isAuto
                ? 'rgba(16,185,129,0.20)'
                : '#3f3f46';
            }
          }}
          onMouseLeave={(e) => {
            if (!isRestoring) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = isAuto
                ? 'rgba(16,185,129,0.10)'
                : '#27272a';
            }
          }}
          onFocus={(e) => {
            if (!isRestoring) e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <VideoCameraIcon size={14} />
          <span className="hidden sm:inline">{isRestoring ? 'Restoring' : 'Restore video'}</span>
          <span className="sm:hidden">{isRestoring ? 'Restoring' : 'Restore'}</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Participant tile — shared by state 3 (populated) and state 4 (alone)
// ─────────────────────────────────────────────────────────────────────────────

type ParticipantTileProps = {
  initials: string;
  name: string;
  isLocal: boolean;
  isMuted: boolean;
};

function ParticipantTile({ initials, name, isLocal, isMuted }: ParticipantTileProps) {
  return (
    <div
      className="relative flex flex-col items-center gap-4 rounded-lg px-4 py-8"
      style={{
        backgroundColor: '#121214',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
      }}
    >
      {/* Mute indicator */}
      {isMuted && !isLocal && (
        <div
          className="absolute top-2.5 right-2.5 flex h-[26px] w-[26px] items-center justify-center rounded"
          style={{
            backgroundColor: 'rgba(239,68,68,0.10)',
            border: '1px solid rgba(239,68,68,0.10)',
          }}
          aria-label="Microphone muted"
        >
          <MicrophoneSlashIcon size={13} style={{ color: '#f87171' }} />
        </div>
      )}

      {/* Avatar */}
      <div
        className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full text-xl font-medium"
        style={{
          backgroundColor: '#3f3f46',
          color: 'rgba(255,255,255,0.92)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}
      >
        {initials}
        {isLocal && (
          <span
            aria-hidden="true"
            className="absolute bottom-1 right-1 h-[14px] w-[14px] rounded-full"
            style={{
              backgroundColor: '#10b981',
              border: '2.5px solid #121214',
            }}
          />
        )}
      </div>

      {/* Display name */}
      <div
        className="w-full truncate px-2 text-center text-sm font-medium"
        style={{ color: 'rgba(255,255,255,0.92)' }}
      >
        {name}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Spinner SVG — used in connecting state and restoring banner
// ─────────────────────────────────────────────────────────────────────────────

function SpinnerSVG() {
  return (
    <svg
      className="animate-spin"
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      aria-hidden="true"
      style={{ color: '#0a0a0b' }}
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
