# Wave 79 — B-1 Contracts

typescript-pro (commit 1567aa71):
- `packages/shared/src/privacy.ts`: `ENCRYPTION_ALGORITHMS = ['ECDH-P256-AES-GCM']` (bounded z.enum → unsupported/oversized → 400 per P-4); `EncryptionKeySchema {publicKey: string min1 max2000, algorithm: z.enum(...)}`; `PublicKeyResponseSchema {userId, publicKey, algorithm, createdAt}` (no private material, no email).
- `packages/shared/src/dm.ts`: `DmMessageSchema.content` → nullable; +`ciphertext`/`senderKeyRef`/`envelopeVersion` (nullable optional). Backward-compat (plaintext = content set, ciphertext null). Canonical DM contract lives in shared (consumed api+web).
- index.ts ESM `.js` named re-exports added. Isolation typecheck `pnpm --filter @studyhall/shared typecheck` exit 0; dist rebuilt (gitignored). No deviations.

```yaml
skipped: false
contracts_authored: [packages/shared/src/privacy.ts, packages/shared/src/dm.ts]
sdk_regenerated: false
fast_path_approved: false
deviations: []
```
