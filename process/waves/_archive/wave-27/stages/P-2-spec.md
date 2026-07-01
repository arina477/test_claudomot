# Wave 27 — P-2 Spec (pointer)

**Spec contract source of truth:** `tasks.description` of **6a546c7b** (primary; YAML head w/ 2 spec blocks + `---` + prose). **wave_type:** multi-spec. **claimed_task_ids:** [6a546c7b, 07361daf]. **design_gap_flag:** false. Sibling 07361daf linked via parent_task_id FK.

## Spec A — 6a546c7b (server presence perf index)
ACs: index on server_members(user_id) in schema+migration, applied; getServerIdsForUser uses it (Index Scan not Seq Scan, EXPLAIN/usage assertion); behavior-preserving (same co-member set, tests green); do NOT rewrite getCoMemberUserIds (already covered; SELECT DISTINCT no-op).

## Spec B — 07361daf (client subscription lift)
ACs: ONE list-level presence subscription (not per-row) — N messages → 1 subscriber; each dot reads hasPresence/getPresenceStatus at render off a single tick; behavior-preserving (dots render identically: online/offline/unknown→no-dot/self→online; single socket AC4; tests green with the subscription-count assertion updated to 1).

## Out of scope
cache infra (index/query-shape only); getCoMemberUserIds rewrite; presenceMap/snapshot rework; any UI change; invite rotation / cleanup.
