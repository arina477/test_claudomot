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

// Mock socket singleton — captures handlers so tests can trigger them
let capturedMessageNewHandler: ((msg: MessageResponse) => void) | null = null;
let capturedMessageUpdatedHandler: ((msg: MessageResponse) => void) | null = null;
let capturedMessageDeletedHandler: ((p: MessageResponse) => void) | null = null;
let capturedReactionAddedHandler:
  | ((p: {
      messageId: string;
      channelId: string;
      emoji: string;
      count: number;
      reactedByMe: boolean;
    }) => void)
  | null = null;
let capturedReactionRemovedHandler:
  | ((p: {
      messageId: string;
      channelId: string;
      emoji: string;
      count: number;
      reactedByMe: boolean;
    }) => void)
  | null = null;
let capturedThreadReplyDeletedHandler:
  | ((p: {
      parentId: string;
      channelId: string;
      replyId: string;
      replyCount: number;
      lastReplyAt: string | null;
    }) => void)
  | null = null;

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
  onMessageUpdated: vi.fn((handler: (msg: MessageResponse) => void) => {
    capturedMessageUpdatedHandler = handler;
    return () => {
      capturedMessageUpdatedHandler = null;
    };
  }),
  onMessageDeleted: vi.fn((handler: (p: MessageResponse) => void) => {
    capturedMessageDeletedHandler = handler;
    return () => {
      capturedMessageDeletedHandler = null;
    };
  }),
  onReactionAdded: vi.fn(
    (
      handler: (p: {
        messageId: string;
        channelId: string;
        emoji: string;
        count: number;
        reactedByMe: boolean;
      }) => void,
    ) => {
      capturedReactionAddedHandler = handler;
      return () => {
        capturedReactionAddedHandler = null;
      };
    },
  ),
  onReactionRemoved: vi.fn(
    (
      handler: (p: {
        messageId: string;
        channelId: string;
        emoji: string;
        count: number;
        reactedByMe: boolean;
      }) => void,
    ) => {
      capturedReactionRemovedHandler = handler;
      return () => {
        capturedReactionRemovedHandler = null;
      };
    },
  ),
  applyReactionEvent: vi.fn(
    (
      existing: { emoji: string; count: number; reactedByMe: boolean }[],
      payload: { emoji: string; count: number; reactedByMe: boolean },
    ) => {
      const { emoji, count, reactedByMe } = payload;
      if (count === 0) return existing.filter((r) => r.emoji !== emoji);
      const idx = existing.findIndex((r) => r.emoji === emoji);
      if (idx === -1) return [...existing, { emoji, count, reactedByMe }];
      return existing.map((r, i) => (i === idx ? { emoji, count, reactedByMe } : r));
    },
  ),
  // wave-15 mention events
  onMention: vi.fn(() => () => {}),
  // wave-18 thread events
  onThreadReplyCreated: vi.fn(() => () => {}),
  onThreadReplyDeleted: vi.fn(
    (
      handler: (p: {
        parentId: string;
        channelId: string;
        replyId: string;
        replyCount: number;
        lastReplyAt: string | null;
      }) => void,
    ) => {
      capturedThreadReplyDeletedHandler = handler;
      return () => {
        capturedThreadReplyDeletedHandler = null;
      };
    },
  ),
  getSocketState: vi.fn(() => 'online'),
}));

// Mock api
vi.mock('../auth/api', () => ({
  api: {
    listMessages: vi.fn(),
    sendMessage: vi.fn(),
    editMessage: vi.fn(),
    deleteMessage: vi.fn(),
    toggleReaction: vi.fn(),
    getServerMembers: vi.fn(),
    // wave-18 thread endpoints — no-op stubs
    getThreadReplies: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    postReply: vi.fn(),
    getMyMentions: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    getProfile: vi.fn().mockReturnValue(new Promise(() => {})),
    getServers: vi.fn().mockReturnValue(new Promise(() => {})),
    getServerDetail: vi.fn().mockReturnValue(new Promise(() => {})),
    // wave-37 notification endpoints
    getNotifications: vi.fn().mockResolvedValue({ items: [], unreadCount: 0, nextCursor: null }),
    markNotificationRead: vi.fn().mockResolvedValue({ unreadCount: 0 }),
    markAllNotificationsRead: vi.fn().mockResolvedValue({ unreadCount: 0 }),
  },
}));

import { api } from '../auth/api';

const mockApi = api as unknown as {
  listMessages: ReturnType<typeof vi.fn>;
  sendMessage: ReturnType<typeof vi.fn>;
  editMessage: ReturnType<typeof vi.fn>;
  deleteMessage: ReturnType<typeof vi.fn>;
  toggleReaction: ReturnType<typeof vi.fn>;
  getServerMembers: ReturnType<typeof vi.fn>;
};

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { MainColumn } from './MainColumn';
import { MentionAutocomplete } from './MentionAutocomplete';
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
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    reactions: [],
    mentions: [],
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
    assignmentsOpen: false,
    openAssignments: vi.fn(),
    closeAssignments: vi.fn(),
    scheduleOpen: false,
    openSchedule: vi.fn(),
    closeSchedule: vi.fn(),
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

  // ── Wave-19 M3 attachment render tests ─────────────────────────────────────

  it('renders file-chip for a non-image attachment', () => {
    const msgs: DisplayMessage[] = [
      {
        kind: 'real',
        ...makeMsg({
          content: 'Check this out',
          attachments: [
            {
              id: 'att-1',
              filename: 'hw1.pdf',
              contentType: 'application/pdf',
              sizeBytes: 1234567,
              url: 'https://example.com/hw1.pdf',
            },
          ],
        }),
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
    // File chip shows filename
    expect(screen.getByText('hw1.pdf')).toBeInTheDocument();
    // It's a download link
    const chip = document.querySelector('a[download]') as HTMLAnchorElement;
    expect(chip).toBeTruthy();
    expect(chip.href).toContain('https://example.com/hw1.pdf');
  });

  it('renders inline image preview for an image attachment', () => {
    const msgs: DisplayMessage[] = [
      {
        kind: 'real',
        ...makeMsg({
          content: 'Look at this image',
          attachments: [
            {
              id: 'att-2',
              filename: 'diagram.png',
              contentType: 'image/png',
              sizeBytes: 200000,
              url: 'https://example.com/diagram.png',
            },
          ],
        }),
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
    // Inline img element with the attachment URL
    const img = document.querySelector(
      'img[src="https://example.com/diagram.png"]',
    ) as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.alt).toBe('diagram.png');
  });

  it('tombstone renders no attachments even when present in data', () => {
    const msgs: DisplayMessage[] = [
      {
        kind: 'real',
        ...makeMsg({
          isDeleted: true,
          content: null,
          attachments: [
            {
              id: 'att-del',
              filename: 'secret.pdf',
              contentType: 'application/pdf',
              sizeBytes: 500,
              url: 'https://example.com/secret.pdf',
            },
          ],
        }),
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
    // Tombstone text
    expect(screen.getByText(/This message was deleted/i)).toBeInTheDocument();
    // No attachment filename visible
    expect(screen.queryByText('secret.pdf')).not.toBeInTheDocument();
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
    // Wave-19: onSend signature is (content, attachments?, previews?).
    // When no attachments are staged, the latter two args are undefined.
    expect(onSend).toHaveBeenCalledWith('Test message', undefined, undefined);
    expect(ta.value).toBe('');
  });

  it('calls onSend when the send button is clicked', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<MessageComposer onSend={onSend} />);
    const ta = screen.getByTestId('composer-input');
    await user.type(ta, 'Click send');
    await user.click(screen.getByTestId('send-button'));
    // Wave-19: onSend signature is (content, attachments?, previews?).
    expect(onSend).toHaveBeenCalledWith('Click send', undefined, undefined);
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

  // ── Wave-19 M3 attachment guard tests ──────────────────────────────────────

  it('rejects a file that is too large (>10MB) — shows error tile, does not enable send', () => {
    const onSend = vi.fn();
    render(<MessageComposer onSend={onSend} />);

    const input = document.querySelector('[data-testid="file-input"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    // 11 MB image — exceeds the 10 MB limit
    const bigFile = new File(['x'.repeat(11 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    Object.defineProperty(bigFile, 'size', { value: 11 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [bigFile] } });

    // Strip should appear
    expect(screen.getByTestId('staged-attachment-strip')).toBeInTheDocument();
    // Error tile: role=alert
    const alert = document.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    // Send button should still be disabled (no text + error tile)
    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  it('rejects a file with a disallowed content-type — shows error tile', () => {
    const onSend = vi.fn();
    render(<MessageComposer onSend={onSend} />);

    const input = document.querySelector('[data-testid="file-input"]') as HTMLInputElement;
    const badFile = new File(['data'], 'video.mp4', { type: 'video/mp4' });
    fireEvent.change(input, { target: { files: [badFile] } });

    expect(screen.getByTestId('staged-attachment-strip')).toBeInTheDocument();
    const alert = document.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
  });

  it('accepts a valid PDF attachment and shows it in the staged strip', () => {
    const onSend = vi.fn();
    render(<MessageComposer onSend={onSend} />);

    const input = document.querySelector('[data-testid="file-input"]') as HTMLInputElement;
    const pdf = new File(['%PDF'], 'notes.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [pdf] } });

    const strip = screen.getByTestId('staged-attachment-strip');
    expect(strip).toBeInTheDocument();
    expect(strip.textContent).toContain('notes.pdf');
    // No error alert
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });
});

// ── useMessagesWithRetry integration via MainColumn ───────────────────────────

describe('MainColumn — optimistic send + real-time dedup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedMessageNewHandler = null;
    capturedMessageUpdatedHandler = null;
    capturedMessageDeletedHandler = null;
    capturedReactionAddedHandler = null;
    capturedReactionRemovedHandler = null;
    capturedThreadReplyDeletedHandler = null;
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

// ── Message lifecycle tests (wave-13 B-3) ─────────────────────────────────────

describe('MessageList — lifecycle UI (wave-13 B-3)', () => {
  it('renders (edited) indicator for isEdited messages', () => {
    const msg = makeMsg({
      content: 'Edited text',
      isEdited: true,
      editedAt: new Date().toISOString(),
    });
    const msgs: DisplayMessage[] = [{ kind: 'real', ...msg }];
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
    expect(screen.getByTestId(`edited-indicator-${msg.id}`)).toBeInTheDocument();
    expect(screen.getByText('(edited)')).toBeInTheDocument();
  });

  it('renders tombstone for isDeleted messages, no content shown', () => {
    const msg = makeMsg({ content: null, isDeleted: true });
    const msgs: DisplayMessage[] = [{ kind: 'real', ...msg }];
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
    expect(screen.getByTestId(`tombstone-${msg.id}`)).toBeInTheDocument();
    expect(screen.getByText('This message was deleted')).toBeInTheDocument();
  });

  it('renders reaction pills with count', () => {
    const msg = makeMsg({
      reactions: [
        { emoji: '👍', count: 3, reactedByMe: false },
        { emoji: '❤️', count: 1, reactedByMe: true },
      ],
    });
    const msgs: DisplayMessage[] = [{ kind: 'real', ...msg }];
    render(
      <MessageList
        messages={msgs}
        loadingInitial={false}
        loadingOlder={false}
        errorInitial={false}
        hasOlderMessages={false}
        onLoadOlder={vi.fn()}
        onRetry={vi.fn()}
        onReaction={vi.fn()}
      />,
    );
    expect(screen.getByTestId(`reaction-pill-${msg.id}-👍`)).toBeInTheDocument();
    expect(screen.getByTestId(`reaction-pill-${msg.id}-❤️`)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('reaction pill aria-pressed=true for reactedByMe', () => {
    const msg = makeMsg({
      reactions: [{ emoji: '👍', count: 2, reactedByMe: true }],
    });
    const msgs: DisplayMessage[] = [{ kind: 'real', ...msg }];
    render(
      <MessageList
        messages={msgs}
        loadingInitial={false}
        loadingOlder={false}
        errorInitial={false}
        hasOlderMessages={false}
        onLoadOlder={vi.fn()}
        onRetry={vi.fn()}
        onReaction={vi.fn()}
      />,
    );
    const pill = screen.getByTestId(`reaction-pill-${msg.id}-👍`);
    expect(pill).toHaveAttribute('aria-pressed', 'true');
  });

  it('reaction pill aria-pressed=false when not reacted', () => {
    const msg = makeMsg({
      reactions: [{ emoji: '🤔', count: 1, reactedByMe: false }],
    });
    const msgs: DisplayMessage[] = [{ kind: 'real', ...msg }];
    render(
      <MessageList
        messages={msgs}
        loadingInitial={false}
        loadingOlder={false}
        errorInitial={false}
        hasOlderMessages={false}
        onLoadOlder={vi.fn()}
        onRetry={vi.fn()}
        onReaction={vi.fn()}
      />,
    );
    const pill = screen.getByTestId(`reaction-pill-${msg.id}-🤔`);
    expect(pill).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking a reaction pill calls onReaction with messageId and emoji', async () => {
    const onReaction = vi.fn();
    const msg = makeMsg({ reactions: [{ emoji: '👍', count: 1, reactedByMe: false }] });
    const msgs: DisplayMessage[] = [{ kind: 'real', ...msg }];
    const user = userEvent.setup();
    render(
      <MessageList
        messages={msgs}
        loadingInitial={false}
        loadingOlder={false}
        errorInitial={false}
        hasOlderMessages={false}
        onLoadOlder={vi.fn()}
        onRetry={vi.fn()}
        onReaction={onReaction}
      />,
    );
    const pill = screen.getByTestId(`reaction-pill-${msg.id}-👍`);
    await user.click(pill);
    expect(onReaction).toHaveBeenCalledWith(msg.id, '👍');
  });
});

// ── Socket lifecycle events (wave-13 B-3) ─────────────────────────────────────

describe('MainColumn — socket message:updated / deleted / reaction events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedMessageNewHandler = null;
    capturedMessageUpdatedHandler = null;
    capturedMessageDeletedHandler = null;
    capturedReactionAddedHandler = null;
    capturedReactionRemovedHandler = null;
    capturedThreadReplyDeletedHandler = null;
  });

  function renderWithChannel(channelId = 'ch-1', channelName = 'questions') {
    const ctx = makeCtx({ selectedChannelId: channelId, selectedChannelName: channelName });
    return render(
      <ServerContext.Provider value={ctx}>
        <MainColumn />
      </ServerContext.Provider>,
    );
  }

  it('socket message:updated replaces existing message in UI', async () => {
    const original = makeMsg({ content: 'Original', channelId: 'ch-1' });
    mockApi.listMessages.mockResolvedValue({ messages: [original], nextCursor: null });
    renderWithChannel();

    await waitFor(() => screen.getByText('Original'));

    const updated = { ...original, content: 'Updated content', isEdited: true };
    act(() => {
      capturedMessageUpdatedHandler?.(updated);
    });

    await waitFor(() => {
      expect(screen.getByText('Updated content')).toBeInTheDocument();
      expect(screen.queryByText('Original')).not.toBeInTheDocument();
    });
  });

  it('socket message:deleted marks message as tombstone', async () => {
    const msg = makeMsg({ content: 'Will be deleted', channelId: 'ch-1' });
    mockApi.listMessages.mockResolvedValue({ messages: [msg], nextCursor: null });
    renderWithChannel();

    await waitFor(() => screen.getByText('Will be deleted'));

    // The backend emits the full tombstoned MessageResponse DTO — id field, not messageId.
    // This is the real wire contract; payload.messageId would be undefined and never match.
    const tombstone: MessageResponse = {
      ...msg,
      isDeleted: true,
      content: null,
      reactions: [],
    };
    act(() => {
      capturedMessageDeletedHandler?.(tombstone);
    });

    await waitFor(() => {
      expect(screen.getByText('This message was deleted')).toBeInTheDocument();
      expect(screen.queryByText('Will be deleted')).not.toBeInTheDocument();
    });
  });

  // ── Wave-58 B-3: tombstone own optimistic message on message:deleted ─────────
  // Covers the race where message:deleted arrives while B's own message is still
  // in optimisticMessages (confirmed server id known but optimistic row not yet
  // cleaned up by the send's onSuccess callback).
  //
  // Scenario:
  //   1. B sends a message → optimistic pending entry appears.
  //   2. Server confirms with a real id (api.sendMessage resolves).
  //   3. confirmedIdToKeyRef is populated by the send's .then() callback.
  //   4. Before the optimistic entry is cleaned up (same .then()), moderator A
  //      fires message:deleted for that server id.
  //   5. B's optimistic copy must disappear alongside the realMessages tombstone.
  //
  // In the no-IDB test path (db = null), steps 2-5 collapse into a single
  // async tick. We use a controlled promise to keep the optimistic entry alive
  // while we inject message:new (to register the server id) before resolving.
  it('B-3: own optimistic message tombstones when message:deleted fires for its confirmed server id', async () => {
    mockApi.listMessages.mockResolvedValue({ messages: [], nextCursor: null });

    let resolveSend!: (v: MessageResponse) => void;
    const sendPromise = new Promise<MessageResponse>((resolve) => {
      resolveSend = resolve;
    });
    mockApi.sendMessage.mockReturnValue(sendPromise);

    renderWithChannel();
    await waitFor(() => screen.getByTestId('empty-channel-state'));

    // B sends a message — optimistic pending entry appears immediately.
    const user = userEvent.setup();
    await user.type(screen.getByTestId('composer-input'), 'B message unique-marker-b3');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('pending-message')).toBeInTheDocument();
      expect(screen.getByText('B message unique-marker-b3')).toBeInTheDocument();
    });

    // Build the confirmed MessageResponse the server would return.
    const confirmedId = 'server-confirmed-id-b3';
    const confirmed: MessageResponse = makeMsg({
      id: confirmedId,
      content: 'B message unique-marker-b3',
      channelId: 'ch-1',
    });
    const tombstone: MessageResponse = {
      ...confirmed,
      isDeleted: true,
      content: null,
      reactions: [],
    };

    // Resolve the send AND immediately fire message:deleted in the same act()
    // flush. The send's .then() callback populates confirmedIdToKeyRef and
    // the message:deleted handler reads it — both must run in the same tick
    // so the optimistic entry is gone when the dust settles.
    act(() => {
      resolveSend(confirmed);
    });

    // Give microtasks (the .then() callbacks) a chance to run, then fire the
    // delete event. At this point confirmedIdToKeyRef has the server id → key
    // mapping (populated by the .then()), and the message:deleted handler will
    // use it to drop the optimistic copy.
    act(() => {
      capturedMessageDeletedHandler?.(tombstone);
    });

    await waitFor(() => {
      // Tombstone text must be visible.
      expect(screen.getByText('This message was deleted')).toBeInTheDocument();
      // Original content must not be visible anywhere (neither real nor optimistic).
      expect(screen.queryByText('B message unique-marker-b3')).not.toBeInTheDocument();
      // Pending state must be gone.
      expect(screen.queryByTestId('pending-message')).not.toBeInTheDocument();
    });
  });

  it('socket reaction:added adds a reaction to the message', async () => {
    const msg = makeMsg({ reactions: [], channelId: 'ch-1' });
    mockApi.listMessages.mockResolvedValue({ messages: [msg], nextCursor: null });
    renderWithChannel();

    await waitFor(() => screen.getByTestId(`message-row-${msg.id}`));

    act(() => {
      capturedReactionAddedHandler?.({
        messageId: msg.id,
        channelId: 'ch-1',
        emoji: '👍',
        count: 1,
        reactedByMe: false,
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId(`reaction-pill-${msg.id}-👍`)).toBeInTheDocument();
    });
  });

  it('socket reaction:removed removes a reaction when count reaches 0', async () => {
    const msg = makeMsg({
      reactions: [{ emoji: '👍', count: 1, reactedByMe: false }],
      channelId: 'ch-1',
    });
    mockApi.listMessages.mockResolvedValue({ messages: [msg], nextCursor: null });
    renderWithChannel();

    await waitFor(() => screen.getByTestId(`reaction-pill-${msg.id}-👍`));

    act(() => {
      capturedReactionRemovedHandler?.({
        messageId: msg.id,
        channelId: 'ch-1',
        emoji: '👍',
        count: 0,
        reactedByMe: false,
      });
    });

    await waitFor(() => {
      expect(screen.queryByTestId(`reaction-pill-${msg.id}-👍`)).not.toBeInTheDocument();
    });
  });
});

// ── Edit message UI (wave-13 B-3) ────────────────────────────────────────────
// Tests use MessageList directly with currentUserId so profile loading isn't involved.

describe('MessageList — edit own message UI', () => {
  it('shows inline edit form when Edit button is clicked (own message)', async () => {
    const onEdit = vi.fn();
    const msg = makeMsg({ content: 'Original message', authorId: 'testuser' });
    const msgs: DisplayMessage[] = [{ kind: 'real', ...msg }];
    const user = userEvent.setup();
    render(
      <MessageList
        messages={msgs}
        loadingInitial={false}
        loadingOlder={false}
        errorInitial={false}
        hasOlderMessages={false}
        onLoadOlder={vi.fn()}
        onRetry={vi.fn()}
        onEdit={onEdit}
        currentUserId="testuser"
      />,
    );

    // Edit button in row-actions (accessible even though CSS opacity:0 in tests)
    const editBtn = screen.getByRole('button', { name: /edit your message/i });
    await user.click(editBtn);

    // Inline edit form should appear
    expect(screen.getByTestId('inline-edit-form')).toBeInTheDocument();
    expect(screen.getByTestId('edit-textarea')).toBeInTheDocument();
  });

  it('saves edit via Save button and calls onEdit', async () => {
    const onEdit = vi.fn();
    const msg = makeMsg({ content: 'Original message', authorId: 'testuser' });
    const msgs: DisplayMessage[] = [{ kind: 'real', ...msg }];
    const user = userEvent.setup();
    render(
      <MessageList
        messages={msgs}
        loadingInitial={false}
        loadingOlder={false}
        errorInitial={false}
        hasOlderMessages={false}
        onLoadOlder={vi.fn()}
        onRetry={vi.fn()}
        onEdit={onEdit}
        currentUserId="testuser"
      />,
    );

    await user.click(screen.getByRole('button', { name: /edit your message/i }));
    const ta = screen.getByTestId('edit-textarea') as HTMLTextAreaElement;
    await user.clear(ta);
    await user.type(ta, 'Updated content');
    await user.click(screen.getByTestId('edit-save-btn'));

    expect(onEdit).toHaveBeenCalledWith(msg.id, 'Updated content');
    // Form should dismiss
    expect(screen.queryByTestId('inline-edit-form')).not.toBeInTheDocument();
  });

  it('Esc key cancels inline edit without calling onEdit', async () => {
    const onEdit = vi.fn();
    const msg = makeMsg({ content: 'Keep this', authorId: 'testuser' });
    const msgs: DisplayMessage[] = [{ kind: 'real', ...msg }];
    const user = userEvent.setup();
    render(
      <MessageList
        messages={msgs}
        loadingInitial={false}
        loadingOlder={false}
        errorInitial={false}
        hasOlderMessages={false}
        onLoadOlder={vi.fn()}
        onRetry={vi.fn()}
        onEdit={onEdit}
        currentUserId="testuser"
      />,
    );

    await user.click(screen.getByRole('button', { name: /edit your message/i }));
    expect(screen.getByTestId('inline-edit-form')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByTestId('edit-textarea'), { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByTestId('inline-edit-form')).not.toBeInTheDocument();
    });
    expect(onEdit).not.toHaveBeenCalled();
  });
});

// ── Delete message UI (wave-13 B-3) ──────────────────────────────────────────

describe('MessageList — delete message UI', () => {
  it('shows delete confirm strip on Delete click, then calls onDelete and dismisses', async () => {
    const onDelete = vi.fn();
    const msg = makeMsg({ content: 'Delete me', authorId: 'testuser' });
    const msgs: DisplayMessage[] = [{ kind: 'real', ...msg }];
    const user = userEvent.setup();
    render(
      <MessageList
        messages={msgs}
        loadingInitial={false}
        loadingOlder={false}
        errorInitial={false}
        hasOlderMessages={false}
        onLoadOlder={vi.fn()}
        onRetry={vi.fn()}
        onDelete={onDelete}
        currentUserId="testuser"
      />,
    );

    const deleteBtn = screen.getByRole('button', { name: /delete your message/i });
    await user.click(deleteBtn);

    expect(screen.getByTestId('delete-confirm-btn')).toBeInTheDocument();
    expect(screen.getByText('Delete this message?')).toBeInTheDocument();

    await user.click(screen.getByTestId('delete-confirm-btn'));

    expect(onDelete).toHaveBeenCalledWith(msg.id);
    // Confirm strip dismissed
    expect(screen.queryByTestId('delete-confirm-btn')).not.toBeInTheDocument();
  });

  it('cancel from delete-confirm strip keeps message visible', async () => {
    const onDelete = vi.fn();
    const msg = makeMsg({ content: 'Keep me', authorId: 'testuser' });
    const msgs: DisplayMessage[] = [{ kind: 'real', ...msg }];
    const user = userEvent.setup();
    render(
      <MessageList
        messages={msgs}
        loadingInitial={false}
        loadingOlder={false}
        errorInitial={false}
        hasOlderMessages={false}
        onLoadOlder={vi.fn()}
        onRetry={vi.fn()}
        onDelete={onDelete}
        currentUserId="testuser"
      />,
    );

    await user.click(screen.getByRole('button', { name: /delete your message/i }));
    expect(screen.getByTestId('delete-cancel-btn')).toBeInTheDocument();

    await user.click(screen.getByTestId('delete-cancel-btn'));

    expect(screen.getByText('Keep me')).toBeInTheDocument();
    expect(screen.queryByTestId('delete-confirm-btn')).not.toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });
});

// ── MentionAutocomplete — wave-15 B-4 username threading ─────────────────────
//
// These tests verify the autocomplete→resolver chain:
//   1. handleSelect inserts member.username (not displayName-derived text).
//   2. Members with username=null are excluded from the candidate list.
//   3. Filter matches on username prefix (not displayName stripping).

describe('MentionAutocomplete — username threading (wave-15 B-4)', () => {
  const onSelect = vi.fn();
  const onDismiss = vi.fn();
  const onActiveIdChange = vi.fn();
  const testListboxId = 'test-mention-listbox';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts member.username (not displayName-derived) when a member is selected', async () => {
    mockApi.getServerMembers.mockResolvedValue([
      { userId: 'u1', displayName: 'Mia Wong', avatarUrl: null, username: 'miaw' },
    ]);

    const user = userEvent.setup();
    render(
      <MentionAutocomplete
        serverId="server-1"
        query=""
        onSelect={onSelect}
        onDismiss={onDismiss}
        listboxId={testListboxId}
        onActiveIdChange={onActiveIdChange}
      />,
    );

    // Wait for members to load and the item to appear
    const item = await screen.findByRole('option', { name: /Mia Wong/i });
    await user.click(item);

    expect(onSelect).toHaveBeenCalledWith({ username: 'miaw' });
    // Crucially: NOT 'MiaWong' (the old displayName-strip behaviour)
    expect(onSelect).not.toHaveBeenCalledWith({ username: 'MiaWong' });
  });

  it('excludes members with username=null from the candidate list', async () => {
    mockApi.getServerMembers.mockResolvedValue([
      { userId: 'u1', displayName: 'Has Username', avatarUrl: null, username: 'hasuser' },
      { userId: 'u2', displayName: 'No Username', avatarUrl: null, username: null },
    ]);

    render(
      <MentionAutocomplete
        serverId="server-1"
        query=""
        onSelect={onSelect}
        onDismiss={onDismiss}
        listboxId={testListboxId}
        onActiveIdChange={onActiveIdChange}
      />,
    );

    await screen.findByRole('option', { name: /Has Username/i });
    // The null-username member must not appear
    expect(screen.queryByRole('option', { name: /No Username/i })).not.toBeInTheDocument();
  });

  it('filters candidates by username prefix, not by displayName stripping', async () => {
    // username 'miaw' — should match query 'mia', NOT match if only checking displayName strip
    mockApi.getServerMembers.mockResolvedValue([
      { userId: 'u1', displayName: 'Mia Wong', avatarUrl: null, username: 'miaw' },
      { userId: 'u2', displayName: 'Bobby Tables', avatarUrl: null, username: 'btables' },
    ]);

    render(
      <MentionAutocomplete
        serverId="server-1"
        query="mia"
        onSelect={onSelect}
        onDismiss={onDismiss}
        listboxId={testListboxId}
        onActiveIdChange={onActiveIdChange}
      />,
    );

    // 'miaw' starts with 'mia' → included
    await screen.findByRole('option', { name: /Mia Wong/i });
    // 'btables' does not start with 'mia' and displayName 'Bobby Tables' doesn't include 'mia'
    expect(screen.queryByRole('option', { name: /Bobby Tables/i })).not.toBeInTheDocument();
  });

  it('displays the real username handle in the dropdown subtitle', async () => {
    mockApi.getServerMembers.mockResolvedValue([
      { userId: 'u1', displayName: 'Mia Wong', avatarUrl: null, username: 'miaw' },
    ]);

    render(
      <MentionAutocomplete
        serverId="server-1"
        query=""
        onSelect={onSelect}
        onDismiss={onDismiss}
        listboxId={testListboxId}
        onActiveIdChange={onActiveIdChange}
      />,
    );

    await screen.findByRole('option', { name: /Mia Wong/i });
    // Subtitle should show @miaw (the real username), not @MiaWong
    expect(screen.getByText('@miaw')).toBeInTheDocument();
    expect(screen.queryByText('@MiaWong')).not.toBeInTheDocument();
  });
});

// ── thread:reply:deleted — affordance update (wave-18 B-6) ───────────────────
// Tests that the thread:reply:deleted socket event correctly updates the parent
// message's replyCount/lastReplyAt in the channel message list so the affordance
// chip hides when replyCount reaches 0.

describe('MainColumn — socket thread:reply:deleted affordance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedMessageNewHandler = null;
    capturedMessageUpdatedHandler = null;
    capturedMessageDeletedHandler = null;
    capturedReactionAddedHandler = null;
    capturedReactionRemovedHandler = null;
    capturedThreadReplyDeletedHandler = null;
  });

  function renderWithChannel(channelId = 'ch-1', channelName = 'questions') {
    const ctx = makeCtx({ selectedChannelId: channelId, selectedChannelName: channelName });
    return render(
      <ServerContext.Provider value={ctx}>
        <MainColumn />
      </ServerContext.Provider>,
    );
  }

  it('thread:reply:deleted hides affordance chip when replyCount reaches 0', async () => {
    // A parent message with one reply — affordance chip visible
    const parent = makeMsg({
      content: 'Parent message',
      channelId: 'ch-1',
      replyCount: 1,
      lastReplyAt: new Date().toISOString(),
    });
    mockApi.listMessages.mockResolvedValue({ messages: [parent], nextCursor: null });
    renderWithChannel();

    // Wait for the message to appear
    await waitFor(() => screen.getByText('Parent message'));

    // Affordance chip must be visible (replyCount=1)
    expect(screen.getByTestId(`thread-affordance-${parent.id}`)).toBeInTheDocument();

    // Fire the delete event — replyCount drops to 0
    act(() => {
      capturedThreadReplyDeletedHandler?.({
        parentId: parent.id,
        channelId: 'ch-1',
        replyId: 'reply-1',
        replyCount: 0,
        lastReplyAt: null,
      });
    });

    // Affordance chip must now be hidden (replyCount=0)
    await waitFor(() => {
      expect(screen.queryByTestId(`thread-affordance-${parent.id}`)).not.toBeInTheDocument();
    });
  });

  it('thread:reply:deleted updates affordance chip count when replies remain', async () => {
    const parent = makeMsg({
      content: 'Parent message',
      channelId: 'ch-1',
      replyCount: 3,
      lastReplyAt: new Date().toISOString(),
    });
    mockApi.listMessages.mockResolvedValue({ messages: [parent], nextCursor: null });
    renderWithChannel();

    await waitFor(() => screen.getByText('Parent message'));

    // Chip shows "3 replies"
    expect(screen.getByTestId(`thread-affordance-${parent.id}`)).toBeInTheDocument();
    expect(screen.getByText('3 replies')).toBeInTheDocument();

    // Delete one reply — replyCount drops to 2
    act(() => {
      capturedThreadReplyDeletedHandler?.({
        parentId: parent.id,
        channelId: 'ch-1',
        replyId: 'reply-x',
        replyCount: 2,
        lastReplyAt: parent.lastReplyAt ?? null,
      });
    });

    // Chip now shows "2 replies"
    await waitFor(() => {
      expect(screen.getByTestId(`thread-affordance-${parent.id}`)).toBeInTheDocument();
      expect(screen.getByText('2 replies')).toBeInTheDocument();
    });
  });

  it('thread:reply:deleted for a different channel is ignored', async () => {
    const parent = makeMsg({
      content: 'Parent message',
      channelId: 'ch-1',
      replyCount: 1,
      lastReplyAt: new Date().toISOString(),
    });
    mockApi.listMessages.mockResolvedValue({ messages: [parent], nextCursor: null });
    renderWithChannel('ch-1');

    await waitFor(() => screen.getByText('Parent message'));

    // Fire event for a different channel
    act(() => {
      capturedThreadReplyDeletedHandler?.({
        parentId: parent.id,
        channelId: 'ch-OTHER',
        replyId: 'reply-1',
        replyCount: 0,
        lastReplyAt: null,
      });
    });

    // Affordance chip must remain (event was for a different channel)
    await waitFor(() => {
      expect(screen.getByTestId(`thread-affordance-${parent.id}`)).toBeInTheDocument();
    });
  });
});

// ── renderBodyWithMentions — shared-slug tokenizer parity (wave-25 B-3) ──────

describe('MessageList — renderBodyWithMentions shared-slug parity (wave-25)', () => {
  function renderMsg(content: string, mentions: { userId: string; username: string }[]) {
    const msg = makeMsg({ content, mentions });
    const msgs: DisplayMessage[] = [{ kind: 'real', ...msg }];
    return render(
      <MessageList
        messages={msgs}
        loadingInitial={false}
        loadingOlder={false}
        errorInitial={false}
        hasOlderMessages={false}
        onLoadOlder={vi.fn()}
        onRetry={vi.fn()}
        viewerUsername={null}
        channelName="general"
      />,
    );
  }

  it('AC2: @bob.dev where bob is resolved → renders bob pill + trailing .dev text', () => {
    renderMsg('hey @bob.dev check this', [{ userId: 'u1', username: 'bob' }]);
    // MentionPill renders aria-label="mention: @bob"
    expect(screen.getByLabelText('mention: @bob')).toBeInTheDocument();
    // The trailing punctuation renders as plain text
    expect(screen.getByText('.dev', { exact: false })).toBeInTheDocument();
  });

  it('AC2: @alice resolved with no trailing punctuation → pill only, no stray text', () => {
    renderMsg('hello @alice how are you', [{ userId: 'u2', username: 'alice' }]);
    expect(screen.getByLabelText('mention: @alice')).toBeInTheDocument();
  });

  it('AC3: @nobody NOT in mentionMap → plain text, no pill rendered', () => {
    renderMsg('ping @nobody here', []);
    // No aria-label with "mention:" prefix should exist
    expect(screen.queryByLabelText(/mention:/)).not.toBeInTheDocument();
    // The raw token text is present as plain text
    expect(screen.getByText('@nobody', { exact: false })).toBeInTheDocument();
  });

  it('AC3: @bob.dev where bob is NOT resolved → plain text, no pill (unresolved superset)', () => {
    renderMsg('check @bob.dev please', []);
    expect(screen.queryByLabelText(/mention:/)).not.toBeInTheDocument();
    // Token rendered verbatim as plain text
    expect(screen.getByText('@bob.dev', { exact: false })).toBeInTheDocument();
  });

  it('two resolved mentions in one body → two pills both rendered', () => {
    renderMsg('@bob and @alice are here', [
      { userId: 'u1', username: 'bob' },
      { userId: 'u2', username: 'alice' },
    ]);
    expect(screen.getByLabelText('mention: @bob')).toBeInTheDocument();
    expect(screen.getByLabelText('mention: @alice')).toBeInTheDocument();
  });
});
