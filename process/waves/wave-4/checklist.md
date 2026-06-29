## Wave 4 stage completion
> Active milestone: M1 — Foundation: app shell, auth & profiles (5a6efc9e-9de7-4594-a75d-d45e30d9a417, in_progress).
> Seed: 2a655960 — Profile customization backend + avatar upload (single-task bundle; no siblings).
> claimed_task_ids: [2a655960-a429-432d-8633-e8f149368ca3]
> Origin: RESCOPE-AUTO-SPLIT sibling deferred from wave-3 ("profile polish as the next wave"). Completes the M1 customizable-profile scope (username/avatar/accent) the wave-3 frontend stubbed as display_name-only.
> Near-term M1 backlog (subsequent waves): 478e9d43 branch-protection, 839af17f auth rate-limiting, a1299e88 Resend-domain, c51589cd CI browser E2E.

PRODUCT:
- [ ] P-0 Frame (discover + reframe)
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
- [ ] B-1 Contracts
- [ ] B-2 Backend
- [ ] B-3 Frontend
- [ ] B-4 Wiring
- [ ] B-5 Verify
- [ ] B-6 Review

CI/CD:
- [x] C-1 PR,CI&merge (PR#10+#11) · C-2 deploy&verify (non-avatar live; avatar pending bucket)
- [ ] C-2 Deploy & verify (canary armed when real users > 1000)

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
