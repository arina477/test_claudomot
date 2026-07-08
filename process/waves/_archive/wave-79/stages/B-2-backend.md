# Wave 79 — B-2 Backend (security critical-path)

backend-developer, 2 spec blocks.

## Block 1 — key registry (task 60bda5be) — commit b213cd4
- `encryption-key.service.ts` (new): upsertKey (INSERT ON CONFLICT(user_id) DO UPDATE = rotation-replaces-row) + getKeyFor. PUBLIC material only; no private column.
- `profile.controller.ts`: PUT /profile/encryption-key (AuthGuard, verification-required) + GET /profile/:userId/encryption-key (SessionNoVerifyGuard, viewer from session).
- **who_can_dm gate (P-4 karen correction honored):** factored `DmService.canDm(viewerId, targetId)` reusable seam; getEncryptionKey uses `viewer===target || canDm(...)` — NEVER ProfileVisibilityService. enforceWhoCanDm delegates to canDm (403 behavior + query order preserved).
- **Uniform 404 no-oracle:** not-permitted branch AND no-key branch throw identical `NotFoundException('Encryption key not found')` — proven byte-identical (getStatus+getResponse) across nobody/not-shared/nonexistent/permitted-but-no-key.
- profile.module imports DmModule + provides EncryptionKeyService.

## Block 2 — server-blind envelope (task 491cb85d) — commit af7b6f8
- `dm.service.ts` send path: isEncrypted branch persists content:null + ciphertext/senderKeyRef/envelopeVersion; **XOR enforced at Zod (hasContent !== hasCiphertext)** → encrypted+plaintext-both = 400 (never reaches DB). Backward-compat plaintext path preserved. Idempotency + deleted_at tombstone apply to ciphertext.
- **Null-content fixes + preview:** the 3 B-0 tsc errors resolved; listConversations preview maps `m.content ?? 'Encrypted message'` (P-4 correction 3).
- messaging.gateway verified passthrough (envelope rides DTO, no decrypt — no change needed).
- `dm-encryption.integration.spec.ts` (new, 17 tests): server-blind invariant (separate-connection SELECT: content NULL + ciphertext NOT NULL), no-read-path-plaintext, preview placeholder, byte-identical-404 matrix, canDm seam, rotation, plaintext fallback, idempotent encrypted re-send, no-private-column, no-email-leak.

## Results
- api + shared tsc clean; biome clean; 47 DB-free unit tests pass. 17 integration tests authored + tsc-clean, deferred to CI postgres:16 (no local pg server — known env limit).
- **Deviations (both ACCEPTED — within-plan write-boundary choices, not silent contradictions):** (1) extended SendDmMessageSchema (B-1 added DTO fields but not the request schema; B-2 owns the write boundary per P-4 correction 5; added envelope-integrity refine); (2) self-fetch bypass on GET key (viewer fetching own key always permitted — mirrors sibling profile self-view carve-out).

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [backend-developer]
files_implemented: [apps/api/src/profile/encryption-key.service.ts, apps/api/src/profile/profile.controller.ts, apps/api/src/profile/profile.module.ts, apps/api/src/dm/dm.service.ts, packages/shared/src/dm.ts, apps/api/test/integration/dm-encryption.integration.spec.ts, apps/api/test/integration/pg-harness.ts]
deviations: [{specialist: backend-developer, change: "extend SendDmMessageSchema", adjudication: accepted}, {specialist: backend-developer, change: "self-fetch key bypass", adjudication: accepted}]
simplify_applied: true
```
