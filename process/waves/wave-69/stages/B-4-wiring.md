# B-4 — Wiring (wave-69)
Orchestrator-run integration gate (verification only, no authoring).

## Repo-wide typecheck
`pnpm typecheck` (turbo, all 3 packages @studyhall/{shared,api,web}) — 4/4 successful, EXIT 0. No B-2↔B-3 contract drift.

## Route registration
- Backend: ReportsModule imported + registered in apps/api/src/app.module.ts (:17 import, :56 registration). Routes: `POST /reports`, `GET /servers/:serverId/reports`, `POST /servers/:serverId/reports/:reportId/resolve` (reports.controller.ts). RbacModule exports ModerationService (rbac.module.ts:37) so ReportsModule injection resolves.
- Client: api.createReport / api.getServerReports / api.resolveReport present in apps/web/src/auth/api.ts.
- No new frontend ROUTE (ReportInbox is a moderator-gated overlay in ChannelSidebar, not a router entry — matches design). No router change needed.

## Env wiring
No new env vars (B-0 deps/env both none; git diff shows no .env changes). Trivially clean.

## Import sanity
Covered by the repo-wide typecheck (tsc catches orphan/dead imports). Clean.

```yaml
typecheck_passed: true
routes_registered: [POST /reports, GET /servers/:serverId/reports, POST /servers/:serverId/reports/:reportId/resolve]
env_vars_wired: []
drift_defects: []
```
