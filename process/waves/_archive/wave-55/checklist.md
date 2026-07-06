<!-- Seed: 344eabde-bc21-4978-9473-d5b46b7276b1 (M8 — DM privacy: add who_can_dm='server-members' positive-control integration case for /dm/candidates) -->
<!-- claimed_task_ids: [344eabde-bc21-4978-9473-d5b46b7276b1] · milestone M8 (84e17739-af5e-4396-beb9-b6f3d6836fc4, in_progress) -->
<!-- bundled siblings (parent_task_id = 344eabde): [] (none — single-seed bundle) -->
<!-- N-2 seed rationale: GENUINELY-MISSING privacy control (not polish). The real-Postgres DM-candidates suite tests who_can_dm='nobody'+'everyone' but NOT the third enum 'server-members' — an unverified path on the who-can-DM bet differentiator (ad1a3685) vs Discord. Flagged HIGH PRIORITY by wave-54 P-0 ceo-reviewer + L-block. Strictly higher-value than the remaining DM-polish/hardening/test tail (wave-54 hardening-of-an-already-closed-class was the weakest drain). Re-ordered ahead of oldest-created_at per N-2 Action 1 (value-first). Focused DM-REST integration test → single-seed bundle; P-1 may keep it single. DM-scale pair c5051444+874bd233 (shared /dm/candidates) deferred as a natural later 2-task bundle. -->
<!-- Single-task bundle → P-block sizes/specs; likely stays single at P-1 (one focused DM-REST integration case). -->
<!-- Note: wave-55 waves DB row is opened by wave-55 P-0 Action 0a (INSERT milestone_id) — NOT by N-3. -->
## Wave 55 stage completion

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
- [x] B-0 Branch & schema
- [~] B-1 Contracts (SKIP)
- [x] B-2 Backend
- [~] B-3 Frontend (SKIP)
- [x] B-4 Wiring
- [x] B-5 Verify
- [x] B-6 Review

CI/CD:
- [x] C-1 PR, CI & merge
- [x] C-2 Deploy & verify (canary skipped)

TEST:
- [x] T-1 Static
- [x] T-2 Unit
- [~] T-3 Contract (SKIP)
- [x] T-4 Integration
- [~] T-5 E2E (SKIP)
- [~] T-6 Layout (SKIP)
- [~] T-7 Perf (SKIP)
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
