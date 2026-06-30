# Wave 22 — P-2 Spec (pointer)
**Source of truth:** tasks.description of seed 01fcefb8. wave_type multi-spec (3 blocks), design_gap TRUE-partial (D-block light — assignments-panel.html adopted).
- 01fcefb8: assignments CRUD (organizer=owner/manage-flag via can(), title/desc/due/optional-attach; non-organizer 403) + per-member to-do/done (UNIQUE(assignment_id,user_id) upsert) + due-sorted list (+myStatus) + edit/soft-delete (cascade status) + optional attachment via NEW assignment_attachments (FilesService reuse). Migration 0010.
- 916ecff7: assignments-panel page + assignment-card primitive (amber-due/red-overdue chips, per-member toggle, organizer create/edit form) vs ADOPTED design/assignments-panel.html.
- a5f25f9b: tests — CRUD + authz-403-gates (rule-4) + due-sort + one-per-member-UNIQUE + status-isolation + soft-delete-cascade + attachment-server-validated.
**Authz:** rbac can() (owner OR manage-flag — NO static educator-role). **OUT:** reminders/Resend (deferred, no cred-ask); grading/rubrics/submissions.
