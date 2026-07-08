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
import type { SendDmMessageInput } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import {
  getCachedDmConversations,
  getCachedDmMessages,
  putCachedDmConversations,
  putCachedDmMessage,
  putCachedDmMessages,
} from '../features/sync/cache';
import { db } from '../features/sync/db';
import { drain, enqueue, loadPending, retryOutboxItem } from '../features/sync/outbox';
import type { OutboxTarget } from '../features/sync/types';
import type { ConversationCryptoCapability, DmEncryptionState } from './dmEncryptionState';
import { getMessagingSocket, onDmMessage } from './messagingSocket';
import { useDmEncryption } from './useDmEncryption';

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
  | ({
      kind: 'real';
      /**
       * Per-message honest encryption state (wave-79). Only 'encrypted' shows a
       * lock/shield; it is set ONLY when the row was a real ciphertext envelope
       * that decrypted successfully. A plaintext row → 'not-encrypted-plaintext'
       * (or 'not-encrypted-group' in a group DM); an envelope we cannot decrypt
       * → 'cannot-decrypt'. Absent proof of encryption → never a padlock.
       */
      encryptionState: DmEncryptionState;
      /** Decrypted (or plaintext) text to render. Null while a decrypt is pending. */
      displayContent: string | null;
    } & DmMessage)
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

  // ── E2E encryption (wave-79) ────────────────────────────────────────────────
  /**
   * Conversation-level crypto capability of the open thread, driving the header
   * badge. 'loading' on mount (never a lock); 'encrypted' only when a peer key
   * was provably resolved; 'plaintext'/'group' otherwise.
   */
  encryptionCapability: ConversationCryptoCapability;

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

  // Ref to currentUserId so the socket handler can identify own-sender echoes
  const currentUserIdRef = useRef<string | null>(null);
  currentUserIdRef.current = currentUserId;

  // ── E2E encryption (wave-79) ────────────────────────────────────────────────
  const encryption = useDmEncryption();
  const encryptionRef = useRef(encryption);
  encryptionRef.current = encryption;

  // Whether the open conversation is a group DM — group rows never show a lock.
  const openIsGroupRef = useRef(false);

  /**
   * F7 — proof-based delivered-row labeling. Records the ACTUAL send outcome
   * (encrypted vs plaintext, from what encryptOutgoing REALLY returned) keyed by
   * idempotencyKey, so buildDeliveredRow labels a delivered row from the real
   * send mode rather than from live capability (which can race). Entries are
   * written in makeSendFn at the moment of send and consumed (deleted) at
   * delivery. A plaintext-sent row can therefore NEVER show the lock even if
   * capability flips to 'encrypted' in the race window.
   */
  const sentModeRef = useRef<Map<string, 'encrypted' | 'plaintext'>>(new Map());

  /**
   * Decorate a raw DmMessage with its honest per-message encryption state.
   * - Plaintext row (content set, no ciphertext) → not-encrypted (group vs 1:1).
   * - Encrypted envelope → attempt decrypt; success → 'encrypted' with plaintext,
   *   failure → 'cannot-decrypt' (no plaintext). NEVER a false padlock.
   */
  const decorateRow = useCallback(async (m: DmMessage): Promise<DisplayDmMessage> => {
    const isEnvelope = typeof m.ciphertext === 'string' && m.ciphertext.length > 0;
    if (!isEnvelope) {
      // Plaintext message — honest Not-encrypted.
      return {
        kind: 'real',
        ...m,
        encryptionState: openIsGroupRef.current ? 'not-encrypted-group' : 'not-encrypted-plaintext',
        displayContent: m.content,
      };
    }
    // Real ciphertext envelope — only proof of encryption grants the lock.
    // F2: bind the decrypting key to the message's AUTHOR (server-registered
    // key for m.authorId), NOT the envelope's self-asserted senderKeyRef. A
    // spoofed senderKeyRef → cannot-decrypt (no lock for a key-mismatch).
    const result = await encryptionRef.current.decryptEnvelope(
      m.ciphertext as string,
      m.authorId,
      m.senderKeyRef,
      m.envelopeVersion,
    );
    if (result.ok) {
      return { kind: 'real', ...m, encryptionState: 'encrypted', displayContent: result.plaintext };
    }
    return { kind: 'real', ...m, encryptionState: 'cannot-decrypt', displayContent: null };
  }, []);

  /**
   * Build a SendFn that ENCRYPTS DM sends when the conversation resolved to
   * 'encrypted'. The outbox stores plaintext locally (device-local IDB, same
   * trust boundary as the private key) and hands us plaintext at drain time;
   * we transform it to a server-blind envelope here, at the wire boundary, so
   * only ciphertext + senderKeyRef + envelopeVersion ever leave the device.
   * Keyless-peer / group / any crypto failure → plaintext send (honest).
   * Channel sends are unchanged.
   */
  const makeSendFn = useCallback(
    () =>
      async (
        target: OutboxTarget,
        body: { content: string; idempotencyKey: string },
      ): Promise<{ id: string; [key: string]: unknown }> => {
        if (target.kind === 'dm') {
          const crypto = await encryptionRef.current.encryptOutgoing(body.content);
          // F7: record the REAL send outcome keyed by idempotencyKey so the
          // delivered row is labeled from what actually went on the wire, not
          // from live capability at delivery time.
          sentModeRef.current.set(body.idempotencyKey, crypto.mode);
          const dmBody: SendDmMessageInput =
            crypto.mode === 'encrypted'
              ? {
                  ciphertext: crypto.envelope.ciphertext,
                  senderKeyRef: crypto.envelope.senderKeyRef,
                  envelopeVersion: crypto.envelope.envelopeVersion,
                  idempotencyKey: body.idempotencyKey,
                }
              : { content: body.content, idempotencyKey: body.idempotencyKey };
          return api.sendDmMessage(target.conversationId, dmBody) as Promise<{
            id: string;
            [key: string]: unknown;
          }>;
        }
        return api.sendMessage(target.channelId, body) as Promise<{
          id: string;
          [key: string]: unknown;
        }>;
      },
    [],
  );

  /**
   * Build the confirmed 'real' row when an optimistic DM send is delivered.
   * We keep the sender's plaintext for local display; the honest per-message
   * encryption state is derived from the ACTUAL send outcome (F7) — what
   * encryptOutgoing really returned, recorded in sentModeRef keyed by
   * idempotencyKey — NOT from live capability at delivery time. A plaintext
   * send therefore NEVER shows the lock even if capability races to 'encrypted'.
   */
  const buildDeliveredRow = useCallback(
    (
      optimistic: {
        content: string;
        conversationId: string;
        createdAt: string;
        idempotencyKey: string;
      },
      confirmedId: string,
      authorId: string,
    ): DisplayDmMessage => {
      // Proof-based: read the real send mode for THIS send. Consume it so the
      // map doesn't grow unbounded. Absent (should not happen for a delivered
      // DM) → fail closed to not-encrypted, never a false padlock.
      const mode = sentModeRef.current.get(optimistic.idempotencyKey);
      sentModeRef.current.delete(optimistic.idempotencyKey);
      const encryptionState: DmEncryptionState =
        mode === 'encrypted'
          ? 'encrypted'
          : openIsGroupRef.current
            ? 'not-encrypted-group'
            : 'not-encrypted-plaintext';
      return {
        kind: 'real',
        id: confirmedId,
        conversationId: optimistic.conversationId,
        authorId,
        content: optimistic.content,
        createdAt: optimistic.createdAt,
        encryptionState,
        displayContent: optimistic.content,
      };
    },
    [],
  );

  // Flip the matching optimistic row to 'failed' — shared drain onFailed handler.
  const markFailed = useCallback((idempotencyKey: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.kind === 'optimistic' && m.idempotencyKey === idempotencyKey
          ? { ...m, state: 'failed' as const }
          : m,
      ),
    );
  }, []);

  // ── Fetch conversation list ────────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    setConversationsLoading(true);
    setConversationsError(false);
    try {
      const res = await api.listDmConversations();
      setConversations(res.conversations);
      // Write-through: persist to offline cache so the list is available when offline.
      if (db) {
        const cachedAt = new Date().toISOString();
        void putCachedDmConversations(
          db,
          res.conversations.map((c) => ({ ...c, cachedAt })),
        );
      }
    } catch {
      // Offline fallback — serve the last-known conversation list from cache.
      if (db) {
        try {
          const cached = await getCachedDmConversations(db);
          setConversations(cached);
        } catch {
          setConversationsError(true);
        }
      } else {
        setConversationsError(true);
      }
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  // ── Fetch messages for open conversation ──────────────────────────────────

  const fetchMessages = useCallback(
    async (conversationId: string, cursor?: string) => {
      if (!cursor) {
        setMessagesLoading(true);
        setMessagesError(false);
        setMessages([]);
      }
      try {
        const res = await api.listDmMessages(conversationId, cursor);
        const realMsgs: DisplayDmMessage[] = await Promise.all(res.messages.map(decorateRow));
        if (cursor) {
          // Prepend older messages
          setMessages((prev) => [...realMsgs, ...prev]);
        } else {
          setMessages(realMsgs);
        }
        setNextCursor(res.nextCursor);
        setHasOlderMessages(res.nextCursor !== null);
        // Write-through: persist fetched messages to offline cache.
        if (db && res.messages.length > 0) {
          const cachedAt = new Date().toISOString();
          void putCachedDmMessages(
            db,
            res.messages.map((m) => ({ ...m, cachedAt })),
          );
        }
      } catch {
        if (!cursor) {
          // Offline fallback — serve the last-known thread history from cache.
          if (db) {
            try {
              const cached = await getCachedDmMessages(db, conversationId);
              const cachedMsgs: DisplayDmMessage[] = await Promise.all(cached.map(decorateRow));
              setMessages(cachedMsgs);
            } catch {
              setMessagesError(true);
            }
          } else {
            setMessagesError(true);
          }
        }
      } finally {
        if (!cursor) setMessagesLoading(false);
      }
    },
    [decorateRow],
  );

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

  // Ref to the conversations list so selectConversation resolves the target
  // conversation for encryption WITHOUT re-creating the callback on every list
  // change (which would churn the DmThread on every incoming message).
  const conversationsRef = useRef<DmConversation[]>([]);
  conversationsRef.current = conversations;

  const selectConversation = useCallback(
    (id: string) => {
      setOpenConversationId(id);
      // Resolve E2E capability BEFORE fetching so decorateRow tags rows with the
      // correct group-vs-1:1 not-encrypted state and the peer key is warming.
      const conv = conversationsRef.current.find((c) => c.id === id) ?? null;
      openIsGroupRef.current = conv ? conv.isGroup || conv.participants.length > 2 : false;
      if (conv) {
        encryptionRef.current.resolveConversation(conv, currentUserIdRef.current);
      }
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
        // Decrypt/decorate off the setState path (async), then reconcile.
        void decorateRow(message).then((decorated) => {
          const isOwnEnvelope =
            message.authorId === currentUserIdRef.current &&
            typeof message.ciphertext === 'string' &&
            message.ciphertext.length > 0;

          setMessages((prev) => {
            // Dedup real-id: ignore if a confirmed row with this id is already present.
            if (prev.some((m) => m.kind === 'real' && m.id === message.id)) return prev;
            // Socket write-through: keep the offline cache fresh on live messages
            // (parity with useMessages.ts channel write-through).
            if (db) {
              void putCachedDmMessage(db, { ...message, cachedAt: new Date().toISOString() });
            }
            // Reconcile own-sender echo → promote the matching pending optimistic
            // row in-place instead of appending a duplicate. Match by (authorId ===
            // self) + content for plaintext; for an ENCRYPTED own echo the echo
            // carries ciphertext (content null) so it cannot be content-matched —
            // the sender cannot decrypt their own envelope (ECDH is directional),
            // so we promote the FIRST pending row and keep its optimistic plaintext
            // for local display while honestly tagging it 'encrypted'.
            if (message.authorId === currentUserIdRef.current) {
              const idx = prev.findIndex(
                (m) =>
                  m.kind === 'optimistic' &&
                  m.state === 'pending' &&
                  (isOwnEnvelope || m.content === message.content),
              );
              if (idx !== -1) {
                const opt = prev[idx];
                const optContent = opt && opt.kind === 'optimistic' ? opt.content : null;
                const promoted: DisplayDmMessage = isOwnEnvelope
                  ? {
                      kind: 'real' as const,
                      ...message,
                      encryptionState: 'encrypted',
                      // Keep the sender's own plaintext locally (can't self-decrypt).
                      displayContent: optContent,
                    }
                  : decorated;
                return [...prev.slice(0, idx), promoted, ...prev.slice(idx + 1)];
              }
            }
            return [...prev, decorated];
          });
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
            // Encrypted messages have content=null server-side — show a neutral
            // preview rather than leaking "null" (the gateway never sees plaintext).
            content: message.content ?? 'Encrypted message',
            createdAt: message.createdAt,
            authorId: message.authorId,
          },
        };
        const rest = prev.filter((_, i) => i !== idx);
        return [updated, ...rest];
      });
    });

    return unsub;
  }, [fetchConversations, decorateRow]);

  // ── Drain outbox on reconnect / online ────────────────────────────────────

  useEffect(() => {
    if (!db || !currentUserId) return;

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
              return buildDeliveredRow(m, confirmedId, currentUserId);
            }),
          );
        },
        markFailed,
      );
    };

    const socket = getMessagingSocket();
    socket.on('connect', doDrain);
    window.addEventListener('online', doDrain);

    return () => {
      socket.off('connect', doDrain);
      window.removeEventListener('online', doDrain);
    };
  }, [currentUserId, makeSendFn, buildDeliveredRow, markFailed]);

  // ── Send a DM message ──────────────────────────────────────────────────────

  const sendDmMessage = useCallback(
    (content: string) => {
      if (!openConversationId || !currentUserId || !db) return;

      const target: OutboxTarget = { kind: 'dm', conversationId: openConversationId };
      const store = db;

      // Enqueue to the durable outbox FIRST (outbox is the SINGLE source of
      // truth for send), then reflect optimistic state, then trigger drain() —
      // no separate direct POST. This prevents the double-send race (direct
      // POST + drain re-POSTing same item with a different key).
      enqueue(store, target, content)
        .then(({ idempotencyKey }) => {
          const now = new Date().toISOString();

          // Reflect as pending in UI — enqueue().then() is ~1 ms after the IDB
          // write; feels instant. idempotencyKey is the SINGLE key for this send
          // through the entire lifecycle (optimistic row, outbox row, server dedup).
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

          // Trigger drain — the outbox handles the actual POST. drain() is
          // re-entrant-safe (module-level guard): concurrent calls are de-duped.
          // If offline, the row stays pending until next reconnect. The send-fn
          // ENCRYPTS DM sends into a server-blind envelope (see makeSendFn).
          void drain(
            store,
            makeSendFn(),
            // onDelivered: reconcile optimistic → real (honest per-message state).
            (deliveredKey, confirmedId) => {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.kind !== 'optimistic' || m.idempotencyKey !== deliveredKey) return m;
                  return buildDeliveredRow(m, confirmedId, currentUserId);
                }),
              );
              // Update conversation list preview on delivery.
              setConversations((prev) => {
                const idx = prev.findIndex((c) => c.id === openConversationId);
                if (idx === -1) return prev;
                const updated: DmConversation = {
                  ...(prev[idx] as DmConversation),
                  lastMessage: {
                    content,
                    createdAt: new Date().toISOString(),
                    authorId: currentUserId,
                  },
                };
                return [updated, ...prev.filter((_, i) => i !== idx)];
              });
            },
            markFailed,
          );
        })
        .catch(() => {
          // IDB enqueue failed (e.g. QuotaExceededError) — the message cannot
          // be durably queued; surface nothing (the composer is still enabled
          // and the user can retry).
        });
    },
    [
      openConversationId,
      currentUserId,
      currentUserDisplay,
      makeSendFn,
      buildDeliveredRow,
      markFailed,
    ],
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
          // Trigger immediate drain (encrypting send-fn — see makeSendFn).
          if (!db || !currentUserId) return;
          void drain(
            db,
            makeSendFn(),
            (key, confirmedId) => {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.kind !== 'optimistic' || m.idempotencyKey !== key) return m;
                  return buildDeliveredRow(m, confirmedId, currentUserId ?? '');
                }),
              );
            },
            markFailed,
          );
        })
        .catch(() => {});
    },
    [currentUserId, makeSendFn, buildDeliveredRow, markFailed],
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

    encryptionCapability: encryption.capability,

    sendDmMessage,
    retryDmMessage,

    createConversation,
  };
}
