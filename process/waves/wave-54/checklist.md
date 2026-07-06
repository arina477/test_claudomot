<!-- Seed: c52a7a52-c2da-48d7-ac08-a8d849e9f429 (M8 — App-wide sweep: apply UUID-format guard to all remaining client-serverId/roomId uuid-cast sites (info-disclosure hardening)) -->
<!-- claimed_task_ids: [c52a7a52-c2da-48d7-ac08-a8d849e9f429] · milestone M8 (84e17739-af5e-4396-beb9-b6f3d6836fc4, in_progress) -->
<!-- bundled siblings (parent_task_id = c52a7a52): [] (none — single-seed bundle) -->
<!-- N-2 seed rationale: security-first drain of the M8 hardening tail continues. Direct wave-53 continuation — wave-53 closed the one verified info-disclosure leak (study-room.gateway.ts) + shipped a reusable UUID-format guard / generic-error-mapping mechanism, proven live; this sweep applies that same mechanism app-wide to the not-yet-verified uuid-cast sites (same class as wave-23 inherited non-UUID :serverId -> 500). Reuses shipped guard — no new mechanism. Highest security value among the 8 M8 open candidates; kept un-entangled as a single seed (the cross-cutting audit has an unknown site count). Seed re-ordered ahead of pure oldest-created_at per N-2 Action 1 (security-first); coincidentally also newest (mvp-thinner THIN split from wave-53 P-0). DM-scale pair c5051444+874bd233 (shared /dm/candidates) deferred as a natural later 2-task bundle. -->
<!-- Single-task bundle → P-block sizes/specs; likely stays single at P-1 (one focused cross-cutting security sweep, though P-1 may split by remediation site if the audit surfaces many). -->
<!-- Note: wave-54 waves DB row is opened by wave-54 P-0 Action 0a (INSERT milestone_id) — NOT by N-3. -->
## Wave 54 stage completion

PRODUCT:
- [x] P-0 Frame (discover + reframe)
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [x] P-4 Gate

DESIGN (SKIPPED — design_gap_flag false):
- [~] D-1 Brief
- [~] D-2 Variants (with bounded iteration)
- [~] D-3 Review & adopt

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
