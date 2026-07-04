# Wave 43 — B-2 Backend

node-specialist implemented the scheduling module (3 per-task commits) mirroring assignments.

| Commit | Task | Scope |
|---|---|---|
| 12c5bad | 535bdb8c | scheduling.service/controller/module CRUD (create/update/softDelete) + app registration |
| 64d6a8a | cdf81427 | listSessionsForServer + GET /servers/:serverId/scheduled-sessions (recurrence expansion) |
| 7d77797 | 1216146e | getSession + GET /scheduled-sessions/:id |

- **5 endpoints:** POST /servers/:serverId/scheduled-sessions, GET (list, ?from&to), GET /scheduled-sessions/:id, PATCH, DELETE.
- **IDOR-safe:** all :id routes derive server_id from the fetched row; client never supplies serverId.
- **Recurrence compute-on-read:** 7-day cursor from starts_at, capped at min(recurrence_until, window); 90d hard cap / 60d default window; batched organizer resolve (inArray, no N+1); no materialized rows; 'none' emits once. Sorted startsAt ASC.
- **Reuse manage_assignments** (assertOrganizer=can(manage_assignments)); assertMember; soft-delete. Stale manage_channels comment NOT carried. api typecheck clean. Deviations: none.

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [node-specialist]
files_implemented: [apps/api/src/scheduling/scheduling.service.ts, apps/api/src/scheduling/scheduling.controller.ts, apps/api/src/scheduling/scheduling.module.ts, apps/api/src/app.module.ts]
deviations: []
simplify_applied: true
```
