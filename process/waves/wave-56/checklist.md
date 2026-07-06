<!-- Seed: c5051444-318f-4a90-a79a-947b4452e42f (M8 — DM: add LIMIT/pagination to getDmCandidates for large-server scale) -->
<!-- claimed_task_ids: [c5051444-318f-4a90-a79a-947b4452e42f] · milestone M8 (84e17739-af5e-4396-beb9-b6f3d6836fc4, in_progress) -->
<!-- bundled siblings (parent_task_id = c5051444): [] (none — single-seed bundle) -->
<!-- N-2 seed rationale: the ONE high-leverage remaining M8 item — real scale-correctness. getDmCandidates (apps/api/src/dm/dm.service.ts:677) returns ALL shared-server co-members with no LIMIT/pagination; fine at MVP scale, unbounded as servers grow. A wave-47 T-7-perf-deferred scope-fence slice (INFO), now the right moment to drain since M8 substantive scope is SHIPPED and this is the highest-leverage tail item (ceo-reviewer). Re-ordered ahead of oldest-created_at per N-2 Action 1 (value-first). The other 5 M8 open items are cosmetic/test-debt (f8eb49c1 typing-label unit test, a1dda389 delete-msg E2E hardening, 5bcbd27f DM off-token polish, 874bd233 DM throttle/429, ff09c4c9 DM->server nav) — deferred. Note: 874bd233 (DM throttle/429 on the same /dm/candidates surface) is a natural later pair-bundle with this scale work but is NOT pulled in — kept single-seed to hold WIP tight; P-1 may keep single. -->
<!-- Single-task bundle → P-block sizes/specs; likely stays single at P-1 (one focused DM-scale LIMIT+cursor change). -->
<!-- === M9-FOUNDER-FLAG (soft, non-pausing) === M8 substantive scope is SHIPPED (36 done); the advance to M9 (Monetization/freemium tiers) is a MONETIZATION/business-model call, FOUNDER-RESERVED under CLAUDE.md rule 17 — NOT auto-promoted, NOT BOARD-resolvable. N-1 surfaced the M8-tail-vs-M9 question as a SOFT founder note at process/session/updates/checkpoint-2026-07-06-m8-tail-vs-m9-monetization.md. No measured pause trigger fired; loop continues on this seed. If the founder answers "start monetization", promote M9 at the next N-1 (or on resume); until then, keep draining highest-value M8 items. Do NOT auto-close M8 or auto-promote M9 on brain authority. -->
<!-- Note: wave-56 waves DB row is opened by wave-56 P-0 Action 0a (INSERT milestone_id) — NOT by N-3. -->
## Wave 56 stage completion

PRODUCT:
- [x] P-0 Frame (discover + reframe)
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [x] P-4 Gate

DESIGN (evaluate design_gap_flag at P-0; likely SKIP — backend DM-scale/pagination, no new UI surface):
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
- [ ] C-2 Deploy & verify
- [ ] C-3 Canary

TEST:
- [x] T-1 Static
- [x] T-2 Unit
- [~] T-3 (SKIP)
- [x] T-4 Integration
- [~] T-5 (SKIP)
- [~] T-6 (SKIP)
- [~] T-7 (SKIP)
- [~] T-8 (SKIP — non-auth)
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
