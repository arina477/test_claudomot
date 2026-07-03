# Wave 42 — P-1 Decompose

## Maximum size rubric
| Measure | Estimate | Threshold | Trips? |
|---|---|---|---|
| Files touched | ~15–25 (schema assignment_submissions + 1–2 migrations; shared assignments.ts Zod; assignments.service.ts submit/list/return + member-presign; assignments.controller.ts 3–4 routes; AssignmentCard/Form/Panel + roster + return UI; real-PG tests) | > 60 | no |
| New primitives | ~8–12 (1 table + 1–2 migrations + 3 endpoints [submit/list/return] + possible member-presign endpoint + Zod schemas + submit/roster/return UI) | > 60 | no |
| Estimated net LOC | ~2,600–3,400 (seed submission+submit+member-presign+submit UI ~1,200; roster GET+Zod+roster UI ~700; return ALTER+POST+returned-state UI ~700; real-PG authz/behavior tests) | > 5,000 | no |
| Stage-4 working set | moderate (~150K: 3 spec blocks + assignments/attachment/RBAC context + per-agent briefs) | > 350K | no |

**Max verdict:** not tripped. No size-forced split.

## Wave type
`claimed_task_ids = [db8e082a (seed), 1746f72a (roster), b859984b (return)]` → length 3 → **multi-spec** (3 self-contained spec blocks; P-2 authors one per task; P-4 reviewers iterate per-block).

## Minimum floor
- multi-spec floor: net LOC `> 2,500` OR `claimed_task_ids.length >= 6`.
- Estimate ~2,600–3,400 LOC → **floor MET** (> 2,500). The member-gated presign path (problem-framer finding #1, if P-2 chooses it over text-only) adds ~150–250 LOC, reinforcing the floor. No floor-merge.

**Verdict:** PROCEED (multi-spec, no split, floor met).

## design_gap_flag
```yaml
design_gap_flag: true
missing_surfaces:
  - "educator submissions roster: a per-assignment list of submissions (submitter + submitted-at + text + attachment + returned-state) with a return action — NO existing mockup; a new educator-facing view (D-1 audits: may reuse list/row patterns from AssignmentsPanel/member-roster, but the submission-row + return-with-comment composition is a plausibly-new interaction)"
  - "student submit control: text + optional file attachment on the assignment card/form — likely a trivial extension of the shipped AssignmentCard/AssignmentForm patterns (D-1 may empty-audit)"
  - "returned-state display: the submitting member sees returned + comment on their own submission — small extension of the assignment card (D-1 may empty-audit)"
```
Rationale: submit control + returned-state display extend shipped AssignmentCard/Form patterns (likely trivial). The **educator submissions roster + return-with-comment control** is a plausibly-new educator-facing interaction with no mockup → **design_gap_flag=true**; D-block runs. D-1's audit confirms which surfaces are real gaps vs trivial extensions (empty-audit + skip if all covered). → P-block hands off to **D**.

```yaml
wave_type: multi-spec
verdict: PROCEED
floor_merge_attempt: 0
design_gap_flag: true
```
