# Wave 22 — P-1 Decompose
## Max-size rubric (no trip)
| Measure | Est | Threshold | Pass |
|---|---|---|---|
| Files | ~28-36 (migration 0010 assignments+assignment_status+assignment_attachments, schema, assignments.service/controller/module, shared types, AssignmentsPanel page + AssignmentCard + create-form, api.ts, tests) | >60 | ✓ |
| Net LOC | ~2800 | >5000 | ✓ |
## Wave type + floor
- claimed = [01fcefb8 (CRUD+status spine), 916ecff7 (panel+card UI), a5f25f9b (tests)] → 3 → **multi-spec**. Floor (>2500 LOC OR >=6 specs): ~2800 > 2500 → **above floor**.
- **mvp-thinner floor re-check (P-0 escalation):** the optional-attachment + edit/delete are valid THIN-defers on merits but cutting drops below 2500 → KEEP both (floor-bound). LOC firmed at ~2800 (attachment schema ~350-450 + edit/delete ~250-350 included) → stays above floor WITH them. No defer; floor-exemption does NOT apply (net-new feature LOC). Verdict holds: KEEP all 3 tasks + attachment + edit/delete.
## Verdict: PROCEED (multi-spec, above floor)
## design_gap_flag: TRUE (PARTIAL — design/assignments-panel.html is ADOPTED [token-compliant, has assignment-card + amber-due/red-overdue chips + per-member toggle + due-sort + organizer create modal]; the D-block is LIGHT: extract the assignment-card primitive + token-fidelity/responsive check + confirm the create-form, NOT a fresh brief/variants cycle. D-1 brief minimal/skip; D-3 review-and-adopt the extracted primitive against the adopted page.)
```yaml
design_gap_flag: true
missing_surfaces:
  - assignment-card-primitive: extract from the ADOPTED design/assignments-panel.html (amber-due/red-overdue chips, title/due/per-member-toggle). PARTIAL — design exists, B-4 builds to it; D-block verifies the extraction + tokens.
  - assignments-panel-page: the page layout exists in design/assignments-panel.html (adopted) — B-4 implements it.
```
## Carries (rule-1, from P-0): organizer authz = owner OR a manage-flag via rbac can() (NO static educator-role; P-2/P-3 pick reuse-manage_channels vs new manage_assignments flag); assignment attachment = net-new schema (attachments table message-coupled → assignment_attachments table OR nullable message_id); reminder/Resend DEFERRED.
