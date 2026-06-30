# Wave 15 — P-block review artifacts

**Block:** P (Product)
**Wave topic:** M3 @mentions — parse/resolve/persist + realtime fan-out + my-mentions endpoint + composer autocomplete + mention pills
**Block exit gate:** P-4
**Status:** gate-passed

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | process/waves/wave-15/stages/P-0-frame.md | done | PROCEED; mvp-thinner OK (floor-flag → P-1) |
| P-1 | process/waves/wave-15/stages/P-1-decompose.md | done | PROCEED multi-spec (~2600 LOC, above floor); design_gap TRUE |
| P-2 | tasks.description of 3d238446 (+pointer) | done | multi-spec 3 blocks; security-scoped |
| P-3 | process/waves/wave-15/stages/P-3-plan.md | done | message_mentions 0007 + parser/persist/my-mentions + autocomplete/pills/unread |
| P-4 | process/waves/wave-15/blocks/P/gate-verdict.md | done | PASSED — head-product+karen+jenny APPROVE; Gemini UNAVAILABLE |

## Block-specific context
- **Wave topic:** @mention parse/resolve/persist (message_mentions) + realtime fan-out (reuse /messaging) + GET my-mentions (authz) + composer @autocomplete member-picker + mention pills + unread-mention affordance
- **Spec-contract short-circuit verdict:** no-prior-spec (seed prose; full P-1..P-3)
- **Roadmap milestone:** M3 (6198650e) in_progress; wave-15 milestone backfilled
- **design_gap_flag:** TRUE (mention autocomplete + mention-pill + unread affordance → D-block)
- **claimed_task_ids:** [3d238446, cd585f04, c3f3f62a]
- **Tier-3 product decisions resolved this wave:** none (my-mentions authz = standard security-tightened path → T-8/P-4)
- **Autonomous mode active during P-block:** automatic

## Open escalations carried into gate
- SECURITY: GET my-mentions must authz-scope to the requesting user (no cross-user mention read) + server-membership scoping. → T-8 + P-4 tightened. Mention resolution must only resolve server members (no leak / no @everyone abuse this wave).
- SCHEMA: message_mentions association table (NEW — first schema change since wave-13 0006) → B-0 migration.

## Gate verdict log
<appended by head-product at P-4>
