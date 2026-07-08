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
 *     foreign key) resolves to the honest "cannot decrypt" state, never a throw.
 *   - Key-loss recovery: if there is no private key for existing encrypted
 *     history, regenerate + re-register; prior messages honestly show
 *     cannot-decrypt (v1 accepted, no crash).
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
import { ensureKeypair, regenerateKeypair } from '../features/crypto/keystore';
import type { StudyHallDB } from '../features/sync/db';
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
  /** Decrypt an incoming envelope — never throws; failure → cannot-decrypt. */
  decryptEnvelope: (
    ciphertext: string,
    senderKeyRef: string,
    envelopeVersion: number | null | undefined,
  ) => Promise<DecryptResult>;
};

export function useDmEncryption(): UseDmEncryptionResult {
  const dbRef = useRef<StudyHallDB | null>(null);
  const keypairRef = useRef<StoredKeypair | null>(null);
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
      dbRef.current = db;
      if (!db) {
        // No IndexedDB — encryption unavailable; everything fails closed to plaintext.
        setKeyReady(false);
        return;
      }
      void (async () => {
        try {
          const kp = await ensureKeypair(db);
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
          if (!cancelled) setKeyReady(false);
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Resolve a conversation's capability + peer key ────────────────────────
  const resolveConversation = useCallback((conversation: DmConversation, uid: string | null) => {
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
      // Cache hit — reuse the imported peer key.
      const cached = peerKeyCache.current.get(peer.userId);
      if (cached) {
        activePeerKeyRef.current = cached;
        setCapability('encrypted');
        return;
      }
      try {
        const res = await api.getPeerEncryptionKey(peer.userId);
        const key = await importPeerPublicKey(res.publicKey);
        const resolved: ResolvedPeerKey = { key, base64: res.publicKey };
        peerKeyCache.current.set(peer.userId, resolved);
        activePeerKeyRef.current = resolved;
        setCapability('encrypted');
      } catch {
        // 404 (peer has no key) OR any key-fetch error → FAIL CLOSED to
        // plaintext. Never a false padlock.
        activePeerKeyRef.current = null;
        setCapability('plaintext');
      }
    })();
  }, []);

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
      senderKeyRef: string,
      envelopeVersion: number | null | undefined,
    ): Promise<DecryptResult> => {
      let kp = keypairRef.current;
      if (!kp && dbRef.current) {
        // Key-loss / new-device: no private key for existing encrypted history.
        // Regenerate + re-register so future messages encrypt; THIS message
        // (encrypted to the old key) will honestly fail to decrypt.
        try {
          kp = await regenerateKeypair(dbRef.current);
          keypairRef.current = kp;
          try {
            await api.putEncryptionKey(kp.publicKeyBase64, DM_ENCRYPTION_ALGORITHM);
          } catch {
            /* re-register best-effort */
          }
        } catch {
          return { ok: false };
        }
      }
      if (!kp) return { ok: false };
      return decryptMessage(ciphertext, senderKeyRef, envelopeVersion, kp.privateKey);
    },
    [],
  );

  return { keyReady, capability, resolveConversation, encryptOutgoing, decryptEnvelope };
}
