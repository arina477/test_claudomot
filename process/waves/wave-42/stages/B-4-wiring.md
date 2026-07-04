# Wave 42 — B-4 Wiring

- **Repo-wide typecheck:** `pnpm typecheck` → 4/4 packages successful (shared build+typecheck, api, web), 0 errors. No B-2↔B-3 drift.
- **Backend routes registered** (NestJS decorators, AssignmentsController in AssignmentsModule):
  - POST /servers/:serverId/assignments/submissions/presign (L137, member-presign; server-prefixed → no shadow)
  - POST /assignments/:id/submit (L235)
  - GET /assignments/:id/submissions (L258)
  - POST /assignments/:id/submissions/:submissionId/return (L275)
  All distinct from the bare GET/PATCH/DELETE /assignments/:id (different method or longer path) — no route shadowing.
- **Client callers** present in apps/web/src/auth/api.ts: submitAssignment, presignSubmissionAttachment, listAssignmentSubmissions, returnSubmission.
- **Env wiring:** no new env vars this wave.
- **Import sanity:** covered by repo typecheck (tsc catches orphan imports).

```yaml
typecheck_passed: true
routes_registered: ["POST /servers/:serverId/assignments/submissions/presign", "POST /assignments/:id/submit", "GET /assignments/:id/submissions", "POST /assignments/:id/submissions/:submissionId/return"]
env_vars_wired: []
drift_defects: []
```
