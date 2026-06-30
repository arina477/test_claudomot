# Wave 22 — B-block review artifacts
**Block:** B (Build) | **Wave topic:** M5 assignments (CRUD + per-member status + panel/card UI) | **Gate:** B-6 | **Status:** in-progress
## Stage deliverables
| Stage | Deliverable | Status |
|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch + claim + migration 0010 |
| B-1 | stages/B-1-contracts.md | done | Assignment/AssignmentStatus/DTOs |
| B-2 | stages/B-2-backend.md | done | assignments service/controller/module (CRUD+toggle+can()-authz+attachment) |
| B-3 | stages/B-3-frontend.md | pending | AssignmentsPanel + AssignmentCard + AssignmentForm (vs adopted design) |
| B-4 | stages/B-4-wiring.md | pending | routes + DESIGN-SYSTEM --danger-text promotion + panel entry + typecheck |
| B-5 | stages/B-5-verify.md | pending | |
| B-6 | stages/B-6-review.md | pending | head-builder gate (rule-4 non-organizer-403) |
## Context
- Branch: wave-22-m5-assignments | claimed: [01fcefb8, 916ecff7, a5f25f9b]
- **P-4 carries (MANDATORY):** (1) organizer authz = rbac can(userId, serverId, 'manage_channels') — SINGLE call site (G3; manage_assignments follow-on); member routes server-membership-gated; (2) attachment: headAttachment server-validate ≤10MB BEFORE the assignment_attachments INSERT (wave-19 anti-spoof; not confirm-time-only); (3) soft-delete HIDES status via is_deleted query, NOT CASCADE (cascade = hard-delete only); tests assert hidden-not-removed; (4) rule-4 non-organizer-403 negative-path test at B-6 Phase-2; (5) per-member status UNIQUE(assignment_id,user_id) ON CONFLICT upsert + isolation (A's toggle ≠ B's); (6) due-sort ASC (due_date NOT NULL); (7) reuse rbac can() + FilesService; (8) OUT reminders/Resend (deferred) + grading/rubrics.
- **D-block carries:** B-4 vs ADOPTED design/assignments-panel.html (assignment-card .glass-panel + border-l-2 status + card-done; chip thresholds overdue<now [--danger-text]/dueSoon<48h [amber]/normal [no chip]; real-checkbox per-member toggle + stopPropagation; ph-paperclip attachment badge; organizer create/edit modal from primitives; empty-state). **PROMOTE --danger-text #f87171 to design/DESIGN-SYSTEM.md §1.**
- Migration 0010. NO new dep.
## Gate verdict log
<appended by head-builder at B-6>
