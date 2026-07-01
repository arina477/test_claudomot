## Wave 27 stage completion

**Wave:** 27
**Active milestone:** a5232e16 — M5 Academic tooling: assignments [in_progress]
**Seed task:** 6a546c7b-e459-46a6-95f2-d00707353308 — Presence perf: getCoMemberUserIds full-membership scan per connect
**Bundled siblings (0):** none — solo-task bundle
**claimed_task_ids:** [6a546c7b]

**Pending ritual outcomes / carry-ins for P-0:**
- **Presence perf wave (M5 workable backlog).** Server `presence.service.getCoMemberUserIds` does a full `server_members` scan on every connect/reconnect — now materially hotter after wave-26 shipped author-avatar presence dots (a new presence consumer on every message row). N-2 picked it: server-side, test-covered, concrete acceptance sketch (SELECT DISTINCT / index / cache). Source wave-14 V-2 (M-1/KI-1), non-blocking-until-scale but load-relevant now.
- **wave_type expectation:** [backend] (+ maybe integration test on the query). design_gap_flag likely FALSE (no UI). Confirm at P-1. wave_type likely single-spec below-floor → precedent-application override-ship (6th; per wave-24 BOARD "don't re-litigate").
- **Founder-digest carry (record-only):** Resend key = SOLE M5-close blocker (reminders arc deferred). M5 = 8 done / 9 open.
- **M5 remaining seed candidates (future):** d058283d (invite rotation — trigger not fired at ~0 servers), d23a0740 (presence code-debt cleanup); + reminders arc (cred-blocked headline).
- **Unassigned queue (wave-26 spawns, P-0 may map to M5):** 07361daf (client per-row presence-subscription perf — SAME concern-family as this seed, consider), ee6421a7 (mid-word mention split), + prior unassigned.
- **Carries:** per-row client presence subscription (07361daf) is the CLIENT half of presence perf — this wave is the SERVER half; P-0 may consider whether they're one coherent perf slice. Playwright MCP chrome-absent → bundled-chromium (T-5 rule 1). BUILD rule 7 (biome check not format). biome now ignores process/** (wave-26 fix).

PRODUCT:
- [x] P-0 Frame
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [x] P-4 Gate

DESIGN (skip block if non-UI wave):
- [ ] D-1 Brief
- [ ] D-2 Variants (with bounded iteration)
- [ ] D-3 Review & adopt

BUILD:
- [x] B-0 Branch & schema
- [x] B-1 Contracts
- [x] B-2 Backend
- [x] B-3 Frontend
- [x] B-4 Wiring
- [x] B-5 Verify
- [x] B-6 Review

CI/CD:
- [x] C-1 PR, CI & merge
- [x] C-2 Deploy & verify
- [x] C-3 Canary — SKIPPED (DAU<1000)

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
