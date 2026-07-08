/**
 * keystore.ts — device-local persistence for the E2E DM keypair (wave-79).
 *
 * The keypair lives in the `encryptionKeys` dexie table (singleton, id='self').
 * The PRIVATE key is a non-extractable CryptoKey stored directly — IndexedDB's
 * structured-clone preserves CryptoKey handles without ever exposing their raw
 * bytes, so the private key never leaves the browser and can never be put on
 * the wire. This module owns get/put/clear only; registration with the server
 * (PUT /profile/encryption-key) and the key-loss regeneration policy live in
 * the calling hook.
 */

import type { StudyHallDB } from '../sync/db';
import type { StoredKeypair } from '../sync/types';
import { type GeneratedKeypair, generateKeypair } from './dm-crypto';

const SELF_ID = 'self' as const;

/** Read the device-local keypair, or null if none has been generated yet. */
export async function loadKeypair(db: StudyHallDB): Promise<StoredKeypair | null> {
  const row = await db.encryptionKeys.get(SELF_ID);
  return row ?? null;
}

/** Persist a freshly generated keypair as the singleton device key. */
export async function saveKeypair(db: StudyHallDB, kp: GeneratedKeypair): Promise<StoredKeypair> {
  const row: StoredKeypair = {
    id: SELF_ID,
    privateKey: kp.privateKey,
    publicKey: kp.publicKey,
    publicKeyBase64: kp.publicKeyBase64,
    createdAt: new Date().toISOString(),
  };
  await db.encryptionKeys.put(row);
  return row;
}

/**
 * Return the existing device keypair, generating + persisting a fresh one on
 * first use. Idempotent: repeated calls return the same stored keypair.
 */
export async function ensureKeypair(db: StudyHallDB): Promise<StoredKeypair> {
  const existing = await loadKeypair(db);
  if (existing) return existing;
  const generated = await generateKeypair();
  return saveKeypair(db, generated);
}

/**
 * Regenerate the keypair (key-loss / new-device recovery). Prior encrypted
 * history becomes undecryptable and honestly shows the "cannot decrypt" state —
 * accepted for v1, no crash. Returns the new stored keypair; the caller must
 * re-register the new public key with the server.
 */
export async function regenerateKeypair(db: StudyHallDB): Promise<StoredKeypair> {
  const generated = await generateKeypair();
  return saveKeypair(db, generated);
}
