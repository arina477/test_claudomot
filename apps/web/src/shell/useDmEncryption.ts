/**
 * useDmEncryption — client-side E2E key lifecycle + per-conversation crypto
 * resolution for the DM surface (wave-79 M13 leg-3a, task 3fb88f44).
 *
 * Responsibilities:
 *   - On mount: ensure the device keypair exists in dexie and register its
 *     PUBLIC key with the server (PUT /profile/encryption-key). The PRIVATE key
 *     never leaves dexie / this device.
 *   - Resolve a conversation's crypto capability: a >2-participant GROUP is out
 *     of scope (plaintext); a 1:1 fetches the peer's public key (cached). A 404
 *     / any key-fetch error FAILS CLOSED to plaintext.
 *   - encryptOutgoing(): for an encrypted 1:1, wrap plaintext into a server-blind
 *     envelope; otherwise return { mode: 'plaintext' } so the send stays plaintext.
 *   - decryptEnvelope(): decrypt an incoming ciphertext; a failure (key lost /
 *     foreign key / spoofed sender) resolves to the honest "cannot decrypt"
 *     state, never a throw.
 *   - Key-loss: a MISSING private key at decrypt time resolves to cannot-decrypt.
 *     It NEVER regenerates as a side effect (wave-79 B-6 F4) — keypair creation
 *     lives ONLY in the explicit mount/first-use ensureKeypair path, so a
 *     transient IndexedDB unavailability can never overwrite the good
 *     server-registered key and orphan history / downgrade peers.
 *
 * SENDER-AUTHENTICATION (wave-79 B-6 F2): an incoming envelope is decrypted with
 * the SERVER-registered public key for message.authorId (resolved via the peer-
 * key cache keyed by authorId), NOT the envelope's self-asserted senderKeyRef.
 * The decrypting key is bound to the displayed sender; a crafted senderKeyRef
 * cannot decrypt-and-attribute a spoofed message.
 *
 * FAIL-CLOSED CONTRACT: the 'encrypted' capability (the only lock state) is
 * granted ONLY when a peer public key was successfully fetched AND imported.
 * Absent that proof, capability is 'plaintext' or 'group' — never 'encrypted'.
 */

import type { DmConversation } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import {
  DM_ENCRYPTION_ALGORITHM,
  type DecryptResult,
  type EncryptedEnvelope,
  decryptMessage,
  encryptMessage,
  importPeerPublicKey,
} from '../features/crypto/dm-crypto';
import { ensureKeypair } from '../features/crypto/keystore';
import type { StoredKeypair } from '../features/sync/types';
import type { ConversationCryptoCapability } from './dmEncryptionState';

/** Resolved peer key entry cached per userId (imported CryptoKey + its base64). */
type ResolvedPeerKey = { key: CryptoKey; base64: string };

export type OutgoingCrypto =
  | { mode: 'plaintext' }
  | { mode: 'encrypted'; envelope: EncryptedEnvelope };

export type UseDmEncryptionResult = {
  /** Whether the local keypair is ready (registered or at least generated). */
  keyReady: boolean;
  /** Crypto capability of the currently-resolved conversation. */
  capability: ConversationCryptoCapability;
  /** Resolve capability + peer key for a conversation (call on selection). */
  resolveConversation: (conversation: DmConversation, currentUserId: string | null) => void;
  /**
   * Prepare an outgoing payload for the open conversation. Returns an encrypted
   * envelope for an encrypted 1:1, else { mode: 'plaintext' }. Fails closed to
   * plaintext if anything about the peer key is not provably usable.
   */
  encryptOutgoing: (content: string) => Promise<OutgoingCrypto>;
  /**
   * Decrypt an incoming envelope — never throws; failure → cannot-decrypt.
   * Binds the decrypting key to the message's AUTHOR: the shared secret is
   * derived against the server-registered public key for `authorId`, and the
   * envelope's self-asserted `senderKeyRef` (if any) must match it (F2). A
   * missing local private key resolves to cannot-decrypt WITHOUT regenerating
   * the keypair (F4).
   */
  decryptEnvelope: (
    ciphertext: string,
    authorId: string,
    senderKeyRef: string | null | undefined,
    envelopeVersion: number | null | undefined,
  ) => Promise<DecryptResult>;
};

export function useDmEncryption(): UseDmEncryptionResult {
  const keypairRef = useRef<StoredKeypair | null>(null);
  // SINGLE keypair-resolution path (F4): every reader awaits this one promise
  // rather than racing its own ensureKeypair/regenerate. Set exactly once, in
  // the mount effect's explicit first-use path. Decrypt/encrypt NEVER create it.
  const keypairPromiseRef = useRef<Promise<StoredKeypair> | null>(null);
  const [keyReady, setKeyReady] = useState(false);
  const [capability, setCapability] = useState<ConversationCryptoCapability>('loading');

  // Per-user resolved peer-key cache (import once, reuse).
  const peerKeyCache = useRef<Map<string, ResolvedPeerKey>>(new Map());
  // Peer key for the currently-open conversation (null when plaintext/group).
  const activePeerKeyRef = useRef<ResolvedPeerKey | null>(null);

  // Lazy-load the dexie handle (kept out of module scope for test isolation).
  useEffect(() => {
    let cancelled = false;
    void import('../features/sync/db').then(({ db }) => {
      if (cancelled) return;
      if (!db) {
        // No IndexedDB — encryption unavailable; everything fails closed to plaintext.
        setKeyReady(false);
        return;
      }
      // Explicit first-use keypair resolution — the ONLY place a keypair is
      // generated. Store the promise so concurrent readers share one resolution
      // (no two-writer race on keypairRef).
      const resolution = ensureKeypair(db);
      keypairPromiseRef.current = resolution;
      void (async () => {
        try {
          const kp = await resolution;
          keypairRef.current = kp;
          // Register the PUBLIC key. Best-effort: a failure here does not block
          // messaging (sends fall back to plaintext honestly).
          try {
            await api.putEncryptionKey(kp.publicKeyBase64, DM_ENCRYPTION_ALGORITHM);
          } catch {
            // registration failed — leave keyReady true (we can still decrypt our
            // own inbound if peers already have our old key); outgoing to peers
            // still requires a peer key, resolved independently.
          }
          if (!cancelled) setKeyReady(true);
        } catch {
          // Keypair generation/persistence unavailable (e.g. no encryptionKeys
          // table) — encryption stays off; everything fails closed to plaintext.
          // Clear the failed promise so a later explicit resolve can retry.
          keypairPromiseRef.current = null;
          if (!cancelled) setKeyReady(false);
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Resolve (and cache) a peer's registered public key by userId ──────────
  // Single fetch+import path, shared by conversation resolution AND author-bound
  // decrypt (F2). `forceRefetch` bypasses the cache so a rotated peer key can be
  // re-fetched after a decrypt failure (F6). Returns null on 404 / any error.
  const resolvePeerKey = useCallback(
    async (userId: string, forceRefetch = false): Promise<ResolvedPeerKey | null> => {
      if (!forceRefetch) {
        const cached = peerKeyCache.current.get(userId);
        if (cached) return cached;
      }
      try {
        const res = await api.getPeerEncryptionKey(userId);
        const key = await importPeerPublicKey(res.publicKey);
        const resolved: ResolvedPeerKey = { key, base64: res.publicKey };
        peerKeyCache.current.set(userId, resolved);
        return resolved;
      } catch {
        return null;
      }
    },
    [],
  );

  // ── Resolve a conversation's capability + peer key ────────────────────────
  const resolveConversation = useCallback(
    (conversation: DmConversation, uid: string | null) => {
      activePeerKeyRef.current = null;

      // Group DMs (>2 participants) are out of scope for encryption in leg-3a.
      if (conversation.isGroup || conversation.participants.length > 2) {
        setCapability('group');
        return;
      }

      const peer = conversation.participants.find((p) => p.userId !== uid);
      if (!peer) {
        // Degenerate 1:1 with no distinct peer — cannot encrypt; plaintext.
        setCapability('plaintext');
        return;
      }

      setCapability('loading');
      void (async () => {
        const resolved = await resolvePeerKey(peer.userId);
        if (resolved) {
          activePeerKeyRef.current = resolved;
          setCapability('encrypted');
        } else {
          // 404 (peer has no key) OR any key-fetch error → FAIL CLOSED to
          // plaintext. Never a false padlock.
          activePeerKeyRef.current = null;
          setCapability('plaintext');
        }
      })();
    },
    [resolvePeerKey],
  );

  // ── Encrypt an outgoing message for the resolved conversation ─────────────
  const encryptOutgoing = useCallback(async (content: string): Promise<OutgoingCrypto> => {
    const kp = keypairRef.current;
    const peer = activePeerKeyRef.current;
    // No local key or no usable peer key → plaintext (honest, no padlock).
    if (!kp || !peer) return { mode: 'plaintext' };
    try {
      const envelope = await encryptMessage(content, kp.privateKey, kp.publicKeyBase64, peer.key);
      return { mode: 'encrypted', envelope };
    } catch {
      // Encryption unexpectedly failed — fall back to plaintext rather than
      // dropping the message. The indicator will honestly read Not-encrypted.
      return { mode: 'plaintext' };
    }
  }, []);

  // ── Decrypt an incoming envelope ──────────────────────────────────────────
  const decryptEnvelope = useCallback(
    async (
      ciphertext: string,
      authorId: string,
      senderKeyRef: string | null | undefined,
      envelopeVersion: number | null | undefined,
    ): Promise<DecryptResult> => {
      // Resolve our private key WITHOUT side-effecting regeneration (F4). We
      // await the single mount-time resolution promise if it hasn't settled the
      // ref yet; a MISSING private key falls to cannot-decrypt — never rotate,
      // never re-register (a transient IDB blip must not overwrite the good key).
      let kp = keypairRef.current;
      if (!kp && keypairPromiseRef.current) {
        try {
          kp = await keypairPromiseRef.current;
          keypairRef.current = kp;
        } catch {
          return { ok: false };
        }
      }
      if (!kp) return { ok: false };

      // Sender-authentication (F2): derive the shared secret against the
      // AUTHOR's server-registered key, resolved from authorId — NOT the
      // envelope's self-asserted senderKeyRef.
      const wasCached = peerKeyCache.current.has(authorId);
      const author = await resolvePeerKey(authorId);
      if (!author) return { ok: false };
      const first = await decryptMessage(
        ciphertext,
        author.base64,
        senderKeyRef,
        envelopeVersion,
        kp.privateKey,
      );
      if (first.ok || !wasCached) return first;
      // F6: the decrypt failed with a CACHED author key — it may be STALE after
      // the peer rotated. Re-fetch once bypassing the cache and retry before
      // giving up (a rotated peer isn't stuck on a dead cached key). If the
      // fresh fetch fails, honestly fall to cannot-decrypt.
      const refreshed = await resolvePeerKey(authorId, true);
      if (!refreshed) return { ok: false };
      return decryptMessage(
        ciphertext,
        refreshed.base64,
        senderKeyRef,
        envelopeVersion,
        kp.privateKey,
      );
    },
    [resolvePeerKey],
  );

  return { keyReady, capability, resolveConversation, encryptOutgoing, decryptEnvelope };
}
