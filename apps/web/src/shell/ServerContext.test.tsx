/**
 * ServerContext.test.tsx — offline hydration tests for the wave-65
 * server list + detail cache.
 *
 * Coverage:
 *   1. Offline hydration — api.getServers rejects, cache seeded → servers
 *      hydrate from cache and status becomes 'loaded'.
 *   2. Offline hydration — api.getServerDetail rejects, cache seeded →
 *      selectedDetail hydrates from cache and detailStatus becomes 'loaded'.
 *   3. Cold cache + offline → graceful error state (no throw, no crash).
 *   4. Online happy path — write-through: putCachedServers + putCachedServerDetail
 *      called on successful fetch.
 */

import type { ServerDetail, ServerSummary } from '@studyhall/shared';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useContext } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServerContext, ServerProvider } from './ServerContext';

// ── API mock ──────────────────────────────────────────────────────────────────

vi.mock('../auth/api', () => ({
  api: {
    getServers: vi.fn(),
    getServerDetail: vi.fn(),
  },
}));

import { api } from '../auth/api';
const mockApi = api as unknown as {
  getServers: ReturnType<typeof vi.fn>;
  getServerDetail: ReturnType<typeof vi.fn>;
};

// ── Cache mock ────────────────────────────────────────────────────────────────

const mockGetCachedServers = vi.fn();
const mockPutCachedServers = vi.fn().mockResolvedValue(undefined);
const mockGetCachedServerDetail = vi.fn();
const mockPutCachedServerDetail = vi.fn().mockResolvedValue(undefined);

vi.mock('../features/sync/cache', () => ({
  getCachedServers: (...args: unknown[]) => mockGetCachedServers(...args),
  putCachedServers: (...args: unknown[]) => mockPutCachedServers(...args),
  getCachedServerDetail: (...args: unknown[]) => mockGetCachedServerDetail(...args),
  putCachedServerDetail: (...args: unknown[]) => mockPutCachedServerDetail(...args),
  // stubs for other cache functions imported transitively by the module graph
  getCachedMessages: vi.fn().mockResolvedValue([]),
  putCachedMessages: vi.fn().mockResolvedValue(undefined),
  putCachedMessage: vi.fn().mockResolvedValue(undefined),
  getCachedChannel: vi.fn().mockResolvedValue(undefined),
  putCachedChannel: vi.fn().mockResolvedValue(undefined),
  getCachedDmConversations: vi.fn().mockResolvedValue([]),
  putCachedDmConversations: vi.fn().mockResolvedValue(undefined),
  putCachedDmConversation: vi.fn().mockResolvedValue(undefined),
  getCachedDmMessages: vi.fn().mockResolvedValue([]),
  putCachedDmMessages: vi.fn().mockResolvedValue(undefined),
  putCachedDmMessage: vi.fn().mockResolvedValue(undefined),
  getCachedAssignments: vi.fn().mockResolvedValue([]),
  putCachedAssignments: vi.fn().mockResolvedValue(undefined),
  getCachedScheduledSessions: vi.fn().mockResolvedValue([]),
  putCachedScheduledSessions: vi.fn().mockResolvedValue(undefined),
  getCachedAttachmentBlob: vi.fn().mockResolvedValue(undefined),
  putCachedAttachmentBlob: vi.fn().mockResolvedValue(undefined),
}));

// ── DB mock ───────────────────────────────────────────────────────────────────

vi.mock('../features/sync/db', () => ({
  db: { _mocked: true },
}));

// ── fixtures ──────────────────────────────────────────────────────────────────

const serverSummaries: ServerSummary[] = [
  { id: 'srv-1', name: 'Physics 101', ownerId: 'owner-1' },
  { id: 'srv-2', name: 'CS 202', ownerId: 'owner-2' },
];

const serverDetail: ServerDetail = {
  server: { id: 'srv-1', name: 'Physics 101', ownerId: 'owner-1', inviteCode: null },
  categories: [
    {
      id: 'cat-1',
      name: 'General',
      position: 0,
      channels: [{ id: 'ch-1', name: 'general', type: 'text', isPrivate: false, position: 0 }],
    },
  ],
};

// ── helper: consumer component ────────────────────────────────────────────────

/** Renders a minimal consumer that exposes context state via data-testid attributes. */
function ServerContextConsumer() {
  const ctx = useContext(ServerContext);
  return (
    <div>
      <span data-testid="status">{ctx.status}</span>
      <span data-testid="detail-status">{ctx.detailStatus}</span>
      <span data-testid="server-count">{ctx.servers.length}</span>
      <span data-testid="selected-detail">
        {ctx.selectedDetail ? JSON.stringify(ctx.selectedDetail.server.id) : 'null'}
      </span>
      <span data-testid="selected-channel">{ctx.selectedChannelId ?? 'null'}</span>
      {ctx.selectedDetail?.categories[0]?.channels.map((ch) => (
        <button
          key={ch.id}
          data-testid={`select-channel-${ch.id}`}
          type="button"
          onClick={() => ctx.selectChannel(ch.id, ch.name)}
        >
          {ch.name}
        </button>
      ))}
      <button data-testid="select-srv-1" type="button" onClick={() => ctx.selectServer('srv-1')}>
        Select srv-1
      </button>
    </div>
  );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('ServerProvider — offline hydration (server list)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates server rail from cache when network rejects', async () => {
    mockApi.getServers.mockRejectedValue(new Error('offline'));
    mockGetCachedServers.mockResolvedValue(
      serverSummaries.map((s) => ({ ...s, cachedAt: '2026-07-01T10:00:00.000Z' })),
    );
    mockGetCachedServerDetail.mockResolvedValue(undefined);

    render(
      <ServerProvider>
        <ServerContextConsumer />
      </ServerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('loaded');
    });

    expect(screen.getByTestId('server-count').textContent).toBe('2');
  });

  it('falls through to error state when cache is also empty', async () => {
    mockApi.getServers.mockRejectedValue(new Error('offline'));
    mockGetCachedServers.mockResolvedValue([]);

    render(
      <ServerProvider>
        <ServerContextConsumer />
      </ServerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('error');
    });

    expect(screen.getByTestId('server-count').textContent).toBe('0');
  });
});

describe('ServerProvider — offline hydration (server detail)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates channel sidebar from cache when detail fetch rejects', async () => {
    // Server list succeeds so we can select a server.
    mockApi.getServers.mockResolvedValue(serverSummaries);
    mockPutCachedServers.mockResolvedValue(undefined);

    // Detail fetch fails; cache has data.
    mockApi.getServerDetail.mockRejectedValue(new Error('offline'));
    mockGetCachedServerDetail.mockResolvedValue({
      id: 'srv-1',
      detail: serverDetail,
      cachedAt: '2026-07-01T10:00:00.000Z',
    });

    render(
      <ServerProvider>
        <ServerContextConsumer />
      </ServerProvider>,
    );

    // Wait for server list to load.
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('loaded');
    });

    // Select a server to trigger the detail effect.
    await act(async () => {
      await userEvent.click(screen.getByTestId('select-srv-1'));
    });

    // Detail should hydrate from cache.
    await waitFor(() => {
      expect(screen.getByTestId('detail-status').textContent).toBe('loaded');
    });

    expect(screen.getByTestId('selected-detail').textContent).toBe('"srv-1"');
  });

  it('a channel becomes selectable after detail hydrates from cache', async () => {
    mockApi.getServers.mockResolvedValue(serverSummaries);
    mockPutCachedServers.mockResolvedValue(undefined);
    mockApi.getServerDetail.mockRejectedValue(new Error('offline'));
    mockGetCachedServerDetail.mockResolvedValue({
      id: 'srv-1',
      detail: serverDetail,
      cachedAt: '2026-07-01T10:00:00.000Z',
    });

    render(
      <ServerProvider>
        <ServerContextConsumer />
      </ServerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('loaded');
    });

    await act(async () => {
      await userEvent.click(screen.getByTestId('select-srv-1'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('detail-status').textContent).toBe('loaded');
    });

    // Channel button should be rendered and clickable.
    const channelBtn = screen.getByTestId('select-channel-ch-1');
    await act(async () => {
      await userEvent.click(channelBtn);
    });

    expect(screen.getByTestId('selected-channel').textContent).toBe('ch-1');
  });

  it('cold cache + offline detail → graceful error state (no crash)', async () => {
    mockApi.getServers.mockResolvedValue(serverSummaries);
    mockPutCachedServers.mockResolvedValue(undefined);
    mockApi.getServerDetail.mockRejectedValue(new Error('offline'));
    mockGetCachedServerDetail.mockResolvedValue(undefined);

    render(
      <ServerProvider>
        <ServerContextConsumer />
      </ServerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('loaded');
    });

    await act(async () => {
      await userEvent.click(screen.getByTestId('select-srv-1'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('detail-status').textContent).toBe('error');
    });

    // No crash, no infinite spinner.
    expect(screen.getByTestId('selected-detail').textContent).toBe('null');
  });
});

describe('ServerProvider — online write-through', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls putCachedServers after a successful server list fetch', async () => {
    mockApi.getServers.mockResolvedValue(serverSummaries);
    mockApi.getServerDetail.mockRejectedValue(new Error('not needed'));
    mockGetCachedServerDetail.mockResolvedValue(undefined);

    render(
      <ServerProvider>
        <ServerContextConsumer />
      </ServerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('loaded');
    });

    expect(mockPutCachedServers).toHaveBeenCalledWith(
      expect.objectContaining({ _mocked: true }),
      serverSummaries,
    );
  });

  it('calls putCachedServerDetail after a successful server detail fetch', async () => {
    mockApi.getServers.mockResolvedValue(serverSummaries);
    mockPutCachedServers.mockResolvedValue(undefined);
    mockApi.getServerDetail.mockResolvedValue(serverDetail);

    render(
      <ServerProvider>
        <ServerContextConsumer />
      </ServerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('loaded');
    });

    await act(async () => {
      await userEvent.click(screen.getByTestId('select-srv-1'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('detail-status').textContent).toBe('loaded');
    });

    expect(mockPutCachedServerDetail).toHaveBeenCalledWith(
      expect.objectContaining({ _mocked: true }),
      'srv-1',
      serverDetail,
    );
  });
});
