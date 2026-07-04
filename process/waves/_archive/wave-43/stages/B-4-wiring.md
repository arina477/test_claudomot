# Wave 43 — B-4 Wiring
- **Repo typecheck:** `pnpm typecheck` 4/4 successful, 0 errors. No B-2↔B-3 drift.
- **Backend routes registered** (SchedulingController decorators): POST /servers/:serverId/scheduled-sessions (L63); GET (list) (L85); GET /scheduled-sessions/:id (L102); PATCH (L117); DELETE (L139). Server-prefixed create/list distinct from :id routes — no shadowing. SchedulingModule imported+registered in app.module.ts (L7/L46).
- **Client + shell wiring:** 5 api.ts session fns; ClassCalendar wired into MainColumn scheduleOpen branch (L167-174); ChannelSidebar Schedule tab; ServerContext scheduleOpen state.
- **Env:** no new env vars. Import sanity: covered by repo typecheck.
```yaml
typecheck_passed: true
routes_registered: ["POST /servers/:serverId/scheduled-sessions", "GET /servers/:serverId/scheduled-sessions", "GET /scheduled-sessions/:id", "PATCH /scheduled-sessions/:id", "DELETE /scheduled-sessions/:id"]
env_vars_wired: []
drift_defects: []
```
