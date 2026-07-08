import { z } from 'zod';

export const PROFILE_VISIBILITY = ['everyone', 'server-members', 'nobody'] as const;
export const WHO_CAN_DM = ['everyone', 'server-members', 'nobody'] as const;

export type ProfileVisibility = (typeof PROFILE_VISIBILITY)[number];
export type WhoCanDm = (typeof WHO_CAN_DM)[number];

export const PrivacySettingsResponseSchema = z.object({
  profileVisibility: z.enum(PROFILE_VISIBILITY),
  whoCanDm: z.enum(WHO_CAN_DM),
  showPresence: z.boolean(),
});

export type PrivacySettingsResponse = z.infer<typeof PrivacySettingsResponseSchema>;

export const UpdatePrivacySchema = z.object({
  profileVisibility: z.enum(PROFILE_VISIBILITY),
  whoCanDm: z.enum(WHO_CAN_DM),
  showPresence: z.boolean(),
});

export type UpdatePrivacyInput = z.infer<typeof UpdatePrivacySchema>;

// ── E2E DM encryption: supported algorithms (server-blind key exchange) ───────
// Bounded enum so the PUT /profile/encryption-key boundary rejects
// unsupported/unknown algorithms with a 400 (per P-4 karen).
//
// 'ECDH-P256-AES-GCM' identifies the v1 envelope scheme: an ECDH key agreement
// over the NIST P-256 curve deriving a shared secret, used to key AES-GCM for
// per-message content encryption. B-3 confirms the concrete Web Crypto
// primitive maps (ECDH namedCurve 'P-256' → AES-GCM) this identifier stands for.
// Single-entry today; append future schemes here as they are introduced.
export const ENCRYPTION_ALGORITHMS = ['ECDH-P256-AES-GCM'] as const;
export type EncryptionAlgorithm = (typeof ENCRYPTION_ALGORITHMS)[number];

// ── PUT /profile/encryption-key request ───────────────────────────────────────
// publicKey: exported public key material (e.g. base64 SPKI). Bounded to 2000
//   chars — a P-256 SPKI export is well under that; oversized → 400.
// algorithm: must be a supported scheme; unknown value → 400.
// No private material ever crosses this boundary (private key stays client-side).
export const EncryptionKeySchema = z.object({
  publicKey: z
    .string()
    .min(1, 'publicKey must not be empty')
    .max(2000, 'publicKey must not exceed 2000 characters'),
  algorithm: z.enum(ENCRYPTION_ALGORITHMS),
});

export type EncryptionKeyInput = z.infer<typeof EncryptionKeySchema>;

// ── GET /profile/:userId/encryption-key response ──────────────────────────────
// Public key material only — NO private material, NO email. Lets a peer fetch
// the recipient's public key to encrypt an envelope they alone can decrypt.
export const PublicKeyResponseSchema = z.object({
  userId: z.string(),
  publicKey: z.string(),
  algorithm: z.enum(ENCRYPTION_ALGORITHMS),
  createdAt: z.string(), // ISO 8601
});

export type PublicKeyResponse = z.infer<typeof PublicKeyResponseSchema>;
