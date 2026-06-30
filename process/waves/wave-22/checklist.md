## Wave 22 stage completion

**Wave:** 22
**Active milestone:** a5232e16 — M5 Academic tooling: assignments [in_progress]
**Seed task:** 01fcefb8-141e-4f65-b646-18005e780196 — Implement assignments CRUD + per-member status spine
**Bundled siblings (2):**
- 916ecff7-713e-4a92-9061-cb40f7e2364e — Build assignments-panel page + assignment-card primitive
- a5f25f9b-1c24-4d02-824b-6234f98cce3a — Test assignments CRUD + status spine (integration + E2E)
**claimed_task_ids:** [01fcefb8, 916ecff7, a5f25f9b]

**Pending ritual outcomes / carry-ins for P-0:**
- **NEW CHAPTER:** M4 (offline-first WEDGE) CLOSED at wave-21 N-3 (waves 20-21 shipped exactly-once+in-order offline send + cached reads + live connection-state + multi-page catch-up — the Discord-differentiator is LIVE). M5 (academic tooling: assignments) ACTIVATED. Wave-22 is the FIRST M5 wave.
- **PRODUCT-PRINCIPLES rule 1 (promoted rule):** VERIFY each "unbuilt" premise against the real repo at P-0/P-block before assuming greenfield. The bundle assumes new assignments table + AssignmentsModule + assignments-panel page + assignment-card primitive — confirm what (if anything) already exists; reuse modules/tables/DTOs where present; do not rebuild.
- **design_gap likely TRUE → expect D-block.** New page (assignments-panel) + new primitive (assignment-card with amber-due / red-overdue chips). `design/assignments-panel.html` referenced — consult/confirm at D-1.
- **Resend SDK = P-0 SDK-research item** per external-sdk-integration-rules.md. The due-date reminder arc (cron + NotificationsModule + Resend email) is DEFERRED to a later M5 bundle — NOT in this wave's seed. If/when picked up, Resend is an external SDK needing research + an account-issued API key (founder credential-ask).
- **Slice scope this wave:** assignments CRUD spine (organizer posts; members view + mark personal to-do/done; sorted by due date) + its page/primitive + integration/E2E tests. The reminder/notification arc is explicitly out of this bundle.
- **M5 backlog (independent, NOT this wave's scope):** 6 re-homed M3/M4 messaging/presence tech-debt rows live under M5 as top-level backlog candidates (invite-rotation d058283d, presence-dots 10b9d18e, presence-perf 6a546c7b, real-PG test tier 02fa8011, presence-debt d23a0740, mention-parity c18b8089). A future P-0/N-2 may pick these once the assignments arc is underway; the wave-22 seed is the assignments spine, selected explicitly over these older-created rows.
- **Carried obs (record-only, founder digest):** obs-2 — principles-file-write-outside-L-block guard. The per-spawn no-edit reminder HELD this wave (1st hold after 7 instances — head-verifier honored it); the durable structural guard (git diff HEAD -- 'command-center/principles/*.md' non-empty at ANY block exit = gate fail, all gate agents) is still UNIMPLEMENTED — now LOWER urgency (reminder mitigates). BUILD rule 5 promoted (reconnect-loop re-entrancy guard). VERIFY candidate: async-invariant-executing-test (1st-instance → future L-2). Playwright chrome-absent (67881a58).

PRODUCT:
- [ ] P-0 Frame (discover + reframe)
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [x] P-4 Gate APPROVED

DESIGN (skip block if non-UI wave):
- [ ] D-1 Brief
- [ ] D-2 Variants (with bounded iteration)
- [x] D-3 Review & adopt (PARTIAL — build-ready, 2 contrast fixes)

BUILD:
- [ ] B-0 Branch & schema
- [ ] B-1 Contracts
- [ ] B-2 Backend
- [ ] B-3 Frontend
- [ ] B-4 Wiring
- [ ] B-5 Verify
- [ ] B-6 Review

CI/CD:
- [x] C-1 PR, CI & merge (PR #34 merged → 108f4a3; 7/7 CI green on e0b24ee; 1 fix-up cycle: biome format drift routed to react-specialist)
- [x] C-2 Deploy & verify (api 7ffaeaea + web 66f4c715 SUCCESS, distinct from baseline; migration 0010 applied 10→11; assignments route serves 401-not-404; canary skipped DAU<1000)

TEST:
[x] - [ ] T-1 Static
[x] - [ ] T-2 Unit
[x] - [ ] T-3 Contract
[x] - [ ] T-4 Integration
[x] - [ ] T-5 E2E
[x] - [ ] T-6 Layout
[x] - [ ] T-7 Perf
[x] - [ ] T-8 Security
[x] - [ ] T-9 Journey

VERIFY:
- [ ] V-1 Independent reviews (Karen + jenny, parallel)
- [ ] V-2 Triage
- [ ] V-3 Fast-fix loop (or close)

LEARN:
- [x] L-1 Docs (CHANGELOG.md:47-50 #34; M5 a5232e16 stays in_progress done=3/open=11; README skipped; no backlog-stockout)
- [ ] L-2 Distill

NEXT:
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
