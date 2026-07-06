# P-3 — Plan (wave-55)

## Approach
Test-only. Add the 2-cell 'server-members' privacy truth-table to the existing wave-48 real-Postgres integration suite. No production code, no schema, no deps.

- **Positive cell:** insert a co-member `USER_W_SERVERMEMBERS` in SERVER_S (the shared server) via `insertFixtureUser(id, email, undefined, 'server-members')`; assert `getDmCandidates(CALLER)` INCLUDES it. Mirrors case (a)'s topology (add to case (a) or a new case (c)).
- **Negative cell:** insert a user `USER_V_SERVERMEMBERS_DISJOINT` with who_can_dm='server-members' in a DIFFERENT server the caller is NOT in; assert `getDmCandidates(CALLER)` EXCLUDES it. Mirrors case (b)'s disjoint topology but with the 'server-members' tier specifically (the load-bearing lock).
- *Alternative considered:* extend case (a)/(b) in place vs. a dedicated case (c) block. Prefer a dedicated `it('(c) who_can_dm=server-members: co-member included, disjoint excluded', ...)` for clear intent + isolated fixtures.

## Data / API / deps
NONE. `getDmCandidates` + the predicate (dm.service.ts:704-711) unchanged. `insertFixtureUser` already accepts who_can_dm as the 4th param.

## File-level steps
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| `apps/api/test/integration/dm-candidates.spec.ts` | modify | add case (c): server-members co-member INCLUDED + disjoint server-members user EXCLUDED (2 assertions, isolated fixtures, reuse pg-harness) | node-specialist | only |

## Specialist routing
- **node-specialist** (AGENTS.md — Node.js/NestJS backend + services/runtime) — owns the dm.service real-Postgres integration test. Single specialist. (Verify in AGENTS.md; if a dedicated test-automator is preferred, substitute — but node-specialist knows the dm.service + pg-harness context.)

## Parallelization
Single file, single step. No parallelism.

## Self-consistency
Every AC → the single step (positive + negative assertions). design_gap_flag false. No schema/API/deps. Sweep clean.

## Verification note
This runs in the real-Postgres integration suite (CI postgres:16 — the layer that could not run locally at B-5, authoritative at C-1). The negative assertion is the load-bearing privacy fence.
