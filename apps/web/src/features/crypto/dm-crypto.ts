/**
 * dm-crypto.ts — client-side E2E encryption primitives for DM messages.
 *
 * Scheme (ENCRYPTION_ALGORITHMS[0] = 'ECDH-P256-AES-GCM', wave-79 M13 leg-3a):
 *   - Identity keypair: ECDH over NIST P-256. The PRIVATE key is generated
 *     non-extractable and lives ONLY in dexie (IndexedDB) on this device; it
 *     is NEVER exported to bytes and NEVER transmitted. The PUBLIC key is
 *     exported as base64 SPKI and registered via PUT /profile/encryption-key.
 *   - Per message: ECDH-derive a 256-bit AES-GCM shared secret from (my
 *     private key, peer public key), then AES-GCM encrypt the UTF-8 plaintext
 *     with a FRESH random 12-byte IV. The envelope carries iv + ciphertext so
 *     the recipient (deriving the SAME shared secret from their private key +
 *     my public key) can decrypt.
 *
 * Envelope wire format (base64 of a JSON string), envelopeVersion = 1:
 *   { "iv": "<base64 12-byte IV>", "ct": "<base64 AES-GCM ciphertext+tag>" }
 * The senderKeyRef field of the DM envelope carries the sender's base64 SPKI
 * public key so the recipient can import it and derive the shared secret
 * without a second round-trip.
 *
 * SECURITY INVARIANTS (enforced here, asserted in tests):
 *   - The private key is generated with extractable=false → SubtleCrypto will
 *     refuse to export it; it cannot appear in any request body.
 *   - Every encrypt() call uses a fresh crypto.getRandomValues IV (no reuse).
 *   - decrypt() NEVER throws to callers as an uncaught error — a bad/foreign
 *     ciphertext yields a typed DecryptFailure the UI renders as the calm
 *     "cannot decrypt on this device" state, never a crash or a false padlock.
 */

import type { EncryptionAlgorithm } from '@studyhall/shared';
import { ENCRYPTION_ALGORITHMS } from '@studyhall/shared';

/** The single supported algorithm identifier this module implements. */
export const DM_ENCRYPTION_ALGORITHM: EncryptionAlgorithm = ENCRYPTION_ALGORITHMS[0];

/** Envelope-format version. Bump when the wire shape changes. */
export const ENVELOPE_VERSION = 1 as const;

const EC_PARAMS: EcKeyGenParams = { name: 'ECDH', namedCurve: 'P-256' };
const AES_LENGTH = 256;
const IV_BYTES = 12;

// ── base64 helpers (browser + jsdom safe; no Node Buffer dependency) ──────────

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i] as number);
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** UTF-8 encode into a Uint8Array with a concrete ArrayBuffer backing (TS 5.7 BufferSource). */
function utf8(s: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(s);
  const out = new Uint8Array(new ArrayBuffer(encoded.length));
  out.set(encoded);
  return out;
}

// ── Keypair generation + public-key serialization ─────────────────────────────

export type GeneratedKeypair = {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  /** base64 SPKI export of the public key — the only material ever transmitted. */
  publicKeyBase64: string;
};

/**
 * Generate a fresh ECDH-P256 keypair. The private key is NON-EXTRACTABLE:
 * SubtleCrypto will reject any exportKey() attempt on it, guaranteeing the
 * private key can never be serialized into a network request.
 */
export async function generateKeypair(): Promise<GeneratedKeypair> {
  const pair = await crypto.subtle.generateKey(
    EC_PARAMS,
    // extractable=false → private key can NEVER be exported. Load-bearing.
    false,
    ['deriveKey', 'deriveBits'],
  );
  const spki = await crypto.subtle.exportKey('spki', pair.publicKey);
  return {
    privateKey: pair.privateKey,
    publicKey: pair.publicKey,
    publicKeyBase64: bytesToBase64(new Uint8Array(spki)),
  };
}

/** Import a peer's base64 SPKI public key into a CryptoKey for ECDH derivation. */
export async function importPeerPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  const spki = base64ToBytes(publicKeyBase64);
  return crypto.subtle.importKey('spki', spki, EC_PARAMS, false, []);
}

// ── Shared-secret derivation ──────────────────────────────────────────────────

async function deriveSharedKey(
  privateKey: CryptoKey,
  peerPublicKey: CryptoKey,
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: peerPublicKey },
    privateKey,
    { name: 'AES-GCM', length: AES_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ── Envelope encrypt / decrypt ────────────────────────────────────────────────

export type EncryptedEnvelope = {
  /** base64 JSON payload {iv, ct}. */
  ciphertext: string;
  /** Sender's base64 SPKI public key — the recipient derives the shared secret from it. */
  senderKeyRef: string;
  envelopeVersion: number;
};

/**
 * Encrypt `plaintext` to the peer's public key. Uses a FRESH random IV per
 * call (never reused). Returns the wire envelope the DM send will carry.
 */
export async function encryptMessage(
  plaintext: string,
  myPrivateKey: CryptoKey,
  myPublicKeyBase64: string,
  peerPublicKey: CryptoKey,
): Promise<EncryptedEnvelope> {
  const sharedKey = await deriveSharedKey(myPrivateKey, peerPublicKey);
  // Fresh, unique IV every message — GCM key-reuse safety.
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(IV_BYTES)));
  const ctBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sharedKey, utf8(plaintext));
  const payload = JSON.stringify({
    iv: bytesToBase64(iv),
    ct: bytesToBase64(new Uint8Array(ctBuf)),
  });
  return {
    ciphertext: bytesToBase64(utf8(payload)),
    senderKeyRef: myPublicKeyBase64,
    envelopeVersion: ENVELOPE_VERSION,
  };
}

export type DecryptResult =
  | { ok: true; plaintext: string }
  // Fail-closed: the UI renders this as the calm "cannot decrypt" state.
  // We NEVER surface a partial/garbled plaintext and NEVER throw to the caller.
  | { ok: false };

/**
 * Decrypt an incoming envelope. Returns a typed result — NEVER throws.
 * Any failure (wrong key / lost private key / corrupt payload / unknown
 * version) resolves to { ok: false }, which the indicator honestly renders
 * as "cannot decrypt on this device" rather than crashing or faking success.
 */
export async function decryptMessage(
  ciphertextBase64: string,
  senderKeyRefBase64: string,
  envelopeVersion: number | null | undefined,
  myPrivateKey: CryptoKey,
): Promise<DecryptResult> {
  try {
    if (envelopeVersion !== ENVELOPE_VERSION) return { ok: false };
    const senderPublicKey = await importPeerPublicKey(senderKeyRefBase64);
    const sharedKey = await deriveSharedKey(myPrivateKey, senderPublicKey);
    const payloadJson = new TextDecoder().decode(base64ToBytes(ciphertextBase64));
    const parsed = JSON.parse(payloadJson) as { iv?: unknown; ct?: unknown };
    if (typeof parsed.iv !== 'string' || typeof parsed.ct !== 'string') return { ok: false };
    const iv = base64ToBytes(parsed.iv);
    const ct = base64ToBytes(parsed.ct);
    const ptBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, sharedKey, ct);
    return { ok: true, plaintext: new TextDecoder().decode(ptBuf) };
  } catch {
    // Wrong key, tampered ciphertext, malformed base64/JSON — all fail closed.
    return { ok: false };
  }
}
