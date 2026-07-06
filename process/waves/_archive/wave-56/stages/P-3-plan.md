# P-3 — Plan (wave-56)
## Approach
Add a defensive LIMIT to the unbounded getDmCandidates query. No schema/deps/UX.
- Define `DM_CANDIDATES_LIMIT` (named const, e.g. 500) — module or config const in the dm module.
- Add `.limit(DM_CANDIDATES_LIMIT)` to the Drizzle chain in getDmCandidates (dm.service.ts, after `.orderBy(users.id, asc(users.display_name))` at :711, before the in-memory `.sort()`/map at :714). Bounds the fetched rows; at MVP scale (< CAP) identical output.
- *Alternative considered:* keyset/cursor pagination — REJECTED at P-0 (premature, deferred to 999a14d1). A bare LIMIT is the cause-layer correctness cap.
## Data / API / deps: NONE. DmCandidate DTO + getDmCandidates signature + who_can_dm predicate unchanged.
## File-level steps
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| apps/api/src/dm/dm.service.ts | modify | define DM_CANDIDATES_LIMIT + add .limit() to getDmCandidates query | node-specialist | first |
| apps/api/test/integration/dm-candidates.spec.ts (or dm.service.spec.ts) | modify | assert the bound: prefer an integration case proving >CAP eligible → ≤CAP returned IF the harness can bulk-insert CAP+1 cheaply; else assert the query applies the limit (representative test) + rely on existing (a)/(b)/(c) for MVP-scale no-regression. node-specialist picks the feasible honest mechanism. | node-specialist | after service |
## Specialist: node-specialist (owns dm.service; AGENTS.md). Single serial chain.
## Self-consistency: every AC → steps. design_gap false. No schema/API/deps. Clean.
## Note: CAP value (~500) is generous — at pre-launch scale never bites; it's a latent-bug guardrail. Test-mechanism honesty flagged for B-6 (don't ship a vacuous limit test).
