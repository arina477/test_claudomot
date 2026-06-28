## Wave 2 stage completion

> Seeded by wave-1 N-3 handoff.
> Active milestone: M1 `5a6efc9e-9de7-4594-a75d-d45e30d9a417` (in_progress) — Foundation: app shell, auth & profiles.
> Seed task: `b9118041-06c0-4478-9d15-dfc715e3b97a` — Postgres + Drizzle + SuperTokens auth backend.
> Bundled siblings: (none — single-task bundle).
> claimed_task_ids: `[b9118041-06c0-4478-9d15-dfc715e3b97a]` (B-0 claims this batch; L-2 closes it).
> SECURITY-SCOPE CARRY-FORWARD: seed touches auth (signup/login/sessions/cookies/CSRF/rate limits) →
> wave-2 P-4 MUST apply the security-scope tightened gate; T-8 Security stage MUST run.
> No pending rituals deferred to founder.

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
- [x] B-3 Frontend (SKIPPED — backend-only)
- [x] B-4 Wiring
- [x] B-5 Verify
- [x] B-6 Review

CI/CD:
- [ ] C-1 PR, CI & merge
- [x] C-2 Deploy & verify (canary armed when real users > 1000)

TEST:
- [x] T-1 Static
- [x] T-2 Unit
- [x] T-3 Contract
- [x] T-4 Integration
- [x] T-5 E2E
- [x] T-6 Layout
- [x] T-7 Perf
- [x] T-8 Security
- [x] T-9 Journey

VERIFY:
- [x] V-1 Independent reviews (Karen + jenny, parallel)
- [x] V-2 Triage
- [x] V-3 Fast-fix loop (or close)

LEARN:
- [x] L-1 Docs
- [x] L-2 Distill

NEXT:
- [x] N-1 Survey & triggers
- [x] N-2 Seed
- [x] N-3 Handoff
