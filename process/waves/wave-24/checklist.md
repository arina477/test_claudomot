## Wave 24 stage completion

**Wave:** 24
**Active milestone:** a5232e16 — M5 Academic tooling: assignments [in_progress]
**Seed task:** 02fa8011-1d44-4a02-a808-eba7191fba1b — Real-Postgres integration test tier for presence/services
**Bundled siblings (0):** none — solo-task bundle
**claimed_task_ids:** [02fa8011]

**Pending ritual outcomes / carry-ins for P-0:**
- **Debt-clearing wave (M5 backlog).** The M5 headline (assignments) is solid — spine shipped w22, delegated authz shipped w23. The mvp-critical remainder (reminders arc, cron+Resend) is CRED-BLOCKED (founder Resend key pending). This wave clears re-homed M3/M4 debt: a real-Postgres integration test tier.
- **Seed scope (02fa8011):** build a real-Postgres integration test harness/tier for presence/services (and extend to rbac/assignments authz). Reinforced by wave-23 F23-T-4 (the new authz surface shipped with NO dedicated real-DB integration test) + the recurring integration-tier thinness. NOTE: a reusable real-PG harness ALREADY EXISTS from wave-17 (`apps/api/test/integration/pg-harness.ts` + `create-server-rollback.spec.ts` + `vitest.integration.config.ts`) — this seed is a THIN CONSUMER that extends coverage onto presence/services + rbac/assignments, NOT a greenfield harness build. PRODUCT-PRINCIPLES rule 1: verify what exists before assuming greenfield.
- **CI-PRINCIPLES rule 4 + NEW BUILD-PRINCIPLES rule 6 (promoted w23):** rule 4 — run `biome format --check` at wiring before commit; rule 6 — B-block SPECIALISTS run the formatter on touched files before reporting done (not only typecheck). Both target the recurring biome-format-drift (4x w19/w22/w23).
- **design_gap FALSE → expect D-block SKIP.** Test-infra wave; no UI/page/primitive.
- **T-block note:** the integration tier is CI-gated (postgres:16 service, DATABASE_URL_TEST). The wave-17 lesson (Turbo strict-env stripped DATABASE_URL_TEST → integration SKIPPED despite green) — verify the tests ACTUALLY execute, not just show green (false-green risk).
- **Founder-digest carries (record-only, from wave-23):** (1) Resend key pending → reminders blocked; (2) Playwright chrome-absent (67881a58) blocks visual E2E/layout 3rd+ UI wave — host-side fix; (3) principles-write-outside-L-block structural guard unimplemented (3rd hold). Digest: process/session/updates/board-digest-2026-07-02.md.
- **M5 backlog (future seeds, per head-next):** wave-25 candidate c18b8089 (mention parser parity, user-visible correctness) lands on top of the new test tier. Also open: d058283d (invite rotation), 6a546c7b (presence perf), 10b9d18e (presence dots — gated by chrome-absent), d23a0740 (cleanup); + wave-23 V-2 cross-cutting 4a92327c (ParseUUIDPipe), 875b97f4 (security hardening), 72cb6ebb (stale-comment sweep); + wave-22 V-2 follow-ons.

PRODUCT:
- [x] P-0 Frame (no-prior-spec; problem-framer PROCEED [extend wave-17 harness NOT rebuild] + ceo-reviewer SELECTIVE-EXPANSION [add rbac/assignments authz coverage — align to F23-T-4] + mvp-thinner OK → accepted scope-correction; claimed [02fa8011])
- [x] P-1 Decompose (single-spec; below floor → MERGE expansion incomplete-scope [reminders cred-blocked] → BOARD P-1-floor-merge-wave-24 6/7 override-ship; design_gap_flag=false → skip D; T-4 false-green guard binding)
- [x] P-2 Spec (single-spec; 5 ACs written to 02fa8011.description — presence co-member + member-gate + rbac/assignments-authz real-DB integration specs + false-green guard)
- [x] P-3 Plan (extend wave-17 pg-harness + 3 integration specs; test-automator; no prod code/dep/migration; false-green guard binding)
- [x] P-4 Gate APPROVED (Phase-1 head-product APPROVED + Phase-2 karen+jenny APPROVE; Gemini CONCERN→NOT-MATERIAL [isolation strategy exists]; 3 binding B-2 carries)

DESIGN (skip block if non-UI wave):
- [ ] D-1 Brief
- [ ] D-2 Variants (with bounded iteration)
- [ ] D-3 Review & adopt

BUILD:
- [x] B-0 Branch & schema (branch wave-24-integration-tier; schema SKIP test-only)
- [x] B-1 Contracts
- [x] B-2 Backend
- [x] B-3 Frontend
- [x] B-4 Wiring
- [x] B-5 Verify
- [x] B-6 Review (head-builder APPROVED + /review 0 crit/high/med genuine real-DB tests; false-green wiring verified; 5 Low accepted)

CI/CD:
- [x] C-1 PR, CI & merge (PR #36 merged 149a081; 7/7 CI jobs success per-job; FALSE-GREEN GUARD HELD — integration tier log confirms 3 new specs executed [presence 2 + member-gate 2 + rbac-authz 6], zero skips)
- [x] C-2 Deploy & verify (api 0ebf493d + web 31fca925 SUCCESS; no redeploy [test-only, byte-equivalent artifact — test files excluded from dist]; no migration/no-new-route; canary skip)
- [x] C-3 Canary (skipped — DAU 0 < 1000)

TEST:
- [x] T-1 Static (CI lint+typecheck green; 0 prod bypass)
- [x] T-2 Unit (CI 395 api + 216 web; wave adds integration-tier not unit — unchanged)
- [x] T-3 Contract (SKIP — no contract change, test-only)
- [x] T-4 Integration (KEY — false-green guard HELD; 3 new specs EXECUTED in CI [2+2+6 passed, 0 skips]; closes F23-T-4)
- [x] T-5 E2E (SKIP — no user-visible change)
- [x] T-6 Layout (SKIP — non-UI)
- [x] T-7 Perf (SKIP — not heavy, no runtime change)
- [x] T-8 Security (SKIP active probes — no auth-code change, wave ADDS authz test coverage; secret-grep 0)
- [x] T-9 Journey (head-tester APPROVED; T-4 genuine executed coverage verified [10 new real-PG tests, 0 skips]; regen skipped [no UI change]; 0 findings)

VERIFY:
- [x] V-1 Independent reviews (karen + jenny both APPROVE; specs real-DB round-trips EXECUTED in CI, closes F23-T-4; 0 drift)
- [x] V-2 Triage (0 blocking; 1 non-blocking hardening task 226c7e42; fast-fix queue empty)
- [x] V-3 Fast-fix loop (queue empty; head-verifier APPROVED — executed-coverage chain airtight, triage honest)

LEARN:
- [x] L-1 Docs (head-learn COMPLETE — CHANGELOG SKIP test-only; M5 stays in_progress 6/10; README SKIP; no commit)
- [x] L-2 Distill (02fa8011 done; 5 observations; CI-PRINCIPLES rule 5 promoted [assert-integration-executed, 2-wave w17+w24]; PRODUCT rule 2 v2 karen-REJECTED 2nd time non-falsifiable)

NEXT:
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
