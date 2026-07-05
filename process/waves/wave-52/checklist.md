<!-- Seed: d123d9e0-bdcd-4815-91c5-ac90b6852997 (M8 — Add joinable focus-room surface + ephemeral join-presence backend) -->
<!-- claimed_task_ids: [d123d9e0, aad849ac, ef84b378] · milestone M8 (84e17739, in_progress) -->
<!-- siblings (parent_task_id = d123d9e0): aad849ac (focus-room UI: open-rooms list, join/leave, who-is-focusing roster), ef84b378 (scope shared study timer to focus room — per-room synchronized Pomodoro) -->
<!-- N-2 seed rationale: founder-directed study-group headline — the joinable focus-room, ceo-reviewer-recommended in BOTH wave-50 and wave-51 P-0. Authored this N-block by milestone-decomposer (commit d2bd9d0, reason=pivot-to-directed-headline). Presence-only slice-1 (~2200 LOC); voice/LiveKit + whiteboard deferred; rides shipped study-timer substrate. -->
<!-- Multi-task bundle (3 tasks) → P-block sizes/specs; likely multi-spec, may split at P-1 (decomposer flagged ef84b378 as the split point). -->
<!-- 7 M8 DM-polish stragglers + 13 unassigned stay independently seedable (wave_id NULL) for future waves. -->
<!-- Note: wave-52 waves DB row is opened by P-0 Action 0a (INSERT milestone_id) — not by N-3. -->
## Wave 52 stage completion

PRODUCT:
- [x] P-0 Frame (discover + reframe)
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [x] P-4 Gate

DESIGN (skip block if non-UI wave):
- [x] D-1 Brief
- [x] D-2 Variants (with bounded iteration)
- [x] D-3 Review & adopt

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
- [x] C-2 Deploy & verify (canary armed when real users > 1000)

TEST:
- [x] T-1 Static
- [x] T-2 Unit
- [x] T-3 Contract
- [x] T-4 Integration (skipped)
- [x] T-5 E2E
- [x] T-6 Layout
- [~] T-7 Perf (skipped — not heavy)
- [x] T-8 Security
- [x] T-9 Journey

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
