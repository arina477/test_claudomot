# Wave 79 — P-3 Plan

## Approach section

### Architecture deltas
- **New — key registry seam:** a `user_encryption_keys` table (public material only) + an `EncryptionKeyService` + two profile-controller routes (PUT self / GET peer). **The GET peer-key route reuses the shipped fail-closed `ProfileVisibilityService` / who_can_dm gate** — NOT a new authz path (P-0 refinement 5; a key leak is a visibility leak). **Alt:** store the public key as a column on `users` — REJECTED (rotation history + a distinct unique-per-user lifecycle + a clean 404-on-no-key surface are cleaner in a dedicated table; mirrors the separate profile/privacy tables). Failure-domain: GET peer-key is a cross-user READ gated exactly like the profile view — the one privacy-sensitive boundary, server-side + fail-closed.
- **Changed — DM storage to server-blind:** `dm` message schema gains nullable `ciphertext` + `sender_key_ref` + `envelope_version` and its `content` relaxes from `NOT NULL` to nullable; `dm.service` persists the envelope with `content = NULL` on an encrypted send (server-blind), preserving a plaintext path for keyless peers. The messaging gateway passes the envelope through unchanged (never decrypts). **Alt:** a parallel `encrypted_messages` table — REJECTED (fragments the single DM timeline, breaks idempotency + soft-delete reuse, complicates ordering). **Chosen:** extend the shipped message row (idempotency_key + tombstone reused). **Migration must BUILD the tombstone/soft-delete column — none exists today** (P-0 refinement 2), and relax `content NOT NULL`.
- **New — client crypto (web):** Web Crypto (SubtleCrypto) keygen; private key in IndexedDB (browser-only, never transmitted); DM view encrypts outgoing to the peer's fetched public key, decrypts incoming; peer-key cache; an **honest E2E indicator that fails closed** (lock only when provably encrypted). **Algorithm (B-3 pins, recommended):** ECDH P-256 for key agreement + AES-GCM for message encryption (standard for messaging, Web-Crypto native, per-message IV); RSA-OAEP is the simpler alt (direct encrypt-to-public-key) — B-3 chooses and pins it into `EncryptionKeySchema.algorithm`. **Alt considered + REJECTED for v1:** key backup / multi-device / forward-secrecy ratchet — gold-plating for a zero-external-user MVP (ceo-reviewer); v1 is browser-only-key + plaintext-fallback, degrading honestly.
- **Failure-domain summary:** the server never gains plaintext for an encrypted DM (server-blind invariant — T-8-proven, non-happy). No transaction-scope change beyond the additive envelope write. The honest indicator is a client-side trust signal whose failure mode (a false padlock) is a privacy harm → D-block owns its visual language + it fails closed.

### Data model
- **Migration 1 (key registry):** CREATE `user_encryption_keys` (user_id uuid unique FK ON DELETE cascade/set-null per convention, public_key text, algorithm text, created_at timestamptz default now()). No private-key column. No pgEnum.
- **Migration 2 (DM envelope):** ALTER dm message table — `content` DROP NOT NULL; ADD `ciphertext text`, `sender_key_ref text`, `envelope_version integer` (or text), and a soft-delete/tombstone column (e.g. `deleted_at timestamptz` if absent — verify + build). Both committed Drizzle migrations; postgres-pro authors + applies locally at B-0; applied to prod MANUALLY at C-2 before the api deploy (bare node, no auto-migrate).

### API contracts (concrete)
- **PUT `/profile/encryption-key`** (self, AuthGuard) — body EncryptionKeySchema {publicKey, algorithm}; 200 stored/rotated | 400 invalid | 401.
- **GET `/profile/:userId/encryption-key`** (SessionNoVerifyGuard, viewer from session) — 200 PublicKeyResponseSchema | uniform 404 (hidden/blocked/nonexistent/no-key) | 401. Gated by ProfileVisibilityService (who_can_dm mirror). No email/private material.
- **DM send (existing path, modified):** accepts plaintext content OR encrypted envelope (ciphertext+senderKeyRef+envelopeVersion), mutually exclusive; encrypted send → server persists content NULL. Delivery over messaging.gateway unchanged.

### New deps
- **None.** Web Crypto (SubtleCrypto) is a native browser API — no third-party SDK, no external-sdk-integration-rules research required. IndexedDB is native.

## Plan section
### File-level steps by B-stage
**B-0 Branch & schema** — branch `wave-79-e2e-dm-encryption`; **2 migrations** (user_encryption_keys; dm envelope cols + content-nullable + tombstone) + Drizzle schema models (apps/api/src/db/schema/users.ts new table, dm.ts alter). | **postgres-pro** | first.
**B-1 Contracts** — `packages/shared/src/privacy.ts`: EncryptionKeySchema + PublicKeyResponseSchema + DM envelope DTO extension (nullable ciphertext/senderKeyRef/envelopeVersion; content nullable in encrypted case); index.ts `.js` ESM named re-export. | **typescript-pro** | after B-0.
**B-2 Backend** — | **backend-developer** (+ **supertokens-integration** consult if the key endpoints need auth-guard wiring) | after B-1:
- `EncryptionKeyService` (create) — store/rotate/fetch public key; unique-per-user.
- profile.controller (modify) — PUT /profile/encryption-key (AuthGuard self) + GET /profile/:userId/encryption-key (**delegates to ProfileVisibilityService/who_can_dm; uniform 404**).
- `dm.service` (modify) — server-blind envelope persist (content NULL on encrypted; plaintext-fallback path); idempotency + tombstone applied to ciphertext.
- messaging.gateway (verify) — envelope passthrough, no decrypt.
- specs: server-blind invariant integration proof (encrypted send → DB row has content NULL + ciphertext set; server cannot read plaintext); key-fetch visibility matrix (visible→200, hidden/blocked/no-key→uniform 404); rotation; plaintext-fallback non-regression.
**B-3 Frontend** — | **react-specialist** | after B-1 + B-2 + **after D-3** (indicator layout):
- web keygen + IndexedDB private-key store (Web Crypto; never transmit); `apps/web/src/auth/api.ts` getPeerEncryptionKey + putEncryptionKey.
- DM view (modify) — encrypt outgoing to peer key, decrypt incoming, peer-key cache; **honest E2E indicator (fails closed — lock only when provably encrypted; plaintext-fallback → not-encrypted; undecryptable → calm 'cannot decrypt on this device')**.
- tests: keygen+register; encrypt/decrypt round-trip; indicator honesty (plaintext-fallback shows NO lock — the anti-security-theater guard); key-loss degrade.
**B-4 Wiring / B-5 Verify / B-6 Review** — standard.

### Specialist routing (validated against AGENTS.md)
postgres-pro (migrations) · typescript-pro (contracts) · backend-developer (key service/endpoints/dm.service) · supertokens-integration (consult, key-endpoint auth) · react-specialist (client crypto+indicator). All present. D-block: head-designer + aidesigner (E2E indicator brief).

### Parallelization map
- Serial: B-0 → B-1 → B-2. B-3 waits on B-2 (envelope path + key endpoints) AND D-3 (indicator). Within B-2: the key-registry leg + the dm-envelope leg are largely independent (different files) — may run as 2 backend-developer calls, but the server-blind dm.service change is the critical-path security item (author + test carefully).

### Self-consistency sweep
1. Every P-2 AC → ≥1 step: key registry (B-0 table + B-1 schema + B-2 service/endpoints); server-blind envelope (B-0 migration + B-2 dm.service); client crypto + indicator (B-3 + D). ✓
2. Every step has a specialist. ✓ 3. No file in two parallel batches. ✓ 4. design_gap true → D-block before B-3. ✓ 5. Architecture deltas + alternatives (dedicated-table vs users-column; extend-row vs parallel-table; v1-vs-Signal-grade). ✓ 6. Contracts concrete (endpoints + migration cols pinned; algorithm B-3-pinned with recommendation). ✓ 7. No new deps (Web Crypto native). ✓ 8. No new SDK (native API). ✓

**Binding refinements carried (LOAD-BEARING):** server-blind invariant (T-8 non-happy proof); migration builds tombstone + relaxes content NOT NULL; honest fail-closed indicator (no false padlock — ship-blocker); key-loss/no-multi-device/plaintext-fallback v1 (honest degrade); peer-key GET through fail-closed visibility gates (uniform 404). P-4 security-scope tightened gate + T-8 mandatory.

## P-4 Phase-2 binding corrections (fold into B-block — override conflicting wording above)
- **B-2 authz:** peer-key GET gates on **who_can_dm** (dm.service.enforceWhoCanDm), NOT ProfileVisibilityService (profile_visibility only). karen: a user can be profile_visibility=everyone + who_can_dm=nobody; the key encrypts a DM → who_can_dm governs. Factor enforceWhoCanDm into a reusable seam; keep uniform-404.
- **B-0 schema:** user_encryption_keys.user_id is **text** FK to users.id (opaque SuperTokens id), NOT uuid (would fail FK).
- **B-2 preview:** listConversations last-message preview handles NULL content (encrypted rows → "Encrypted message" placeholder; no crash/leak).
- **Scope:** group DMs (≤10) OUT OF SCOPE for encryption in leg-3a → plaintext-fallback + honest not-encrypted indicator (deferred). Makes the fail-closed indicator provably correct on group threads.
- **B-1/B-2/B-3 notes:** algorithm = bounded z.enum (400 on unsupported); B-2 rejects encrypted-send-with-plaintext-also-set (server-blindness at write boundary); T-8 adds visible-but-no-key→byte-identical-404 no-oracle row; B-3 reuses shipped `dexie` for the private-key IndexedDB store.
