# Wave 79 — B-block exit gate verdict (B-6)

- **block:** B (Build)
- **wave:** 79 — M13 leg-3a, server-blind E2E DM encryption (multi-spec, 3 blocks)
- **branch:** wave-79-e2e-dm-encryption
- **phase:** 1
- **attempt:** 1
- **gate:** head-builder (Staff/Principal SWE)
- **agentId:** head-builder-1783475554-136039
- **mode:** automatic
- **verdict:** APPROVED
- **decided_at:** 2026-07-08

---

## Verdict: APPROVED

The crypto core, the server-blind write boundary, the who_can_dm authz gate, private-key confinement, and the honest fail-closed indicator all hold under independent review. This is a real (v1-scoped) server-blind E2E posture, not security theater. No server-blind leak, no wrong authz gate, no private-key exposure, no false-padlock path was found. All P-4 BINDING corrections are honored. Every load-bearing AC carries a non-happy proof.

---

## Judgement against the spec + P-4 corrections + BUILD security bar

### 1. Server-blind invariant — HOLDS (crown jewel)
- `dm.service.sendMessage` (dm.service.ts:648-664): `isEncrypted = input.ciphertext !== undefined` → persists `content: null` + ciphertext/sender_key_ref/envelope_version; plaintext path leaves the three envelope columns NULL. Server never persists readable plaintext for an encrypted send.
- Encrypted+plaintext-BOTH is rejected at the write boundary — `SendDmMessageSchema` refine `hasContent !== hasCiphertext` (dm.ts:145-159) rejects both AND neither; a second refine rejects a partial envelope. The XOR is enforced before the row reaches the DB (400, never persisted).
- Integration proof (dm-encryption.integration.spec.ts:113-175): a real encrypted send, then a **separate-connection** `SELECT content, ciphertext ...` asserting `content IS NULL` + `ciphertext IS NOT NULL`, PLUS a full-table `count(*) WHERE content IS NOT NULL = 0`, PLUS the read path (`listMessages`) returns content NULL. Genuinely across a distinct TCP connection (pg-harness separate Pool). This is T-8-grade.

### 2. who_can_dm gate (P-4 correction 1) — HOLDS
- `GET /profile/:userId/encryption-key` (profile.controller.ts:141-171) gates on `viewerUserId === targetUserId || dmService.canDm(...)` — the shared `canDm` seam (dm.service.ts:166-206), NOT `ProfileVisibilityService`. `ProfileVisibilityService.resolve` is used only by the sibling `GET /profile/:userId` route, never the key route. Confirmed by reading both handlers.
- Uniform 404: not-permitted branch and no-key branch both throw the identical `NotFoundException('Encryption key not found')`. Byte-identical proof (integration:370-396) across who_can_dm=nobody / server-not-shared / nonexistent-user / permitted-but-no-key using `getStatus()` + `getResponse()` `toStrictEqual`. No oracle.
- `canDm` fail-closes on missing target (returns false). `enforceWhoCanDm` (the create/send throw path) delegates to the same seam — single source of truth. Self-fetch bypass is a sound, documented carve-out (mirrors profile self-view).

### 3. Private-key confinement — HOLDS
- `generateKeypair` (dm-crypto.ts:80-93) sets `extractable=false`; keystore stores the non-extractable CryptoKey in dexie via structured-clone (keystore.ts) — raw bytes never materialize. No export path, no wire path (only `publicKeyBase64` SPKI is ever transmitted, api.ts:228-232).
- Test (dm-crypto.test.ts:26-35) asserts `extractable===false` AND actively calls `exportKey('pkcs8')` expecting rejection — structural proof the private key cannot enter a request body. Flow test additionally asserts no private key on the wire.

### 4. Honest fail-closed indicator (ship-blocker) — HOLDS
- Only the `encrypted` state has `isLock: true` and renders the sole `data-testid="e2e-lock-affordance"` (DmEncryptionIndicator.tsx:40-71). Every other state (plaintext / group / cannot-decrypt / loading) renders a non-lock glyph.
- Capability derivation is proof-gated: `resolveConversation` (useDmEncryption.ts:118-157) sets `encrypted` ONLY after a peer key is fetched AND imported; 404/any error → `plaintext`; group(>2) → `group`; mount default → `loading`. Per-message `decorateRow` (useDm.ts) tags a row `encrypted` ONLY when a real ciphertext envelope decrypts (`result.ok`); failed decrypt → `cannot-decrypt` (no plaintext, calm shell), plaintext row → `not-encrypted-*`. Absent proof → never a padlock.
- Tests (dm-encryption-indicator.test.tsx) assert the lock affordance is ABSENT in all 4 non-encrypted header states and all 3 per-message non-encrypted states, rendered through the REAL DmThread parent (BUILD rule 12). `cannot-decrypt` renders "[encrypted payload unavailable]", no crash, no plaintext leak.

### 5. Schema (P-4) — HOLDS
- `user_encryption_keys.user_id` is `text` FK → `users.id` (migration 0031; users.ts:58-70) — NOT uuid. No private-key column (asserted at integration:304-312 via information_schema). UNIQUE(user_id); rotation = ON CONFLICT DO UPDATE.
- dm_messages content relaxed to nullable + ciphertext/sender_key_ref/envelope_version added + `deleted_at` tombstone built (migration 0032; dm.ts schema). Tombstone did not exist before — built, not inherited.
- `listConversations` preview: `m.content ?? 'Encrypted message'` (dm.service.ts:514) — no crash on NULL, no blank, no plaintext leak. Proven at integration:177-196.

### 6. Cross-cutting — HOLDS
- Typecheck 4/4 (B-4). Lint (biome, 392 files) / unit (web 722, shared 41, api 811 DB-free) / build (turbo 3/3) green (B-5). The 17 integration tests run in CI postgres:16 (documented env limit, not a gap — real-pg harness present and correct).
- Commit-per-spec discipline: clean. Each feat commit maps to one task's work (48cd772/fe52628 B-0 schema per-table; 1567aa7 B-1 contracts; b213cd4 60bda5be + af7b6f8 491cb85d B-2; 38757f9 3fb88f44 B-3). No cross-task smearing.
- The 3 deviations are SOUND, not silent contradictions:
  - **wire-boundary encryption (not outbox):** correct. Offline outbox is device-local IndexedDB (same trust boundary as the private key); `makeSendFn` transforms plaintext → envelope just before POST, so only ciphertext leaves the device. Preserves offline-first wedge; server-blindness intact.
  - **senderKeyRef = sender's own public key:** correct ECDH — the recipient derives the shared secret from (their private key, sender's public key). No second round-trip. Sound.
  - **biome format on one pre-existing dm.ts import wrap:** zero-semantic. Acceptable.

---

## Minor observations (NON-blocking — L-2 / follow-up candidates, not REWORK)
1. **Type-vs-runtime mismatch on `api.putEncryptionKey`:** typed to return `PublicKeyResponse`, but the controller returns `{ ok: true }` (profile.controller.ts:112). The response is discarded at all call sites, so no runtime impact, and no security consequence. Tidy the return type in a later wave.
2. **Registration is best-effort (silent catch):** `useDmEncryption` swallows a failed `putEncryptionKey` on mount (useDmEncryption.ts:99-103). Correct fail-closed posture (outgoing to peers still requires their key; sends fall back to plaintext honestly), but a peer will silently see plaintext-fallback if the caller's key never registered. Acceptable for v1; consider a surfaced retry later.
3. **`deleted_at` tombstone column added but soft-delete READ filtering not yet wired** into listMessages/listConversations (no `WHERE deleted_at IS NULL`). The spec asked to DEFINE tombstone semantics (done — column + schema doc); enforcement of soft-delete on the read path is a pre-existing DM gap, not introduced here. Flag for T-block / a future leg.

None of these touch the four REWORK trip-wires (server-blind leak / wrong authz gate / private-key exposure / false padlock). They do not gate the block.

---

## Handoff
- **To C-block:** two committed Drizzle migrations (0031, 0032) must be applied in order at deploy; migration 0031 before 0032 (0032 has no dep on 0031, but journal order is preserved). Railway deploy is CLI-push per service.
- **To T-block:** the 17 integration tests + 19 web crypto/indicator tests are the T-1/T-3 seed; T-8 security stage should re-run the byte-identical-404 matrix with timing (status/body proven; timing left to T-8 per spec) and add an E2E two-browser encrypt→decrypt journey at T-4/T-9. Observation 3 (tombstone read-filtering) is a T-block candidate.

**verdict_source: head-builder gate, B-6 Action 1, Attempt 1 — APPROVED**
