# Wave 16 stage completion

> Seeded by wave-15 N-3. Active milestone: M3 — Real-time messaging (`6198650e-f4e0-44dc-9b0a-6550f01f9f82`, in_progress).
> Seed task: `46f16288-4c13-4d8c-ad68-6925d1f51d84` — Add browser E2E coverage for the authed create-server flow.
> Bundled siblings: none (single-task bundle).
> claimed_task_ids (B-0 claims this batch; L-2 closes it): [46f16288-4c13-4d8c-ad68-6925d1f51d84]
> Slice: create-server authed browser E2E coverage (wave-7 V-3 carry + T-9 significant). Depends on a verified authed-browser fixture — P-0 should confirm/establish the fixture before B-block.
> Pending ritual outcomes affecting P-0: M3 threads/attachments feature decomposition deferred to a future N-1 (fires once M3 top-level todo count reaches 0). Two more top-level tech-debt seeds queued (25523fb0 invite-code rotation note→d058283d, 25523fb0 real-PG rollback test).

PRODUCT:
- [x] P-0 Frame (discover + reframe)
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [x] P-4 Gate

DESIGN (skip block if non-UI wave):
- [ ] D-1 Brief
- [ ] D-2 Variants (with bounded iteration)
- [ ] D-3 Review & adopt

BUILD:
- [ ] B-0 Branch & schema
- [x] B-1 Contracts (SKIP — test-infra)
- [x] B-2 Backend (SKIP — test-infra)
- [x] B-3 Frontend (E2E authoring)
- [x] B-4 Wiring
- [x] B-5 Verify
- [x] B-6 Review

CI/CD:
- [x] C-1 PR, CI & merge — PR #28 MERGED (squash); all 7 checks green inc. e2e (authed create-server vs live prod); merge SHA 6982ffe
- [x] C-2 Deploy & verify — NO DEPLOY (test-only; no product artifact changed); health sanity api/web 200; canary skipped (no deploy + DAU<1000)

TEST:
- [x] T-1 Static — Pattern A: lint 0-err + typecheck green at C-1 (run 28437054848); 0 bypasses; 9 pre-existing biome warnings = known carry
- [x] T-2 Unit — Pattern A: no unit added (deliverable is an E2E); existing suites unchanged + green
- [x] T-3 Contract — SKIP (no contract surface)
- [x] T-4 Integration — SKIP (no schema/service)
- [x] T-5 E2E — Pattern A: authed create-server E2E RATIFIED REAL + anti-flake; 4/4 in CI e2e job vs live prod
- [x] T-6 Layout — SKIP (no UI change)
- [x] T-7 Perf — SKIP (no perf surface)
- [x] T-8 Security — light: fixture password NOT leaked (masked secrets / gitignored storageState / no artifact upload); no new authz surface
- [x] T-9 Journey — gate APPROVED; journey map create-server flow annotated E2E-covered (commit 3235f83)

VERIFY:
- [x] V-1 Independent reviews (Karen + jenny, parallel)
- [x] V-2 Triage
- [x] V-3 Fast-fix loop (or close)

LEARN:
- [ ] L-1 Docs
- [ ] L-2 Distill

NEXT:
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
