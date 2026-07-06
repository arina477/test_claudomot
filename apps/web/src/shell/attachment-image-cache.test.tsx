/**
 * attachment-image-cache.test.tsx — offline blob cache for message image attachments.
 *
 * wave-64 B-3 task 83aa28e4
 *
 * Coverage:
 * 1. Online: presigned URL rendered immediately; putCachedAttachmentBlob called
 *    write-through after successful fetch.
 * 2. Offline (fetch reject): renders from cached object-URL when
 *    getCachedAttachmentBlob returns a blob; URL.createObjectURL called.
 * 3. Never-cached offline: renders placeholder (broken-image chip / unavailable state).
 * 4. Object-URL REVOKE called on unmount (the key hazard).
 * 5. Object-URL REVOKE called on src change (attachment swap).
 * 6. Non-image attachment: FileChip rendered, hook does not affect it.
 */

import type { AttachmentRef } from '@studyhall/shared';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Cache mock ────────────────────────────────────────────────────────────────

const mockPutCachedAttachmentBlob = vi.fn().mockResolvedValue(undefined);
const mockGetCachedAttachmentBlob = vi.fn();

vi.mock('../features/sync/cache', () => ({
  putCachedAttachmentBlob: (...args: unknown[]) => mockPutCachedAttachmentBlob(...args),
  getCachedAttachmentBlob: (...args: unknown[]) => mockGetCachedAttachmentBlob(...args),
  // stubs for all other cache functions
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
}));

// ── DB mock ───────────────────────────────────────────────────────────────────

vi.mock('../features/sync/db', () => ({
  db: {
    cachedAttachmentBlobs: {
      get: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

// ── MessageList import (after mocks) ─────────────────────────────────────────

import { MessageList } from './MessageList';
import type { DisplayMessage } from './MessageList';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeImageMsg(attachmentOverrides: Partial<AttachmentRef> = {}): DisplayMessage {
  return {
    kind: 'real',
    id: 'msg-1',
    channelId: 'ch-1',
    authorId: 'user-abc',
    content: 'Look at this',
    createdAt: new Date().toISOString(),
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    reactions: [],
    mentions: [],
    idempotencyKey: null,
    attachments: [
      {
        id: 'att-img-1',
        filename: 'photo.png',
        contentType: 'image/png',
        sizeBytes: 50000,
        url: 'https://example.com/photo.png',
        ...attachmentOverrides,
      },
    ],
  };
}

function renderMessageList(messages: DisplayMessage[]) {
  return render(
    <MessageList
      messages={messages}
      loadingInitial={false}
      loadingOlder={false}
      errorInitial={false}
      hasOlderMessages={false}
      onLoadOlder={vi.fn()}
      onRetry={vi.fn()}
    />,
  );
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

let originalFetch: typeof fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  mockPutCachedAttachmentBlob.mockResolvedValue(undefined);
  mockGetCachedAttachmentBlob.mockResolvedValue(undefined);

  // Spy on URL.createObjectURL / URL.revokeObjectURL — spied in beforeEach so
  // vi.restoreAllMocks() in afterEach tears them down cleanly.
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-object-url');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useCachedAttachmentImage — online write-through', () => {
  it('renders the presigned URL inline for an image attachment (online)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['img-data'], { type: 'image/png' })),
    } as Response);

    renderMessageList([makeImageMsg()]);

    // Inline img uses the presigned URL
    const img = document.querySelector('img[src="https://example.com/photo.png"]');
    expect(img).toBeTruthy();
  });

  it('calls putCachedAttachmentBlob with the fetched blob (write-through)', async () => {
    const fakeBlob = new Blob(['img-data'], { type: 'image/png' });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(fakeBlob),
    } as Response);

    renderMessageList([makeImageMsg()]);

    await waitFor(() => {
      expect(mockPutCachedAttachmentBlob).toHaveBeenCalledWith(
        expect.anything(), // db singleton
        expect.objectContaining({
          id: 'att-img-1',
          blob: fakeBlob,
          contentType: 'image/png',
          filename: 'photo.png',
          sizeBytes: 50000,
        }),
      );
    });
  });
});

describe('useCachedAttachmentImage — offline from cache', () => {
  it('renders from cached object-URL when fetch fails and blob is in cache', async () => {
    const cachedBlob = new Blob(['cached-img'], { type: 'image/png' });
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    mockGetCachedAttachmentBlob.mockResolvedValue({
      id: 'att-img-1',
      blob: cachedBlob,
      contentType: 'image/png',
      filename: 'photo.png',
      sizeBytes: 50000,
      cachedAt: '2026-07-01T00:00:00.000Z',
    });

    renderMessageList([makeImageMsg()]);

    // After fetch fails, the hook reads from cache and creates an object URL.
    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalledWith(cachedBlob);
    });

    // The img src should now be the object URL.
    const img = document.querySelector('img[src="blob:test-object-url"]');
    expect(img).toBeTruthy();
  });
});

describe('useCachedAttachmentImage — never-cached offline', () => {
  it('renders a broken-image placeholder when fetch fails and no cached blob exists', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    mockGetCachedAttachmentBlob.mockResolvedValue(undefined);

    renderMessageList([makeImageMsg()]);

    // The placeholder chip shows "Preview unavailable" text.
    await waitFor(() => {
      expect(screen.getByText(/Preview unavailable/i)).toBeInTheDocument();
    });

    // No object URL created (nothing to revoke either).
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});

describe('useCachedAttachmentImage — object-URL lifecycle', () => {
  it('revokes the object-URL on unmount', async () => {
    const cachedBlob = new Blob(['cached-img'], { type: 'image/png' });
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    mockGetCachedAttachmentBlob.mockResolvedValue({
      id: 'att-img-1',
      blob: cachedBlob,
      contentType: 'image/png',
      filename: 'photo.png',
      sizeBytes: 50000,
      cachedAt: '2026-07-01T00:00:00.000Z',
    });

    const { unmount } = renderMessageList([makeImageMsg()]);

    // Wait for the object URL to be created.
    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalledWith(cachedBlob);
    });

    // Unmount triggers cleanup — revoke must fire.
    act(() => {
      unmount();
    });

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-object-url');
  });

  it('revokes the previous object-URL when attachment id changes (src change)', async () => {
    const cachedBlob1 = new Blob(['cached-1'], { type: 'image/png' });
    const cachedBlob2 = new Blob(['cached-2'], { type: 'image/png' });

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    // First render: attachment 1 → cached blob 1
    mockGetCachedAttachmentBlob
      .mockResolvedValueOnce({
        id: 'att-img-1',
        blob: cachedBlob1,
        contentType: 'image/png',
        filename: 'photo1.png',
        sizeBytes: 50000,
        cachedAt: '2026-07-01T00:00:00.000Z',
      })
      // Second call (after attachment swap): attachment 2 → cached blob 2
      .mockResolvedValueOnce({
        id: 'att-img-2',
        blob: cachedBlob2,
        contentType: 'image/png',
        filename: 'photo2.png',
        sizeBytes: 60000,
        cachedAt: '2026-07-01T00:00:00.000Z',
      });

    // Override createObjectURL to return sequentially different URLs.
    vi.spyOn(URL, 'createObjectURL')
      .mockReturnValueOnce('blob:object-url-1')
      .mockReturnValueOnce('blob:object-url-2');

    const { rerender } = renderMessageList([
      makeImageMsg({
        id: 'att-img-1',
        filename: 'photo1.png',
        url: 'https://example.com/photo1.png',
      }),
    ]);

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalledWith(cachedBlob1);
    });

    // Swap the attachment — effect re-runs with new id/url.
    await act(async () => {
      rerender(
        <MessageList
          messages={[
            makeImageMsg({
              id: 'att-img-2',
              filename: 'photo2.png',
              url: 'https://example.com/photo2.png',
              sizeBytes: 60000,
            }),
          ]}
          loadingInitial={false}
          loadingOlder={false}
          errorInitial={false}
          hasOlderMessages={false}
          onLoadOlder={vi.fn()}
          onRetry={vi.fn()}
        />,
      );
    });

    await waitFor(() => {
      // Previous object URL must have been revoked.
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:object-url-1');
    });
  });
});

describe('useCachedAttachmentImage — non-image passthrough', () => {
  it('renders FileChip (not an img) for a non-image attachment', async () => {
    // Hook runs for all attachments; the fetch will fire even for a PDF.
    // Return a successful response so the hook does not throw.
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['pdf-data'], { type: 'application/pdf' })),
    } as Response);

    const msg: DisplayMessage = {
      kind: 'real',
      id: 'msg-2',
      channelId: 'ch-1',
      authorId: 'user-abc',
      content: 'Here is a PDF',
      createdAt: new Date().toISOString(),
      isEdited: false,
      editedAt: null,
      isDeleted: false,
      reactions: [],
      mentions: [],
      idempotencyKey: null,
      attachments: [
        {
          id: 'att-pdf-1',
          filename: 'notes.pdf',
          contentType: 'application/pdf',
          sizeBytes: 123456,
          url: 'https://example.com/notes.pdf',
        },
      ],
    };

    renderMessageList([msg]);

    // FileChip renders the filename; no inline img element.
    expect(screen.getByText('notes.pdf')).toBeInTheDocument();
    const img = document.querySelector('img');
    expect(img).toBeNull();

    // It renders a download link chip, not an image button.
    const chip = document.querySelector('a[download]') as HTMLAnchorElement;
    expect(chip).toBeTruthy();
    expect(chip.href).toContain('https://example.com/notes.pdf');
  });
});
