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
 *
 * Wave-20 M4 additions (offline-first SPINE):
 * - sendMessage() writes to the Dexie outbox FIRST (durable), then attempts
 *   network POST. No separate send path — outbox BACKS the optimistic state.
 * - Composer stays ENABLED offline (sends enqueue as pending, no error/block).
 * - On socket reconnect + window 'online': drain() outbox then catch-up via
 *   api.getMessagesAfter(lastSeenCursor).
 * - On mount: load pending outbox rows (cold-start hydration across page reload).
 * - Network-first for initial load; on offline/fetch-fail, read from Dexie cache.
 * - Socket message:new events write through to the Dexie cache.
 */

import type { MessageResponse, ValidatedAttachment } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import { getCachedMessages, putCachedMessage, putCachedMessages } from '../features/sync/cache';
import { db } from '../features/sync/db';
import { drain, enqueue, loadPending, retryOutboxItem } from '../features/sync/outbox';
import type { DisplayMessage, OptimisticMessage, StagedAttachmentPreview } from './MessageList';
import {
  applyReactionEvent,
  getMessagingSocket,
  joinChannel,
  leaveChannel,
  onMessageDeleted,
  onMessageNew,
  onMessageUpdated,
  onReactionAdded,
  onReactionRemoved,
  onThreadReplyCreated,
  onThreadReplyDeleted,
} from './messagingSocket';

/**
 * Encode a forward catch-up cursor matching the server's decodeCursor contract:
 * base64url(`${createdAt}|${id}`)
 */
function encodeForwardCursor(createdAt: string, id: string): string {
  const raw = `${createdAt}|${id}`;
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

type UseMessagesResult = {
  messages: DisplayMessage[];
  loadingInitial: boolean;
  loadingOlder: boolean;
  errorInitial: boolean;
  hasOlderMessages: boolean;
  loadOlder: () => void;
  /** Re-triggers the initial channel fetch — use for error-state retry affordances. */
  reloadMessages: () => void;
  sendMessage: (
    content: string,
    attachments?: ValidatedAttachment[],
    stagedPreviews?: StagedAttachmentPreview[],
  ) => void;
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
  // Incrementing reload key — changing this forces the initial-fetch effect to re-run.
  const [reloadKey, setReloadKey] = useState(0);

  const subscribedChannelRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  // Track the last message createdAt seen — used as the catch-up cursor on reconnect.
  const lastSeenCursorRef = useRef<string | null>(null);

  // Track in-flight optimistic reaction toggles to deduplicate socket echoes.
  // Key: `${messageId}:${emoji}`, value: true while the POST is in-flight.
  const inflightReactionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Reconnect + catch-up helper ────────────────────────────────────────────
  // Called on socket reconnect AND window 'online' event.
  const runDrainAndCatchup = useCallback(async (forChannelId: string) => {
    if (!mountedRef.current) return;

    // 1. Drain outbox first (sequential, oldest-first).
    if (db) {
      await drain(
        db,
        (target, body) =>
          target.kind === 'channel'
            ? api.sendMessage(target.channelId, body)
            : Promise.reject(new Error('DM drain not handled by channel hook')),
        (idempotencyKey, confirmedId) => {
          if (!mountedRef.current) return;
          // Reconcile: add confirmed message to real list, remove optimistic.
          setRealMessages((prev) => {
            if (prev.some((m) => m.id === confirmedId)) return prev;
            // We don't have the full MessageResponse here from drain's perspective —
            // the socket message:new will arrive and add it. Just remove optimistic.
            return prev;
          });
          setOptimisticMessages((prev) => prev.filter((m) => m.idempotencyKey !== idempotencyKey));
        },
        (idempotencyKey) => {
          if (!mountedRef.current) return;
          setOptimisticMessages((prev) =>
            prev.map((m) =>
              m.idempotencyKey === idempotencyKey ? { ...m, state: 'failed' as const } : m,
            ),
          );
        },
      );
    }

    // 2. Catch-up: multi-page forward cursor loop.
    //    Advance cursor OUTSIDE setRealMessages to avoid stale-closure reads
    //    across async page boundaries. Write through to Dexie PER PAGE so a
    //    mid-loop disconnect leaves the cache consistent with lastSeenCursorRef.
    //    MAX_ITERS guard prevents an infinite loop on a buggy server response.
    const MAX_ITERS = 100;
    let cursor = lastSeenCursorRef.current;
    if (cursor) {
      try {
        let iters = 0;
        while (cursor && iters < MAX_ITERS) {
          iters++;
          if (!mountedRef.current) return;

          // Use the current cursor value captured outside the updater.
          const pageCursor = cursor;
          const result = await api.getMessagesAfter(forChannelId, pageCursor);
          if (!mountedRef.current) return;

          if (result.items.length > 0) {
            // Dedup and append this page.
            setRealMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newItems = result.items.filter((m) => !existingIds.has(m.id));
              if (newItems.length === 0) return prev;
              return [...prev, ...newItems];
            });

            // Write through to cache per-page (outside updater — avoids stale closure).
            if (db) {
              const cachedAt = new Date().toISOString();
              void putCachedMessages(
                db,
                result.items.map((m) => ({ ...m, cachedAt })),
              );
            }
          }

          // Advance cursor from the server's nextCursor (opaque forward cursor).
          // This MUST happen outside setRealMessages to avoid stale-closure reads
          // when we await the next page.
          if (result.nextCursor) {
            cursor = result.nextCursor;
            lastSeenCursorRef.current = result.nextCursor;
          } else {
            // No more pages — update lastSeenCursorRef to the last item seen
            // so future catch-ups start from the correct position.
            const last = result.items[result.items.length - 1];
            if (last) {
              const newCursor = encodeForwardCursor(last.createdAt, last.id);
              lastSeenCursorRef.current = newCursor;
            }
            cursor = null; // terminate loop
          }
        }

        if (iters >= MAX_ITERS) {
          // Guard fired — log so it's detectable; no silent data loss (partial
          // pages already written to state + cache above).
          console.warn(
            `[useMessages] catch-up loop hit MAX_ITERS (${MAX_ITERS}) for channel ${forChannelId}. Some messages may be deferred to the next reconnect.`,
          );
        }
      } catch {
        // Catch-up fail is non-fatal — socket will deliver new messages.
      }
    }
  }, []);

  // ── Socket reconnect listener ──────────────────────────────────────────────
  useEffect(() => {
    if (!channelId) return;
    const socket = getMessagingSocket();
    const handleReconnect = () => {
      void runDrainAndCatchup(channelId);
    };
    socket.on('connect', handleReconnect);
    return () => {
      socket.off('connect', handleReconnect);
    };
  }, [channelId, runDrainAndCatchup]);

  // ── Window 'online' listener ───────────────────────────────────────────────
  useEffect(() => {
    if (!channelId) return;
    const handleOnline = () => {
      void runDrainAndCatchup(channelId);
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [channelId, runDrainAndCatchup]);

  // ── Fetch initial + socket room join on channel change ─────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey is an intentional force-re-fetch trigger, not used inside the effect body
  useEffect(() => {
    if (!channelId) {
      setRealMessages([]);
      setOptimisticMessages([]);
      setLoadingInitial(false);
      setErrorInitial(false);
      setNextCursor(null);
      lastSeenCursorRef.current = null;
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
    lastSeenCursorRef.current = null;
    setLoadingInitial(true);

    // Network-first: attempt GET; on offline/fetch-fail, read from Dexie cache.
    api
      .listMessages(channelId)
      .then((result) => {
        if (!mountedRef.current) return;
        setRealMessages(result.messages);
        setNextCursor(result.nextCursor ?? null);
        // Update cursor to the last message we received.
        const last = result.messages[result.messages.length - 1];
        if (last) lastSeenCursorRef.current = encodeForwardCursor(last.createdAt, last.id);
        // Write through to cache.
        if (db) {
          const cachedAt = new Date().toISOString();
          void putCachedMessages(
            db,
            result.messages.map((m) => ({ ...m, cachedAt })),
          );
        }
      })
      .catch(async () => {
        if (!mountedRef.current) return;
        // Offline fallback — read from Dexie cache.
        if (db) {
          try {
            const cached = await getCachedMessages(db, channelId);
            if (!mountedRef.current) return;
            setRealMessages(cached);
            const last = cached[cached.length - 1];
            if (last) lastSeenCursorRef.current = encodeForwardCursor(last.createdAt, last.id);
          } catch {
            setErrorInitial(true);
          }
        } else {
          setErrorInitial(true);
        }
      })
      .finally(() => {
        if (!mountedRef.current) return;
        setLoadingInitial(false);
      });

    // Cold-start hydration: load pending outbox rows into optimistic state.
    if (db) {
      const store = db;
      loadPending(store)
        .then((pendingItems) => {
          if (!mountedRef.current) return;
          const pendingForChannel = pendingItems.filter((item) => item.channelId === channelId);
          if (pendingForChannel.length === 0) return;
          setOptimisticMessages((prev) => {
            const existingKeys = new Set(prev.map((m) => m.idempotencyKey));
            const toAdd: OptimisticMessage[] = pendingForChannel
              .filter((item) => !existingKeys.has(item.idempotencyKey))
              .map((item) => ({
                idempotencyKey: item.idempotencyKey,
                content: item.content,
                authorDisplay: 'You',
                state: 'pending' as const,
                ...(item.attachments && item.attachments.length > 0
                  ? {
                      validatedAttachments: item.attachments.map((a) => ({
                        key: a.key,
                        filename: a.filename,
                        contentType: a.contentType,
                        sizeBytes: a.sizeBytes,
                        url: '',
                      })),
                    }
                  : {}),
              }));
            return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
          });
        })
        .catch(() => {
          // Cold-start hydration failure is non-fatal.
        });
    }
  }, [channelId, reloadKey]);

  // ── Socket listener — real-time message:new ────────────────────────────────
  useEffect(() => {
    if (!channelId) return;
    const unsub = onMessageNew((msg: MessageResponse) => {
      if (!mountedRef.current) return;
      if (msg.channelId !== channelId) return;
      setRealMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        // Update cursor.
        lastSeenCursorRef.current = encodeForwardCursor(msg.createdAt, msg.id);
        // Write through to cache.
        if (db) {
          void putCachedMessage(db, { ...msg, cachedAt: new Date().toISOString() });
        }
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

  // ── Socket listener — thread:reply:created ────────────────────────────────
  useEffect(() => {
    if (!channelId) return;
    const unsub = onThreadReplyCreated((event) => {
      if (!mountedRef.current) return;
      if (event.channelId !== channelId) return;
      setRealMessages((prev) =>
        prev.map((m) =>
          m.id === event.parentId
            ? {
                ...m,
                replyCount: (m.replyCount ?? 0) + 1,
                lastReplyAt: event.reply.createdAt,
              }
            : m,
        ),
      );
    });
    return unsub;
  }, [channelId]);

  // ── Socket listener — thread:reply:deleted ───────────────────────────────
  useEffect(() => {
    if (!channelId) return;
    const unsub = onThreadReplyDeleted((event) => {
      if (!mountedRef.current) return;
      if (event.channelId !== channelId) return;
      setRealMessages((prev) =>
        prev.map((m) =>
          m.id === event.parentId
            ? {
                ...m,
                replyCount: event.replyCount,
                lastReplyAt: event.lastReplyAt,
              }
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
        // Write through to cache.
        if (db) {
          const cachedAt = new Date().toISOString();
          void putCachedMessages(
            db,
            result.messages.map((m) => ({ ...m, cachedAt })),
          );
        }
      })
      .catch(() => {
        /* silently ignore — user can scroll up and retry */
      })
      .finally(() => {
        if (!mountedRef.current) return;
        setLoadingOlder(false);
      });
  }, [channelId, nextCursor, loadingOlder]);

  // ── Optimistic send (outbox-backed) ───────────────────────────────────────
  // The Dexie outbox is the durable backing store for every send.
  // The composer stays ENABLED offline — sends enqueue as pending.
  const sendMessage = useCallback(
    (
      content: string,
      attachments?: ValidatedAttachment[],
      stagedPreviews?: StagedAttachmentPreview[],
    ) => {
      if (!channelId) return;

      // Strip to OutboxItem-compatible attachment descriptors (drop url).
      const outboxAttachments = attachments?.map((a) => ({
        key: a.key,
        filename: a.filename,
        contentType: a.contentType,
        sizeBytes: a.sizeBytes,
      }));

      if (db) {
        const store = db;
        // Enqueue to durable store first (outbox is the SINGLE source of truth for send),
        // then reflect optimistic state, then trigger drain() — no separate direct POST.
        // This prevents the double-send race (direct POST + drain re-POSTing same item).
        enqueue(store, { kind: 'channel', channelId }, content, outboxAttachments)
          .then(({ idempotencyKey }) => {
            if (!mountedRef.current) return;

            // Reflect as pending in UI immediately — composer feels instant.
            setOptimisticMessages((prev) => [
              ...prev,
              {
                idempotencyKey,
                content,
                authorDisplay: 'You',
                state: 'pending',
                ...(stagedPreviews ? { stagedAttachments: stagedPreviews } : {}),
                ...(attachments ? { validatedAttachments: attachments } : {}),
              },
            ]);

            // Trigger drain — outbox handles the actual POST. drain() is
            // re-entrant-safe (module-level guard): concurrent calls are
            // de-duped. If offline, the row stays pending until next reconnect.
            void drain(
              store,
              (target, body) =>
                target.kind === 'channel'
                  ? api.sendMessage(target.channelId, body)
                  : Promise.reject(new Error('DM drain not handled by channel hook')),
              (deliveredKey, confirmedId) => {
                if (!mountedRef.current) return;
                setRealMessages((prev) => {
                  if (prev.some((m) => m.id === confirmedId)) return prev;
                  return prev;
                  // Full MessageResponse arrives via socket message:new — just
                  // remove the optimistic row here.
                });
                setOptimisticMessages((prev) =>
                  prev.filter((m) => m.idempotencyKey !== deliveredKey),
                );
              },
              (failedKey) => {
                if (!mountedRef.current) return;
                setOptimisticMessages((prev) =>
                  prev.map((m) =>
                    m.idempotencyKey === failedKey ? { ...m, state: 'failed' as const } : m,
                  ),
                );
              },
            );
          })
          .catch(() => {
            // IDB enqueue failed (e.g. QuotaExceededError) — fall back to in-memory only.
            const idempotencyKey = crypto.randomUUID();
            setOptimisticMessages((prev) => [
              ...prev,
              {
                idempotencyKey,
                content,
                authorDisplay: 'You',
                state: 'pending',
                ...(stagedPreviews ? { stagedAttachments: stagedPreviews } : {}),
                ...(attachments ? { validatedAttachments: attachments } : {}),
              },
            ]);
            api
              .sendMessage(channelId, {
                content,
                idempotencyKey,
                ...(attachments && attachments.length > 0 ? { attachments } : {}),
              })
              .then((confirmed) => {
                if (!mountedRef.current) return;
                setRealMessages((prev) => {
                  if (prev.some((m) => m.id === confirmed.id)) return prev;
                  return [...prev, confirmed];
                });
                setOptimisticMessages((prev) =>
                  prev.filter((m) => m.idempotencyKey !== idempotencyKey),
                );
              })
              .catch(() => {
                if (!mountedRef.current) return;
                setOptimisticMessages((prev) =>
                  prev.map((m) =>
                    m.idempotencyKey === idempotencyKey ? { ...m, state: 'failed' as const } : m,
                  ),
                );
              });
          });
      } else {
        // No IDB available — in-memory-only path (same as pre-wave-20).
        const idempotencyKey = crypto.randomUUID();
        setOptimisticMessages((prev) => [
          ...prev,
          {
            idempotencyKey,
            content,
            authorDisplay: 'You',
            state: 'pending',
            ...(stagedPreviews ? { stagedAttachments: stagedPreviews } : {}),
            ...(attachments ? { validatedAttachments: attachments } : {}),
          },
        ]);
        api
          .sendMessage(channelId, {
            content,
            idempotencyKey,
            ...(attachments && attachments.length > 0 ? { attachments } : {}),
          })
          .then((confirmed) => {
            if (!mountedRef.current) return;
            setRealMessages((prev) => {
              if (prev.some((m) => m.id === confirmed.id)) return prev;
              return [...prev, confirmed];
            });
            setOptimisticMessages((prev) =>
              prev.filter((m) => m.idempotencyKey !== idempotencyKey),
            );
          })
          .catch(() => {
            if (!mountedRef.current) return;
            setOptimisticMessages((prev) =>
              prev.map((m) =>
                m.idempotencyKey === idempotencyKey ? { ...m, state: 'failed' as const } : m,
              ),
            );
          });
      }
    },
    [channelId],
  );

  // ── Retry a failed optimistic message ─────────────────────────────────────
  const retryMessage = useCallback(
    (idempotencyKey: string) => {
      if (!channelId) return;
      const failed = optimisticMessages.find((m) => m.idempotencyKey === idempotencyKey);
      if (!failed) return;

      // Reset to pending in UI.
      setOptimisticMessages((prev) =>
        prev.map((m) =>
          m.idempotencyKey === idempotencyKey ? { ...m, state: 'pending' as const } : m,
        ),
      );

      // Re-queue in outbox (reset attempts + state=pending) if IDB available.
      if (db) {
        void retryOutboxItem(db, idempotencyKey);
      }

      const retryAttachments = failed.validatedAttachments as ValidatedAttachment[] | undefined;
      api
        .sendMessage(channelId, {
          content: failed.content,
          idempotencyKey,
          ...(retryAttachments && retryAttachments.length > 0
            ? { attachments: retryAttachments }
            : {}),
        })
        .then((confirmed) => {
          if (!mountedRef.current) return;
          // Delete from outbox on success.
          if (db) {
            void db.outbox.where('idempotencyKey').equals(idempotencyKey).delete();
          }
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
  const editMessage = useCallback(
    (messageId: string, content: string) => {
      if (!channelId) return;
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
          setRealMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        })
        .catch(() => {
          // Leave optimistic state; socket message:updated will correct if server succeeded.
        });
    },
    [channelId],
  );

  // ── Delete a message ───────────────────────────────────────────────────────
  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!channelId) return;
      setRealMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: null, reactions: [] } : m,
        ),
      );
      api.deleteMessage(channelId, messageId).catch(() => {
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

      const msg = realMessages.find((m) => m.id === messageId);
      if (!msg) return;

      const existing = msg.reactions.find((r) => r.emoji === emoji);
      const wasReacted = existing?.reactedByMe ?? false;
      const newCount = wasReacted ? (existing?.count ?? 1) - 1 : (existing?.count ?? 0) + 1;

      const key = `${messageId}:${emoji}`;
      inflightReactionsRef.current.add(key);

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
          inflightReactionsRef.current.delete(key);
          setRealMessages((prev) =>
            prev.map((m) => {
              if (m.id !== messageId) return m;
              const r = m.reactions.find((rx) => rx.emoji === emoji);
              if (!r) return m;
              if (r.reactedByMe === res.reacted) return m;
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
          setRealMessages((prev) =>
            prev.map((m) => {
              if (m.id !== messageId) return m;
              return {
                ...m,
                reactions: applyReactionEvent(m.reactions, {
                  messageId,
                  channelId,
                  emoji,
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

  const reloadMessages = useCallback(() => {
    // Incrementing reloadKey triggers the initial-fetch useEffect to re-run.
    setReloadKey((k) => k + 1);
  }, []);

  return {
    messages,
    loadingInitial,
    loadingOlder,
    errorInitial,
    hasOlderMessages: nextCursor !== null,
    loadOlder,
    reloadMessages,
    sendMessage,
    retryMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
  };
}
