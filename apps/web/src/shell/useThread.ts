/**
 * useThread — fetch + real-time subscription for a thread (one parent's replies).
 *
 * Responsibilities:
 * - Fetch the initial reply list via GET /messages/:parentId/replies (oldest-first).
 * - Subscribe to 'thread:reply:created' for the open parentId and append incoming
 *   replies live (dedup by id so the sender's own confirmed reply isn't doubled).
 * - Expose sendReply() that goes through the SAME optimistic outbox machinery as
 *   top-level messages (pending → confirmed/failed → retryable) — outbox parity
 *   task 0b728319.
 * - On successful send (or socket echo), reconcile the optimistic row via
 *   idempotency_key so there is no duplicate even if both paths deliver the message.
 * - Reset all state when parentId changes (or becomes null → panel closed).
 *
 * Outbox parity detail (task 0b728319):
 *   Top-level sends: optimistic OptimisticMessage → api.sendMessage → confirmed
 *     MessageResponse → remove optimistic row, append confirmed row.
 *   Reply sends here: same shape — api.postReply replaces api.sendMessage;
 *     the idempotency_key is generated client-side and carried in the POST body;
 *     the 'thread:reply:created' socket event delivers the authoritative row
 *     including the same idempotency_key (server echoes it back); on match the
 *     optimistic row is replaced. On API error the row moves to 'failed' state;
 *     retryMessage re-sends the SAME idempotency_key (server ON CONFLICT DO NOTHING).
 *
 * Wave-18 D-carry 5: The replies container carries aria-live="polite" — declared
 * on the <ol> in ThreadPanel; this hook fires setState which causes React to
 * re-render and the live region to announce new items.
 */

import type { MessageResponse } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import type { OptimisticMessage } from './MessageList';
import { onThreadReplyCreated } from './messagingSocket';

export type ThreadState = {
  replies: MessageResponse[];
  optimisticReplies: OptimisticMessage[];
  loadingInitial: boolean;
  errorInitial: boolean;
  sendReply: (content: string) => void;
  retryReply: (idempotencyKey: string) => void;
};

/**
 * Hook for one open thread (parentId != null).
 * Pass channelId so postReply can include it in the query param.
 */
export function useThread(parentId: string | null, channelId: string | null): ThreadState {
  const [replies, setReplies] = useState<MessageResponse[]>([]);
  const [optimisticReplies, setOptimisticReplies] = useState<OptimisticMessage[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [errorInitial, setErrorInitial] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Reset + fetch when parentId changes ────────────────────────────────────
  useEffect(() => {
    if (!parentId) {
      setReplies([]);
      setOptimisticReplies([]);
      setLoadingInitial(false);
      setErrorInitial(false);
      return;
    }

    setReplies([]);
    setOptimisticReplies([]);
    setErrorInitial(false);
    setLoadingInitial(true);

    api
      .getThreadReplies(parentId)
      .then((result) => {
        if (!mountedRef.current) return;
        setReplies(result.items);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setErrorInitial(true);
      })
      .finally(() => {
        if (!mountedRef.current) return;
        setLoadingInitial(false);
      });
  }, [parentId]);

  // ── Socket listener — thread:reply:created ────────────────────────────────
  // Subscribe once and filter by parentId inside the handler.
  // This also runs when parentId is null so the subscription stays alive for
  // affordance updates in the channel list (useMessages does the parent-row
  // update — this hook focuses on the panel's reply list).
  useEffect(() => {
    if (!parentId) return;
    const unsub = onThreadReplyCreated((event) => {
      if (!mountedRef.current) return;
      if (event.parentId !== parentId) return;

      const incoming = event.reply;

      // Dedup: skip if already present (own confirmed message via API race)
      setReplies((prev) => {
        if (prev.some((r) => r.id === incoming.id)) return prev;
        return [...prev, incoming];
      });

      // Reconcile optimistic row by idempotency_key.
      // The server echoes the idempotency_key back on the reply DTO so we can
      // match it.  Cast is safe: the backend attaches idempotencyKey to the
      // response body during the ack phase (same pattern as top-level send).
      const key = (incoming as MessageResponse & { idempotencyKey?: string }).idempotencyKey;
      if (key) {
        setOptimisticReplies((prev) => prev.filter((m) => m.idempotencyKey !== key));
      }
    });
    return unsub;
  }, [parentId]);

  // ── Optimistic send (outbox parity) ────────────────────────────────────────
  const sendReply = useCallback(
    (content: string) => {
      if (!parentId || !channelId) return;
      const idempotencyKey = crypto.randomUUID();

      // 1. Push optimistic pending row
      setOptimisticReplies((prev) => [
        ...prev,
        { idempotencyKey, content, authorDisplay: 'You', state: 'pending' },
      ]);

      // 2. POST to backend
      api
        .postReply(parentId, channelId, content, idempotencyKey)
        .then((confirmed) => {
          if (!mountedRef.current) return;
          // Append confirmed reply if not already delivered by socket
          setReplies((prev) => {
            if (prev.some((r) => r.id === confirmed.id)) return prev;
            return [...prev, confirmed];
          });
          // Remove optimistic row
          setOptimisticReplies((prev) => prev.filter((m) => m.idempotencyKey !== idempotencyKey));
        })
        .catch(() => {
          if (!mountedRef.current) return;
          // Move to failed state — user can retry
          setOptimisticReplies((prev) =>
            prev.map((m) =>
              m.idempotencyKey === idempotencyKey ? { ...m, state: 'failed' as const } : m,
            ),
          );
        });
    },
    [parentId, channelId],
  );

  // ── Retry a failed optimistic reply ────────────────────────────────────────
  const retryReply = useCallback(
    (idempotencyKey: string) => {
      if (!parentId || !channelId) return;
      const failed = optimisticReplies.find((m) => m.idempotencyKey === idempotencyKey);
      if (!failed) return;

      // Move back to pending
      setOptimisticReplies((prev) =>
        prev.map((m) =>
          m.idempotencyKey === idempotencyKey ? { ...m, state: 'pending' as const } : m,
        ),
      );

      // Re-send same idempotency_key (server ON CONFLICT DO NOTHING — no duplicate)
      api
        .postReply(parentId, channelId, failed.content, idempotencyKey)
        .then((confirmed) => {
          if (!mountedRef.current) return;
          setReplies((prev) => {
            if (prev.some((r) => r.id === confirmed.id)) return prev;
            return [...prev, confirmed];
          });
          setOptimisticReplies((prev) => prev.filter((m) => m.idempotencyKey !== idempotencyKey));
        })
        .catch(() => {
          if (!mountedRef.current) return;
          setOptimisticReplies((prev) =>
            prev.map((m) =>
              m.idempotencyKey === idempotencyKey ? { ...m, state: 'failed' as const } : m,
            ),
          );
        });
    },
    [parentId, channelId, optimisticReplies],
  );

  return {
    replies,
    optimisticReplies,
    loadingInitial,
    errorInitial,
    sendReply,
    retryReply,
  };
}
