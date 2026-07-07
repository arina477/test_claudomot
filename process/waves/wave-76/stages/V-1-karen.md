# V-1 Source-Claim Verification — Karen — Wave 76 (M13 Educator Admin Console + analytics)

**Verdict: APPROVE**

Verified against the DEPLOYED / MERGED state (merge commit `d8d4d9e6`, `#95`), not the diff.
Deployed live: api `https://api-production-b93e.up.railway.app` (/health 200), web `https://web-production-bce1a8.up.railway.app` (/ 200).

Every load-bearing claim of the wave is TRUE in the shipped state. Zero blocking findings. Two non-blocking notes recorded.

---

## Findings (claim → evidence)

### F-1 — Files exist on merge tree — CONFIRMED
`git cat-file -e d8d4d9e6:<path>` returns present for all seven:
- `apps/api/src/billing/educator-access.guard.ts` — EXISTS (new)
- `apps/api/src/billing/educator-analytics.service.ts` — EXISTS (new)
- `apps/api/src/billing/educator-tools.controller.ts` — EXISTS (modified)
- `apps/api/src/billing/entitlements.module.ts` — EXISTS (modified)
- `packages/shared/src/educator-analytics.ts` — EXISTS (new)
- `apps/web/src/shell/EducatorAdminConsole.tsx` — EXISTS (new)
- `apps/api/src/rbac/rbac.service.ts` — EXISTS (delegation target)

### F-2 — Guard delegates to RbacService.can (NOT hand-rolled) — CONFIRMED
`educator-access.guard.ts` calls `await this.rbacService.can(userId, serverId, 'manage_assignments')` and throws `ForbiddenException` on false. No owner/role/membership resolution is hand-rolled in the guard — the ONLY authorization query is the delegated `can()` call. `userId` comes exclusively from `req.session?.getUserId()` (opaque session id, no IDOR).
`entitlements.module.ts` imports `RbacModule` (`imports: [AuthModule, RbacModule]`) and registers `EducatorAccessGuard` + `EducatorAnalyticsService` as providers.
`rbac.service.ts:53` confirms the real signature `async can(userId, serverId, permission)`: owner is folded into the superuser branch (`if (server.owner_id === userId) return true`, line 65-67), missing server → default-deny (line 61-63), non-owner falls through to role/capability resolution. This exactly matches the P-3 binding refinement (NOTE-1, karen P-4 HIGH: resolve via `RbacService.can`, do not hand-roll).

### F-3 — Routes live on deployed api (probe) — CONFIRMED
- `GET /servers/test-server-id/educator-tools/analytics` (unauth) → **401** `{"message":"unauthorised"}`
- `GET /servers/test-server-id/educator-tools/status` (unauth) → **401** `{"message":"unauthorised"}`
- Control `GET /servers/test-server-id/educator-tools/nonexistent-xyz` → **404**

The 401 (not 404) on both target routes proves the routes are registered AND AuthGuard fires first; the 404 control confirms a genuinely-absent sibling behaves differently. Route existence + active guards confirmed against the running d8d4d9e6 deploy.

### F-4 — Guard composition on all educator endpoints — CONFIRMED (in controller source)
`educator-tools.controller.ts` — BOTH handlers carry the identical, correct stack:
- `@Get('status')` → `@UseGuards(AuthGuard, EntitlementGuard, EducatorAccessGuard)` + `@RequireEntitlement('educatorAdminTools')`
- `@Get('analytics')` → `@UseGuards(AuthGuard, EntitlementGuard, EducatorAccessGuard)` + `@RequireEntitlement('educatorAdminTools')`

Order is Auth (authenticate) → Entitlement (server tier gate) → EducatorAccess (caller authority). This closes the wave-75 T8-F1 leak: `/status` now adds `EducatorAccessGuard`, so a non-owner/non-educator school-tier member 403s instead of passing on the tier gate alone. The `{serverId, enabled:true}` contract on `/status` is preserved.

### F-5 — Analytics data-safety (counts/rollups only, no PII, soft-delete excluded) — CONFIRMED
`educator-analytics.service.ts` emits ONLY `count()` aggregates and group-by rollups — no raw message content, no per-user identifiers selected into the response. Returned shape: `memberCount`, `roleBreakdown` (per-role counts), `messageVolume`, `assignmentCount`, `submissionRollup {assignmentCount, submissionCount}`, `recentActivity` (activity-type count buckets).
Soft-delete exclusion is present on every content surface:
- `messageVolume`: `eq(messages.is_deleted, false)`
- `assignmentCount`: `eq(assignments.is_deleted, false)`
- `submissionCount`: joins assignments with `eq(assignments.is_deleted, false)`
- `sessionCount`: `eq(scheduled_sessions.is_deleted, false)`

`roleBreakdown` surfaces `roleName` (role display name — not user PII) and a synthetic "No role" bucket; the shared `ServerAnalyticsSchema` (packages/shared) enforces the aggregate-only contract via `z.number().int().nonnegative()` on every count. Empty server → zero aggregates (count over empty set = 0), no error path. Data-safety invariant holds.

### F-6 — Deploy hash: api + web serve d8d4d9e6 — CONFIRMED
- api `/health` → 200 `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`; the live 401-vs-404 route behavior (F-3) is only possible if the d8d4d9e6 controller is the running code.
- web `/` → 200.
- C-2 deliverable (`C-2-deploy-and-verify.md`) records Railway `serviceInstanceDeploy` polled to SUCCESS for BOTH services on commit `d8d4d9e6` (api instance 7358a103, web instance 107d4255), verified 2026-07-07T19:51:59Z. `ci_stage_verdict: PASS`, canary skipped (DAU < 1000). Merge commit in the deliverable (`d8d4d9e655050870ae2769ea78fea3808340a9da`) matches HEAD git history.

### F-7 — Frontend uses inline-SVG icons + real ServerAnalytics wiring — CONFIRMED
- `EducatorAdminConsole.tsx` imports all six icons from `./icons` (`ChatsCircleIcon, ClipboardTextIcon, ShieldCheckIcon, SpinnerIcon, UsersIcon, WarningCircleIcon`). All six exist as `export function` inline-`<svg>` components in `icons.tsx` (verified `ShieldCheckIcon` body: real `<svg viewBox="0 0 24 24">` with `<path>`/`<polyline>`). No Phosphor CDN webfont: grep for `phosphor.*.css|phosphor-icons|cdn.*phosphor|<i class=.ph` across `apps/web` → NONE. (The word "Phosphor" appears only in doc-comments describing the inline-SVG *style*.)
- Real data wired: `getServerEducatorAnalytics(serverId)` fetch on mount, all displayed stat values bound to the `ServerAnalytics` response (`memberCount`, `messageVolume`, `assignmentCount`, `submissionRollup`, `recentActivity`). The footer "N recent events recorded" is computed from `analytics.recentActivity.reduce(...)`, not a hardcoded mockup string. Four states (loading / loaded / empty / forbidden) plus a retryable error state, all data-driven.
- `api.ts:1104` — `getServerEducatorAnalytics: (serverId) => request<ServerAnalytics>(\`/servers/${serverId}/educator-tools/analytics\`)` — wired to the real shipped route.

### F-8 — Antipattern sweep — CLEAN
- **claimed-but-fake:** none. Every claimed file exists on the merge tree; every claimed route responds live; every claimed guard/aggregate is present in source.
- **decorative tests:** out of V-1 scope (T-block owns test honesty; T-block APPROVED per commit 1e75da4 "authz matrix proven, leak closed"). No mock-the-SUT observed in the shipped production source.
- **deferred-but-undocumented:** none found. No schema change (matches P-3 "no migration"), no new deps (matches P-3), no TODO/FIXME stubs in the shipped surfaces.

---

## Non-blocking notes (do NOT gate)

- **N-1 (doc-comment inconsistency, cosmetic):** `packages/shared/src/educator-analytics.ts` doc-comment says `ServerAnalyticsSchema` is "Returned by GET /educator/servers/:serverId/analytics" and `EducatorToolsStatusSchema` references `/educator/servers/:id/status`. The ACTUAL shipped routes are `/servers/:serverId/educator-tools/analytics` and `/servers/:serverId/educator-tools/status` (confirmed live in F-3). This is a stale comment only — the schema/type is correct and correctly consumed. No behavior impact.
- **N-2 (educator-count heuristic, product-taste — not a correctness defect):** `LoadedDashboard` derives the "Educators" tally by regex-matching role names (`/educator|teacher|owner|instructor|professor|admin/i`) rather than a capability flag. This is a display-only split of an already-safe aggregate; it cannot leak data and does not affect authorization. Flagging for product awareness only — the authz predicate (F-2) correctly uses `manage_assignments` capability, unaffected by this UI heuristic.

---

**Conclusion: APPROVE.** All 6 load-bearing claims + composition/data-safety/antipattern checks pass against the deployed d8d4d9e6 state. The two notes are cosmetic/taste and non-blocking.
