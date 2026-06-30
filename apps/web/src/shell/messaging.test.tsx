/**
 * Messaging component tests — wave-12 M3.
 *
 * Coverage:
 * 1. MessageList: renders messages; empty-channel state; loading state.
 * 2. MessageComposer: disabled when empty; sends on Enter; disabled while
 *    the parent indicates sending.
 * 3. useMessagesWithRetry: optimistic send → confirmed; failed → retry;
 *    socket message:new appends + deduplicates.
 * 4. Integration via ChannelView (MainColumn rendered with context).
 *
 * Socket.IO is mocked; no real network calls.
 */

import type { MessageResponse } from '@studyhall/shared';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock socket singleton — captures the message:new handler so tests can trigger it
let capturedMessageNewHandler: ((msg: MessageResponse) => void) | null = null;

vi.mock('./messagingSocket', () => ({
  getMessagingSocket: vi.fn(() => ({
    connected: false,
    active: false,
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  })),
  joinChannel: vi.fn(),
  leaveChannel: vi.fn(),
  onMessageNew: vi.fn((handler: (msg: MessageResponse) => void) => {
    capturedMessageNewHandler = handler;
    return () => {
      capturedMessageNewHandler = null;
    };
  }),
  getSocketState: vi.fn(() => 'online'),
}));

// Mock api
vi.mock('../auth/api', () => ({
  api: {
    listMessages: vi.fn(),
    sendMessage: vi.fn(),
    getProfile: vi.fn().mockReturnValue(new Promise(() => {})),
    getServers: vi.fn().mockReturnValue(new Promise(() => {})),
    getServerDetail: vi.fn().mockReturnValue(new Promise(() => {})),
  },
}));

import { api } from '../auth/api';

const mockApi = api as unknown as {
  listMessages: ReturnType<typeof vi.fn>;
  sendMessage: ReturnType<typeof vi.fn>;
};

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { MainColumn } from './MainColumn';
import { MessageComposer } from './MessageComposer';
import { MessageList } from './MessageList';
import type { DisplayMessage } from './MessageList';
import { ServerContext } from './ServerContext';
import type { ServerContextValue } from './ServerContext';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeMsg(overrides: Partial<MessageResponse> = {}): MessageResponse {
  return {
    id: crypto.randomUUID(),
    channelId: 'ch-1',
    authorId: 'user-abc',
    content: 'Hello world',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeCtx(override: Partial<ServerContextValue> = {}): ServerContextValue {
  return {
    servers: [],
    status: 'idle',
    selectedId: null,
    selectServer: vi.fn(),
    appendServer: vi.fn(),
    refetch: vi.fn(),
    createModalOpen: false,
    openCreateModal: vi.fn(),
    closeCreateModal: vi.fn(),
    selectedDetail: null,
    detailStatus: 'idle',
    selectedChannelId: null,
    selectedChannelName: null,
    selectChannel: vi.fn(),
    ...override,
  };
}

// ── MessageList tests ─────────────────────────────────────────────────────────

describe('MessageList', () => {
  it('renders real messages', () => {
    const msgs: DisplayMessage[] = [
      { kind: 'real', ...makeMsg({ content: 'First message', authorId: 'alice' }) },
      { kind: 'real', ...makeMsg({ content: 'Second message', authorId: 'bob' }) },
    ];
    render(
      <MessageList
        messages={msgs}
        loadingInitial={false}
        loadingOlder={false}
        errorInitial={false}
        hasOlderMessages={false}
        onLoadOlder={vi.fn()}
        onRetry={vi.fn()}
        channelName="questions"
      />,
    );
    expect(screen.getByText('First message')).toBeInTheDocument();
    expect(screen.getByText('Second message')).toBeInTheDocument();
    expect(screen.getByRole('log')).toBeInTheDocument();
  });

  it('shows empty-channel state when messages array is empty', () => {
    render(
      <MessageList
        messages={[]}
        loadingInitial={false}
        loadingOlder={false}
        errorInitial={false}
        hasOlderMessages={false}
        onLoadOlder={vi.fn()}
        onRetry={vi.fn()}
        channelName="general"
      />,
    );
    expect(screen.getByTestId('empty-channel-state')).toBeInTheDocument();
    expect(screen.getByText(/No messages yet/i)).toBeInTheDocument();
    // Log should NOT be present when empty
    expect(screen.queryByRole('log')).not.toBeInTheDocument();
  });

  it('shows loading spinner when loadingInitial=true', () => {
    render(
      <MessageList
        messages={[]}
        loadingInitial={true}
        loadingOlder={false}
        errorInitial={false}
        hasOlderMessages={false}
        onLoadOlder={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    // spinner is present; no messages
    expect(screen.queryByTestId('empty-channel-state')).not.toBeInTheDocument();
    expect(screen.queryByRole('log')).not.toBeInTheDocument();
  });

  it('renders pending message with aria-busy and clock icon', () => {
    const msgs: DisplayMessage[] = [
      {
        kind: 'optimistic',
        idempotencyKey: 'ikey-1',
        content: 'Sending this now',
        authorDisplay: 'You',
        state: 'pending',
      },
    ];
    render(
      <MessageList
        messages={msgs}
        loadingInitial={false}
        loadingOlder={false}
        errorInitial={false}
        hasOlderMessages={false}
        onLoadOlder={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    const pendingRow = screen.getByTestId('pending-message');
    expect(pendingRow).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Sending…')).toBeInTheDocument();
    expect(screen.getByText('Sending this now')).toBeInTheDocument();
  });

  it('renders failed message with retry button and role=alert', () => {
    const onRetry = vi.fn();
    const msgs: DisplayMessage[] = [
      {
        kind: 'optimistic',
        idempotencyKey: 'ikey-2',
        content: 'This failed',
        authorDisplay: 'You',
        state: 'failed',
      },
    ];
    render(
      <MessageList
        messages={msgs}
        loadingInitial={false}
        loadingOlder={false}
        errorInitial={false}
        hasOlderMessages={false}
        onLoadOlder={vi.fn()}
        onRetry={onRetry}
      />,
    );
    const failedRow = screen.getByTestId('failed-message');
    expect(failedRow).toHaveAttribute('role', 'alert');
    expect(screen.getByText('Failed to send')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledWith('ikey-2');
  });
});

// ── MessageComposer tests ─────────────────────────────────────────────────────

describe('MessageComposer', () => {
  it('send button is disabled when textarea is empty', () => {
    render(<MessageComposer onSend={vi.fn()} channelName="general" />);
    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  it('send button enables when text is typed', async () => {
    const user = userEvent.setup();
    render(<MessageComposer onSend={vi.fn()} channelName="general" />);
    const ta = screen.getByTestId('composer-input');
    await user.type(ta, 'Hello');
    expect(screen.getByTestId('send-button')).not.toBeDisabled();
  });

  it('calls onSend and clears textarea when Enter is pressed', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<MessageComposer onSend={onSend} channelName="general" />);
    const ta = screen.getByTestId('composer-input') as HTMLTextAreaElement;
    await user.type(ta, 'Test message');
    await user.keyboard('{Enter}');
    expect(onSend).toHaveBeenCalledWith('Test message');
    expect(ta.value).toBe('');
  });

  it('calls onSend when the send button is clicked', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<MessageComposer onSend={onSend} />);
    const ta = screen.getByTestId('composer-input');
    await user.type(ta, 'Click send');
    await user.click(screen.getByTestId('send-button'));
    expect(onSend).toHaveBeenCalledWith('Click send');
  });

  it('Shift+Enter inserts newline instead of sending', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<MessageComposer onSend={onSend} />);
    const ta = screen.getByTestId('composer-input') as HTMLTextAreaElement;
    await user.type(ta, 'Line 1');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    // onSend should NOT have been called
    expect(onSend).not.toHaveBeenCalled();
    // Value has a newline
    expect(ta.value).toContain('\n');
  });

  it('does not send whitespace-only content', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<MessageComposer onSend={onSend} />);
    const ta = screen.getByTestId('composer-input');
    await user.type(ta, '   ');
    await user.keyboard('{Enter}');
    expect(onSend).not.toHaveBeenCalled();
  });
});

// ── useMessagesWithRetry integration via MainColumn ───────────────────────────

describe('MainColumn — optimistic send + real-time dedup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedMessageNewHandler = null;
  });

  function renderWithChannel(channelId = 'ch-1', channelName = 'questions') {
    const ctx = makeCtx({ selectedChannelId: channelId, selectedChannelName: channelName });
    return render(
      <ServerContext.Provider value={ctx}>
        <MainColumn />
      </ServerContext.Provider>,
    );
  }

  it('shows empty state when API returns no messages', async () => {
    mockApi.listMessages.mockResolvedValue({ messages: [], nextCursor: null });
    renderWithChannel();
    await waitFor(() => {
      expect(screen.getByTestId('empty-channel-state')).toBeInTheDocument();
    });
  });

  it('renders fetched messages from API', async () => {
    const msgs = [makeMsg({ content: 'From API', authorId: 'u1' })];
    mockApi.listMessages.mockResolvedValue({ messages: msgs, nextCursor: null });
    renderWithChannel();
    await waitFor(() => {
      expect(screen.getByText('From API')).toBeInTheDocument();
    });
  });

  it('optimistic send: shows pending message immediately, then confirms', async () => {
    mockApi.listMessages.mockResolvedValue({ messages: [], nextCursor: null });
    const confirmed = makeMsg({ content: 'Hello', authorId: 'me' });

    // Use a manually-controlled promise so we can assert the pending state
    // before the server response arrives.
    let resolveSend!: (v: MessageResponse) => void;
    const sendPromise = new Promise<MessageResponse>((resolve) => {
      resolveSend = resolve;
    });
    mockApi.sendMessage.mockReturnValue(sendPromise);

    renderWithChannel();
    await waitFor(() => screen.getByTestId('empty-channel-state'));

    const user = userEvent.setup();
    await user.type(screen.getByTestId('composer-input'), 'Hello');
    await user.keyboard('{Enter}');

    // Pending row should appear before the server responds
    await waitFor(() => {
      expect(screen.getByTestId('pending-message')).toBeInTheDocument();
    });

    // Resolve the send — pending replaced by confirmed
    act(() => {
      resolveSend(confirmed);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('pending-message')).not.toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('optimistic send: shows failed state + retry on API error', async () => {
    mockApi.listMessages.mockResolvedValue({ messages: [], nextCursor: null });
    mockApi.sendMessage.mockRejectedValue(new Error('Network error'));

    renderWithChannel();
    await waitFor(() => screen.getByTestId('empty-channel-state'));

    const user = userEvent.setup();
    await user.type(screen.getByTestId('composer-input'), 'Fail this');
    await user.keyboard('{Enter}');

    // After rejection, failed row should be shown
    await waitFor(() => {
      expect(screen.getByTestId('failed-message')).toBeInTheDocument();
    });
    expect(screen.getByText('Failed to send')).toBeInTheDocument();
  });

  it('failed message retry re-attempts send and confirms on success', async () => {
    mockApi.listMessages.mockResolvedValue({ messages: [], nextCursor: null });
    // First attempt fails, retry succeeds
    mockApi.sendMessage
      .mockRejectedValueOnce(new Error('First fail'))
      .mockResolvedValueOnce(makeMsg({ content: 'Retry success' }));

    renderWithChannel();
    await waitFor(() => screen.getByTestId('empty-channel-state'));

    const user = userEvent.setup();
    await user.type(screen.getByTestId('composer-input'), 'Retry success');
    await user.keyboard('{Enter}');

    await waitFor(() => screen.getByTestId('failed-message'));

    // Click retry
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    await user.click(retryBtn);

    // Should go back to pending, then confirm
    await waitFor(() => {
      expect(screen.queryByTestId('failed-message')).not.toBeInTheDocument();
      expect(screen.getByText('Retry success')).toBeInTheDocument();
    });
  });

  it('socket message:new appends new messages', async () => {
    mockApi.listMessages.mockResolvedValue({ messages: [], nextCursor: null });
    renderWithChannel();
    await waitFor(() => screen.getByTestId('empty-channel-state'));

    const incoming = makeMsg({ content: 'Socket message', channelId: 'ch-1' });
    act(() => {
      capturedMessageNewHandler?.(incoming);
    });

    await waitFor(() => {
      expect(screen.getByText('Socket message')).toBeInTheDocument();
    });
  });

  it('socket message:new deduplicates by id (same message not shown twice)', async () => {
    const existing = makeMsg({ content: 'Already here', channelId: 'ch-1' });
    mockApi.listMessages.mockResolvedValue({ messages: [existing], nextCursor: null });
    renderWithChannel();

    await waitFor(() => screen.getByText('Already here'));

    // Simulate same message arriving via socket
    act(() => {
      capturedMessageNewHandler?.(existing);
    });

    // Should only appear once
    await waitFor(() => {
      const items = screen.getAllByText('Already here');
      expect(items).toHaveLength(1);
    });
  });

  it('ignores socket messages for a different channel', async () => {
    mockApi.listMessages.mockResolvedValue({ messages: [], nextCursor: null });
    renderWithChannel('ch-1');
    await waitFor(() => screen.getByTestId('empty-channel-state'));

    const wrongChannel = makeMsg({ content: 'Wrong channel', channelId: 'ch-OTHER' });
    act(() => {
      capturedMessageNewHandler?.(wrongChannel);
    });

    // The message should NOT appear
    await waitFor(() => {
      expect(screen.queryByText('Wrong channel')).not.toBeInTheDocument();
    });
  });
});
