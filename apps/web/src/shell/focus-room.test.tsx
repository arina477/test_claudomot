/**
 * focus-room.test.tsx — FocusRoomPanel unit/component tests.
 * wave-52 M8 task aad849ac (client surface ACs) + ef84b378 (room-timer ACs).
 *
 * Test matrix:
 *   1. Renders loading skeleton initially (before first rooms event).
 *   2. Renders empty state when rooms event arrives with no rooms.
 *   3. Renders open-rooms list from a rooms event (room name + count).
 *   4. Create button click shows inline create form.
 *   5. Create cancel returns to list.
 *   6. Create confirm calls createFocusRoom with serverId + name.
 *   7. Create input has an accessible label (sr-only label wired via htmlFor).
 *   8. Joining a room calls joinFocusRoom and transitions to joined state.
 *   9. STUDY_ROOM_PRESENCE_EVENT updates the roster live (joinedRoom).
 *  10. Leave button calls leaveFocusRoom and returns to list state.
 *  11. Room-vanished: if joined room disappears from rooms event → room-vanished state.
 *  12. Return-to-list from room-vanished resets to list.
 *  13. join_error surfaces inline error message.
 *  14. A11y: roster has role="list" + aria-live="polite".
 *  15. A11y: room-card is focusable (tabIndex=0 + role="button").
 *  16. A11y: joined-panel has role="region" with aria-label.
 *  17. Rooms list updates live (second rooms event changes rooms).
 *  18. Room-timer section renders when in joined state.
 *  19. Room-timer start button emits startRoomTimer.
 *  20. STUDY_ROOM_TIMER_UPDATE_EVENT updates the room-timer display.
 */

import type {
  FocusRoom,
  FocusRoomPresenceEvent,
  FocusRoomRoomsEvent,
  FocusRoomViewer,
  StudyRoomTimer,
  StudyRoomTimerUpdateEvent,
} from '@studyhall/shared';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock studyRoomSocket — capture handlers for test-driven events
// ---------------------------------------------------------------------------

type RoomsHandler = (event: FocusRoomRoomsEvent) => void;
type PresenceHandler = (event: FocusRoomPresenceEvent) => void;
type TimerUpdateHandler = (event: StudyRoomTimerUpdateEvent) => void;
type JoinErrorHandler = (event: { message: string }) => void;

let capturedRoomsHandler: RoomsHandler | null = null;
let capturedPresenceHandler: PresenceHandler | null = null;
let capturedTimerUpdateHandler: TimerUpdateHandler | null = null;
let capturedJoinErrorHandler: JoinErrorHandler | null = null;

vi.mock('./studyRoomSocket', () => ({
  createFocusRoom: vi.fn(),
  joinFocusRoom: vi.fn(),
  leaveFocusRoom: vi.fn(),
  setActiveRoom: vi.fn(),
  startRoomTimer: vi.fn(),
  pauseRoomTimer: vi.fn(),
  resetRoomTimer: vi.fn(),
  onRooms: vi.fn((handler: RoomsHandler) => {
    capturedRoomsHandler = handler;
    return () => {
      capturedRoomsHandler = null;
    };
  }),
  onPresence: vi.fn((handler: PresenceHandler) => {
    capturedPresenceHandler = handler;
    return () => {
      capturedPresenceHandler = null;
    };
  }),
  onTimerUpdate: vi.fn((handler: TimerUpdateHandler) => {
    capturedTimerUpdateHandler = handler;
    return () => {
      capturedTimerUpdateHandler = null;
    };
  }),
  onJoinError: vi.fn((handler: JoinErrorHandler) => {
    capturedJoinErrorHandler = handler;
    return () => {
      capturedJoinErrorHandler = null;
    };
  }),
}));

import { FocusRoomPanel } from './FocusRoomPanel';
import { createFocusRoom, joinFocusRoom, leaveFocusRoom, startRoomTimer } from './studyRoomSocket';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SERVER_ID = 'server-abc';
const SELF_USER_ID = 'user-self';

function makeRoom(overrides?: Partial<FocusRoom>): FocusRoom {
  return {
    id: 'room-001',
    serverId: SERVER_ID,
    name: 'Deep Work',
    count: 2,
    ...overrides,
  };
}

function makeViewer(overrides?: Partial<FocusRoomViewer>): FocusRoomViewer {
  return {
    userId: 'user-abc',
    displayName: 'Alice',
    avatarUrl: null,
    ...overrides,
  };
}

function makeRoomTimer(overrides?: Partial<StudyRoomTimer>): StudyRoomTimer {
  return {
    roomId: 'room-001',
    phase: 'work',
    runState: 'idle',
    endsAt: null,
    remainingMs: 0,
    running: false,
    updatedBy: null,
    workDurationMs: 25 * 60 * 1000,
    breakDurationMs: 5 * 60 * 1000,
    ...overrides,
  };
}

function fireRoomsEvent(rooms: FocusRoom[], serverId = SERVER_ID) {
  capturedRoomsHandler?.({ serverId, rooms });
}

function firePresenceEvent(roomId: string, viewers: FocusRoomViewer[]) {
  capturedPresenceHandler?.({
    roomId,
    roster: { roomId, viewers, count: viewers.length },
  });
}

function fireTimerUpdateEvent(roomId: string, timer: StudyRoomTimer) {
  capturedTimerUpdateHandler?.({ roomId, timer });
}

function fireJoinErrorEvent(message: string) {
  capturedJoinErrorHandler?.({ message });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FocusRoomPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedRoomsHandler = null;
    capturedPresenceHandler = null;
    capturedTimerUpdateHandler = null;
    capturedJoinErrorHandler = null;
  });

  // 1. Loading skeleton before first rooms event
  it('renders loading skeleton before first rooms event', () => {
    render(<FocusRoomPanel serverId={SERVER_ID} />);
    expect(screen.getByTestId('focus-room-skeleton')).toBeInTheDocument();
  });

  // 2. Empty state when rooms event has no rooms
  it('renders empty state when rooms event arrives with no rooms', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} />);

    await act(async () => {
      fireRoomsEvent([]);
    });

    await waitFor(() => expect(screen.getByTestId('focus-room-empty')).toBeInTheDocument());
    expect(screen.queryByTestId('focus-room-skeleton')).not.toBeInTheDocument();
  });

  // 3. Open-rooms list from rooms event
  it('renders open-rooms list with room name and count from rooms event', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} />);

    await act(async () => {
      fireRoomsEvent([makeRoom({ name: 'Calculus Sprint', count: 3 })]);
    });

    await waitFor(() => expect(screen.getByTestId('rooms-list')).toBeInTheDocument());
    expect(screen.getByText('Calculus Sprint')).toBeInTheDocument();
    expect(screen.getByText('3 focusing')).toBeInTheDocument();
  });

  // 4. Create button shows inline form
  it('Create Room button shows inline create form', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} />);

    await act(async () => {
      fireRoomsEvent([]);
    });
    await waitFor(() => screen.getByTestId('empty-create-btn'));

    fireEvent.click(screen.getByTestId('empty-create-btn'));
    await waitFor(() => expect(screen.getByTestId('create-room-form')).toBeInTheDocument());
  });

  // 5. Create cancel returns to list
  it('Cancel in create form returns to list without calling createFocusRoom', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} />);

    await act(async () => {
      fireRoomsEvent([]);
    });
    await waitFor(() => screen.getByTestId('empty-create-btn'));

    // Open form via header create button in list state
    // First show list with a room so the header "Create Room" btn is visible
    await act(async () => {
      fireRoomsEvent([makeRoom()]);
    });
    await waitFor(() => screen.getByTestId('create-room-btn'));

    fireEvent.click(screen.getByTestId('create-room-btn'));
    await waitFor(() => screen.getByTestId('create-room-form'));

    fireEvent.click(screen.getByTestId('create-room-cancel'));

    await waitFor(() => expect(screen.queryByTestId('create-room-form')).not.toBeInTheDocument());
    expect(createFocusRoom).not.toHaveBeenCalled();
  });

  // 6. Create confirm → creator lands in joined state for the new room (B-6 rework)
  //    Backend auto-joins the creator on create; client transitions to joined via the
  //    presence event (no second join_focus_room emitted — server already joined them).
  it('Create confirm calls createFocusRoom and transitions creator to joined state via presence event', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} selfUserId={SELF_USER_ID} />);

    // Start from a list with an existing room so the header Create Room btn is visible
    const existingRoom = makeRoom({ id: 'room-existing', name: 'Existing Room' });
    await act(async () => {
      fireRoomsEvent([existingRoom]);
    });
    await waitFor(() => screen.getByTestId('create-room-btn'));

    fireEvent.click(screen.getByTestId('create-room-btn'));
    await waitFor(() => screen.getByTestId('create-room-input'));

    fireEvent.change(screen.getByTestId('create-room-input'), {
      target: { value: 'Essay Writing' },
    });
    fireEvent.click(screen.getByTestId('create-room-confirm'));

    // createFocusRoom is emitted to the server
    await waitFor(() => expect(createFocusRoom).toHaveBeenCalledWith(SERVER_ID, 'Essay Writing'));

    // Simulate the backend auto-join sequence:
    // 1. Server broadcasts updated rooms list (new room included, count=1)
    const newRoom = makeRoom({ id: 'room-new-001', name: 'Essay Writing', count: 1 });
    await act(async () => {
      fireRoomsEvent([existingRoom, newRoom]);
    });

    // 2. Server broadcasts presence for the new room (creator in roster)
    const creatorViewer = makeViewer({ userId: SELF_USER_ID, displayName: 'You' });
    await act(async () => {
      firePresenceEvent('room-new-001', [creatorViewer]);
    });

    // Creator should land in the JOINED state — not the list
    await waitFor(() => expect(screen.getByTestId('joined-panel')).toBeInTheDocument());
    expect(screen.queryByTestId('create-room-form')).not.toBeInTheDocument();

    // Room name visible in the joined panel header
    expect(screen.getByText('Essay Writing')).toBeInTheDocument();

    // Roster renders (creator is present)
    await waitFor(() => expect(screen.getByTestId('joined-roster')).toBeInTheDocument());

    // Room-timer section renders (creator can start the room timer)
    expect(screen.getByTestId('room-timer-section')).toBeInTheDocument();
    expect(screen.getByTestId('room-timer-start')).toBeInTheDocument();

    // No second join_focus_room emitted — server already joined the creator
    expect(joinFocusRoom).not.toHaveBeenCalled();
  });

  // 7. Create input has accessible label
  it('create input is labelled (sr-only label wired via htmlFor)', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} />);

    await act(async () => {
      fireRoomsEvent([makeRoom()]);
    });
    await waitFor(() => screen.getByTestId('create-room-btn'));

    fireEvent.click(screen.getByTestId('create-room-btn'));
    await waitFor(() => screen.getByTestId('create-room-input'));

    // getAllByLabelText finds inputs labelled via htmlFor
    const labeledInputs = screen.getAllByLabelText(/room name/i);
    expect(labeledInputs.length).toBeGreaterThan(0);
    expect(labeledInputs[0]).toBe(screen.getByTestId('create-room-input'));
  });

  // 8. Joining a room calls joinFocusRoom + shows joined panel
  it('clicking a room card calls joinFocusRoom and shows joined panel', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} />);

    const room = makeRoom({ id: 'room-join-test', name: 'Pomodoro Room' });
    await act(async () => {
      fireRoomsEvent([room]);
    });
    await waitFor(() => screen.getByTestId(`room-card-${room.id}`));

    fireEvent.click(screen.getByTestId(`room-card-${room.id}`));

    await waitFor(() => expect(joinFocusRoom).toHaveBeenCalledWith(SERVER_ID, room.id));
    await waitFor(() => expect(screen.getByTestId('joined-panel')).toBeInTheDocument());
    expect(screen.getByText('Pomodoro Room')).toBeInTheDocument();
  });

  // 9. Presence event updates roster live
  it('STUDY_ROOM_PRESENCE_EVENT updates the roster inside joined panel', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} selfUserId={SELF_USER_ID} />);

    const room = makeRoom({ id: 'room-p1' });
    await act(async () => {
      fireRoomsEvent([room]);
    });
    await waitFor(() => screen.getByTestId(`room-card-${room.id}`));

    // Join the room
    fireEvent.click(screen.getByTestId(`room-card-${room.id}`));
    await waitFor(() => screen.getByTestId('joined-roster'));

    // Simulate presence event
    await act(async () => {
      firePresenceEvent('room-p1', [
        makeViewer({ userId: 'user-1', displayName: 'Alice' }),
        makeViewer({ userId: 'user-2', displayName: 'Bob' }),
      ]);
    });

    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  // 10. Leave button calls leaveFocusRoom and returns to list
  it('Leave Room calls leaveFocusRoom and returns to open-rooms list', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} />);

    const room = makeRoom({ id: 'room-leave' });
    await act(async () => {
      fireRoomsEvent([room]);
    });
    await waitFor(() => screen.getByTestId(`room-card-${room.id}`));

    fireEvent.click(screen.getByTestId(`room-card-${room.id}`));
    await waitFor(() => screen.getByTestId('leave-btn'));

    fireEvent.click(screen.getByTestId('leave-btn'));

    await waitFor(() => expect(leaveFocusRoom).toHaveBeenCalledWith(SERVER_ID, room.id));
    await waitFor(() => expect(screen.queryByTestId('joined-panel')).not.toBeInTheDocument());
  });

  // 11. Room-vanished: joined room disappears from rooms event
  it('shows room-vanished state when joined room disappears from server rooms list', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} />);

    const room = makeRoom({ id: 'room-vanish' });
    await act(async () => {
      fireRoomsEvent([room]);
    });
    await waitFor(() => screen.getByTestId(`room-card-${room.id}`));

    fireEvent.click(screen.getByTestId(`room-card-${room.id}`));
    await waitFor(() => screen.getByTestId('joined-panel'));

    // Server broadcasts rooms without the joined room (it vanished)
    await act(async () => {
      fireRoomsEvent([]);
    });

    await waitFor(() => expect(screen.getByTestId('room-vanished')).toBeInTheDocument());
    expect(screen.queryByTestId('joined-panel')).not.toBeInTheDocument();
  });

  // 12. Return to list from room-vanished
  it('Return to List button from room-vanished state returns to open-rooms list', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} />);

    const room = makeRoom({ id: 'room-rv2' });
    await act(async () => {
      fireRoomsEvent([room]);
    });
    await waitFor(() => screen.getByTestId(`room-card-${room.id}`));

    fireEvent.click(screen.getByTestId(`room-card-${room.id}`));
    await waitFor(() => screen.getByTestId('joined-panel'));

    await act(async () => {
      fireRoomsEvent([]);
    });
    await waitFor(() => screen.getByTestId('room-vanished'));

    fireEvent.click(screen.getByTestId('return-to-list-btn'));

    await waitFor(() => expect(screen.queryByTestId('room-vanished')).not.toBeInTheDocument());
  });

  // 13. join_error surfaces inline error
  it('join_error event surfaces inline error message', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} />);

    await act(async () => {
      fireRoomsEvent([makeRoom()]);
    });
    await waitFor(() => screen.getByTestId('rooms-list'));

    await act(async () => {
      fireJoinErrorEvent('Room not found or access denied.');
    });

    await waitFor(() => expect(screen.getByTestId('join-error')).toBeInTheDocument());
    expect(screen.getByText('Room not found or access denied.')).toBeInTheDocument();
  });

  // 14. A11y: roster has role="list" + aria-live="polite"
  it('joined roster has role="list" and aria-live="polite"', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} />);

    const room = makeRoom({ id: 'room-a11y1' });
    await act(async () => {
      fireRoomsEvent([room]);
    });
    await waitFor(() => screen.getByTestId(`room-card-${room.id}`));

    fireEvent.click(screen.getByTestId(`room-card-${room.id}`));
    await waitFor(() => screen.getByTestId('joined-roster'));

    const roster = screen.getByTestId('joined-roster');
    expect(roster).toHaveAttribute('role', 'list');
    expect(roster).toHaveAttribute('aria-live', 'polite');
  });

  // 15. A11y: room-card is focusable with tabIndex=0 and role="button"
  it('room cards are focusable (tabIndex=0 + role="button")', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} />);

    const room = makeRoom({ id: 'room-a11y2', name: 'Focus Session' });
    await act(async () => {
      fireRoomsEvent([room]);
    });
    await waitFor(() => screen.getByTestId(`room-card-${room.id}`));

    const card = screen.getByTestId(`room-card-${room.id}`);
    expect(card).toHaveAttribute('tabindex', '0');
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Focus Session'));
  });

  // 16. A11y: joined-panel has role="region" with aria-label
  it('joined panel has role="region" with aria-label including the room name', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} />);

    const room = makeRoom({ id: 'room-a11y3', name: 'Library Session' });
    await act(async () => {
      fireRoomsEvent([room]);
    });
    await waitFor(() => screen.getByTestId(`room-card-${room.id}`));

    fireEvent.click(screen.getByTestId(`room-card-${room.id}`));
    await waitFor(() => screen.getByTestId('joined-panel'));

    const panel = screen.getByTestId('joined-panel');
    expect(panel).toHaveAttribute('role', 'region');
    expect(panel).toHaveAttribute('aria-label', expect.stringContaining('Library Session'));
  });

  // 17. Rooms list updates live on second rooms event
  it('rooms list updates live when a second rooms event arrives with different rooms', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} />);

    await act(async () => {
      fireRoomsEvent([makeRoom({ id: 'r1', name: 'Room One', count: 1 })]);
    });
    await waitFor(() => screen.getByText('Room One'));

    // Second event: different rooms
    await act(async () => {
      fireRoomsEvent([
        makeRoom({ id: 'r2', name: 'Room Two', count: 3 }),
        makeRoom({ id: 'r3', name: 'Room Three', count: 1 }),
      ]);
    });

    await waitFor(() => screen.getByText('Room Two'));
    expect(screen.getByText('Room Three')).toBeInTheDocument();
    expect(screen.queryByText('Room One')).not.toBeInTheDocument();
  });

  // 18. Room-timer section renders when joined
  it('room-timer section renders when in joined state', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} />);

    const room = makeRoom({ id: 'room-timer-1' });
    await act(async () => {
      fireRoomsEvent([room]);
    });
    await waitFor(() => screen.getByTestId(`room-card-${room.id}`));

    fireEvent.click(screen.getByTestId(`room-card-${room.id}`));
    await waitFor(() => screen.getByTestId('room-timer-section'));

    // Shows idle countdown (25:00 default)
    expect(screen.getByTestId('room-timer-display')).toBeInTheDocument();
    expect(screen.getByTestId('room-timer-start')).toBeInTheDocument();
  });

  // 19. Room-timer start button emits startRoomTimer
  it('room-timer Start button calls startRoomTimer with serverId + roomId', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} />);

    const room = makeRoom({ id: 'room-timer-2' });
    await act(async () => {
      fireRoomsEvent([room]);
    });
    await waitFor(() => screen.getByTestId(`room-card-${room.id}`));

    fireEvent.click(screen.getByTestId(`room-card-${room.id}`));
    await waitFor(() => screen.getByTestId('room-timer-start'));

    fireEvent.click(screen.getByTestId('room-timer-start'));

    await waitFor(() => expect(startRoomTimer).toHaveBeenCalledWith(SERVER_ID, room.id));
  });

  // 20. STUDY_ROOM_TIMER_UPDATE_EVENT updates room-timer display
  it('STUDY_ROOM_TIMER_UPDATE_EVENT updates the room-timer display', async () => {
    render(<FocusRoomPanel serverId={SERVER_ID} />);

    const room = makeRoom({ id: 'room-timer-3' });
    await act(async () => {
      fireRoomsEvent([room]);
    });
    await waitFor(() => screen.getByTestId(`room-card-${room.id}`));

    fireEvent.click(screen.getByTestId(`room-card-${room.id}`));
    await waitFor(() => screen.getByTestId('room-timer-display'));

    // Initially idle (25:00)
    expect(screen.getByTestId('room-timer-display')).toHaveTextContent('25:00');

    // Simulate timer running with 90s remaining
    const runningTimer = makeRoomTimer({
      roomId: room.id,
      runState: 'running',
      running: true,
      endsAt: new Date(Date.now() + 90_000).toISOString(),
      remainingMs: 90_000,
    });

    await act(async () => {
      fireTimerUpdateEvent(room.id, runningTimer);
    });

    // After timer update, should show running state controls
    await waitFor(() => expect(screen.getByTestId('room-timer-pause')).toBeInTheDocument());
    // No longer shows Start button
    expect(screen.queryByTestId('room-timer-start')).not.toBeInTheDocument();
  });
});
