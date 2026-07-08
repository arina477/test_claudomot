# V-1 Karen — wave-79 (server-blind E2E DM encryption) reality verification

**Axis:** load-bearing CLAIM verification against merge tree + LIVE deployed prod (NOT spec conformance — that is jenny's axis).
**Merge commit:** `0fa0f5f0aa6dfcf86e2df0d7dcc12083167ab3fa` (PR #98, merged, deployed).
**Prod:** api `https://api-production-b93e.up.railway.app` (/health 200) · web `https://web-production-bce1a8.up.railway.app`.
**Method:** `git show 0fa0f5f:<path>` (content, not commit ancestry — squash-merge), live curl probes, Railway GraphQL deployment-state (`Project-Access-Token`, no CLI/Bearer), and a read-only prod-DB schema probe over `DATABASE_PUBLIC_URL`.

## VERDICT: **APPROVE** — 7/7 claims TRUE. 0 REJECT. 0 blocking.

---

### Claim 1 — Files exist on merge tree — **APPROVE**
All 10 named source files + both migrations present on the `0fa0f5f` tree (verified via `git cat-file -e`):
- `apps/api/src/profile/encryption-key.service.ts` (79 lines, new)
- `apps/api/src/profile/profile.controller.ts` (PUT + GET key endpoints, +105)
- `apps/api/src/dm/dm.service.ts` (server-blind + canDm seam, +115)
- `apps/web/src/features/crypto/dm-crypto.ts` (206 lines, new) + `keystore.ts` (58, new)
- `apps/web/src/shell/useDmEncryption.ts` (271, new) + `DmEncryptionIndicator.tsx` (147, new)
- `packages/shared/src/privacy.ts` (39, new) + `dm.ts` (envelope, +89)
- migrations `0031_wave79_user_encryption_keys.sql` + `0032_wave79_dm_envelope.sql` (+ meta snapshots + `_journal.json`)
- `apps/api/test/integration/dm-encryption.integration.spec.ts` (423, new)

### Claim 2 — who_can_dm gate (load-bearing authz) — **APPROVE**
`profile.controller.ts:141` `@Get(':userId/encryption-key')` `@UseGuards(SessionNoVerifyGuard)`. Enforcing line `:151-152`:
```
const permitted = viewerUserId === targetUserId || (await this.dmService.canDm(viewerUserId, targetUserId));
if (!permitted) throw new NotFoundException('Encryption key not found');   // :154
```
Gate is the **canDm seam (who_can_dm)**, NOT ProfileVisibilityService (ProfileVisibilityService gates only the separate `GET /profile/:userId` at :190-200). Uniform 404: not-permitted (:154), no-key (:161), and target-missing (canDm returns false, `dm.service.ts:180`) all funnel to the byte-identical `NotFoundException('Encryption key not found')`. **Live probe:** unauth `GET /profile/<id>/encryption-key` → **401**, unauth `PUT /profile/encryption-key` → **401**. Both routes live.

### Claim 3 — Server-blind persistence + XOR at Zod boundary — **APPROVE**
`dm.service.ts:649-657` — encrypted path persists `content: null`, `ciphertext/sender_key_ref/envelope_version` set; plaintext path (`:663-666`) sets content, leaves envelope cols NULL. XOR enforced at the request boundary in `packages/shared/src/dm.ts:145-158` (`SendDmMessageSchema.refine`): "either plaintext content OR an encrypted envelope, never both and never neither"; a second refine (`:160-172`) requires the full envelope (ciphertext+senderKeyRef+envelopeVersion) together.

### Claim 4 — Private-key confinement — **APPROVE**
`dm-crypto.ts:80-85` `generateKeypair` → `crypto.subtle.generateKey(EC_PARAMS, false, ['deriveKey','deriveBits'])` — `extractable=false`, comment "Load-bearing". Only the PUBLIC key is exported (`:87` `exportKey('spki', pair.publicKey)`). No `exportKey` of `privateKey` anywhere. `keystore.ts` stores the non-extractable `CryptoKey` handle in IndexedDB via structured-clone (raw bytes never exposed).

### Claim 5 — B-6 crypto fixes present in merge tree (dc7132e content) — **APPROVE**
Verified by CONTENT in `0fa0f5f` (not ancestry):
- **F2** (sender-auth) — `dm-crypto.ts:172-204`: shared secret derived against the AUTHOR's server-registered key (`authorPublicKeyBase64`, resolved from `authorId` by caller), NOT the envelope's key. A present-but-mismatched `envelopeSenderKeyRef` fails closed (`:186-191` returns `{ok:false}`).
- **F4** (no side-effecting regen) — `useDmEncryption.ts:224-237`: private key resolved WITHOUT regeneration; a MISSING key falls to `{ok:false}` (cannot-decrypt), "never rotate, never re-register". Keypair creation confined to explicit mount/first-use `ensureKeypair`.
- **F7** (proof-based delivered row) — `useDm.ts:203` records real send outcome into `sentModeRef` keyed by idempotencyKey; `:248-256` `buildDeliveredRow` consumes it — label derives from what actually went on the wire, absent → fail closed to not-encrypted (never a false padlock).

### Claim 6 — Migrations applied to prod (C-2) — **APPROVE (independently reverified)**
C-2 deliverable claims 0031→0032 applied in order before api deploy with column verification. **Independently confirmed against LIVE prod DB** (read-only probe over `DATABASE_PUBLIC_URL`): `user_encryption_keys` table PRESENT with **no private-key column** (`%private%` col count = 0); `dm_messages.content` `is_nullable=YES`; `ciphertext`, `sender_key_ref`, `envelope_version`, `deleted_at` all present. **Deploy state (Railway GraphQL `deployments(first:1)`):** api SUCCESS `commitHash=0fa0f5f…`; web SUCCESS `commitHash=0fa0f5f…` — both == merge SHA.

### Claim 7 — Antipattern: server-blind real, integration spec real — **APPROVE**
- **No hidden plaintext retention.** The two `logger.debug` calls (`dm.service.ts:358, 718`) log only conversation/message/author IDs — never content. Last-message preview (`:511-517`) uses a fixed `'Encrypted message'` placeholder for content-NULL rows (no leak). Gateway fan-out emits the same `toDto` (`:108` content = `row.content`, NULL for encrypted; ciphertext passed "verbatim, never decrypted"). No notification/push path carries DM content. Server never decrypts.
- **Integration spec is real, not hollow.** `dm-encryption.integration.spec.ts` uses `pg-harness` (first import, real Postgres) and asserts via **separate-connection SELECT read-backs**: `:145-148` row `content` IS NULL + `ciphertext`/`sender_key_ref`/`envelope_version` set; `:170-174` a `count(*) WHERE content IS NOT NULL` = '0' (no-plaintext-anywhere proof); `:239-254` plaintext-regression case (content set, ciphertext NULL); `:265-273` idempotency; `:285-287` key round-trip. Real-DB assertions, not mocked.

---

## Non-blocking notes (informational; V-2 owns follow-ups)
B-6 tagged 3 non-blocking crypto follow-ups already carried into V-block: F3 (server-side senderKeyRef validation), F5 (who_can_dm key-fetch timing oracle), F8 (GET encryption-key rate-limit). None affect the load-bearing server-blind/authz claims above.

**All 7 load-bearing claims are TRUE in the merge tree and on live prod. APPROVE.**
