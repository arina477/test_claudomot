# Wave 15 — B-2 Backend
```yaml
skipped: false
specialists_spawned: [backend-developer]
files_implemented:
  - apps/api/src/messaging/mentions.ts (parseMentions util)
  - apps/api/src/messaging/mentions.spec.ts (24 tests)
  - apps/api/src/messaging/messages.service.ts (resolve/persist on create, edit-diff, rowToDto mentions[], listMessages batch, my-mentions query)
  - apps/api/src/messaging/messages.controller.ts (MentionsController GET /me/mentions)
  - apps/api/src/messaging/messaging.module.ts (register MentionsController)
deviations: []
simplify_applied: true
```
- Edit-diffing: fetch existing rows → delete no-longer-mentioned + insert new (idempotent, ON CONFLICT DO NOTHING).
- my-mentions authz: viewerUserId = req.session.getUserId() ONLY (no param/path/body) — structurally cannot read another user's. Server-membership scoped, soft-deleted excluded, cursor-paginated.
- username IS NOT NULL filter applied in resolveMentions (P-4 carry). @everyone/@role OUT. Realtime: mentions[] rides existing message.created/updated DTO (no new event).
- Typecheck clean; 276/276 api tests pass (+24 new).
