/**
 * useMessagesWithRetry — data + socket hook for a channel's message list.
 *
 * Responsibilities:
 * - Fetch initial messages via GET /channels/:channelId/messages.
 * - Provide sendMessage() with optimistic pending → confirmed/failed state.
 * - Subscribe to Socket.IO `message:new` for real-time delivery.
 * - Dedup by id so sender's own confirmed message isn't doubled.
 * - On channel switch: leave old room, join new room, reset state.
 * - Provide retryMessage() for failed optimistic messages.
 *
 * Wave-13 additions:
 * - editMessage(messageId, content) — PATCH + optimistic field update.
 * - deleteMessage(messageId) — DELETE + mark isDeleted (tombstone).
 * - toggleReaction(messageId, emoji) — POST toggle + optimistic update.
 * - Socket handlers for message:updated / message:deleted / reaction:added / reaction:removed.
 *   Own optimistic actions are reconciled against incoming events to avoid double-flip.
 */

import type { MessageResponse } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import type { DisplayMessage, OptimisticMessage } from './MessageList';
import {
  applyReactionEvent,
  joinChannel,
  leaveChannel,
  onMessageDeleted,
  onMessageNew,
  onMessageUpdated,
  onReactionAdded,
  onReactionRemoved,
} from './messagingSocket';

type UseMessagesResult = {
  messages: DisplayMessage[];
  loadingInitial: boolean;
  loadingOlder: boolean;
  errorInitial: boolean;
  hasOlderMessages: boolean;
  loadOlder: () => void;
  sendMessage: (content: string) => void;
  retryMessage: (idempotencyKey: string) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
};

export function useMessagesWithRetry(channelId: string | null): UseMessagesResult {
  const [realMessages, setRealMessages] = useState<MessageResponse[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [errorInitial, setErrorInitial] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const subscribedChannelRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // Track in-flight optimistic reaction toggles to deduplicate socket echoes.
  // Key: `${messageId}:${emoji}`, value: true while the POST is in-flight.
  const inflightReactionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Fetch initial + socket room join on channel change ─────────────────────
  useEffect(() => {
    if (!channelId) {
      setRealMessages([]);
      setOptimisticMessages([]);
      setLoadingInitial(false);
      setErrorInitial(false);
      setNextCursor(null);
      return;
    }

    const prev = subscribedChannelRef.current;
    if (prev && prev !== channelId) {
      leaveChannel(prev);
    }
    joinChannel(channelId);
    subscribedChannelRef.current = channelId;

    setRealMessages([]);
    setOptimisticMessages([]);
    setErrorInitial(false);
    setNextCursor(null);
    setLoadingInitial(true);

    api
      .listMessages(channelId)
      .then((result) => {
        if (!mountedRef.current) return;
        setRealMessages(result.messages);
        setNextCursor(result.nextCursor ?? null);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setErrorInitial(true);
      })
      .finally(() => {
        if (!mountedRef.current) return;
        setLoadingInitial(false);
      });
  }, [channelId]);

  // ── Socket listener — real-time message:new ────────────────────────────────
  useEffect(() => {
    if (!channelId) return;
    const unsub = onMessageNew((msg: MessageResponse) => {
      if (!mountedRef.current) return;
      if (msg.channelId !== channelId) return;
      setRealMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return unsub;
  }, [channelId]);

  // ── Socket listener — message:updated ─────────────────────────────────────
  useEffect(() => {
    if (!channelId) return;
    const unsub = onMessageUpdated((msg: MessageResponse) => {
      if (!mountedRef.current) return;
      if (msg.channelId !== channelId) return;
      setRealMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    });
    return unsub;
  }, [channelId]);

  // ── Socket listener — message:deleted ─────────────────────────────────────
  useEffect(() => {
    if (!channelId) return;
    const unsub = onMessageDeleted((payload) => {
      if (!mountedRef.current) return;
      if (payload.channelId !== channelId) return;
      setRealMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId ? { ...m, isDeleted: true, content: null, reactions: [] } : m,
        ),
      );
    });
    return unsub;
  }, [channelId]);

  // ── Socket listener — reaction:added ──────────────────────────────────────
  useEffect(() => {
    if (!channelId) return;
    const unsub = onReactionAdded((payload) => {
      if (!mountedRef.current) return;
      if (payload.channelId !== channelId) return;
      // Skip if this is an echo of our own optimistic toggle
      const key = `${payload.messageId}:${payload.emoji}`;
      if (inflightReactionsRef.current.has(key)) return;
      setRealMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId
            ? { ...m, reactions: applyReactionEvent(m.reactions, payload) }
            : m,
        ),
      );
    });
    return unsub;
  }, [channelId]);

  // ── Socket listener — reaction:removed ────────────────────────────────────
  useEffect(() => {
    if (!channelId) return;
    const unsub = onReactionRemoved((payload) => {
      if (!mountedRef.current) return;
      if (payload.channelId !== channelId) return;
      const key = `${payload.messageId}:${payload.emoji}`;
      if (inflightReactionsRef.current.has(key)) return;
      setRealMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId
            ? { ...m, reactions: applyReactionEvent(m.reactions, payload) }
            : m,
        ),
      );
    });
    return unsub;
  }, [channelId]);

  // ── Load older (cursor pagination) ────────────────────────────────────────
  const loadOlder = useCallback(() => {
    if (!channelId || !nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    api
      .listMessages(channelId, nextCursor)
      .then((result) => {
        if (!mountedRef.current) return;
        setRealMessages((prev) => [...result.messages, ...prev]);
        setNextCursor(result.nextCursor ?? null);
      })
      .catch(() => {
        /* silently ignore — user can scroll up and retry */
      })
      .finally(() => {
        if (!mountedRef.current) return;
        setLoadingOlder(false);
      });
  }, [channelId, nextCursor, loadingOlder]);

  // ── Optimistic send ────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    (content: string) => {
      if (!channelId) return;
      const idempotencyKey = crypto.randomUUID();
      setOptimisticMessages((prev) => [
        ...prev,
        { idempotencyKey, content, authorDisplay: 'You', state: 'pending' },
      ]);
      api
        .sendMessage(channelId, { content, idempotencyKey })
        .then((confirmed) => {
          if (!mountedRef.current) return;
          setRealMessages((prev) => {
            if (prev.some((m) => m.id === confirmed.id)) return prev;
            return [...prev, confirmed];
          });
          setOptimisticMessages((prev) => prev.filter((m) => m.idempotencyKey !== idempotencyKey));
        })
        .catch(() => {
          if (!mountedRef.current) return;
          setOptimisticMessages((prev) =>
            prev.map((m) =>
              m.idempotencyKey === idempotencyKey ? { ...m, state: 'failed' as const } : m,
            ),
          );
        });
    },
    [channelId],
  );

  // ── Retry a failed optimistic message ─────────────────────────────────────
  const retryMessage = useCallback(
    (idempotencyKey: string) => {
      if (!channelId) return;
      const failed = optimisticMessages.find((m) => m.idempotencyKey === idempotencyKey);
      if (!failed) return;
      setOptimisticMessages((prev) =>
        prev.map((m) =>
          m.idempotencyKey === idempotencyKey ? { ...m, state: 'pending' as const } : m,
        ),
      );
      api
        .sendMessage(channelId, { content: failed.content, idempotencyKey })
        .then((confirmed) => {
          if (!mountedRef.current) return;
          setRealMessages((prev) => {
            if (prev.some((m) => m.id === confirmed.id)) return prev;
            return [...prev, confirmed];
          });
          setOptimisticMessages((prev) => prev.filter((m) => m.idempotencyKey !== idempotencyKey));
        })
        .catch(() => {
          if (!mountedRef.current) return;
          setOptimisticMessages((prev) =>
            prev.map((m) =>
              m.idempotencyKey === idempotencyKey ? { ...m, state: 'failed' as const } : m,
            ),
          );
        });
    },
    [channelId, optimisticMessages],
  );

  // ── Edit a message ─────────────────────────────────────────────────────────
  // Optimistic: immediately reflect the edit in UI; server response reconciles.
  const editMessage = useCallback(
    (messageId: string, content: string) => {
      if (!channelId) return;
      // Optimistic update — mark isEdited locally
      setRealMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content, isEdited: true, editedAt: new Date().toISOString() }
            : m,
        ),
      );
      api
        .editMessage(channelId, messageId, { content })
        .then((updated) => {
          if (!mountedRef.current) return;
          // Reconcile with server response (authoritative timestamps)
          setRealMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        })
        .catch(() => {
          // On failure we leave the optimistic state (the socket message:updated
          // will correct it if the server actually succeeded, or the user can
          // reload; edit failures are uncommon and non-destructive).
        });
    },
    [channelId],
  );

  // ── Delete a message ───────────────────────────────────────────────────────
  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!channelId) return;
      // Optimistic tombstone
      setRealMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: null, reactions: [] } : m,
        ),
      );
      api.deleteMessage(channelId, messageId).catch(() => {
        // On failure roll back — the socket event would have never arrived
        // so we need to undo our optimistic tombstone.
        setRealMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, isDeleted: false, content: m.content } : m,
          ),
        );
      });
    },
    [channelId],
  );

  // ── Toggle reaction (optimistic) ───────────────────────────────────────────
  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!channelId) return;

      // Determine current state to flip optimistically
      const msg = realMessages.find((m) => m.id === messageId);
      if (!msg) return;

      const existing = msg.reactions.find((r) => r.emoji === emoji);
      const wasReacted = existing?.reactedByMe ?? false;
      const newCount = wasReacted ? (existing?.count ?? 1) - 1 : (existing?.count ?? 0) + 1;

      // Mark in-flight to suppress socket echo
      const key = `${messageId}:${emoji}`;
      inflightReactionsRef.current.add(key);

      // Optimistic update
      setRealMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          return {
            ...m,
            reactions: applyReactionEvent(m.reactions, {
              messageId,
              channelId,
              emoji,
              count: newCount,
              reactedByMe: !wasReacted,
            }),
          };
        }),
      );

      api
        .toggleReaction(channelId, messageId, { emoji })
        .then((res) => {
          if (!mountedRef.current) return;
          // Server returns {reacted: bool} — do a final reconcile via message:updated
          // socket event which the server emits. Nothing extra needed here unless
          // we want belt-and-suspenders: the optimistic state already reflects res.reacted.
          // Remove in-flight marker so future socket events are processed.
          inflightReactionsRef.current.delete(key);
          // If the server disagrees, correct via refetch of the single message.
          // In practice message:updated socket arrives and corrects state.
          // Just ensure the reacted flag matches.
          setRealMessages((prev) =>
            prev.map((m) => {
              if (m.id !== messageId) return m;
              const r = m.reactions.find((rx) => rx.emoji === emoji);
              if (!r) return m;
              if (r.reactedByMe === res.reacted) return m;
              // Flip back to match server
              return {
                ...m,
                reactions: m.reactions.map((rx) =>
                  rx.emoji === emoji ? { ...rx, reactedByMe: res.reacted } : rx,
                ),
              };
            }),
          );
        })
        .catch(() => {
          if (!mountedRef.current) return;
          inflightReactionsRef.current.delete(key);
          // Roll back optimistic toggle
          setRealMessages((prev) =>
            prev.map((m) => {
              if (m.id !== messageId) return m;
              return {
                ...m,
                reactions: applyReactionEvent(m.reactions, {
                  messageId,
                  channelId,
                  emoji,
                  // Restore original count/state
                  count: existing?.count ?? 0,
                  reactedByMe: wasReacted,
                }),
              };
            }),
          );
        });
    },
    [channelId, realMessages],
  );

  const messages: DisplayMessage[] = [
    ...realMessages.map((m): DisplayMessage => ({ kind: 'real', ...m })),
    ...optimisticMessages.map((m): DisplayMessage => ({ kind: 'optimistic', ...m })),
  ];

  return {
    messages,
    loadingInitial,
    loadingOlder,
    errorInitial,
    hasOlderMessages: nextCursor !== null,
    loadOlder,
    sendMessage,
    retryMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
  };
}
