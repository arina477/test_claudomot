# Wave 76 — B-2 Backend
Specialist: backend-developer. 3 per-spec commits.
- **682e0912 (8da61b2):** EducatorAccessGuard delegates to RbacService.can(userId, serverId, 'manage_assignments') — NO hand-rolled owner/role (karen P-4 HIGH honored); RbacModule imported; guard spec (5). 
- **ecf79f4a (6248edc):** compose EducatorAccessGuard onto GET /status (AuthGuard+EntitlementGuard+EducatorAccessGuard); {serverId,enabled} PRESERVED; wave-75 tests kept + 2 new (owner/educator allow; non-owner/non-educator 403 — closes T8-F1 leak).
- **80505bb1 (3b793a9):** EducatorAnalyticsService (Drizzle count/group aggregates — memberCount, roleBreakdown, messageVolume, assignmentCount, submissionRollup, recentActivity buckets; counts only, no PII; empty→zero) + GET /analytics (same guard stack); service spec (3) + controller /analytics tests.

## Verify
- **Educator suite 16/16 green; full API suite 808/808 green (47 files, no regressions).** Biome clean. AuthGuard throughout; opaque userId; guard order auth→entitlement→educator-access. /simplify: no changes (guard is a lean RbacService.can delegate; analytics service is necessary aggregates).

```yaml
skipped: false
specialists_spawned: [backend-developer]
files_implemented: [educator-access.guard.ts, educator-analytics.service.ts, educator-tools.controller.ts(mod), entitlements.module.ts(mod), +4 specs]
deviations:
  - {change: "rebuilt packages/shared/dist after B-1 (stale)", adjudication: "ACCEPTED — carry to C-1: CI test job builds shared before api (turbo orders it, verified wave-75)"}
  - {change: "/analytics 401 realized as guard 403 in unit (AuthGuard owns real 401)", adjudication: "ACCEPTED — full-stack 401 asserted at T-5 e2e"}
  - {change: "recentActivity bucket types chosen (message_sent/assignment_submitted/session_scheduled)", adjudication: "ACCEPTED — reasonable, reuses computed volumes"}
simplify_applied: true
