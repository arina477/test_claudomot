# Wave 76 — P-3 Plan

## Approach section

### Architecture deltas
- **New — EducatorAccessGuard** (in the billing/educator module): a NestJS guard resolving `owner OR member holding a role with manage_assignments=true` for `:serverId`. Composed AFTER `AuthGuard` + `EntitlementGuard(educatorAdminTools)`. **Alt:** a named "educator" role — rejected: the `roles` table is capability-based (no named role; manage_assignments is the academic-teaching capability). **Alt:** fold the owner/educator check inline in each handler — rejected: a guard is reusable across the /status + analytics endpoints and is the shipped idiom (EntitlementGuard).
- **Changed — EducatorToolsController** (`educator-tools.controller.ts`, wave-75): add `EducatorAccessGuard` to the existing `GET /status` (closes the wave-75 T8-F1 leak — non-owner/non-educator now 403; the `{serverId, enabled}` contract is PRESERVED). Add the analytics endpoint under the same guard stack.
- **New — EducatorAnalyticsService**: read-only Drizzle count/group aggregates over shipped tables (servers/roles/memberships, messages, assignments+submissions, scheduling), server-scoped. **Alt:** a materialized analytics table + background rollup — rejected: premature (no scale need; read-time count/group is fine for one server; no new telemetry infra per the P-0 guard).
- **New — Educator Admin Console** (`apps/web`): a new full-page/panel surface (ServerRolesPage-style), gated visible only to owner/educator on a school-tier server (ServerPlanPanel gating idiom). Renders the analytics aggregates. **Layout from the D-block** (design_gap_flag true).
- **Failure-domain impact:** all new endpoints are READS behind the composed authz (auth → entitlement → owner/educator). No schema change, no transaction-scope change, no new cross-service boundary (extends the existing educator-tools surface in the billing module). The one behavior change is /status now 403-ing non-owner/non-educator (a tightening, not a regression — closes a known leak).

### Data model
- **No schema change.** Analytics = read-only aggregate queries (Drizzle `count()`, `groupBy`) over existing tables: `servers`/`roles`/memberships (member count + role breakdown), `messages` (message volume), `assignments`+submissions (assignment count + submission rollup), `scheduling`/recent activity. No migration, no new table, no index change (aggregate reads on existing indexed FKs).

### API contracts (concrete)
- **GET `/servers/:serverId/educator-tools/status`** (modified) — `@UseGuards(AuthGuard, EntitlementGuard, EducatorAccessGuard)` + `@RequireEntitlement(educatorAdminTools)`. → 200 `{serverId, enabled:true}` (contract preserved) | 401 | 403 (wrong-tier OR non-owner/non-educator) | 404.
- **GET `/servers/:serverId/educator-tools/analytics`** (new) — same guard stack. → 200 `ServerAnalytics {memberCount, roleBreakdown, messageVolume, assignmentCount, submissionRollup, recentActivity}` | 401 | 403 | 404. Read-only, idempotent. Aggregates only (no raw content/PII).

### New deps
- **None.** No new external SDK. No migration.

## Plan section

### File-level steps by B-stage
**B-0 Branch & schema** — branch `wave-76-educator-admin-console`; NO migration. | orchestrator | first.
**B-1 Contracts** — `packages/shared/src/` (new `ServerAnalyticsSchema` Zod + type; educator-admin DTOs) + index.ts `.js` ESM re-export. | **typescript-pro** | after B-0.
**B-2 Backend** — | **backend-developer** | after B-1:
- `apps/api/src/billing/educator-access.guard.ts` (create) — EducatorAccessGuard (owner OR manage_assignments-member; reuse servers.service owner idiom + roles capability).
- `apps/api/src/billing/educator-analytics.service.ts` (create) — Drizzle count/group aggregates over shipped tables → ServerAnalytics.
- `apps/api/src/billing/educator-tools.controller.ts` (modify) — add EducatorAccessGuard to /status; add GET /analytics.
- `apps/api/src/billing/entitlements.module.ts` (modify) — register EducatorAccessGuard + EducatorAnalyticsService.
- specs: educator-access.guard.spec (owner 200 / educator-member 200 / non-owner-non-educator 403 / wrong-tier 403 / unauth 401), educator-analytics.service.spec (aggregate correctness + empty-server zero), educator-tools.controller.spec (extend wave-75 tests: /status preserved + new 403; /analytics shape + authz).
**B-3 Frontend** — | **react-specialist** | after B-2 + **after D-3** (design_gap true — console layout adopted first):
- `apps/web/src/auth/api.ts` (modify) — `getServerEducatorAnalytics(serverId)` (credentialed-fetch).
- `apps/web/src/shell/EducatorAdminConsole.tsx` (create) — console surface per the D-3 adopted layout; gated owner/educator+school (ServerPlanPanel idiom, opaque userId BUILD-13); renders analytics + loading/empty/forbidden.
- console entry wiring (route/nav in the server settings surface).
- tests: EducatorAdminConsole.test.tsx (visible owner/educator+school; hidden non-owner OR non-school; through real parent).
**B-4 Wiring / B-5 Verify / B-6 Review** — standard.

### Specialist routing (validated against AGENTS.md)
typescript-pro · backend-developer · react-specialist — all present. postgres-pro NOT needed (no migration; read-only aggregates). D-block: head-designer + aidesigner.

### Parallelization map
- B-1 → B-2 serial. B-3 waits on B-2 (analytics endpoint) AND D-3 (adopted console layout). Within B-2: guard + analytics service can be authored in parallel (independent files), controller wiring after both.

### Self-consistency sweep
1. Every P-2 AC → ≥1 step: composed authz guard (B-2 guard); /status leak-close (B-2 controller); analytics aggregates (B-2 service+controller); console UI + gating (B-3 + D-block). ✓
2. Every step has a specialist. ✓ 3. No file in two parallel batches. ✓ 4. design_gap_flag TRUE referenced → D-block before B-3. ✓ 5. Architecture deltas + alternatives declared. ✓ 6. Data/API contracts concrete, no TBD (educator predicate = manage_assignments; /status preserved). ✓ 7. No new deps. ✓ 8. No new external SDK. ✓

**Binding refinements carried:** educator predicate = owner OR manage_assignments (NOTE-1) — **resolve via the shipped `RbacService.can(userId, serverId, 'manage_assignments')` (apps/api/src/rbac/rbac.service.ts:53), do NOT hand-roll (karen P-4 HIGH; owner is folded into can's superuser branch)**; /status preserve+compose (NOTE-2); analytics read-only-aggregates-no-new-infra; opaque userId (BUILD-13); AuthGuard not SessionNoVerifyGuard; owner/educator authz on data-exposing endpoint → P-4 security-scope gate + T-8; design_gap true → D-block authors console layout before B-3.
