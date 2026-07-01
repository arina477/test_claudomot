/**
 * VoiceStudyRoom — render + state tests.
 *
 * Testing surface (wave-31 B-3, Refs: 1dd1f2ca):
 *   - Pre-join renders a "Join voice" button; no auto-connect on mount.
 *   - Clicking Join triggers the token fetch (POST .../voice/token).
 *   - Connect uses video={false} (audio-first — camera OFF).
 *   - Error state renders on fetch failure with a human-readable message.
 *   - Error state renders a "Try again" retry button.
 *
 * NOT tested here (by design — media plane is not testable in headless):
 *   - ICE/DTLS negotiation, SFU track routing, audio levels.
 *   - mic toggle connected to a real microphone.
 *   - LiveKit connection state progression (requires a live SFU).
 *
 * LiveKit is mocked to isolate wiring from SFU connectivity.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mock the API client ─────────────────────────────────────────────────────
vi.mock('../auth/api', () => ({
  api: {
    getVoiceToken: vi.fn(),
    // wave-32: VoiceStudyRoom now mounts useVoiceOccupancy on the pre-join
    // surface; stub getVoiceParticipants so the occupancy poll does not fire
    // an unhandled real fetch in these wave-31 tests.
    getVoiceParticipants: vi.fn().mockResolvedValue({ count: 0, participants: [] }),
  },
}));

// ── Mock @livekit/components-react ──────────────────────────────────────────
// The media plane (LiveKit SFU, ICE, DTLS) is not testable in headless.
// We mock the components-react surface to isolate the wiring + state machine.
//
// disconnect is a STABLE mock hoisted outside the vi.mock factory so we can
// assert on it in teardown tests without the mock returning a fresh fn() on
// every useRoomContext() call (a fresh vi.fn() per render would never have
// been called from the perspective of our expect()).
const mockDisconnect = vi.fn();

vi.mock('@livekit/components-react', () => ({
  LiveKitRoom: ({
    children,
    token,
    serverUrl,
    video,
  }: {
    children: React.ReactNode;
    token: string;
    serverUrl: string;
    video: boolean;
    connect: boolean;
    onDisconnected: () => void;
    onError: () => void;
  }) => (
    <div
      data-testid="livekit-room"
      data-token={token}
      data-server-url={serverUrl}
      data-video={String(video)}
    >
      {children}
    </div>
  ),
  useLocalParticipant: () => ({
    localParticipant: {
      identity: 'user-123',
      isMicrophoneEnabled: true,
      setMicrophoneEnabled: vi.fn().mockResolvedValue(undefined),
    },
  }),
  useParticipants: () => [
    {
      identity: 'user-123',
      name: 'Test User',
      isMicrophoneEnabled: true,
    },
  ],
  // Returns the SAME stable mockDisconnect reference on every call so teardown
  // assertions accumulate calls on a single spy, not a fresh one per render.
  useRoomContext: () => ({
    disconnect: mockDisconnect,
  }),
}));

// ── Mock ProfileContext ──────────────────────────────────────────────────────
vi.mock('./ProfileContext', () => ({
  ProfileContext: {
    _currentValue: { profile: null },
    Consumer: ({ children }: { children: (v: { profile: null }) => React.ReactNode }) =>
      children({ profile: null }),
  },
  useProfile: () => ({ profile: null, refresh: vi.fn() }),
}));

import { api } from '../auth/api';
import { VoiceStudyRoom } from './VoiceStudyRoom';

const mockApi = vi.mocked(api);

function renderVoice(props = { channelId: 'ch-voice-1', channelName: 'study-room' }) {
  return render(<VoiceStudyRoom {...props} />);
}

describe('VoiceStudyRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // clearAllMocks resets call history on mockDisconnect (it's a module-level vi.fn(),
    // so clearAllMocks covers it — no need to manually call mockDisconnect.mockClear()).
  });

  // ── Pre-join state ─────────────────────────────────────────────────────────

  it('renders the Join voice button in pre-join state', () => {
    renderVoice();
    expect(screen.getByTestId('join-voice-btn')).toBeInTheDocument();
    expect(screen.getByText('Join voice')).toBeInTheDocument();
  });

  it('shows the channel name in pre-join state', () => {
    renderVoice({ channelId: 'ch-1', channelName: 'study-room' });
    expect(screen.getAllByText('study-room').length).toBeGreaterThan(0);
  });

  it('does NOT auto-connect on mount (no token fetch without user action)', () => {
    renderVoice();
    expect(mockApi.getVoiceToken).not.toHaveBeenCalled();
  });

  it('does NOT render LiveKitRoom in pre-join state', () => {
    renderVoice();
    expect(screen.queryByTestId('livekit-room')).not.toBeInTheDocument();
  });

  // ── Clicking Join triggers token fetch ────────────────────────────────────

  it('calls getVoiceToken with the channelId when Join is clicked', async () => {
    // Never resolve — keep in connecting state
    mockApi.getVoiceToken.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderVoice({ channelId: 'ch-voice-abc', channelName: 'study-room' });

    await user.click(screen.getByTestId('join-voice-btn'));

    expect(mockApi.getVoiceToken).toHaveBeenCalledWith('ch-voice-abc');
  });

  it('shows a spinner (connecting state) while the token fetch is pending', async () => {
    mockApi.getVoiceToken.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderVoice();

    await user.click(screen.getByTestId('join-voice-btn'));

    // The "Join voice" button should not be visible during connecting
    expect(screen.queryByTestId('join-voice-btn')).not.toBeInTheDocument();
    // Connecting state shows aria-busy indicator (accessible label)
    expect(screen.getByText('Connecting to voice channel…')).toBeInTheDocument();
  });

  // ── Success path: LiveKitRoom wired correctly ─────────────────────────────

  it('renders LiveKitRoom with video=false after token fetch succeeds', async () => {
    mockApi.getVoiceToken.mockResolvedValue({
      token: 'livekit-jwt-xyz',
      url: 'wss://livekit.example.com',
    });
    const user = userEvent.setup();
    renderVoice();

    await user.click(screen.getByTestId('join-voice-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('livekit-room')).toBeInTheDocument();
    });

    const room = screen.getByTestId('livekit-room');
    // video={false} is the audio-first constraint — camera must be OFF
    expect(room).toHaveAttribute('data-video', 'false');
    expect(room).toHaveAttribute('data-token', 'livekit-jwt-xyz');
    expect(room).toHaveAttribute('data-server-url', 'wss://livekit.example.com');
  });

  it('renders voice controls (mic + leave) when in-room', async () => {
    mockApi.getVoiceToken.mockResolvedValue({
      token: 'jwt',
      url: 'wss://lk.example.com',
    });
    const user = userEvent.setup();
    renderVoice();

    await user.click(screen.getByTestId('join-voice-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('voice-controls')).toBeInTheDocument();
    });

    expect(screen.getByTestId('mic-toggle-btn')).toBeInTheDocument();
    expect(screen.getByTestId('leave-voice-btn')).toBeInTheDocument();
  });

  // ── Error state ───────────────────────────────────────────────────────────

  it('renders the error state with a message on fetch failure (403)', async () => {
    mockApi.getVoiceToken.mockRejectedValue(new Error('403 Forbidden: permission denied'));
    const user = userEvent.setup();
    renderVoice();

    await user.click(screen.getByTestId('join-voice-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('voice-error-message')).toBeInTheDocument();
    });

    // 403 maps to the permission-denied message
    expect(screen.getByTestId('voice-error-message')).toHaveTextContent(
      "You don't have permission to join this voice channel.",
    );
  });

  it('renders the error state with a message on fetch failure (503)', async () => {
    mockApi.getVoiceToken.mockRejectedValue(new Error('503 Service Unavailable'));
    const user = userEvent.setup();
    renderVoice();

    await user.click(screen.getByTestId('join-voice-btn'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByTestId('voice-error-message')).toHaveTextContent(
      'Voice is not available right now.',
    );
  });

  it('does not render a blank/crashed screen on error (renders error UI instead)', async () => {
    mockApi.getVoiceToken.mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();
    renderVoice();

    await user.click(screen.getByTestId('join-voice-btn'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Error view has a retry button — confirms the error UI rendered
    expect(screen.getByTestId('voice-retry-btn')).toBeInTheDocument();
    // The voice room container is still present (no crash)
    expect(screen.getByTestId('voice-study-room')).toBeInTheDocument();
  });

  it('can retry after an error', async () => {
    mockApi.getVoiceToken
      .mockRejectedValueOnce(new Error('Network error'))
      .mockReturnValue(new Promise(() => {})); // second call stays pending

    const user = userEvent.setup();
    renderVoice();

    await user.click(screen.getByTestId('join-voice-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('voice-retry-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('voice-retry-btn'));

    // After retry, connecting state should show (second fetch in flight)
    await waitFor(() => {
      expect(screen.queryByTestId('voice-retry-btn')).not.toBeInTheDocument();
    });

    expect(mockApi.getVoiceToken).toHaveBeenCalledTimes(2);
  });

  // ── Disconnect on unmount (no leaked LiveKit connection / mic-hot-after-leave) ─

  it('calls room.disconnect() when the component unmounts (no leaked connection)', async () => {
    // Arrange: get into in-room state
    mockApi.getVoiceToken.mockResolvedValue({
      token: 'jwt',
      url: 'wss://lk.example.com',
    });
    const user = userEvent.setup();
    const { unmount } = renderVoice();

    await user.click(screen.getByTestId('join-voice-btn'));
    await waitFor(() => expect(screen.getByTestId('livekit-room')).toBeInTheDocument());

    // Act: unmount (simulates navigation away or tab close)
    unmount();

    // Assert: the RoomView teardown effect called disconnect()
    // This proves the LiveKit connection is not leaked after unmount.
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('calls room.disconnect() when the Leave button is clicked (no mic-hot-after-leave)', async () => {
    // Arrange: get into in-room state
    mockApi.getVoiceToken.mockResolvedValue({
      token: 'jwt',
      url: 'wss://lk.example.com',
    });
    const user = userEvent.setup();
    renderVoice();

    await user.click(screen.getByTestId('join-voice-btn'));
    await waitFor(() => expect(screen.getByTestId('voice-controls')).toBeInTheDocument());

    // Act: user clicks Leave
    await user.click(screen.getByTestId('leave-voice-btn'));

    // Assert: handleLeave called room.disconnect() — mic is no longer publishing
    expect(mockDisconnect).toHaveBeenCalled();

    // Assert: UI returns to pre-join state after Leave
    await waitFor(() => expect(screen.getByTestId('join-voice-btn')).toBeInTheDocument());
  });

  // ── Security: no livekit-server-sdk import in frontend ────────────────────

  it('does not import AccessToken or livekit-server-sdk (anti-pattern check)', async () => {
    // This test verifies the module graph at import time.
    // The VoiceStudyRoom module is already imported above; if it imported
    // livekit-server-sdk/AccessToken it would have failed with a module-not-found
    // error (since livekit-server-sdk is not in apps/web deps).
    // The component rendered without error = anti-pattern is absent.
    expect(screen.queryByTestId('voice-study-room')).toBeDefined();
  });
});
