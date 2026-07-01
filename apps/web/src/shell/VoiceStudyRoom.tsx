/**
 * VoiceStudyRoom — audio-first LiveKit voice channel surface.
 *
 * Implements the 5 states from design/voice-study-room.html (D-3 adopted):
 *   1. Pre-join   — "Join voice" CTA; no auto-connect on mount.
 *   2. Connecting — spinner while fetching token + LiveKit connect.
 *   3. In-room (populated) — participant tile grid + mic toggle + Leave.
 *   4. In-room (alone)     — own tile + empty-state prompt + controls.
 *   5. Error       — danger icon + message + "Try again" CTA.
 *
 * Design constraints (wave-31, Refs: 1dd1f2ca):
 *   - Camera OFF: `video={false}` on LiveKitRoom — audio-first, no camera.
 *   - No screen-share, speaking/presence rings, occupancy indicator, reconnection UI.
 *   - Dark-only. Phosphor-style inline SVG icons (MicrophoneIcon etc.).
 *   - Single LiveKitRoom per session; unmount → room.disconnect() via onDisconnected
 *     and the component teardown — LiveKitRoom cleans up on unmount when connect={false}.
 *   - Token is fetched via useVoiceToken (server-minted, RBAC-gated, TTL=1h).
 *   - livekit-server-sdk is NOT imported here (server-only).
 *
 * Routing note (wave-31): VoiceStudyRoom is rendered by MainColumn when
 * selectedChannel.type === 'voice'. Full routing wiring is in MainColumn.tsx.
 */

import {
  LiveKitRoom,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
} from '@livekit/components-react';
import { useCallback, useContext, useEffect, useRef } from 'react';
import { ProfileContext } from './ProfileContext';
import { VoiceOccupancyIndicator } from './VoiceOccupancyIndicator';
import {
  ArrowCounterClockwiseIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  SignOutIcon,
  SpeakerHighIcon,
  UsersIcon,
} from './icons';
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
  // Polling stops once the user joins (status changes away from 'idle') so stale
  // intervals never fire during an active LiveKit session.
  const occupancy = useVoiceOccupancy(channelId, { enabled: status === 'idle' });

  // Shared channel header across all states (design pattern from mockup)
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
            // Involuntary network drop → show pre-join (user did not explicitly leave;
            // if the Leave button triggered this, handleLeave already called reset()
            // and the LiveKitRoom will have unmounted before onDisconnected fires,
            // so this is a no-op in that path — idempotent).
            reset();
          }}
          onError={(err) => {
            // LiveKit connect failure → show the error state with a message, not pre-join.
            // Routing to reset() (pre-join) would silently swallow the failure.
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
  // Derive the join button label: empty room → "Be the First to Join" (D-3 empty state CTA);
  // error / loading / populated → "Join voice" (standard CTA).
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

      {/* Occupancy indicator — pre-join surface only.
          Bounded by a top-border panel to match the D-3 design card layout.
          Error state uses role="status" (not role="alert") per D-3 spec so a
          transient occupancy failure never hijacks the screen-reader focus from Join. */}
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
                // Empty state: muted secondary style (D-3 spec — "Be the First to Join")
                backgroundColor: '#27272a',
                color: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(255,255,255,0.10)',
                minWidth: 200,
                boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
              }
            : {
                // Populated / loading / error: primary emerald CTA
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

      {/* Spinner button — pointer-events-none while connecting */}
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
        {/* Warning circle — danger-text */}
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
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const { profile } = useContext(ProfileContext);

  // Track mic muted state from local participant
  const isMuted = !localParticipant?.isMicrophoneEnabled;

  const toggleMic = useCallback(() => {
    if (!localParticipant) return;
    localParticipant.setMicrophoneEnabled(isMuted).catch(() => {
      // Device permission denial is handled gracefully:
      // The mic stays muted; no exception propagates to the room view.
    });
  }, [localParticipant, isMuted]);

  const handleLeave = useCallback(() => {
    room.disconnect();
    onLeave();
  }, [room, onLeave]);

  // Disconnect on unmount (anti-pattern: never leave a room connection open)
  const roomRef = useRef(room);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);
  useEffect(() => {
    return () => {
      roomRef.current.disconnect();
    };
  }, []);

  const participantCount = participants.length;
  const isAlone = participantCount <= 1;

  // Derive initials for a participant display name
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
      {/* Participant count badge — in header area via absolute positioning on populated state */}
      {!isAlone && (
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

      {/* Participant tile area */}
      <div
        className="flex-1 overflow-y-auto p-6 pb-24"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#3f3f46 transparent',
        }}
      >
        {isAlone ? (
          /* State 4: alone */
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
          /* State 3: populated */
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
      {/* Mute indicator — danger-tinted top-right corner badge */}
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
        {/* Online presence dot for local participant */}
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
// Spinner SVG — used in connecting state
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
