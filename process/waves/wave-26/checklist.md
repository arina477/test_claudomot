## Wave 26 stage completion

**Wave:** 26
**Active milestone:** a5232e16 — M5 Academic tooling: assignments [in_progress]
**Seed task:** 10b9d18e-5071-41dc-85de-ef257b9dfde0 — Add presence dots to message author rows and DM/member affordances
**Bundled siblings (0):** none — solo-task bundle
**claimed_task_ids:** [10b9d18e]

**Pending ritual outcomes / carry-ins for P-0:**
- **UI presence-affordance wave (M5 workable backlog).** M5's headline (reminders arc) is cred-blocked on the founder's Resend key (M5-disposition escalated — sole M5-close blocker). N-2 picked the highest user-visible workable slice: presence dots on message-row author avatars (+ DM/member affordances), driven by the existing live /presence state + presence-dot primitive. Design ref `design/server-channel-view.html` present.
- **T-5 UNBLOCK (NEW this wave):** wave-25 promoted T-5 rule 1 — "on Playwright MCP launch failure, drive the bundled chromium directly rather than marking the layer blocked." This moves presence-dot UI verification from blocked → verifiable (the standing chrome-absent blocker 67881a58 no longer stops T-5/T-6). This is WHY 10b9d18e was seeded now.
- **wave_type expectation:** [ui] (+ light backend if presence query touched). design_gap_flag likely FALSE (existing presence-dot component + design ref) — confirm at P-1.
- **Founder-digest carry (record-only):** Resend key = sole M5-close blocker (reminders deferred); mid-word `@` mention split-boundary backlog (ee6421a7, LOW, from wave-25 V-1); Playwright MCP chrome-absent now has a documented bundled-chromium substitute (T-5 rule 1).
- **M5 remaining seed candidates (future):** d058283d (invite rotation — trigger not fired at ~0 servers), 6a546c7b (presence perf — test-covered, below scale threshold), d23a0740 (presence code-debt); + cross-cutting (ParseUUIDPipe, security-hardening, stale-comment-sweep, integration-tier-hardening); + reminders arc (cred-blocked headline).

PRODUCT:
- [ ] P-0 Frame
- [ ] P-1 Decompose
- [ ] P-2 Spec
- [ ] P-3 Plan
- [ ] P-4 Gate

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
