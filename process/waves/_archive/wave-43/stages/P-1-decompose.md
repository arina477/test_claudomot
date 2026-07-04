# Wave 43 — P-1 Decompose

## Maximum size rubric
| Measure | Estimate | Threshold | Trips? |
|---|---|---|---|
| Files touched | ~15–25 (scheduled_sessions schema + migration; scheduling module schema/module/service/controller; shared Zod; SessionForm modal; calendar view component; session detail component; web api.ts; real-PG tests) | > 60 | no |
| New primitives | ~8–14 (1 table + 1 migration + scheduling module + ~5 endpoints [create/list/get/update/delete] + Zod schemas + 3 UI surfaces) | > 60 | no |
| Estimated net LOC | ~2,500–3,600 (entity + module mirroring assignments + recurrence descriptor + 3 UI [modal/calendar/detail] + real-PG authz/behavior tests) | > 5,000 | no |
| Stage-4 working set | moderate (~150K: 3 spec blocks + assignments-module/RBAC context + per-agent briefs) | > 350K | no |

**Max verdict:** not tripped. No size-forced split. (Recurrence is bounded to a closed enum + recurrence_until per P-0 flag — kept in scope; P-1 does NOT split it out, but B-block may escalate a split if the recurrence read-model proves heavier than estimated.)

## Wave type
`claimed_task_ids = [535bdb8c (seed), cdf81427 (calendar view), 1216146e (session detail)]` → length 3 → **multi-spec**.

## Minimum floor
- multi-spec floor: net LOC `> 2,500` OR `claimed_task_ids.length >= 6`.
- Estimate ~2,500–3,600 LOC → **floor MET** (> 2,500). No floor-merge.

**Verdict:** PROCEED (multi-spec, no split, floor met).

## design_gap_flag
```yaml
design_gap_flag: true
missing_surfaces:
  - "class calendar view: a per-server member-visible list/agenda of scheduled sessions (date-grouped) — NO existing mockup; a genuinely new educator/student surface (D-1 audits; may reuse list/row patterns from assignments-panel but the date-grouped calendar/agenda composition is new)"
  - "session authoring modal: educator create/edit a session (title, description, starts_at/ends_at, recurrence) — likely a trivial mirror of the shipped AssignmentForm.tsx modal pattern (D-1 may empty-audit)"
  - "scheduled-session detail view: single-session drill-in with role-gated edit/delete — small extension of card/detail patterns (D-1 may empty-audit)"
```
Rationale: the authoring modal + session detail mirror shipped AssignmentForm/card patterns (likely trivial). The **class calendar/agenda view** is a plausibly-new date-grouped interaction with no mockup → **design_gap_flag=true**; D-block runs. D-1's audit confirms which surfaces are real gaps vs trivial extensions.

```yaml
wave_type: multi-spec
verdict: PROCEED
floor_merge_attempt: 0
design_gap_flag: true
```
