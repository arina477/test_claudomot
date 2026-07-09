# Wave 88 — P-3 Plan

## Approach

### Action 1 — Architecture deltas
**Module:** `DmService.sendMessage` (`apps/api/src/dm/dm.service.ts`) — add a server-side senderKeyRef integrity check before the `dm_messages` insert.

- **What changes:** when an encrypted send carries a non-null `senderKeyRef`, resolve the author's registered public key and reject the send if the asserted key differs; fail-open when the author has no registered key.
- **Key lookup — inline read-only select in DmService (DEFAULT):** DmService already has `db`. Do a read-only lookup directly: `const [row] = await db.select({ publicKey: user_encryption_keys.public_key }).from(user_encryption_keys).where(eq(user_encryption_keys.user_id, callerId)).limit(1)` (the sender is the session-derived `callerId`, dm.service.ts:612 — NOT a local `authorId`). Add the `user_encryption_keys` (from db schema) + `eq` imports (both likely already in scope). This is a READ-only lookup; `EncryptionKeyService` remains the sole WRITER of the table (no ownership violation).
  - **Why NOT inject EncryptionKeyService (karen P-4 correction):** `ProfileModule` ALREADY imports `DmModule` (`apps/api/src/profile/profile.module.ts:19` — wave-79, so encryption-key fetch reuses `DmService.canDm`). So importing `ProfileModule` into `DmModule` would create a **guaranteed circular module dependency** (DmModule ⇄ ProfileModule) requiring `forwardRef()` on both sides. The inline read-only select avoids the cycle entirely and is the minimal, lowest-risk path — it is the default, not a fallback.
  - *Only-if-needed alternative:* if a shared read-seam is later wanted, extract a tiny key-read helper into a leaf module both import; NOT in scope for this wave.
- **Why this approach (vs alternatives):**
  - *Alt A — validate in a Zod schema / DTO:* rejected — the registered key is server state (a DB read), not a static payload shape; Zod can't express it.
  - *Alt B — validate on the read/list path too:* rejected — historical stored messages predate the check; re-validating reads would break already-stored messages and is out of the server-blind write-integrity scope. Write-path only (AC5).
- **Failure-domain impact:** adds one indexed SELECT (by `user_encryption_keys.user_id`, UNIQUE) inside the send path before the existing insert transaction. No new external call. Server-blind model preserved (public-key-string comparison only).

### Action 2 — Data model
**No schema change, no migration.** Reads existing `user_encryption_keys.public_key` (public material). `dm_messages.sender_key_ref` stays nullable text.

### Action 3 — API contracts (concrete)
`POST /dm/conversations/:id/messages`:
- Request body: UNCHANGED (`senderKeyRef` already present).
- Success response: UNCHANGED.
- NEW failure: **4xx (400 Bad Request preferred)** when `senderKeyRef` != the author's registered public key — body: an error envelope with a clear message ("senderKeyRef does not match your registered encryption key"). Existing 403 (participant/block gates) + 400 (validation) responses unchanged. The exact status (400 vs 403) is finalized in B per the file's existing exception conventions; 400 preferred (payload-vs-server-state inconsistency, actionable by client re-register).
- Auth model: unchanged (participant-gated).
- Idempotency: unchanged.

### Action 4 — Dependency list
None. No new deps, no SDK.

## Plan

### Action 5 — File-level steps

**B-0 Schema / B-1 Contracts:** skip (no schema, no contract/type change).

**B-2 Backend** (`node-specialist`) — single-file change (no module rewiring; the circular-dep-free inline read):
| Path | Op | What changes | Order |
|---|---|---|---|
| `apps/api/src/dm/dm.service.ts` | modify | add imports for `user_encryption_keys` (from the db schema) + `eq` (if not present); in `sendMessage` (~:610-669), inside the existing encrypted branch (where `input.senderKeyRef` is non-null), after the participant/block gates and BEFORE the `dm_messages` insert: `const [row] = await db.select({ publicKey: user_encryption_keys.public_key }).from(user_encryption_keys).where(eq(user_encryption_keys.user_id, callerId)).limit(1); if (row && row.publicKey !== input.senderKeyRef) throw new BadRequestException('senderKeyRef does not match your registered encryption key');` — `callerId` is the session-derived sender (dm.service.ts:612), NOT a local `authorId`. Fail-OPEN when `row` is undefined (no registered key); the non-encrypted path (senderKeyRef null) never reaches this branch. No module/DI change. | single |

**B-3 Frontend:** skip (backend-only; no client change).

**B-4 Wiring:** repo-wide typecheck (verifies the DI wiring + no circular dep).

**B-5 Verify** — tests (`node-specialist`):
| Path | Op | What changes | Order |
|---|---|---|---|
| `apps/api/src/dm/dm.service.spec.ts` | modify | unit cases: AC1 match→accept, AC2 mismatch→4xx (no insert, no emit), AC3 no-registered-key→fail-open accept, AC4 senderKeyRef null→no-check, AC5 read/list path not re-validated. Mock the db `select().from(user_encryption_keys)...` chain to return a matching key / a mismatching key / [] (no key). | after B-2 |
| `apps/api/test/integration/dm-encryption.integration.spec.ts` | modify | real-Postgres T-4/T-8 cases: register a key, send matching (accept) + mismatching (reject) + no-key (fail-open) + **post-rotation send with the current key (accept, not rejected)**. | after B-2 |

### Action 6 — Specialist routing (validated)
- `node-specialist` — NestJS backend + spec + integration test. ✓ in `command-center/AGENTS.md`.

### Action 7 — Parallelization map
B-2 is a single-file change (dm.service.ts). B-5 unit ∥ integration may run in parallel (different files). `/simplify` on dm.service.ts after B-2.

### Action 8 — Post-write consistency sweep
1. AC→step: AC1/AC2/AC3/AC4 → B-2 validation branch + B-5 unit/integration; AC5 → no read-path change (explicit) + B-5 read-path assertion; AC6 → public-key-string comparison only (no plaintext access). ✓
2. Every step has `node-specialist`. ✓
3. No file in multiple parallel batches. ✓
4. `design_gap_flag: false` referenced. ✓
5. Architecture deltas carry alternative trade-offs (A/B). ✓
6. Data/API contracts concrete (no schema; 4xx failure specified). ✓
7. No new deps. ✓
8. No external SDK. ✓
Sweep clean — ready for P-4 (SECURITY-tightened gate applies: wave_touches ∩ {auth/crypto} ≠ ∅).
