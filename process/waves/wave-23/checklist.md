## Wave 23 stage completion

**Wave:** 23
**Active milestone:** a5232e16 — M5 Academic tooling: assignments [in_progress]
**Seed task:** 8aa67564-a142-4628-b658-f020d4d2872c — Add dedicated manage_assignments permission (split from manage_channels)
**Bundled siblings (1):** edbdea8f-71c9-43f0-8f1f-0bcea355f183 — /me effective-permissions endpoint + assignments CTA gate (added at P-0 via BOARD-ratified SELECTIVE-EXPANSION for end-to-end delegated-organizer authz)
**claimed_task_ids:** [8aa67564, edbdea8f]

**Pending ritual outcomes / carry-ins for P-0:**
- **M5 continues (bundle 2).** Wave-22 shipped the assignments spine LIVE (organizer posts + members mark to-do/done + panel/card). This wave does the manage_assignments authz refinement — split a dedicated permission off the wave-22 manage_channels reuse.
- **Seed scope (8aa67564):** extend the rbac Permission union (4→5: +manage_assignments), the roles table flag column(s), create/update role DTOs + roleToDto, and swap the assignments controller can() call site from manage_channels → manage_assignments. Additive + risk-free now (no non-owner assignment-organizer roles exist to migrate). SINGLE call-site swap. **Migration path note (head-next flag):** confirm the seed spec encodes that existing assignment rows + the wave-22 owner-path keep working post-split — a P-2 concern, not a blocker.
- **PRODUCT-PRINCIPLES rule 1 (active):** VERIFY each "unbuilt" premise against the real repo at P-0 before assuming greenfield. The rbac Permission union, roles table, role DTOs, and the assignments controller can()-call-site ALL EXIST (M2 + wave-22) — this is an extend/swap, not greenfield. Reuse; do not rebuild.
- **CI-PRINCIPLES rule 4 (NEW, promoted wave-22):** run the formatter check (`biome format --check`) at the wiring stage before commit, not only test+typecheck — biome format drift passed local but failed CI in w19 + w22. Apply at B-wiring.
- **design_gap likely FALSE → expect D-block SKIP.** This is a backend authz/RBAC change (permission union + roles flag + DTO + call-site swap); no new page/primitive. The role-management UI (if any) may surface a checkbox, but confirm at P-1 whether any net-new UI is in scope — likely backend-only.
- **Resend / reminders DEFERRED (founder digest).** The due-date reminder arc (cron + NotificationsModule + Resend email) is the remaining mvp-critical M5 scope but needs an account-issued Resend API key (founder credential-ask, logged to process/session/updates/pending-founder-asks.log 2026-07-02). NOT seeded — once the key lands a future N-1 authors + seeds it without pausing. Until then the loop ships manage_assignments + the 6 re-homed presence/mention debt rows.
- **M5 backlog (independent, NOT this wave's scope):** 6 re-homed M3/M4 debt rows (invite-rotation d058283d, presence-dots 10b9d18e, presence-perf 6a546c7b, real-PG test tier 02fa8011, presence-debt d23a0740, mention-parity c18b8089) + 4 wave-22 V-2 follow-ons (controller-IDOR-assertion 4b397de0, /me-roles-CTA edbdea8f, rowToDto-N+1 6f257c82, optimistic-revert 3ad35a42). Claimable in future waves.
- **Carried obs (record-only, founder digest):** principles-write-outside-L-block durable structural guard (git diff at any non-L block exit = fail) still UNIMPLEMENTED — 2nd consecutive hold via per-spawn reminder (lower urgency). Playwright chrome-absent (67881a58, recurring).

PRODUCT:
- [x] P-0 Frame (no-prior-spec; problem-framer PROCEED + ceo-reviewer SELECTIVE-EXPANSION + mvp-thinner OK → accepted: bundle edbdea8f /me-roles CTA as sibling for end-to-end delegated-organizer authz; P-1 sizes, fallback seed-alone)
- [x] P-1 Decompose (multi-spec; below floor → MERGE expansion incomplete-scope [reminders cred-blocked] → BOARD P-1-floor-merge-wave-23 6/7 override-ship; design_gap_flag=false → skip D)
- [x] P-2 Spec (multi-spec, 2 blocks written to 8aa67564.description; manage_assignments perm + /me-permissions CTA gate; BOARD conditions embedded)
- [x] P-3 Plan (extend RBAC +manage_assignments: migration 0011 + backfill, Permission union, role DTOs, /me/permissions endpoint, call-site swap, CTA gate; no new dep/SDK; specialists postgres-pro/typescript-pro/backend-developer/react-specialist)
- [x] P-4 Gate APPROVED (Phase-1 head-product APPROVED + Phase-2 karen+jenny APPROVE, Gemini UNAVAILABLE; 3 non-blocking B-stage carries logged in gate-verdict)

DESIGN (skip block if non-UI wave):
- [ ] D-1 Brief
- [ ] D-2 Variants (with bounded iteration)
- [ ] D-3 Review & adopt

BUILD:
- [x] B-0 Branch & schema (branch wave-23-manage-assignments; bundle claimed; migration 0011_rainy_wild_child + backfill; no new dep/env; local apply deferred to C-block)
- [x] B-1 Contracts (shared rbac.ts +manage_assignments in RolePermissions/Create/Update schemas + NEW EffectivePermissionsSchema; Permission union 4→5; isolated typecheck clean)
- [x] B-2 Backend (rbac service createRole/updateRole/roleToDto +flag + getEffectivePermissions; GET /servers/:serverId/me/permissions; assertOrganizer swap manage_channels→manage_assignments; backfill seed; api typecheck clean)
- [x] B-3 Frontend (api.ts getMyPermissions; AssignmentsPanel CTA gate owner→owner||manage_assignments; honest-403 via existing submitError; ServerRolesPage PERM_FLAGS 5th checkbox = end-to-end grantable; web typecheck clean)
- [x] B-4 Wiring (repo typecheck 4/4 + pnpm lint exit 0; /me/permissions route registered; biome-format-drift in B-2 rbac files + 3 dead pre-existing suppressions fixed via react-specialist — CI-PRINCIPLES rule 4 catch, 3rd instance)
- [x] B-5 Verify (lint exit 0 + api unit 388 + web 216 [both authz-swap test-fixes + new manage_assignments-grant test] + build green; integration tier CI-gated no-local-DB; dev-smoke→C-2)
- [x] B-6 Review (head-builder attempt-1 REWORK [/me authz coverage] → attempt-2 APPROVED; /review 0 crit/high/med, both authz doors airtight; 3 Low accepted; commit-discipline PASS)

CI/CD:
- [x] C-1 PR, CI & merge (PR #35 merged squash; 6/6 required CI jobs success per-job-verified; merge 489c86a; local main synced)
- [x] C-2 Deploy & verify (migration 0011 applied prod-first [manage_assignments col verified]; api 0ebf493d + web 31fca925 SUCCESS distinct revisions; /me/permissions 401-not-404 LIVE proof; canary skip DAU<1000)
- [x] C-3 Canary (skipped — DAU 0 < 1000)

TEST:
- [x] T-1 Static (CI lint+typecheck green; no prod ts-bypass)
- [x] T-2 Unit (395 api + 216 web green; both authz boundaries covered)
- [x] T-3 Contract (EffectivePermissions + role DTOs typed end-to-end, no drift)
- [x] T-4 Integration (tier green; F23-T-4 Low: new-surface real-DB gap → V-2, reinforces 02fa8011)
- [x] T-5 E2E (core /me/permissions authz boundary LIVE-verified via HTTP: owner all-true, non-member 403, IDOR-safe; visual BLOCKED by chrome-absent infra 67881a58 → F23-T-5 non-blocking)
- [x] T-6 Layout (token audit PASS by diff — zero new hex/style/primitive; no canonicalized design; visual harness gap = shared F23-T-5)
- [x] T-7 Perf (bundle unchanged/0 new deps; /me/permissions mean 0.12s within SLO; no render-path change)
- [x] T-8 Security (LIVE authz AIRTIGHT — write/read/escalation doors all held via full truth-table probe; secret-grep 0; 0 crit/high/med; 4 Low→V-2)
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
