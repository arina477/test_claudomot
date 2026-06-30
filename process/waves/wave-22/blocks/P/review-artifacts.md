# Wave 22 — P-block review artifacts
**Block:** P (Product) | **Wave topic:** M5 assignments — CRUD + per-member status spine + assignments-panel UI + tests | **Gate:** P-4 | **Status:** gate-passed
## Stage deliverables
| Stage | Deliverable | Status |
|---|---|---|
| P-0 | stages/P-0-frame.md | done (PROCEED; rule-1: organizer=owner-or-manage-flag, attachment-needs-schema, panel.html-adopted→D-partial; floor-bound keep-all) |
| P-1 | stages/P-1-decompose.md | done |
| P-2 | tasks.description of 01fcefb8 (+pointer) | done |
| P-3 | stages/P-3-plan.md | done |
| P-4 | blocks/P/gate-verdict.md | done | PASSED — head-product+karen+jenny APPROVE; Gemini authz concern→NOT-MATERIAL+3 guardrails |
## Context
- FIRST M5 wave (academic tooling: assignments — Tier T3, the differentiator Discord lacks). NEW DOMAIN. claimed: [01fcefb8 (CRUD+status spine), 916ecff7 (assignments-panel + assignment-card UI), a5f25f9b (tests)].
- M5 ## Scope: organizer (owner/educator-role) posts assignment (title/desc/due/attachment); members view + mark personal to-do/done; sorted by due date; reminders (cron+Resend) — **reminder/Resend arc DEFERRED to a later M5 bundle → NO founder cred-ask THIS wave**.
- New schema (assignments + per-member status tables). Organizer authz = existing RBAC (owner/educator-role). Reuse the attachment data plane (wave-19 FilesService) for the optional assignment attachment.
- design_gap: likely TRUE (assignments-panel page + assignment-card primitive [amber-due/red-overdue chips] = new UI) → D-block expected.
- **PRODUCT-PRINCIPLES rule 1 (promoted w20):** verify the seed's premises vs the codebase at P-0 (e.g. does an educator-role/owner-authz + the attachment data plane exist to reuse?).
## Gate verdict log
<appended by head-product at P-4>
