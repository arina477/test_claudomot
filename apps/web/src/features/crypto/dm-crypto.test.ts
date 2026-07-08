/**
 * dm-crypto.test.ts — wave-79 B-3 client-side E2E crypto + keystore.
 *
 * Covers:
 *   - keygen + register: the PRIVATE key is non-extractable (never exportable,
 *     never in a request body); only the base64 SPKI PUBLIC key is emitted.
 *   - encrypt → send → decrypt round-trip between two keyholders.
 *   - key-loss degrade: a peer without the matching private key cannot decrypt
 *     and gets a typed fail-closed result (no throw, no crash).
 *   - regenerateKeypair rotates the device key (prior ciphertext undecryptable).
 */

import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { StudyHallDB } from '../sync/db';
import {
  ENVELOPE_VERSION,
  decryptMessage,
  encryptMessage,
  generateKeypair,
  importPeerPublicKey,
} from './dm-crypto';
import { ensureKeypair, loadKeypair, regenerateKeypair } from './keystore';

describe('dm-crypto — keygen + non-extractable private key', () => {
  it('generates a keypair whose PRIVATE key is non-extractable (never serializable)', async () => {
    const kp = await generateKeypair();
    // The private key must be non-extractable so SubtleCrypto refuses to export
    // it — it can NEVER appear in a network request body.
    expect(kp.privateKey.extractable).toBe(false);
    await expect(crypto.subtle.exportKey('pkcs8', kp.privateKey)).rejects.toThrow();
    // Only public material is emitted, as a non-empty base64 string.
    expect(typeof kp.publicKeyBase64).toBe('string');
    expect(kp.publicKeyBase64.length).toBeGreaterThan(0);
  });

  it('exports a public key that a peer can re-import for ECDH', async () => {
    const kp = await generateKeypair();
    const imported = await importPeerPublicKey(kp.publicKeyBase64);
    expect(imported.type).toBe('public');
  });
});

describe('dm-crypto — encrypt/decrypt round-trip', () => {
  it('a message encrypted to the peer decrypts back to plaintext (2 keyholders)', async () => {
    const alice = await generateKeypair();
    const bob = await generateKeypair();
    const bobPub = await importPeerPublicKey(bob.publicKeyBase64);

    const plaintext = 'the variance in column C is anomalous';
    const env = await encryptMessage(plaintext, alice.privateKey, alice.publicKeyBase64, bobPub);

    // Envelope carries ciphertext + sender ref + version — never the plaintext.
    expect(env.ciphertext).not.toContain('anomalous');
    expect(env.senderKeyRef).toBe(alice.publicKeyBase64);
    expect(env.envelopeVersion).toBe(ENVELOPE_VERSION);

    // Bob derives the SAME shared secret (his private + Alice's REGISTERED
    // public key, passed as the author key) → decrypts. The envelope's
    // senderKeyRef matches the author key, so sender-auth passes.
    const result = await decryptMessage(
      env.ciphertext,
      alice.publicKeyBase64,
      env.senderKeyRef,
      env.envelopeVersion,
      bob.privateKey,
    );
    expect(result).toEqual({ ok: true, plaintext });
  });

  it('uses a fresh IV per message (two encrypts of the same text differ)', async () => {
    const alice = await generateKeypair();
    const bob = await generateKeypair();
    const bobPub = await importPeerPublicKey(bob.publicKeyBase64);
    const a = await encryptMessage('same', alice.privateKey, alice.publicKeyBase64, bobPub);
    const b = await encryptMessage('same', alice.privateKey, alice.publicKeyBase64, bobPub);
    expect(a.ciphertext).not.toEqual(b.ciphertext);
  });
});

describe('dm-crypto — fail-closed decrypt (key-loss / wrong key)', () => {
  it('a keyholder without the matching key gets { ok:false } — never throws', async () => {
    const alice = await generateKeypair();
    const bob = await generateKeypair();
    const eve = await generateKeypair(); // wrong recipient
    const bobPub = await importPeerPublicKey(bob.publicKeyBase64);

    const env = await encryptMessage('secret', alice.privateKey, alice.publicKeyBase64, bobPub);
    // Eve tries to decrypt Bob's message (author = Alice) → fails closed, no throw.
    const result = await decryptMessage(
      env.ciphertext,
      alice.publicKeyBase64,
      env.senderKeyRef,
      env.envelopeVersion,
      eve.privateKey,
    );
    expect(result).toEqual({ ok: false });
  });

  it('a corrupt/garbage ciphertext resolves { ok:false } rather than throwing', async () => {
    const bob = await generateKeypair();
    // author key is a valid public key; the ciphertext itself is garbage.
    const alice = await generateKeypair();
    const result = await decryptMessage(
      'not-valid-base64-@@@',
      alice.publicKeyBase64,
      alice.publicKeyBase64,
      1,
      bob.privateKey,
    );
    expect(result).toEqual({ ok: false });
  });

  it('F2: an envelope senderKeyRef that does NOT match the author key fails closed (no decrypt)', async () => {
    const alice = await generateKeypair(); // real author
    const bob = await generateKeypair(); // recipient
    const mallory = await generateKeypair(); // attacker-chosen sender key
    const bobPub = await importPeerPublicKey(bob.publicKeyBase64);

    // Alice legitimately encrypts to Bob; the true author key is alice's.
    const env = await encryptMessage('audit me', alice.privateKey, alice.publicKeyBase64, bobPub);

    // A crafted envelope claims Mallory's senderKeyRef while attributed to Alice.
    // Decrypting binds to the AUTHOR's registered key (alice) but the envelope
    // asserts a MISMATCHED senderKeyRef → sender-auth rejects → { ok:false }.
    const result = await decryptMessage(
      env.ciphertext,
      alice.publicKeyBase64, // author's server-registered key
      mallory.publicKeyBase64, // spoofed senderKeyRef in the envelope
      env.envelopeVersion,
      bob.privateKey,
    );
    expect(result).toEqual({ ok: false });
  });

  it('an unknown envelope version fails closed', async () => {
    const alice = await generateKeypair();
    const bob = await generateKeypair();
    const bobPub = await importPeerPublicKey(bob.publicKeyBase64);
    const env = await encryptMessage('x', alice.privateKey, alice.publicKeyBase64, bobPub);
    const result = await decryptMessage(
      env.ciphertext,
      alice.publicKeyBase64,
      env.senderKeyRef,
      999,
      bob.privateKey,
    );
    expect(result).toEqual({ ok: false });
  });
});

describe('keystore — device-local persistence (private key stays in dexie)', () => {
  let db: StudyHallDB;
  beforeEach(() => {
    db = new StudyHallDB(new IDBFactory(), IDBKeyRange);
  });

  it('ensureKeypair generates once and reuses the same stored keypair', async () => {
    expect(await loadKeypair(db)).toBeNull();
    const first = await ensureKeypair(db);
    const second = await ensureKeypair(db);
    expect(second.publicKeyBase64).toBe(first.publicKeyBase64);
    // Persisted row is keyed by the singleton id 'self'.
    const stored = await loadKeypair(db);
    expect(stored?.id).toBe('self');
    // The stored PRIVATE key remains non-extractable in IDB.
    expect(stored?.privateKey.extractable).toBe(false);
  });

  it('regenerateKeypair rotates the device key (prior ciphertext becomes undecryptable)', async () => {
    const alice = await ensureKeypair(db);
    const bob = await generateKeypair();
    const bobPub = await importPeerPublicKey(bob.publicKeyBase64);
    // Encrypt to Bob using the OLD alice key (irrelevant to alice's own decrypt).
    // Simulate key-loss on Bob's device: he rotates before receiving.
    const bobDb = new StudyHallDB(new IDBFactory(), IDBKeyRange);
    await bobDb.encryptionKeys.put({
      id: 'self',
      privateKey: bob.privateKey,
      publicKey: bob.publicKey,
      publicKeyBase64: bob.publicKeyBase64,
      createdAt: new Date().toISOString(),
    });
    const env = await encryptMessage('hi bob', alice.privateKey, alice.publicKeyBase64, bobPub);

    const rotated = await regenerateKeypair(bobDb);
    expect(rotated.publicKeyBase64).not.toBe(bob.publicKeyBase64);
    // Bob's NEW private key can't decrypt the message sent to his OLD key.
    const result = await decryptMessage(
      env.ciphertext,
      alice.publicKeyBase64,
      env.senderKeyRef,
      env.envelopeVersion,
      rotated.privateKey,
    );
    expect(result).toEqual({ ok: false });
  });
});
