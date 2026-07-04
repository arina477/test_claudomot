# Wave 42 — B-3 Frontend

react-specialist implemented the assignment collect/return UI (commit b3249dd) against design/assignment-submissions.html.

- **apps/web/src/auth/api.ts:** submitAssignment, presignSubmissionAttachment, putSubmissionAttachmentToStorage, listAssignmentSubmissions, returnSubmission.
- **AssignmentCard.tsx:** StudentSubmitForm (textarea + presign→PUT→submit attachment, uploading + error states) + OwnSubmissionCard (submitted-at, attachment chip, emerald Returned badge + educator comment blockquote, "Edit submission" resubmit). serverId prop.
- **SubmissionsRoster.tsx (NEW):** roster (skeleton/empty/error), RosterRow (avatar/timestamps/previews/Return trigger aria-haspopup=dialog), ReturnDialog (role=dialog aria-modal, focus trap Tab/Shift+Tab, Esc close, focus restore, initial focus textarea). Returns null when !isOrganizer.
- **AssignmentsPanel.tsx:** roster integrated for organizers; aria-live polite announcer region.
- **assignments.test.tsx:** listAssignmentSubmissions mock added.
- Permission-gated (isOrganizer→manage_assignments) client-side; backend also enforces. NO grade/score. web typecheck + biome lint clean.

Deviations (adjudicated MINOR): (1) single commit b3249dd rather than strict per-task — the submit/roster/return UI share AssignmentCard/AssignmentsPanel; cohesive surface, per-task split not clean (flag to B-6 for commit-discipline note, non-blocking). (2) api.ts section comment says "wave-42 M9" — should be M8 (cosmetic; fix opportunistically).

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [react-specialist]
files_implemented: [apps/web/src/auth/api.ts, apps/web/src/shell/AssignmentCard.tsx, apps/web/src/shell/SubmissionsRoster.tsx, apps/web/src/shell/AssignmentsPanel.tsx, apps/web/src/shell/assignments.test.tsx]
designs_consumed: [design/assignment-submissions.html]
deviations:
  - {specialist: react-specialist, change: "single commit vs per-task", plan_said: "commit-per-spec", why: "shared UI components across the 3 tasks", adjudication: accepted-minor-flag-B6}
  - {specialist: react-specialist, change: "M9 comment typo", plan_said: "M8", why: "typo", adjudication: cosmetic}
simplify_applied: true
```
