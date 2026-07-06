# P-1 Decompose — wave-65

## Maximum size rubric (all four measures)
- Files touched: ~5-6 — apps/web/src/features/sync/{db.ts (vN+1 bump), types.ts (CachedServer + CachedServerDetail), cache.ts (get/put server + serverDetail + wire dormant channels)}, apps/web/src/shell/ServerContext.tsx (write-through+read-through), + test files. **Well under 60.**
- New primitives: ~3-5 — 2 new Dexie cache tables (server list, server detail/channel tree) + activate the dormant `channels` table + new cache helpers. No new routes/models/services/SDKs (reuses shipped api.getServers/getServerDetail). **Under 60.**
- Estimated net LOC: ~500-800 (cache helpers ~90, types ~40, db schema bump ~20, ServerContext wiring ~110, tests ~250-350). **Under 5,000.**
- Stage-4 working set: small (single-file plan + a handful of source files, no SDK docs). **Under 350K.**
→ Maximum rubric: **no threshold trips.**

## Wave type + minimum floor
- claimed_task_ids = [db3ade72] → length 1 → **wave_type: single-spec**.
- Single-spec floor: net LOC > 1,500. Estimate ~500-800 → **BELOW floor → RESCOPE-AUTO-MERGE triggers.**

## Floor resolution — OVERRIDE-SHIP BY RULE (resolve-by-rule, no BOARD)
- **Verdict:** override-ship the sub-floor single-task wave. `floor_merge_attempt: 0`.
- **Why no expansion:** This is an infra-ACTIVATION / UX-completion wave — it consumes already-shipped offline substrate (Dexie cache tables + the thrice-shipped read-through pattern [DM/assignments/schedule] + ConnectionStateIndicator) and makes it function at runtime for the server-list + channel-tree surface. Inherently sub-floor in net-new feature LOC because the heavy lifting already exists. The ONLY adjacent M12 merge candidate is the conflict-resolution UI — a large, novel, standalone surface that all-3 P-0 reviewers scope-fenced (ceo-reviewer HOLD-SCOPE: own wave; mvp-thinner OK: minimal keystone, no split) — and the assignment-media leg (10e7543f) is blocked/un-buildable. Decomposition-expand has no coherent adjacent scope; padding would be the floor's own anti-goal.
- **Precedent (directly on point):** PRODUCT-PRINCIPLES rule 5 (floor targets wasteful greenfield micro-waves; a coherent reuse-heavy completion slice with no valid merge candidate is exempt). Founding lineage: wave-21 (infra-activation/UX-completion consuming shipped infra — ConnectionStateIndicator + Dexie), extended through waves 23-27/40/45/50/53/63/64. This is the same class.
- **Why no BOARD:** board-process anti-pattern #1 — resolve routine sizing by rule, never convene; the wave-24 BOARD's standing "do NOT re-litigate a Nth per-wave floor-merge" ruling. Logged to product-decisions.

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
Reason: no new UI surface. Reuses shipped `ConnectionStateIndicator` (apps/web/src/shell/ConnectionStateIndicator.tsx) for the offline signal; ServerContext already has `error`/`idle` states (ServersStatus/DetailStatus); the sidebar renders from hydrated state (existing components). Graceful empty-state reuses existing patterns. Matches design_gap_flag=false of prior offline read-through waves (63, 64).

```yaml
wave_type: single-spec
verdict: RESCOPE-AUTO-MERGE → override-ship-by-rule
floor_merge_attempt: 0
claimed_task_ids: [db3ade72-6504-4700-93b1-9d99b4098f38]
design_gap_flag: false
```
