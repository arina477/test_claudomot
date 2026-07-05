/**
 * studyRoomSocket.test.ts — namespace regression guard (wave-49 B-6 lesson applied).
 *
 * Asserts that studyRoomSocket connects to the /study-room Socket.IO namespace
 * (NOT /messaging, NOT /study-timer). This is the regression guard for the
 * wave-49 B-6 cross-layer transport bug pattern: the original timer implementation
 * used the wrong namespace, making all socket events unreachable.
 *
 * A full two-client realtime round-trip belongs in T-block E2E (T-4);
 * this unit assertion catches the namespace mismatch at the unit level
 * without a real server.
 *
 * Test matrix:
 *   1. connects to /study-room namespace, NOT /messaging or /study-timer
 *   2. re-emits join_focus_room on reconnect for the active room
 *   3. does NOT re-emit join after leaveFocusRoom clears _activeRoomId
 *   4. onRooms / onPresence subscribe to correct event names
 *   5. onTimerUpdate subscribes to study-room:timer_update
 *   6. onJoinError subscribes to study-room:join_error
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('studyRoomSocket — namespace', () => {
  beforeEach(() => {
    // Reset the module registry so the singleton is re-created fresh for each test.
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Namespace assertion — the PRIMARY regression guard from wave-49 B-6 lesson
  it('connects to the /study-room namespace, NOT /messaging or /study-timer', async () => {
    const mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };
    const mockIo = vi.fn((_url: string, _opts?: object) => mockSocket);

    vi.doMock('socket.io-client', () => ({ io: mockIo }));

    // Trigger the lazy singleton init by calling any emit function
    const { joinFocusRoom } = await import('./studyRoomSocket');
    joinFocusRoom('server-test', 'room-test');

    // Assert: io called exactly once, URL ends with /study-room
    expect(mockIo).toHaveBeenCalledOnce();
    // biome-ignore lint/style/noNonNullAssertion: toHaveBeenCalledOnce guarantees calls[0] exists
    const calledUrl = mockIo.mock.calls[0]![0];
    expect(calledUrl).toMatch(/\/study-room$/);
    expect(calledUrl).not.toContain('/messaging');
    expect(calledUrl).not.toContain('/study-timer');
  });

  // 2. Reconnect re-join — active room re-joined after transient drop
  it('re-emits join_focus_room on reconnect for the active room', async () => {
    const connectHandlers: Array<() => void> = [];
    const mockSocket = {
      on: vi.fn((event: string, handler: () => void) => {
        if (event === 'connect') connectHandlers.push(handler);
      }),
      off: vi.fn(),
      emit: vi.fn(),
    };
    vi.doMock('socket.io-client', () => ({ io: vi.fn(() => mockSocket) }));

    const { joinFocusRoom } = await import('./studyRoomSocket');

    joinFocusRoom('server-abc', 'room-xyz');

    // Simulate reconnect
    mockSocket.emit.mockClear();
    for (const handler of connectHandlers) handler();

    // Should re-emit join_focus_room for the active room
    expect(mockSocket.emit).toHaveBeenCalledWith('join_focus_room', {
      serverId: 'server-abc',
      roomId: 'room-xyz',
    });
  });

  // 3. No re-join after intentional leave
  it('does NOT re-emit join_focus_room after leaveFocusRoom', async () => {
    const connectHandlers: Array<() => void> = [];
    const mockSocket = {
      on: vi.fn((event: string, handler: () => void) => {
        if (event === 'connect') connectHandlers.push(handler);
      }),
      off: vi.fn(),
      emit: vi.fn(),
    };
    vi.doMock('socket.io-client', () => ({ io: vi.fn(() => mockSocket) }));

    const { joinFocusRoom, leaveFocusRoom } = await import('./studyRoomSocket');

    joinFocusRoom('server-abc', 'room-xyz');
    leaveFocusRoom('server-abc', 'room-xyz');

    // Simulate reconnect after leave
    mockSocket.emit.mockClear();
    for (const handler of connectHandlers) handler();

    // Should NOT re-emit join after explicit leave cleared _activeRoomId
    expect(mockSocket.emit).not.toHaveBeenCalledWith('join_focus_room', expect.anything());
  });

  // 4. onRooms and onPresence subscribe to the correct event names
  it('onRooms subscribes to study-room:rooms and onPresence to study-room:presence', async () => {
    const mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };
    vi.doMock('socket.io-client', () => ({ io: vi.fn(() => mockSocket) }));

    const { onRooms, onPresence } = await import('./studyRoomSocket');

    const roomsHandler = vi.fn();
    const presenceHandler = vi.fn();

    onRooms(roomsHandler);
    onPresence(presenceHandler);

    // Verify subscriptions to the correct event names
    expect(mockSocket.on).toHaveBeenCalledWith('study-room:rooms', roomsHandler);
    expect(mockSocket.on).toHaveBeenCalledWith('study-room:presence', presenceHandler);

    // Verify NOT subscribed to wrong namespaces
    const calls = mockSocket.on.mock.calls.map((c) => c[0]);
    expect(calls).not.toContain('study-timer:update');
    expect(calls).not.toContain('message:new');
  });

  // 5. onTimerUpdate subscribes to study-room:timer_update
  it('onTimerUpdate subscribes to study-room:timer_update', async () => {
    const mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };
    vi.doMock('socket.io-client', () => ({ io: vi.fn(() => mockSocket) }));

    const { onTimerUpdate } = await import('./studyRoomSocket');

    const handler = vi.fn();
    onTimerUpdate(handler);

    expect(mockSocket.on).toHaveBeenCalledWith('study-room:timer_update', handler);
  });

  // 6. onJoinError subscribes to study-room:join_error
  it('onJoinError subscribes to study-room:join_error', async () => {
    const mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };
    vi.doMock('socket.io-client', () => ({ io: vi.fn(() => mockSocket) }));

    const { onJoinError } = await import('./studyRoomSocket');

    const handler = vi.fn();
    onJoinError(handler);

    expect(mockSocket.on).toHaveBeenCalledWith('study-room:join_error', handler);
  });
});
