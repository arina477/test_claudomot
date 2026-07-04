# Wave 42 — B-2 Backend

node-specialist implemented the assignment collect/return backend (3 per-task commits).

| Commit | Task | Method | Route |
|---|---|---|---|
| 3e154ac | db8e082a | submitAssignment | POST /assignments/:id/submit |
| 3e154ac | db8e082a | presignSubmissionAttachment | POST /servers/:serverId/assignments/submissions/presign |
| 7010660 | 1746f72a | listSubmissions | GET /assignments/:id/submissions |
| cbc2c16 | b859984b | returnSubmission | POST /assignments/:id/submissions/:submissionId/return |

- **IDOR-safe:** every :id route fetches the assignment row, derives server_id from it, passes to assertMember/assertOrganizer. No client serverId trusted.
- **Resubmit-clears-return:** submitAssignment onConflictDoUpdate sets returned_at=null + organizer_comment=null.
- **Member-presign:** presignSubmissionAttachment gates assertMember (not organizer); same key shape validateAndHeadAttachment accepts; declared before /assignments/:id.
- **mySubmission** surfaced on GET /assignments/:id for the authed member.
- NO grade/score field. api typecheck clean.

Deviations (adjudicated MINOR, accepted): (1) attachment.id uses object_key for inline submission attachments (no separate attachment row) — consistent with AttachmentRefSchema. (2) added wave-42 barrel exports to packages/shared/src/index.ts (B-1 completion). Neither contradicts plan file targets/method names.

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [node-specialist]
files_implemented: [apps/api/src/assignments/assignments.service.ts, apps/api/src/assignments/assignments.controller.ts, packages/shared/src/index.ts]
deviations:
  - {specialist: node-specialist, change: "attachment.id=object_key inline", plan_said: "reuse AttachmentRef", why: "no separate attachment row", adjudication: accepted-minor}
  - {specialist: node-specialist, change: "barrel exports in shared/index.ts", plan_said: "B-1 contracts", why: "export completion", adjudication: accepted-minor}
simplify_applied: true
```
