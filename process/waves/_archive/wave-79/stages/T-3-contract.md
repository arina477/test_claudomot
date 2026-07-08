# T-3 — Contract (wave-79)

**Wave:** M13 leg-3a — server-blind E2E DM encryption.
**Pattern:** mixed — B (active live probe of the two new REST endpoints) + A (shared Zod contract verified by CI test job).
**Live api:** https://api-production-b93e.up.railway.app · merge commit `0fa0f5f`.

## Contract surface (B-1)
- `packages/shared/src/privacy.ts`: `EncryptionKeySchema {publicKey: string min1 max2000, algorithm: z.enum(['ECDH-P256-AES-GCM'])}`; `PublicKeyResponseSchema {userId, publicKey, algorithm, createdAt}`.
- `packages/shared/src/dm.ts`: `SendDmMessageSchema.content` → nullable; +ciphertext/senderKeyRef/envelopeVersion.
- New REST: `PUT /profile/encryption-key` (self, AuthGuard); `GET /profile/:userId/encryption-key` (who_can_dm-gated).

## Action 3 — Active probe (live prod, Fixture A id 21984eb2… / Fixture B id da74148e…, header-mode Bearer)

### PUT /profile/encryption-key
| Probe | Expected | Observed | Verdict |
|---|---|---|---|
| valid key + algorithm (store) | 200 | `200 {"ok":true}` | PASS |
| second PUT (rotate/replace) | 200 | `200 {"ok":true}` (self-GET later returns ROTATED_PUBKEY → replace proven) | PASS |
| unsupported algorithm `RSA-1024-WEAK` | 400 | `400 {fieldErrors.algorithm:["Invalid enum value. Expected 'ECDH-P256-AES-GCM'…"]}` | PASS |
| oversized publicKey (2500 chars) | 400 | `400 {fieldErrors.publicKey:["publicKey must not exceed 2000 characters"]}` | PASS |
| empty publicKey | 400 | `400 {fieldErrors.publicKey:["publicKey must not be empty"]}` | PASS |
| unauth | 401 | `401 {"message":"unauthorised"}` | PASS |

### GET /profile/:userId/encryption-key
| Probe | Expected | Observed | Verdict |
|---|---|---|---|
| A fetches B (co-members, who_can_dm=everyone, key present) | 200 PublicKeyResponse | `200 {userId, publicKey:"FIXTURE_B_PUBKEY…", algorithm, createdAt}` | PASS |
| self-fetch (A fetches own) | 200 | `200 {userId:A, publicKey:"ROTATED_PUBKEY…", …}` (rotation confirmed) | PASS |
| unauth | 401 | `401 {"message":"unauthorised"}` | PASS |

**PublicKeyResponse shape verified:** exactly `{userId, publicKey, algorithm, createdAt}`. **No `email` field, no private material** in either response. Matches PublicKeyResponseSchema.

(Uniform-404 no-oracle matrix + who_can_dm gate exercised live at T-8 Action 2 — deferred to security stage where the byte-identical assertion lives.)

## Action 2 — Pattern A confirmation (shared contract via CI)
C-1 test job green: `dm-encryption.integration.spec.ts` exercises `SendDmMessageSchema.safeParse` mutual-exclusivity (both/neither/partial → reject; plaintext-only → accept) and `EncryptionKeySchema`. Bounded z.enum enforced at both type + runtime (live 400 above).

## Action 4 — Coverage audit
Every B-1 contract surface traced: PUT (store/rotate/400×3/401) + GET (200/self/401) live; envelope schema via CI. Negative cases covered (bad algorithm, oversized, empty, unauth). Response shape byte-inspected — no email/private leak.

```yaml
test_pattern: mixed
skipped: false
contracts_audited: [EncryptionKeySchema, PublicKeyResponseSchema, SendDmMessageSchema-envelope]
ci_evidence: ["C-1 test job 28912467863 green — SendDmMessageSchema mutual-exclusivity + EncryptionKeySchema"]
active_probe_results:
  - "PUT /profile/encryption-key: 200 store, 200 rotate, 400 bad-algo, 400 oversized, 400 empty, 401 unauth — all as spec"
  - "GET /profile/:userId/encryption-key: 200 PublicKeyResponse {userId,publicKey,algorithm,createdAt} (no email/private), self-fetch 200, unauth 401"
infrastructure_gap_recorded: false
findings: []
```
