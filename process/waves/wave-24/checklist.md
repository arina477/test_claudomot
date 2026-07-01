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
- [ ] P-4 Gate APPROVED

DESIGN (skip block if non-UI wave):
- [ ] D-1 Brief
- [ ] D-2 Variants (with bounded iteration)
- [ ] D-3 Review & adopt

BUILD:
- [ ] B-0 Branch & schema
- [ ] B-1 Contracts
- [ ] B-2 Backend
- [ ] B-3 Frontend
- [ ] B-4 Wiring
- [ ] B-5 Verify
- [ ] B-6 Review

CI/CD:
- [ ] C-1 PR, CI & merge
- [ ] C-2 Deploy & verify
- [ ] C-3 Canary (skip if DAU<1000)

TEST:
- [ ] T-1 Static
- [ ] T-2 Unit
- [ ] T-3 Contract
- [ ] T-4 Integration
- [ ] T-5 E2E
- [ ] T-6 Layout
- [ ] T-7 Perf
- [ ] T-8 Security
- [ ] T-9 Journey

VERIFY:
- [ ] V-1 Independent reviews (Karen + jenny, parallel)
- [ ] V-2 Triage
- [ ] V-3 Fast-fix loop (or close)

LEARN:
- [ ] L-1 Docs
- [ ] L-2 Distill

NEXT:
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
