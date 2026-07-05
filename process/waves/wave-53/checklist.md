<!-- Seed: fb1c367a-4f63-47a5-8f35-10a8d0fd492a (M8 — study-room + app-wide: non-UUID serverId leaks raw DB error via gateway catch (info-disclosure)) -->
<!-- claimed_task_ids: [fb1c367a] · milestone M8 (84e17739-af5e-4396-beb9-b6f3d6836fc4, in_progress) -->
<!-- bundled siblings (parent_task_id = fb1c367a): [] (none — single-seed bundle) -->
<!-- N-2 seed rationale: single-seed security-first drain of the M8 hardening tail (info-disclosure F-1). M8 substantive scope has shipped; remaining M8 queue is polish/hardening drained wave-by-wave. Seed re-ordered ahead of pure oldest-created_at per N-2 Action 1 (quality/security-first). DM-scale pair c5051444+874bd233 is a natural later 2-task bundle. -->
<!-- Single-task bundle → P-block sizes/specs; unlikely to split at P-1 (one focused security fix). -->
<!-- Note: wave-53 waves DB row is opened by wave-53 P-0 Action 0a (INSERT milestone_id) — NOT by N-3. -->
## Wave 53 stage completion

PRODUCT:
- [x] P-0 Frame (discover + reframe)
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [x] P-4 Gate

DESIGN (SKIPPED — design_gap_flag false, backend/error-handling only):
- [~] D-1 Brief
- [~] D-2 Variants (with bounded iteration)
- [~] D-3 Review & adopt

BUILD:
- [x] B-0 Branch & schema
- [~] B-1 Contracts (SKIPPED — no contract-surface change)
- [x] B-2 Backend
- [~] B-3 Frontend (SKIPPED — backend-only)
- [x] B-4 Wiring
- [x] B-5 Verify
- [x] B-6 Review

CI/CD:
- [x] C-1 PR, CI & merge
- [x] C-2 Deploy & verify (canary skipped — pre-launch <1000 DAU)

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
