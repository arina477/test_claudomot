# Wave 25 — B-block review artifacts

**Block:** B (Build) | **Wave topic:** M5 debt — mention parser parity (shared slug grammar) + editMessage atomicity | **Block exit gate:** B-6 | **Status:** gate-passed | **wave_type:** single-spec (Action 6 skipped) | **HEAD:** `aeeb8d6`

## Block-exit handoff
```yaml
build_block_status:    complete
branch:                wave-25-mention-parity
stages_run:            [B-0, B-1, B-2, B-3, B-4, B-5, B-6]
stages_skipped:        [D-block (design_gap_flag=false), B-0-schema-subactions (no migration)]
review_verdict:        APPROVE          # head-builder Phase-1 APPROVED + /review 0 critical/high
deviations_logged:
  - "B-3 client: web-local mention slug mirror + parity contract test (CJS-avoidance convention) instead of direct shared import — single-source-of-truth preserved by contract test"
  - "B-6 Medium accepted-debt: mid-word @ split boundary still divergent (pre-existing, low blast radius)"
fix_up_commits:        [2a1f2dd, 53162de, f9b7887, aeeb8d6]
last_commit_sha:       aeeb8d6
ready_for_ci:          true
```

## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch wave-25-mention-parity; schema SKIP; commit 44a5fd6 |
| B-1 | stages/B-1-contracts.md | done | typescript-pro: MENTION_TOKEN_SLUG_SRC/RE + extractMentionSlug in packages/shared; commit 1da04a6 |
| B-2 | stages/B-2-backend.md | done | backend-developer: server shared-slug import (behavior-preserving) + editMessage txn + real-PG rollback spec; commits 33522d6, 2a1f2dd |
| B-3 | stages/B-3-frontend.md | done | react-specialist client parity (d7074a6) + typescript-pro CJS-avoidance re-entry (53162de) |
| B-4 | stages/B-4-wiring.md | done | repo typecheck 4/4; caught B-2 organizeImports defect → re-entered |
| B-5 | stages/B-5-verify.md | done | api 395 + web 233; build 3/3; caught B-3 vite CJS-import defect → re-entered; 1 unrelated flake documented |
| B-6 | stages/B-6-review.md | in-progress | head-builder gate + /review |

## Defects caught in-block + resolved (Iron Law: all routed to specialists)
- **B-2 (at B-4):** organizeImports lint-gate error in rollback spec → backend-developer `biome check --write` → `2a1f2dd`.
- **B-3 (at B-5):** vite/rollup cannot import runtime value from CJS-only @studyhall/shared → typescript-pro web-local mirror + parity contract test (CJS-avoidance convention) → `53162de`.

## Approach deviation carried into gate (needs B-6 blessing)
P-3 planned the web client to import `extractMentionSlug` DIRECTLY from `@studyhall/shared`. The codebase's established CJS-avoidance convention (web imports types only, mirrors runtime constants locally — messagingSocket.ts:32-40) makes a direct runtime-value import un-bundleable by vite. Resolved via a web-local mirror (`apps/web/src/shell/mentionSlug.ts`) + a shared-vs-local **parity contract test** (`mention-slug-parity.test.ts`, 12 cases) that turns any drift into a RED test. Server (apps/api) DOES import the shared value directly (CJS→CJS). Net: true single source on the server; enforced-parity mirror on the client. This still satisfies the wave thesis (no silent client/server mention-grammar drift).

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
