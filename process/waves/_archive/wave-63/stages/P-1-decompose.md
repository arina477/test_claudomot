# P-1 Decompose — wave-63 (M12 offline-academic-read bundle #2)

## Maximum size rubric — NO SPLIT
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | >60 | ~12-18 (db.ts, cache.ts, types.ts + tests; assignments hook/panel, class-calendar hook + tests) | no |
| New primitives | >60 | ~4 (2 Dexie tables, 2 Cached* types) + ~4 helpers | no |
| Net LOC | >5,000 | ~1900 (decomposer est) | no |
| Stage-4 working set | >350K | moderate | no |

## Wave type: multi-spec (claimed_task_ids.length == 3: [c5689dc5 seed, 35c57942, 42e0a265]).

## Minimum floor — TRIPPED (below 2,500 LOC multi-spec floor), WAIVED (override-ship, resolve-by-rule)
Multi-spec floor >2,500 LOC OR ≥6 specs; ~1900 LOC / 3 specs trips. **Floor WAIVED** per the infra-reuse floor-exemption
lineage (product-decisions wave-21/50; and wave-62 applied this exact exemption for M12 bundle #1). This wave EXTENDS
the shipped Dexie/cache substrate (apps/web/src/features/sync) verbatim in shape — the heavy lifting (Dexie singleton,
read-through pattern, migration discipline, fake-indexeddb harness) already exists (M4 + bundle #1). All 3 P-0
reviewers scope-fenced against expansion (problem-framer PROCEED, ceo-reviewer HOLD-SCOPE, mvp-thinner OK — schedule
NOT splittable, would re-pay the v-bump migration risk). Override-ship §2b(a), keep the 3-task bundle, resolve-by-rule.

## Verdict: PROCEED (floor-waived, 3-task multi-spec bundle)

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []   # reuses shipped offline UI (connection indicator, cached rendering); AssignmentsPanel + ClassCalendar surfaces already exist; offline rendering of cached academic data needs no new mockup
```

## Carry-forward (to P-2/P-3/B)
- HIGHEST-RISK: Dexie v2->v3 `.version(3).stores()` MUST re-state ALL v1+v2 tables verbatim (channels/messages/outbox/dmConversations/dmMessages) + preservation test (v1→v2→v3). head-builder byte-compares. [2nd instance of the verbatim-restate lesson — head-learn L-2 wave-62 held candidate → confirm this wave.]
- SESSIONS cache must account for the window-dependent occurrence-EXPANDED response (server expands weekly occurrences per from/to) — NOT a naive by-id cache.
- cache-only degradation strictly when disconnected (no stale-over-live).

## Footer
```yaml
wave_type: multi-spec
verdict: PROCEED
floor_merge_attempt: 0
siblings_created: []
design_gap_flag: false
```
