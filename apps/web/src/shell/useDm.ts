/**
 * useDm — data + socket hook for the DM surface.
 *
 * Responsibilities:
 * - Fetch the conversation list via GET /dm/conversations.
 * - Fetch messages for the open conversation (lazy on selection).
 * - Provide sendDmMessage() with optimistic pending → confirmed/failed state.
 * - Subscribe to `dm:message` socket event for real-time delivery.
 * - Dedup inbound messages by id so sender's own optimistic row is reconciled
 *   without doubling.
 * - Offline send: enqueues via the generalized outbox (target: {kind:'dm', ...}).
 * - On reconnect / window 'online': drain the outbox.
 * - retryDmMessage() for failed optimistic rows.
 *
 * wave-46 M8 task 1ceffdc9 (UI) + d8264800 (outbox generalization).
 */

import type { DmConversation, DmMessage } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import { db } from '../features/sync/db';
import { drain, enqueue, loadPending, retryOutboxItem } from '../features/sync/outbox';
import type { OutboxTarget } from '../features/sync/types';
import { getMessagingSocket, onDmMessage } from './messagingSocket';

// ---------------------------------------------------------------------------
// Optimistic DM message state
// ---------------------------------------------------------------------------

export type OptimisticDmMessage = {
  /** Client-generated key — used to reconcile with server-confirmed message. */
  idempotencyKey: string;
  conversationId: string;
  content: string;
  authorDisplay: string;
  state: 'pending' | 'failed';
  /** ISO timestamp created at enqueue time; used for stable ordering. */
  createdAt: string;
};

export type DisplayDmMessage =
  | ({ kind: 'real' } & DmMessage)
  | ({ kind: 'optimistic' } & OptimisticDmMessage);

// ---------------------------------------------------------------------------
// Hook result type
// ---------------------------------------------------------------------------

export type UseDmResult = {
  // ── Conversation list ──────────────────────────────────────────────────────
  conversations: DmConversation[];
  conversationsLoading: boolean;
  conversationsError: boolean;
  reloadConversations: () => void;

  // ── Open thread ────────────────────────────────────────────────────────────
  openConversationId: string | null;
  selectConversation: (id: string) => void;
  messages: DisplayDmMessage[];
  messagesLoading: boolean;
  messagesError: boolean;
  hasOlderMessages: boolean;
  loadOlderMessages: () => void;

  // ── Send / retry ──────────────────────────────────────────────────────────
  sendDmMessage: (content: string) => void;
  retryDmMessage: (idempotencyKey: string) => void;

  // ── Start-DM picker ────────────────────────────────────────────────────────
  createConversation: (
    participantIds: string[],
  ) => Promise<{ ok: true; conversation: DmConversation } | { ok: false; error: string }>;
};

// ---------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------

export function useDm(currentUserId: string | null, currentUserDisplay: string): UseDmResult {
  // ── Conversations ──────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<DmConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState(false);

  // ── Open thread ────────────────────────────────────────────────────────────
  const [openConversationId, setOpenConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayDmMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);

  // Ref to current openConversationId for stable socket callback
  const openConvIdRef = useRef<string | null>(null);
  openConvIdRef.current = openConversationId;

  // ── Fetch conversation list ────────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    setConversationsLoading(true);
    setConversationsError(false);
    try {
      const res = await api.listDmConversations();
      setConversations(res.conversations);
    } catch {
      setConversationsError(true);
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  // ── Fetch messages for open conversation ──────────────────────────────────

  const fetchMessages = useCallback(async (conversationId: string, cursor?: string) => {
    if (!cursor) {
      setMessagesLoading(true);
      setMessagesError(false);
      setMessages([]);
    }
    try {
      const res = await api.listDmMessages(conversationId, cursor);
      const realMsgs: DisplayDmMessage[] = res.messages.map((m) => ({
        kind: 'real' as const,
        ...m,
      }));
      if (cursor) {
        // Prepend older messages
        setMessages((prev) => [...realMsgs, ...prev]);
      } else {
        setMessages(realMsgs);
      }
      setNextCursor(res.nextCursor);
      setHasOlderMessages(res.nextCursor !== null);
    } catch {
      if (!cursor) setMessagesError(true);
    } finally {
      if (!cursor) setMessagesLoading(false);
    }
  }, []);

  // Load pending outbox items for cold-start hydration on mount.
  // currentUserDisplay is intentionally excluded: this effect is a one-shot
  // cold-start hydration that reads pre-existing outbox rows from IndexedDB. The
  // display name captured here is stable enough for the initial render; subsequent
  // changes to the display name do not need to re-hydrate the outbox.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional cold-start only — see comment above
  useEffect(() => {
    if (!db) return;
    loadPending(db).then((pending) => {
      const dmPending = pending.filter((item) => item.target?.kind === 'dm');
      if (dmPending.length === 0) return;

      setMessages((prev) => {
        const existing = new Set(
          prev.map((m) => (m.kind === 'optimistic' ? m.idempotencyKey : '')),
        );
        const toAdd: DisplayDmMessage[] = dmPending
          .filter((item) => !existing.has(item.idempotencyKey))
          .map((item) => ({
            kind: 'optimistic' as const,
            idempotencyKey: item.idempotencyKey,
            conversationId:
              item.target?.kind === 'dm'
                ? (item.target as { kind: 'dm'; conversationId: string }).conversationId
                : '',
            content: item.content,
            authorDisplay: currentUserDisplay,
            state: item.state,
            createdAt: item.createdAt,
          }));
        return [...prev, ...toAdd];
      });
    });
  }, []);

  const selectConversation = useCallback(
    (id: string) => {
      setOpenConversationId(id);
      void fetchMessages(id);
    },
    [fetchMessages],
  );

  const loadOlderMessages = useCallback(() => {
    if (!openConversationId || !nextCursor) return;
    void fetchMessages(openConversationId, nextCursor);
  }, [openConversationId, nextCursor, fetchMessages]);

  // ── Real-time: subscribe to dm:message ────────────────────────────────────

  useEffect(() => {
    const unsub = onDmMessage((event) => {
      const { conversationId, message } = event;

      // If this is the open conversation, append to thread (dedup by id).
      if (openConvIdRef.current === conversationId) {
        setMessages((prev) => {
          // Reconcile: if an optimistic row with matching idempotencyKey exists,
          // the sender's own confirmation arrives via REST response (not socket).
          // For OTHER participants the message is new — dedup by id.
          const alreadyPresent = prev.some((m) => m.kind === 'real' && m.id === message.id);
          if (alreadyPresent) return prev;
          return [...prev, { kind: 'real' as const, ...message }];
        });
      }

      // Always update the conversation list: move conversation to top with new
      // lastMessage preview, preserving the rest of the list order.
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversationId);
        if (idx === -1) {
          // Unknown conversation — re-fetch the list to pick it up.
          void fetchConversations();
          return prev;
        }
        const updated: DmConversation = {
          ...(prev[idx] as DmConversation),
          lastMessage: {
            content: message.content,
            createdAt: message.createdAt,
            authorId: message.authorId,
          },
        };
        const rest = prev.filter((_, i) => i !== idx);
        return [updated, ...rest];
      });
    });

    return unsub;
  }, [fetchConversations]);

  // ── Drain outbox on reconnect / online ────────────────────────────────────

  useEffect(() => {
    if (!db || !currentUserId) return;

    const makeSendFn =
      () => (target: OutboxTarget, body: { content: string; idempotencyKey: string }) => {
        if (target.kind === 'dm') {
          return api.sendDmMessage(target.conversationId, body) as Promise<{
            id: string;
            [key: string]: unknown;
          }>;
        }
        return api.sendMessage(target.channelId, body) as Promise<{
          id: string;
          [key: string]: unknown;
        }>;
      };

    const doDrain = () => {
      if (!db) return;
      void drain(
        db,
        makeSendFn(),
        // onDelivered: reconcile optimistic row with confirmed message
        (idempotencyKey, confirmedId) => {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.kind !== 'optimistic' || m.idempotencyKey !== idempotencyKey) return m;
              // Replace optimistic with confirmed real message
              const real: DisplayDmMessage = {
                kind: 'real',
                id: confirmedId,
                conversationId: m.conversationId,
                authorId: currentUserId,
                content: m.content,
                createdAt: m.createdAt,
              };
              return real;
            }),
          );
        },
        // onFailed: flip to failed state
        (idempotencyKey) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.kind === 'optimistic' && m.idempotencyKey === idempotencyKey
                ? { ...m, state: 'failed' as const }
                : m,
            ),
          );
        },
      );
    };

    const socket = getMessagingSocket();
    socket.on('connect', doDrain);
    window.addEventListener('online', doDrain);

    return () => {
      socket.off('connect', doDrain);
      window.removeEventListener('online', doDrain);
    };
  }, [currentUserId]);

  // ── Send a DM message ──────────────────────────────────────────────────────

  const sendDmMessage = useCallback(
    (content: string) => {
      if (!openConversationId || !currentUserId || !db) return;

      const now = new Date().toISOString();
      const target: OutboxTarget = { kind: 'dm', conversationId: openConversationId };

      // Enqueue in outbox first (durable), then attempt network POST.
      enqueue(db, target, content).then(({ idempotencyKey }) => {
        // Append optimistic row immediately.
        const optimistic: DisplayDmMessage = {
          kind: 'optimistic',
          idempotencyKey,
          conversationId: openConversationId,
          content,
          authorDisplay: currentUserDisplay,
          state: 'pending',
          createdAt: now,
        };
        setMessages((prev) => [...prev, optimistic]);

        // Attempt immediate network send.
        api
          .sendDmMessage(openConversationId, { content, idempotencyKey })
          .then((confirmed) => {
            // Remove from outbox
            if (db) {
              db.outbox
                .where('idempotencyKey')
                .equals(idempotencyKey)
                .delete()
                .catch(() => {});
            }
            // Reconcile optimistic → real
            setMessages((prev) =>
              prev.map((m) => {
                if (m.kind !== 'optimistic' || m.idempotencyKey !== idempotencyKey) return m;
                return {
                  kind: 'real' as const,
                  id: confirmed.id,
                  conversationId: openConversationId,
                  authorId: currentUserId,
                  content: confirmed.content,
                  createdAt: confirmed.createdAt,
                };
              }),
            );
            // Update conversation list preview
            setConversations((prev) => {
              const idx = prev.findIndex((c) => c.id === openConversationId);
              if (idx === -1) return prev;
              const updated: DmConversation = {
                ...(prev[idx] as DmConversation),
                lastMessage: {
                  content: confirmed.content,
                  createdAt: confirmed.createdAt,
                  authorId: currentUserId,
                },
              };
              return [updated, ...prev.filter((_, i) => i !== idx)];
            });
          })
          .catch(() => {
            // Network failed — leave the outbox row; drain will retry.
            // Optimistic row stays as 'pending' (outbox holds it).
          });
      });
    },
    [openConversationId, currentUserId, currentUserDisplay],
  );

  // ── Retry a failed optimistic message ─────────────────────────────────────

  const retryDmMessage = useCallback(
    (idempotencyKey: string) => {
      if (!db) return;
      retryOutboxItem(db, idempotencyKey)
        .then(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.kind === 'optimistic' && m.idempotencyKey === idempotencyKey
                ? { ...m, state: 'pending' as const }
                : m,
            ),
          );
          // Trigger immediate drain
          if (!db || !currentUserId) return;
          const sendFn = (
            target: OutboxTarget,
            body: { content: string; idempotencyKey: string },
          ) => {
            if (target.kind === 'dm') {
              return api.sendDmMessage(target.conversationId, body) as Promise<{
                id: string;
                [key: string]: unknown;
              }>;
            }
            return api.sendMessage(target.channelId, body) as Promise<{
              id: string;
              [key: string]: unknown;
            }>;
          };
          void drain(
            db,
            sendFn,
            (key, confirmedId) => {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.kind !== 'optimistic' || m.idempotencyKey !== key) return m;
                  return {
                    kind: 'real' as const,
                    id: confirmedId,
                    conversationId: m.conversationId,
                    authorId: currentUserId ?? '',
                    content: m.content,
                    createdAt: m.createdAt,
                  };
                }),
              );
            },
            (key) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.kind === 'optimistic' && m.idempotencyKey === key
                    ? { ...m, state: 'failed' as const }
                    : m,
                ),
              );
            },
          );
        })
        .catch(() => {});
    },
    [currentUserId],
  );

  // ── Create a new conversation ──────────────────────────────────────────────

  const createConversation = useCallback(
    async (
      participantIds: string[],
    ): Promise<{ ok: true; conversation: DmConversation } | { ok: false; error: string }> => {
      try {
        const conversation = await api.createDmConversation({ participantIds });
        // Prepend to list
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === conversation.id);
          return exists ? prev : [conversation, ...prev];
        });
        return { ok: true, conversation };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create conversation';
        // Surface 403 who_can_dm policy message more clearly.
        const friendly =
          msg.includes('403') || msg.toLowerCase().includes('policy')
            ? 'This person has restricted who can message them.'
            : msg.includes('400')
              ? 'Invalid participants or too many recipients (max 10).'
              : 'Could not start the conversation. Please try again.';
        return { ok: false, error: friendly };
      }
    },
    [],
  );

  return {
    conversations,
    conversationsLoading,
    conversationsError,
    reloadConversations: fetchConversations,

    openConversationId,
    selectConversation,
    messages,
    messagesLoading,
    messagesError,
    hasOlderMessages,
    loadOlderMessages,

    sendDmMessage,
    retryDmMessage,

    createConversation,
  };
}
