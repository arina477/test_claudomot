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
 */

import type { MessageResponse } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import type { DisplayMessage, OptimisticMessage } from './MessageList';
import { joinChannel, leaveChannel, onMessageNew } from './messagingSocket';

type UseMessagesResult = {
  messages: DisplayMessage[];
  loadingInitial: boolean;
  loadingOlder: boolean;
  errorInitial: boolean;
  hasOlderMessages: boolean;
  loadOlder: () => void;
  sendMessage: (content: string) => void;
  retryMessage: (idempotencyKey: string) => void;
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
  };
}
