# Wave 1 — P-block review artifacts

**Block:** P (Product)
**Wave topic:** Bootstrap the StudyHall foundation (M1) — monorepo + dark app shell + auth + profiles
**Block exit gate:** P-4
**Status:** gate-passed

## Stage deliverables

| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | process/waves/wave-1/stages/P-0-frame.md | done | discovery + reframe complete; disposition PROCEED (RESCOPE-AUTO-SPLIT → P-1) |
| P-1 | process/waves/wave-1/stages/P-1-decompose.md | done | RESCOPE-AUTO-SPLIT; wave=seed only; single-spec; design_gap_flag=false |
| P-2 | process/waves/wave-1/stages/P-2-spec.md | done | spec contract in seed task description; single-spec |
| P-3 | process/waves/wave-1/stages/P-3-plan.md | done | approach + file-level plan; specialists validated |
| P-4 | process/waves/wave-1/blocks/P/gate-verdict.md | done | PASS (head-product APPROVED; karen+jenny APPROVE; Gemini UNAVAILABLE) |

## Block-specific context

- **Wave topic:** Bootstrap the StudyHall foundation (M1) — monorepo + dark app shell + auth + profiles
- **Spec-contract short-circuit verdict:** no-prior-spec (seed task carries prose ## What/## Why/## Acceptance, no fenced YAML head) — full P-1..P-3 run
- **Roadmap milestone:** M1 — Foundation: app shell, auth & profiles (in_progress, platform-foundation); wave row milestone_id = M1
- **design_gap_flag:** false (shell implements existing design system + mockups; D-block skips)
- **claimed_task_ids:** [cbf25dd5] (siblings split out by P-1 to future waves)
- **Tier-3 product decisions resolved this wave:** none (foundation/infra; auth is MVP-scope per security.md — triggers security-scope tightened gate at P-4, not a Tier-3 decision)
- **Autonomous mode active during P-block:** automatic

## Open escalations carried into gate

- Security-scope tightened gate: does NOT apply this wave (sliced to scaffold-only; /health is anon, no auth surface). CARRIES FORWARD to the wave claiming b9118041 (auth backend).

## Gate verdict log

<appended by fresh head-product spawn at P-4 Action 1; one entry per attempt>
F-1 (Node version): _library.md pins v20.15.0; reconcile B-0 to 20.15.0 (or amend _library if 22 deliberate). CI yml + P-3 currently say 22.

## B-block carry-forward notes (from P-4 reviewers)
- jenny Nuance 1: the **member-list column** is OUT of this wave's shell (presence/data-bearing → deferred to messaging wave). Build server-rail + channel-sidebar + main column only; treat member-list as explicitly out-of-scope so T-9 journey doesn't flag it against the mockup.
- jenny Nuance 2: HealthResponse.status enum has 'degraded' but only 'ok' is exercised this wave (no failure path) — fine, forward-compat.
- F-1 RESOLVED: Node standardized on 22 (.nvmrc canonical; CI uses node-version-file). B-0 creates .nvmrc=22.
