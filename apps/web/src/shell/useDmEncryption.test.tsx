/**
 * useDmEncryption.test.tsx — wave-79 B-6 crypto-glue safety fixes.
 *
 * Drives the REAL useDmEncryption hook (renderHook) with REAL Web Crypto, REAL
 * dexie (fake-indexeddb) — only the api + socket are mocked. Asserts the three
 * B-6 trust-binding / state-honesty guarantees at the hook boundary:
 *
 *   F2 — decrypt binds to the AUTHOR's server-registered key (fetched via
 *        getPeerEncryptionKey by authorId), NOT the envelope's senderKeyRef.
 *        A mismatched senderKeyRef → cannot-decrypt (no lock).
 *   F4 — a MISSING private key at decrypt time → cannot-decrypt WITHOUT
 *        regenerating/re-registering the keypair (putEncryptionKey NOT called
 *        again as a decrypt side effect).
 *   F6 — a decrypt failure with a cached (rotated/stale) author key re-fetches
 *        the peer key and retries.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encryptMessage, generateKeypair, importPeerPublicKey } from '../features/crypto/dm-crypto';
import { StudyHallDB } from '../features/sync/db';

// ── Real dexie (fake-indexeddb), fresh per test ──────────────────────────────
let testDb: StudyHallDB;
vi.mock('../features/sync/db', async () => {
  const actual = await vi.importActual<typeof import('../features/sync/db')>('../features/sync/db');
  return {
    ...actual,
    get db() {
      return testDb;
    },
  };
});

// ── API mock ─────────────────────────────────────────────────────────────────
const putEncryptionKey = vi.fn();
const getPeerEncryptionKey = vi.fn();

vi.mock('../auth/api', () => ({
  api: {
    putEncryptionKey: (...a: unknown[]) => putEncryptionKey(...a),
    getPeerEncryptionKey: (...a: unknown[]) => getPeerEncryptionKey(...a),
  },
}));

// ── keystore mock — real by default; can force ensureKeypair to reject to
// simulate a transient IndexedDB unavailability (F4 missing-key branch). ──────
let keystoreEnsureShouldReject = false;
vi.mock('../features/crypto/keystore', async () => {
  const actual = await vi.importActual<typeof import('../features/crypto/keystore')>(
    '../features/crypto/keystore',
  );
  return {
    ...actual,
    ensureKeypair: (...a: Parameters<typeof actual.ensureKeypair>) => {
      if (keystoreEnsureShouldReject) return Promise.reject(new Error('IDB unavailable'));
      return actual.ensureKeypair(...a);
    },
  };
});

import { useDmEncryption } from './useDmEncryption';

beforeEach(() => {
  vi.clearAllMocks();
  keystoreEnsureShouldReject = false;
  testDb = new StudyHallDB(new IDBFactory(), IDBKeyRange);
  putEncryptionKey.mockResolvedValue({
    userId: 'me',
    publicKey: 'pub',
    algorithm: 'ECDH-P256-AES-GCM',
    createdAt: new Date().toISOString(),
  });
});

/** Render the hook and wait until the mount-time keypair register has fired. */
async function renderReady() {
  const hook = renderHook(() => useDmEncryption());
  await waitFor(() => expect(hook.result.current.keyReady).toBe(true));
  // Capture how many times putEncryptionKey was called by mount (should be 1).
  return hook;
}

describe('useDmEncryption — F2 sender-authentication (decrypt binds to author key)', () => {
  it('decrypts with the AUTHOR key fetched by authorId, not the envelope senderKeyRef', async () => {
    // Alice authors a message to me (the hook owner). I need Alice's registered
    // key, resolved by her authorId — the envelope also carries it as senderKeyRef.
    const alice = await generateKeypair();
    getPeerEncryptionKey.mockResolvedValue({
      userId: 'alice',
      publicKey: alice.publicKeyBase64,
      algorithm: 'ECDH-P256-AES-GCM',
      createdAt: new Date().toISOString(),
    });

    const hook = await renderReady();
    // Encrypt an envelope FROM alice TO me (the hook's registered key).
    const myKp = await testDb.encryptionKeys.get('self');
    if (!myKp) throw new Error('expected self keypair');
    const myPub = await importPeerPublicKey(myKp.publicKeyBase64);
    const env = await encryptMessage('proven', alice.privateKey, alice.publicKeyBase64, myPub);

    let result!: { ok: boolean; plaintext?: string };
    await act(async () => {
      result = await hook.result.current.decryptEnvelope(
        env.ciphertext,
        'alice',
        env.senderKeyRef,
        env.envelopeVersion,
      );
    });
    expect(getPeerEncryptionKey).toHaveBeenCalledWith('alice');
    expect(result).toEqual({ ok: true, plaintext: 'proven' });
  });

  it('a mismatched envelope senderKeyRef → cannot-decrypt (no lock), even with valid ciphertext', async () => {
    // Alice is the real author; the server-registered key for authorId 'alice'
    // is alice's. But the crafted envelope asserts MALLORY's senderKeyRef.
    const alice = await generateKeypair();
    const mallory = await generateKeypair();
    getPeerEncryptionKey.mockResolvedValue({
      userId: 'alice',
      publicKey: alice.publicKeyBase64,
      algorithm: 'ECDH-P256-AES-GCM',
      createdAt: new Date().toISOString(),
    });

    const hook = await renderReady();
    const myKp = await testDb.encryptionKeys.get('self');
    if (!myKp) throw new Error('expected self keypair');
    const myPub = await importPeerPublicKey(myKp.publicKeyBase64);
    const env = await encryptMessage('spoofed', alice.privateKey, alice.publicKeyBase64, myPub);

    let result!: { ok: boolean };
    await act(async () => {
      result = await hook.result.current.decryptEnvelope(
        env.ciphertext,
        'alice',
        mallory.publicKeyBase64, // spoofed senderKeyRef ≠ author's registered key
        env.envelopeVersion,
      );
    });
    expect(result).toEqual({ ok: false });
  });
});

describe('useDmEncryption — F4 no side-effecting keygen on decrypt', () => {
  it('a MISSING private key at decrypt → cannot-decrypt and does NOT rotate/re-register', async () => {
    // Simulate a transient IndexedDB unavailability: mount-time ensureKeypair
    // rejects, so there is NO local private key. A decrypt attempt in this state
    // must FAIL CLOSED and must NOT regenerate + re-register a fresh keypair
    // (which would overwrite the good server-registered key and orphan history).
    keystoreEnsureShouldReject = true;

    const alice = await generateKeypair();
    getPeerEncryptionKey.mockResolvedValue({
      userId: 'alice',
      publicKey: alice.publicKeyBase64,
      algorithm: 'ECDH-P256-AES-GCM',
      createdAt: new Date().toISOString(),
    });

    const hook = renderHook(() => useDmEncryption());
    // Mount resolution failed → keyReady is false and NO key was registered.
    await waitFor(() => expect(hook.result.current.keyReady).toBe(false));
    expect(putEncryptionKey).not.toHaveBeenCalled();

    let result!: { ok: boolean };
    await act(async () => {
      result = await hook.result.current.decryptEnvelope('YWJj', 'alice', undefined, 1);
    });
    // Fail-closed: no private key → cannot-decrypt.
    expect(result.ok).toBe(false);
    // CRITICAL (F4): decrypt did NOT regenerate + re-register a keypair.
    expect(putEncryptionKey).not.toHaveBeenCalled();
  });

  it('decrypt NEVER calls putEncryptionKey (no re-registration as a receive side effect)', async () => {
    getPeerEncryptionKey.mockRejectedValue(new Error('404'));
    const hook = await renderReady();
    const registerCallsAfterMount = putEncryptionKey.mock.calls.length;
    await act(async () => {
      await hook.result.current.decryptEnvelope('YWJj', 'ghost', undefined, 1);
    });
    // Author key unresolvable (404) → cannot-decrypt, and crucially decrypt did
    // NOT regenerate + re-register our keypair.
    expect(putEncryptionKey.mock.calls.length).toBe(registerCallsAfterMount);
  });
});

describe('useDmEncryption — F6 stale peer-key re-fetch on decrypt failure', () => {
  it('re-fetches the author key (cache bypass) after a decrypt failure with a cached key', async () => {
    // First selection caches a STALE (wrong/rotated) key for alice; the real
    // author key that decrypts is served on the forced re-fetch.
    const staleKey = await generateKeypair();
    const alice = await generateKeypair();
    getPeerEncryptionKey
      .mockResolvedValueOnce({
        userId: 'alice',
        publicKey: staleKey.publicKeyBase64,
        algorithm: 'ECDH-P256-AES-GCM',
        createdAt: new Date().toISOString(),
      })
      .mockResolvedValueOnce({
        userId: 'alice',
        publicKey: alice.publicKeyBase64,
        algorithm: 'ECDH-P256-AES-GCM',
        createdAt: new Date().toISOString(),
      });

    const hook = await renderReady();
    const myKp = await testDb.encryptionKeys.get('self');
    if (!myKp) throw new Error('expected self keypair');
    const myPub = await importPeerPublicKey(myKp.publicKeyBase64);

    // Warm the cache with the STALE key via resolveConversation.
    act(() => {
      hook.result.current.resolveConversation(
        {
          id: 'c',
          isGroup: false,
          participants: [
            { userId: 'me', displayName: 'Me', avatar: null },
            { userId: 'alice', displayName: 'Alice', avatar: null },
          ],
          lastMessage: null,
          createdAt: new Date().toISOString(),
        },
        'me',
      );
    });
    await waitFor(() => expect(getPeerEncryptionKey).toHaveBeenCalledTimes(1));

    // Alice actually encrypted with her CURRENT (rotated) key → the cached stale
    // key can't decrypt; the hook must re-fetch and succeed.
    const env = await encryptMessage('rotated', alice.privateKey, alice.publicKeyBase64, myPub);
    let result!: { ok: boolean; plaintext?: string };
    await act(async () => {
      result = await hook.result.current.decryptEnvelope(
        env.ciphertext,
        'alice',
        env.senderKeyRef,
        env.envelopeVersion,
      );
    });
    expect(getPeerEncryptionKey).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: true, plaintext: 'rotated' });
  });
});
