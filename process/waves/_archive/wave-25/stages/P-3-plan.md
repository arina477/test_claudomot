# Wave 25 — P-3 Plan

## Approach
**Extract the mention slug grammar to packages/shared (one source of truth) + make editMessage's mention-diff atomic.** No migration, no new dep. Reuses the existing message_mentions table (0007), the wave-24 real-PG harness, and packages/shared (existing Zod home).

### Architecture delta
- **packages/shared:** NEW exported mention slug grammar — the `[a-zA-Z0-9_-]+` handle regex/constant (+ a small tokenize/extract helper if the client renderer needs one). Single source of truth. *Alternative considered:* hand-sync the client to the server regex — rejected as the cause (grammar duplication survived 4 milestones as drift); a shared constant is ~1.2× cost, structurally prevents re-drift. *NOT* a full tokenizer framework (problem-framer + mvp-thinner: premature abstraction for 2 consumers). Hand-sync fallback if the client renderer entangles + extraction balloons past the size class.
- **Server (apps/api/src/messaging/mentions.ts):** parseMentions imports the shared slug grammar (replaces its inline `[a-zA-Z0-9_-]+` regex) — behavior-preserving (mentions.spec.ts is the regression guard). Failure-domain: none (same grammar, sourced from shared).
- **Server (apps/api/src/messaging/messages.service.ts:668-721):** wrap editMessage's mention-diff (UPDATE messages + DELETE + INSERT message_mentions) in `db.transaction()` — mirror createReply (:1031) / reply-delete (:839). Failure-domain: narrows a partial-write window to atomic.
- **Client (apps/web/src/shell/MessageList.tsx:559-565):** renderBodyWithMentions imports the SAME shared slug grammar → tokenizes handles identically → @bob.dev (server-resolved) renders as a pill. Pill-vs-plain still gated by the server mentions map (no false pill on unresolved handles).

### Data model / API / deps
None — no schema/migration (message_mentions unchanged), no endpoint contract change (editMessage PATCH behavior preserved, only persistence becomes transactional), no new dep.

## Plan (file-level by B-stage)
### B-0 Branch (orchestrator) — branch wave-25-mention-parity. NO schema.
### B-1 Contracts (typescript-pro)
- `packages/shared/src/*` — NEW exported mention slug grammar constant/regex (+ barrel export). The single source both sides import. [create/modify]
### B-2 Backend (backend-developer)
- `apps/api/src/messaging/mentions.ts` — parseMentions imports the shared slug grammar (replace inline regex; behavior-preserving). [modify]
- `apps/api/src/messaging/messages.service.ts` — editMessage mention-diff wrapped in db.transaction() (mirror createReply). [modify]
- `apps/api/test/integration/edit-message-mentions-rollback.spec.ts` — NEW real-PG rollback spec on the wave-24 pg-harness (create-server-rollback pattern): fixtures → editMessage with a mid-txn fault → assert real ROLLBACK → 0 partial message_mentions. Real-DB round-trip; fail-loud on missing DATABASE_URL_TEST (CI rule 5). [create]
### B-3 Frontend (react-specialist)
- `apps/web/src/shell/MessageList.tsx` — renderBodyWithMentions imports the shared slug grammar → tokenizes identically to the server; @bob.dev server-resolved → pill; unresolved → plain text (no false pill). [modify]
### B-4 Wiring / B-5 Verify / B-6 Review
- Repo typecheck; `biome format --check` before commit (CI rule 4 + BUILD rule 6); existing mentions.spec.ts + messaging web tests green (behavior-preserving regression guard); the new integration spec EXECUTES in CI (CI rule 5 — assert nonzero).

### Specialist routing (vs AGENTS.md): typescript-pro (shared), backend-developer (server + integration spec), react-specialist (client) — all present.
### Parallelization: B-1 (shared grammar) FIRST → then B-2 (server imports it) ∥ B-3 (client imports it) — both depend only on B-1's shared export, disjoint files.

### Self-consistency sweep
1. AC1 shared extraction (B-1) + server import (B-2); AC2 client import (B-3); AC3 pill-vs-plain gated by mentions map (B-3, no logic change to that gate); AC4 editMessage txn (B-2); AC5 real-PG rollback spec (B-2). ✓
2. Specialist each. ✓ 3. No file in two batches (B-2 server ∥ B-3 client, disjoint). ✓ 4. design_gap_flag=false. ✓ 5. Reuse (shared, message_mentions, pg-harness, createReply txn pattern). ✓ 6. No contract change (internal grammar constant). ✓ 7. No new dep. ✓ 8. No SDK. ✓

## Binding carries
- Behavior-preserving extraction (mentions.spec.ts green); hand-sync fallback if client entangles.
- CI rule 5: the new integration spec must ACTUALLY execute (T-4/C-1 verify nonzero). BUILD rule 6: specialists run biome format before reporting.

→ P-4 Gate.
