# Wave 25 — B-block review artifacts

**Block:** B (Build) | **Wave topic:** M5 debt — mention parser parity (shared slug grammar) + editMessage atomicity | **Block exit gate:** B-6 | **Status:** in-progress

## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | in-progress | branch wave-25-mention-parity; schema SKIP |
| B-1 | stages/B-1-contracts.md | pending | typescript-pro: MENTION_TOKEN_SLUG_RE in packages/shared |
| B-2 | stages/B-2-backend.md | pending | backend-developer: server import + editMessage txn + real-PG rollback spec |
| B-3 | stages/B-3-frontend.md | pending | react-specialist: client import |
| B-4 | stages/B-4-wiring.md | pending | typecheck + biome (rule 4/6) |
| B-5 | stages/B-5-verify.md | pending | mentions.spec.ts green (behavior-preserving) + integration executes |
| B-6 | stages/B-6-review.md | pending | |

## Block-specific context
- **Spec:** tasks row c18b8089 (DB). **Branch:** wave-25-mention-parity. **claimed_task_ids:** [c18b8089] (solo).
- **New deps/env/schema:** none.

## Binding B-1 carry (from P-4 Phase-2 karen + jenny)
Name the shared export **`MENTION_TOKEN_SLUG_RE`** (the mention token slug `[a-zA-Z0-9_-]+`, BROADER than the username grammar `[a-z0-9_]{3,20}`) — NOT "username grammar." A future dev must not tighten the mention slug to the username rule (would break hyphen/uppercase mention tokens). Behavior-preserving extraction (mentions.spec.ts green).

## Binding carries (B/T)
- Behavior-preserving extraction: mentions.spec.ts + messaging web tests stay green (regression guard). Hand-sync fallback if client renderer entangles.
- CI rule 5: the new integration spec (editMessage rollback) must ACTUALLY execute in CI (T-4/C-1 verify nonzero). BUILD rule 6: specialists run biome format before reporting.

## Open escalations carried into gate: none
## Gate verdict log: <appended by head-builder at B-6>
