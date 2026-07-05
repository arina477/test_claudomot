/**
 * studyTimerSocket.test.ts — namespace regression guard (B-6 review finding).
 *
 * Asserts that studyTimerSocket connects to the /study-timer Socket.IO namespace
 * (NOT /messaging). This is the regression guard for the wave-49 B-6 cross-layer
 * transport bug: the original implementation used getMessagingSocket() which routes
 * to the /messaging namespace, making join_timer_room and study-timer:* broadcasts
 * unreachable by the StudyTimerGateway (which listens only on /study-timer).
 *
 * A full two-client realtime round-trip belongs in T-block E2E (T-4); this unit
 * assertion catches the namespace mismatch at the unit level without a real server.
 *
 * Refs: c3daf6d3 (original widget commit), wave-49 B-6 gate finding.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('studyTimerSocket — namespace', () => {
  beforeEach(() => {
    // Reset the module registry so the singleton in studyTimerSocket.ts is
    // re-created fresh for each test (avoids cross-test singleton leakage).
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('connects to the /study-timer namespace, not /messaging', async () => {
    // Arrange: set up the mock socket BEFORE importing the module so the
    // singleton init picks up our mock io (vi.doMock is not hoisted).
    const mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };
    // Typed signature so TS can resolve calls[0][0] as string.
    const mockIo = vi.fn((_url: string, _opts?: object) => mockSocket);

    vi.doMock('socket.io-client', () => ({ io: mockIo }));

    // Act: fresh import after resetModules gives a fresh module (no cached singleton).
    // Calling joinTimerRoom triggers the lazy getStudyTimerSocket() init.
    const { joinTimerRoom } = await import('./studyTimerSocket');
    joinTimerRoom('server-test');

    // Assert: io was called exactly once and the URL ends with /study-timer.
    expect(mockIo).toHaveBeenCalledOnce();
    // biome-ignore lint/style/noNonNullAssertion: toHaveBeenCalledOnce guarantees calls[0] exists
    const calledUrl = mockIo.mock.calls[0]![0];
    expect(calledUrl).toMatch(/\/study-timer$/);
    expect(calledUrl).not.toContain('/messaging');
  });

  it('re-emits join_timer_room on reconnect for the active serverId', async () => {
    // Arrange
    const connectHandlers: Array<() => void> = [];
    const mockSocket = {
      on: vi.fn((event: string, handler: () => void) => {
        if (event === 'connect') connectHandlers.push(handler);
      }),
      off: vi.fn(),
      emit: vi.fn(),
    };
    vi.doMock('socket.io-client', () => ({ io: vi.fn(() => mockSocket) }));

    const { joinTimerRoom } = await import('./studyTimerSocket');

    // Act: join a room (sets _activeServerId + triggers singleton init)
    joinTimerRoom('server-abc');

    // Simulate a reconnect event firing
    mockSocket.emit.mockClear();
    for (const handler of connectHandlers) handler();

    // Assert: join_timer_room is re-emitted for the active serverId
    expect(mockSocket.emit).toHaveBeenCalledWith('join_timer_room', { serverId: 'server-abc' });
  });

  it('does NOT re-emit join_timer_room on reconnect after leaveTimerRoom', async () => {
    // Arrange
    const connectHandlers: Array<() => void> = [];
    const mockSocket = {
      on: vi.fn((event: string, handler: () => void) => {
        if (event === 'connect') connectHandlers.push(handler);
      }),
      off: vi.fn(),
      emit: vi.fn(),
    };
    vi.doMock('socket.io-client', () => ({ io: vi.fn(() => mockSocket) }));

    const { joinTimerRoom, leaveTimerRoom } = await import('./studyTimerSocket');

    joinTimerRoom('server-abc');
    leaveTimerRoom('server-abc');

    // Simulate reconnect after leave
    mockSocket.emit.mockClear();
    for (const handler of connectHandlers) handler();

    // Assert: no re-join after leave cleared _activeServerId
    expect(mockSocket.emit).not.toHaveBeenCalledWith('join_timer_room', expect.anything());
  });
});
