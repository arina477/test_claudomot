# Wave 76 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, gate reviewer for wave-76 B-block Phase 1)
**Reviewed against:** process/waves/wave-76/blocks/B/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
The M13 educator-admin slice is contract-faithful and every data-exposing door is server-side guarded. The `EducatorAccessGuard` (apps/api/src/billing/educator-access.guard.ts) delegates the entire owner/educator predicate to `RbacService.can(userId, serverId, 'manage_assignments')` — it does NOT hand-roll owner/role/membership resolution, closing the karen P-4 HIGH. Reading rbac.service.ts confirms `can()` folds the owner short-circuit into its superuser branch (owner_id === userId → true) and is default-deny on missing server / non-member / null role / false flag, so both the owner path and the educator (manage_assignments-role member) path resolve correctly and no IDOR is possible (userId is the opaque session id from `getUserId()`, never a route/body value). Both educator endpoints compose in the mandated order `@UseGuards(AuthGuard, EntitlementGuard, EducatorAccessGuard)` with `@RequireEntitlement('educatorAdminTools')` — auth → entitlement → educator-access. The wave-75 /status leak (T8-F1) is genuinely closed: the endpoint now composes the third guard while preserving the `{serverId, enabled: true}` contract. AuthGuard uses `verifySession()` (verification-required), not SessionNoVerifyGuard; no pgEnum anywhere in the wave-76 surface (shared DTOs are text+Zod). Analytics is counts/rollups only — the service issues `count()`/`groupBy` over shipped tables and the `ServerAnalyticsSchema` carries no raw message content and no per-user identifiers/PII. Frontend gates the console on opaque-id owner comparison (`getMe().userId === ownerId`, BUILD-13) plus the `educatorAdminTools` entitlement, treats the server as authoritative (403 → forbidden state), imports icons inline from `./icons` (no CDN), wires the real `getServerEducatorAnalytics` client (no mock placeholder), and is tested through the real parent `ServerOverviewSettings` (BUILD-12). No migration, no new deps, no scale infra added.

## Negative-path reproduction (BUILD-PRINCIPLES rule 4 — reproduced, not code-read only)
Ran the actual specs rather than trusting the deliverable's green claim:

- `apps/api/src/billing/{educator-access.guard,educator-tools.controller,educator-analytics.service}.spec.ts` → **16/16 passed** live. Load-bearing negatives that executed green:
  - non-owner/non-educator (`can=false`) → **403 even on a school-tier server** (the T8-F1 leak fix).
  - unauthenticated (no session on request) → **403, `can()` never called** (defence-in-depth).
  - missing `:serverId` param → 403, `can()` never called (wiring-bug guard).
  - guard asserts the exact delegation shape `can(userId, serverId, 'manage_assignments')`.
  - /status contract preserved: `{ serverId, enabled: true }`.
  - analytics empty-server → zero-valued aggregates with 200 (not an error).
- `apps/web/src/shell/EducatorAdminConsole.test.tsx` → **8/8 passed** live, all rendered through the real parent `ServerOverviewSettings`: owner+school visible with real analytics values; non-owner hidden (parent gate); non-school-tier hidden; loading; empty ("No activity yet"); forbidden (403 → access-denied surface).

## Commit-discipline check (Action 6 — multi-spec)
PASS. Every feat commit cites exactly one `task_id` in its body (verified: 8da61b2→682e0912, 3b793a9→80505bb1, a720dee→d81e266d, and per-manifest 1b230d0→80505bb1 [B-1 contracts], 6248edc→ecf79f4a, f0f555f fix→682e0912). Every claimed task_id has ≥1 commit (682e0912, ecf79f4a, 80505bb1, d81e266d all covered). The shared `educator-tools.controller.ts` and `entitlements.module.ts` appear in two commits (6248edc leak-close, 3b793a9 analytics-endpoint-add), but each edit is scoped to that commit's own spec-block surface — incremental layering on a shared controller, not cross-spec bleed. No commit mixes logic across spec blocks; no single commit cites multiple task_ids.

## Minor note (non-blocking, not rework)
Spec AC for 682e0912 lists "Unknown serverId → 404"; the composed stack returns **403** for an unknown serverId because `RbacService.can()` default-denies a missing server (returns false → ForbiddenException). This is a deny-is-deny outcome that also avoids server-existence enumeration — a defensible security posture, not a leak or contract break. Flagged for the T-block/journey to confirm the 404-vs-403 disposition is acceptable; it does not gate B-6.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
