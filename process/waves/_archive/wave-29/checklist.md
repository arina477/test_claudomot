## Wave 29 stage completion

**Wave:** 29
**Active milestone:** a5232e16 — M5 Academic tooling: assignments [in_progress]
**Seed task:** d23a0740-0326-4748-a158-62e69ea733e7 — Presence/members code-debt: displayName empty-fallback + unused ServerMembers wrapper schema
**Bundled siblings (0):** none — solo-task bundle
**claimed_task_ids:** [d23a0740-0326-4748-a158-62e69ea733e7]

**Pending ritual outcomes / carry-ins for P-0:**
- **Seed = presence/members code-debt (M5 workable backlog).** displayName empty-fallback cleanup + removal of an unused ServerMembers wrapper schema / unused var. Oldest top-level todo under M5 (created 2026-06-30), the only M5 seed candidate this wave.
- **SUB-FLOOR SINGLE-SPEC / OVERRIDE-SHIP (P-0).** Code-debt cleanup with no user-facing surface — likely another below-floor single-spec (the 8th M5-debt wave). The standing **PRECEDENT-APPLICATION override-ship** applies: do not re-litigate the below-floor disposition at P-0 (wave-24 BOARD precedent "don't re-litigate"). Confirm the exact scope at P-1; expect design_gap_flag FALSE (backend/code-only).
- **wave_type expectation:** [backend / code-hygiene]. No migration expected (schema-only-if displayName storage changes, unlikely — this is a read-path fallback + dead-code removal). No UI control in scope → D-block skip likely.
- **Founder-digest carry (record-only):** Resend key = SOLE M5-close blocker (reminders arc deferred). M5 = 11 done / 7 open after wave-28. Park-or-key fork is founder-pending — **record-only, NOT a pause trigger** (in 2026-07-01 digest).
- **M5 remaining seed candidates (future):** after d23a0740, the Resend-cred-blocked reminders arc remains the M5-close headline; plus already-scoped open tasks (assignments-polish, stale manage_channels sweep, integration-hardening, extend-presence-dots) carry their own waves.
- **Unassigned queue (depth 5, P-0 may map to M5):** P-0 walks the unassigned queue per roadmap-lifecycle; re-check relevance of prior presence-perf spawns (presence-perf server+client SHIPPED in wave-27).
- **Carries (env/tooling):** Railway deploy is CLI-push not git-trigger — run `railway up` per changed service at C-2 (merge to main does NOT deploy). Playwright MCP chrome-absent → bundled-chromium (T-5 rule 1). BUILD rule 7 (biome check not format) + **BUILD rule 8 (pre-commit format gate, promoted wave-28 L-2)**. biome ignores process/**.

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
- [x] B-1 Contracts
- [x] B-2 Backend
- [x] B-3 Frontend (skipped — backend-only)
- [x] B-4 Wiring
- [x] B-5 Verify
- [x] B-6 Review

CI/CD:
- [x] C-1 PR, CI & merge
- [x] C-2 Deploy & verify (api + web deployed via railway up, verified via deployment-state endpoint serving fd03d27; canary skipped — 0 DAU pre-launch)

TEST:
- [x] T-1 Static (ci-verified — lint+typecheck green on fd03d27)
- [x] T-2 Unit (ci-verified — 407 pass; 5 mutation-genuine guard tests executed nonzero)
- [x] T-3 Contract (skipped — no contract-shape change; dead-code deletion, wire unchanged)
- [x] T-4 Integration (ci-verified — touched service specs executed on fd03d27; no live-probe value)
- [x] T-5 E2E (skipped — no user-visible UI change; C-2 verified api+web live)
- [x] T-6 Layout (skipped — non-UI wave)
- [x] T-7 Perf (skipped — not heavy)
- [x] T-8 Security (skipped — no auth/session/CSRF/rate-limit surface)
- [x] T-9 Journey (gate-passed — head-tester APPROVED; annotation-only regen, map af100be)

VERIFY:
- [x] V-1 Independent reviews (Karen + jenny, parallel)
- [x] V-2 Triage
- [x] V-3 Fast-fix loop (or close)

LEARN:
- [x] L-1 Docs
- [x] L-2 Distill

NEXT:
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
