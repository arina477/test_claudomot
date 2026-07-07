# P-3 Plan — wave-69 (M14 moderation bundle #1, multi-spec)

## Approach
### Architecture deltas
**1. reports domain (apps/api) — NEW (spec A).** New `reports` table + ReportsModule (POST /reports). Report is a first-class entity keyed to a routing server (target_server_id) so owners/mods see their queue. Alternative: reports table vs reusing an existing flags mechanism — NEW table WINS (no report/flag primitive exists; the enum target_type + status is report-specific). Failure-domain: new write endpoint (any authed user files); no privileged action here (filing is not moderation).
**2. report-action loop (apps/api) — spec B.** GET /servers/:serverId/reports (moderate_members-gated) + POST resolve → routes actions THROUGH the existing ModerationService.setMemberTimeout / MessagesService.deleteMessage so assertRankGuard applies unchanged. Alternative: re-implement rank check in ReportsService vs route through ModerationService — ROUTE-THROUGH WINS (the rank guard is load-bearing + already correct; a second impl risks divergence — the milestone mandates reuse). Failure-domain: SECURITY-critical — the action endpoints are the privileged surface (moderate_members + rank-guard + cross-server tamper guard [target_server_id===serverId]).
**3. web report surfaces (apps/web) — spec C.** Report dialog (server/member/message) + owner report inbox (moderate_members-gated). Per D-3 canonicalized design (report dialog + inbox). Alternative: inline report buttons vs a shared ReportDialog component — shared ReportDialog WINS (one dialog, 3 target types). 

### Data model (spec A)
- NEW `reports` table: id(uuid pk), reporter_id(text FK users), target_type(enum server|member|message), target_server_id(uuid FK servers), target_user_id(text FK users null), target_message_id(uuid FK messages null), reason(text bounded), status(enum open|resolved|dismissed default open), created_at, resolved_at(null), resolved_by(text FK users null). Index (target_server_id, status). NEW schema file + export from db/schema/index.ts; Drizzle-generated migration (db:generate). No change to servers/messages.
### API contracts
- POST /reports (AuthGuard) body {target_type, target_server_id?, target_user_id?, target_message_id?, reason} → Report. Server-side: callerId from session; validate target exists; resolve+persist target_server_id.
- GET /servers/:serverId/reports?status=open (AuthGuard, can(moderate_members)) → Report[].
- POST /servers/:serverId/reports/:reportId/resolve (AuthGuard, moderate_members) body {action: timeout|delete_message|dismiss} → updated Report. Routes through ModerationService/MessagesService (rank-guard); target_server_id===serverId guard.
- Owner unlist: reuse wave-68 PATCH /servers/:id {is_public:false} (owner-gated).
### New deps: none. ### SDK: N/A.

## Plan (file-level, by B-stage)
**B-0 Schema:**
| apps/api/src/db/schema/reports.ts | create | reports table + enums | database-administrator | 1st |
| apps/api/src/db/schema/index.ts | modify | export reports | database-administrator | with |
| apps/api/drizzle/migrations/<gen>.sql | create (generated) | db:generate | database-administrator | after schema |
**B-1 Contracts:**
| packages/shared/src/reports.ts (+index) | create | ReportSchema + CreateReportSchema + ResolveReportSchema (action enum) | typescript-pro | after B-0 |
**B-2 Backend:**
| apps/api/src/reports/reports.service.ts + reports.controller.ts + reports.module.ts | create | POST /reports (validate+resolve target_server_id); GET /servers/:serverId/reports (moderate_members); POST resolve (route through ModerationService.setMemberTimeout / MessagesService.deleteMessage / dismiss; rank-guard; cross-server guard). Register ReportsModule (imports Auth+Rbac+Messaging) | backend-developer | after B-1 |
| apps/api reports specs + pg-harness integration | create | report create/validate; moderate_members gate (non-mod→403); rank-guard (can't act on owner); cross-server tamper (target_server_id!==serverId→403); resolve→status/ModerationService called. LIVE-DB integration for the authz + action loop | backend-developer | after B-2 |
**B-3 Frontend (after D-3):**
| apps/web/src/auth/api.ts | modify | createReport, getServerReports, resolveReport | react-specialist | after B-1 |
| apps/web report dialog + owner inbox components + wiring (discovery listing/member/message report affordance; inbox gated on moderate_members via /me/permissions) | create | per D-3 design | react-specialist | after B-2 + D-3 |
| apps/web report/inbox tests | create | report submit→POST; inbox action→resolve; moderator-gate; success/error | react-specialist | after B-3 |

## Specialist routing (AGENTS.md): database-administrator (schema), typescript-pro (shared), backend-developer (reports service/controller + action-loop + integration), react-specialist (report UI+inbox). All present.
## Parallelization: B-0→B-1 serial. B-2 (backend) ∥ D-block (report/inbox design) can overlap. B-3 after B-2 + D-3.
## Self-consistency sweep: spec-A→B-0/B-2(POST /reports+unlist); spec-B→B-2(GET/resolve+authz); spec-C→B-3(dialog+inbox); every step has a specialist; design_gap_flag=true→D-block; contracts concrete; no deps/TBD. Clean.
