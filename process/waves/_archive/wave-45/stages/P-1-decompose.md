# Wave 45 — P-1 Decompose

## Maximum-size rubric (split when any trips)
| Measure | Estimate | Threshold | Trips? |
|---|---|---|---|
| Files touched | ~3-4 (.mcp.json/playwright config; useTyping.ts; ServerRolesPage.tsx) | > 60 | no |
| New primitives | 0 (no models/routes/services/migrations/SDKs/major components) | > 60 | no |
| Estimated net LOC | ~50 (config swap + 6 guarded-access refactors + ~4 dead-suppression deletions) | > 5,000 | no |
| Stage-4 working set | tiny (2 small tasks, no SDK docs) | > 350K tokens | no |

No maximum threshold trips.

## Wave type
`claimed_task_ids.length == 2` → **multi-spec**. claimed_task_ids = [67881a58 (seed), 4e994e96 (sibling)].

## Minimum floor
multi-spec floor: net LOC > 2,500 **OR** claimed_task_ids.length >= 6. Estimate ~50 LOC / 2 tasks → **BELOW FLOOR** → RESCOPE-AUTO-MERGE.

## MERGE resolution
MERGE-via-decomposition (expand-current-bundle) is **strategically blocked**: M8's only un-built `## Scope` is the metric-barred discretionary product scope (study-groups/DMs/message-search) the BOARD deferred at wave-44 N-1 pending the founder's M8 success-metric. Authoring it now would front-run that pending founder decision — contradicting the wave-44 N-1 ruling. milestone-decomposer therefore NOT spawned (floor_merge_attempt: 0) — expansion assessed as inappropriate, floor disposition escalated directly.

Escalation (automatic → BOARD, slug `P-1-floor-merge-wave-45`): **7/7 APPROVE override-and-ship**. Scoped to metric-independent infra/hygiene. See `process/waves/wave-45/escalations/board-P-1-floor-merge-wave-45.md`.

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
Rationale: no NEW UI surface. Task 1 is test-infra (Playwright MCP config). Task 2 touches production UI code (useTyping.ts typing-indicator label, ServerRolesPage.tsx) but introduces NO new page/component/icon/flow — pure behavior-preserving lint refactor over existing, already-designed surfaces. → skip D-block, hand off to B.

```yaml
p_stage_verdict: COMPLETE
verdict: ESCALATED-FLOOR-UNMET
resolution: "override-ship (BOARD P-1-floor-merge-wave-45, 7/7 APPROVE)"
wave_type: multi-spec
claimed_task_ids: [67881a58-aceb-4ccb-95e7-772e8f306dd4, 4e994e96-7935-4ebf-95ad-1551a087b6c6]
floor_merge_attempt: 0
merge_blocked_reason: "decomposition would front-run metric-barred M8 scope deferred at wave-44 N-1"
design_gap_flag: false
next_block: B
```
