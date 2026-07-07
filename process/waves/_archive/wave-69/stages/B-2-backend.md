# B-2 — Backend (wave-69)
Specialist: backend-developer. ReportsModule = spec A (report substrate) + spec B (owner/mod action loop), co-located per the P-3 plan's B-2 routing.

## Files
- CREATE apps/api/src/reports/reports.service.ts — createReport (validate target exists, resolve+persist target_server_id server-side, reporter_id from session), getServerReports (moderate_members-gated, index scan), resolveReport (cross-server tamper guard target_server_id===serverId→404, moderate_members gate, 409 already-resolved, dispatch timeout→setMemberTimeout / delete_message→deleteMessage[channel_id from message row] / dismiss, flip status+resolved_at+resolved_by).
- CREATE apps/api/src/reports/reports.controller.ts — @UseGuards(AuthGuard); POST /reports, GET /servers/:serverId/reports?status, POST /servers/:serverId/reports/:reportId/resolve; callerUserId=req.session.getUserId() (SessionAugmentedRequest, mirrors moderation.controller).
- CREATE apps/api/src/reports/reports.module.ts — imports Auth+Rbac+Messaging; registered in app.module.
- MODIFY apps/api/src/rbac/rbac.module.ts — export ModerationService.
- MODIFY apps/api/src/app.module.ts — register ReportsModule.
- CREATE apps/api/test/integration/reports.integration.spec.ts — LIVE-DB (pg-harness), 10 cases incl. the 4 authz paths.

## 4 load-bearing authz paths (enforcement verified)
1. no-IDOR/session callerId — reporter_id=req.session.getUserId(); CreateReportSchema omits reporter_id so Zod strips spoofed body value.
2. moderate_members gate — rbacService.can(callerUserId, serverId, 'moderate_members') before read/mutate in getServerReports + resolveReport.
3. rank-guard via route-through — timeout→setMemberTimeout(serverId, callerUserId, target_user_id, 60) [assertRankGuard inside, UNCHANGED]; delete_message→deleteMessage(channel_id, message_id, callerUserId) [delete rank guard inside]. Args verified against real signatures (serverId-first for setMemberTimeout).
4. cross-server tamper — report.target_server_id !== serverId → NotFoundException (404, avoids cross-server existence leak).

## Owner unlist (spec A) — REUSE, no dup
Satisfied by wave-68 PATCH /servers/:id updateServer {is_public:false} (owner_id!==userId→403). No new endpoint (platform-admin unlist role DEFERRED per spec).

## Verify
- pnpm --filter api typecheck: exit 0 (shared built first). biome: clean on 5 touched files. Unit suite: 764/764 pass, no regressions.
- Integration spec: DEFERRED to CI (local test DB 127.0.0.1:5433 ECONNREFUSED) — runs in CI postgres:16 via test:integration. Structurally typecheck-clean.

## /simplify
Folded into implementation — lean, no gold-plating (no pagination/filtering/appeals/analytics — DEFERRED per spec). Verified by agent + covered by B-6 gate.

## Deviations: none.

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [backend-developer]
files_implemented: [apps/api/src/reports/reports.service.ts, reports.controller.ts, reports.module.ts, apps/api/src/rbac/rbac.module.ts (export), apps/api/src/app.module.ts (register), apps/api/test/integration/reports.integration.spec.ts]
deviations: []
simplify_applied: true
commit_sha: e7af205
```
