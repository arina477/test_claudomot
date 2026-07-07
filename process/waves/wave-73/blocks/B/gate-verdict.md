# Wave 73 — B-6 Verdict

**Block:** B (Build) — M10 privacy-events audit log (multi-spec: 156aa2ee + 03940edd + 5a2521bc)
**Gate:** B-6 Review (Phase 1, fresh independent head-builder)
**Reviewer:** head-builder (independent of B-0→B-5 authoring)
**Branch:** wave-73-privacy-audit-log

## Verdict

**APPROVED**

Every stage-exit checkbox and every P-4 carry-forward hard-gate is satisfied against the ACTUAL code (not stage self-report). The highest-risk claim — per-seam LIVE-DB assertion guarding the wave-71/72 "plumbing built but not wired" pattern — is genuinely met: the integration test instantiates the REAL production services and asserts a real `privacy_events` row after each of the 5 real actions, via a separate DB connection.

## Rationale

### Gate 1 — Per-seam LIVE-DB assertion (highest risk) — PASS
`apps/api/test/integration/privacy-events.spec.ts` is a real pg-harness suite (harness imported first per CF-2). It does NOT code-read hook presence; it:
- Instantiates the REAL production services — `new AccountDeletionService(appendService)`, `new AccountDataService(appendService)`, `new PrivacyService(appendService)`, `new BlocksService(appendService)`. I verified each constructor signature in production matches exactly `constructor(private readonly appendPrivacyEvent: AppendPrivacyEventService)`, so the test exercises the actual shipped hooks, not test doubles of the SUT.
- Performs each real action and asserts a real row via the SEPARATE `harnessQuery` pool:
  - test 1 `deleteAccount(USER_A)` → asserts `account_deleted`, actor=USER_A, target_type='self', target_id=USER_A.
  - test 2 `exportAccountData(USER_A)` → asserts `data_exported`.
  - test 3 `updatePrivacy(...)` → asserts `privacy_settings_changed`.
  - test 4 `createBlock(A,B)` → asserts `user_blocked`, target_type='user', target_id=B.
  - test 5 `createBlock` then `removeBlock(A,B)` → asserts `user_unblocked`.
- Execution reality: the suite is gated by `SKIP = !process.env.DATABASE_URL_TEST` only (DB-presence, not a per-case `.skip`/`.only` abuse — confirmed by grep). CI (`.github/workflows/ci.yml`) provisions `postgres:16`, sets `DATABASE_URL_TEST`, and runs `pnpm test:ci` (= unit + `vitest run --config vitest.integration.config.ts`), so all 5 per-seam assertions execute against a live DB in CI. I could not re-run locally (no local Postgres binaries / Docker; the harness `TRUNCATE ... users CASCADE` makes pointing it at the shared live DB unsafe and I refused to do so), but the test is real, non-mocked, and CI-wired — the C-block owns the actual CI-green verdict at C-1.

### Gate 2 — Best-effort non-blocking — PASS
All 4 production hooks wrap `appendPrivacyEvent.append(...)` in an independent try/catch that logs and swallows (`account-deletion.service.ts:123-133`, `account-data.service.ts:63-73`, `privacy.service.ts:67-83`, `blocks.service.ts:157-167 / 188-198`). deleteAccount fires the hook AFTER the committed erasure txn AND after the best-effort session revocation, in its own try/catch. Tests 7/7b/7c inject a throwing append stub and assert exportAccountData/updatePrivacy/createBlock still resolve.

### Gate 3 — Append-only — PASS
`AppendPrivacyEventService` exposes ONLY `append` + `listForActor`. No update/delete methods. Controller wires only the read.

### Gate 4 — no-IDOR read — PASS
`GET /profile/privacy-events` (`privacy.controller.ts:121-126`) takes `callerId = req.session.getUserId()` only — no userId param in path/query — guarded by `SessionNoVerifyGuard`, returns `listForActor(callerId)`. Test 6 seeds A and B, asserts A's read excludes B (and vice-versa).

### Gate 5 — PII discipline — PASS
Context payloads carry only ids + non-PII enum values (visibility/whoCanDm). Test 8 gives USER_A a display_name, asserts the settings-changed context contains ONLY {visibilityFrom,visibilityTo,whoCanDmFrom,whoCanDmTo} and NOT the email or display_name.

### Gate 6 — updatePrivacy pre-read — PASS
`privacy.service.ts:50` pre-reads `before = getPrivacy(userId)` before the UPDATE, then `after = getPrivacy(...)`, populating from/to context (not empty). Resolves the P-4 blind-UPDATE carry-forward.

### Gate 7 — Module boundary — PASS
`BlocksModule` imports `PrivacyModule` (which exports `AppendPrivacyEventService`); flow is one-directional (BlocksModule → PrivacyModule, no back-edge). No circular dependency.

### Gate 8 — Commit discipline (multi-spec) — PASS
`git log origin/main..HEAD`: each feat commit cites exactly one `task:` id in its body; every claimed task_id has ≥1 commit — 156aa2ee (B-0 schema + B-2 service, ×2), 03940edd (B-1 contract), 5a2521bc (B-3 panel). No cross-task commits.

### Gate 9 — No gold-plating — PASS
No crypto tamper-evidence, no compliance-grade infra, no update/delete — append-only-by-convention, exactly as FENCED in the spec. mvp-thinner scope honored.

### Spot-verified B-5 / supporting claims
- Migration `0028_overjoyed_black_queen.sql` committed + git-tracked; matches schema (uuid PK gen_random_uuid, actor_id FK ON DELETE no action = no cascade, jsonb context, `(actor_id, created_at)` index). No `migrate()` on startup in main.ts/app.module.ts — migrations do NOT auto-run.
- Shared DTO (`packages/shared/src/privacy-events.ts`) matches spec (enum + PrivacyEventSchema + PrivacyEventListResponseSchema); re-exported from index.ts (.js idiom). Schema index re-exports the table.
- Frontend `PrivacyActivityPanel.tsx` renders all states (skeleton loading — not spinner, error+retry, empty, populated), own-scoped, DS tokens, dark-theme; mounted in `SettingsPrivacyPage.tsx:600`. `api.getPrivacyEvents` parses the response with the shared schema.

## Rework

None.

## Escalation

None.

### Non-blocking notes (cosmetic — do NOT gate; optional L-2 cleanup)
1. `privacy_events.ts` schema header comment lists stale example event names (`account_deletion_initiated`, `visibility_changed`) that predate the final enum. Comment-only; the actual column is free-text validated at the service against the shared enum. No functional impact.
2. `PrivacyActivityPanel.visibilityLabel` maps both `everyone` and `server-members` to "Visible to classmates" — a lossy UI label. The audit ROW stores the exact enum value; only the rendered string collapses. Acceptable for MVP; flag if a from/to distinction between those two states becomes user-visible-critical.
3. I could not personally execute the integration suite (no local Postgres/Docker; refused to point the truncating harness at the shared live DB). Evidence of realness is code-read of the real-service instantiation + CI wiring, not a local green run. The C-1 gate MUST confirm the CI integration job goes green on this branch before merge — that is the load-bearing execution proof this gate defers to C-block by design.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: B-6
  reviewers:
    head-builder: APPROVED   # Phase-1 independent gate reviewer (this verdict)
  failed_checks: []
  rationale: >
    All 9 P-4 hard-gates verified against actual code. Per-seam LIVE-DB assertion
    (highest risk) is genuinely met — the integration test instantiates the real
    production services (constructor signatures confirmed identical to shipped DI)
    and asserts a real privacy_events row after each of the 5 real actions via a
    separate harness pool; it is CI-wired to run against postgres:16. Best-effort
    swallowing, append-only, no-IDOR, PII discipline, updatePrivacy pre-read,
    one-way module boundary, and multi-spec commit discipline all hold. Migration
    0028 committed and does not auto-run. No gold-plating. Could not execute the
    suite locally (no Postgres/Docker; refused to truncate the shared live DB) —
    execution proof is deferred to the C-1 CI integration job by design.
  next_action: PROCEED_TO_C
```

---
## Phase 2 (/review) + final B-6 disposition
Independent /review: all high-risk structural concerns SAFE (no module cycle, all 4 hooks best-effort/after-commit, contract shape exact, no-IDOR/SQL/XSS clean). 4 P2 findings (none blocking) — all FIXED same-branch (2 were false rows into the append-only ledger: createBlock/removeBlock gated on returning-length; updatePrivacy gated on genuine change; panel suppresses no-change visibility clause). Fixes split into 2 per-spec commits (e8991fb/5a2dfeb). Post-fix: typecheck 4/4, lint clean, api 764, web 675, build ✓ zero-require.
**FINAL B-6 VERDICT: APPROVE.** → C-block.
