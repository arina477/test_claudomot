# Wave 36 — P-3 Plan

Multi-spec test-hardening + polish. design_gap_flag=false → B after gate.

## APPROACH
- **Architecture deltas:** NONE. No production code changes except the b7feab30 1-line date string. No new services/routes/modules.
- **Data model:** none (integration tests seed rows via the existing pg-harness fixtures; no migration).
- **API contracts:** none new — tests target existing endpoints (GET/PUT /profile/privacy, GET /profile/data + /export, GET /servers/:id/members).
- **New deps:** none (vitest + pg-harness already in the repo; CI already runs a postgres:16 service container with DATABASE_URL_TEST).
- **BINDING (problem-framer):** the roster-filter + data-export tests run against REAL Postgres via `apps/api/test/integration/` pg-harness — no mocked db (mock-the-SUT voids the wave). The integration tier must provably execute (assert on real-DB row counts) per the wave-17/24 false-green lesson (T-4 verifies).

## PLAN (file-level, grouped by B-stage)

### B-3 Backend (api tests) — `node-specialist`
- `apps/api/test/integration/privacy-visibility-authz.spec.ts` — CREATE: real-PG integration mirroring `servers-member-gate.spec.ts` — seed users A+B + 1 server + 2 memberships via pg-harness; set A.profile_visibility='nobody' → GET /servers/:id/members as B excludes A, as A includes self; 'everyone'/'server-members' → A visible to B.
- `apps/api/test/integration/account-data-export-idor.spec.ts` — CREATE: real-PG integration — session A → GET /profile/data + /export return only A's rows; `?userId=<B>` ignored.
- `apps/api/src/privacy/privacy.controller.spec.ts` (or the repo's controller-test location — node-specialist matches the existing pattern) — CREATE: PUT /profile/privacy invalid-enum → 400 (before DB write); valid → 200.
- `apps/api/src/privacy/privacy.service.spec.ts` + `account-data.service.spec.ts` — CREATE: unit — updatePrivacy persists both cols; account-data aggregation shape.
- `apps/api/src/instrument.spec.ts` (or colocated beforeSend unit) — CREATE: beforeSend deletes user.{email,username,ip_address} + request.{data,cookies}, returns event.

### B-4 Frontend (web) — `react-specialist`
- `apps/web/src/pages/SettingsPrivacyPage` — toUiVisibility unit test (colocate per repo pattern). NOTE: toUiVisibility is currently an internal fn — export it (or a testable helper) for the unit test; do NOT change its behavior.
- `apps/web/src/pages/PrivacyPage.tsx` + `TermsPage.tsx` — MODIFY (b7feab30): "Last updated: 2024" → 2026 (or a build-time/dynamic year). 1 line each.

### Docs — `orchestrator`
- `command-center/product/product-decisions.md` (73e96a9d) — the states-AC re-scope note (a related note was appended at P-1; B formalizes/confirms it as the task's deliverable). No code.

## Parallelization map
- B-3 (node-specialist, api tests) ∥ B-4 (react-specialist, web) — different packages, no overlap.
- Within B-3: the 5 spec files are independent → single parallel batch (or one node-specialist authors all, its choice).
- Docs note: orchestrator, anytime.

## Self-consistency sweep
1. Every P-2 AC → a step: roster-hiding→privacy-visibility-authz.spec; export-IDOR→account-data-export-idor.spec; enum-400→privacy.controller.spec; unit(toUiVisibility/updatePrivacy/beforeSend)→respective spec; 73e96a9d→product-decisions note; b7feab30→PrivacyPage/TermsPage edit. ✓
2. Every step has a specialist (node-specialist / react-specialist / orchestrator — all valid). ✓
3. No file in two batches. ✓
4. design_gap_flag=false referenced. ✓
5. Architecture deltas: none (stated). ✓
6. Contracts: no new (tests target existing). ✓
7. New deps: none. ✓
8. SDK: n/a. ✓
