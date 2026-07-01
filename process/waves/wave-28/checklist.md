## Wave 28 stage completion

**Wave:** 28
**Active milestone:** a5232e16 — M5 Academic tooling: assignments [in_progress]
**Seed task:** d058283d-a979-4528-9cd6-3ff48b4cfbc1 — Rotate permanent server invite_code (owner-gated regenerate)
**Bundled siblings (0):** none — solo-task bundle
**claimed_task_ids:** [d058283d-a979-4528-9cd6-3ff48b4cfbc1]

**Pending ritual outcomes / carry-ins for P-0:**
- **Seed = invite-code rotation (M5 workable backlog).** Owner-gated regenerate of a server's permanent `invite_code`. Oldest top-level todo under M5 (created 2026-06-29), selected over the newer presence code-debt cleanup (d23a0740).
- **SECURITY-SCOPE CARRY (P-4 gate).** This wave touches invite-code regeneration — an auth/security-adjacent surface (owner-gated authorization + credential-rotation semantics). The P-4 security-scope-tightened gate likely applies; confirm at P-1/P-2 and route T-8 Security accordingly. See CLAUDE.md trigger row "Wave touches auth / ... / user creation ..." → T-8 + P-4 security gate.
- **wave_type expectation:** [backend] (owner-gated endpoint + rotation logic; possibly a small migration if invite_code storage changes). design_gap_flag likely FALSE unless a UI control to regenerate is in scope — confirm at P-1. Possible single-spec below-floor; apply wave-24 BOARD precedent ("don't re-litigate") if so.
- **Founder-digest carry (record-only):** Resend key = SOLE M5-close blocker (reminders arc deferred). M5 = 10 done / 8 open. Park-or-key fork is founder-pending — record-only, NOT a pause trigger.
- **M5 remaining seed candidates (future):** d23a0740 (presence/members code-debt cleanup); + reminders arc (Resend-cred-blocked headline).
- **Unassigned queue (depth 5, P-0 may map to M5):** includes prior wave-26 spawns (07361daf client per-row presence-subscription perf — presence-perf family now SHIPPED server+client in wave-27, re-check relevance; ee6421a7 mid-word mention split) + others. P-0 walks the unassigned queue.
- **Carries (env/tooling):** Railway deploy is CLI-push not git-trigger — run `railway up` per changed service at C-2 (merge to main does NOT deploy). Playwright MCP chrome-absent → bundled-chromium (T-5 rule 1). BUILD rule 7 (biome check not format). biome ignores process/**.

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
- [x] B-0 Branch & schema
- [x] B-1 Contracts (skipped — no contract surface)
- [x] B-2 Backend
- [x] B-3 Frontend (skipped — backend-only)
- [x] B-4 Wiring
- [x] B-5 Verify
- [x] B-6 Review

CI/CD:
- [x] C-1 PR, CI & merge
- [x] C-2 Deploy & verify — api live (deployment 48c515e9 SUCCESS; /health 200; rotate route 404→401; web untouched; canary skipped, 0 DAU < 1000)

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
