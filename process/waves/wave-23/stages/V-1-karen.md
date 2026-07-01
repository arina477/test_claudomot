# V-1 Karen — Source-claim verification (wave-23, M5 bundle 2: delegated assignment-organizer authz)

**Scope:** MERGED main @ 489c86a (PR#35) + LIVE (api 0ebf493d, web 31fca925, migration 0011 applied prod).
Tasks: 8aa67564 (manage_assignments RBAC split) + edbdea8f (/me effective-permissions + CTA gate).
**Verdict: APPROVE.** Every load-bearing claim VERIFIED against merged code + LIVE probes + C-2 direct-query evidence. No claimed-but-not-built, no decorative tests, deferral correctly logged.

---

## Per-claim

### 1. Permission union 4→5 + generic fail-closed can() — VERIFIED
- `apps/api/src/rbac/rbac.service.ts:30-35` — `Permission` union has 5 members incl. `manage_assignments`.
- `rbac.service.ts:52-92` — `can()` is generic: superuser short-circuit (`server.owner_id === userId` → true, :66), then 4 explicit default-deny gates (no server :61, no member :77, null role_id :81, missing role row :87), terminal `return role[permission] === true` (:90). Fail-closed on absent/undefined flag confirmed (strict `=== true`).

### 2. Migration 0011 applied LIVE + backfill — VERIFIED (via C-2 direct-query evidence)
- File `apps/api/drizzle/migrations/0011_rainy_wild_child.sql:1` — `ALTER TABLE "roles" ADD COLUMN "manage_assignments" boolean DEFAULT false NOT NULL;` and :3 backfill `UPDATE "roles" SET "manage_assignments" = true WHERE "manage_channels" = true;`. Both spec clauses present.
- LIVE: C-2 deliverable (`stages/C-2-deploy-and-verify.md:27-32`) records a direct prod query — column `data_type=boolean, is_nullable=NO, column_default=false`; ledger advanced 11→12, last `created_at`=1782864164741 = journal `when` for 0011; applied via drizzle-kit migrate BEFORE api cutover, in order. Backfill matched 0 rows (no manage_channels=true roles exist — consistent with P-0 owner-only seed; no silent privilege loss, nothing to lose). Cited C-2 evidence; not independently re-queryable (app DB, not control-plane).

### 3. getEffectivePermissions + GET /servers/:serverId/me/permissions — VERIFIED
- `rbac.service.ts:278-345` — owner → `owner:true` + all 5 flags true (:290-297); non-member → `ForbiddenException` (:307); null role / missing role → all-false (:311-320); role present → per-flag mirror incl. `manage_assignments: role.manage_assignments` (:340).
- Route registered: `ServerPermissionsController` in `rbac.module.ts:10,19`; controller `rbac.controller.ts:111-124` — `@Controller('servers/:serverId')` + `@Get('me/permissions')`, `@UseGuards(AuthGuard)`.
- **LIVE probe:** `GET /servers/<uuid>/me/permissions` unauth → **401** (auth guard ran, route serves the new revision) — NOT 404. Route-flip confirmed.

### 4. assertOrganizer swap — VERIFIED
- `apps/api/src/assignments/assignments.service.ts:61` — live code `this.rbacService.can(userId, serverId, 'manage_assignments')`. Single private `assertOrganizer` (:60), fanned to all 4 organizer call sites (:231,343,411,477). No `manage_channels` in LIVE assignments logic — the 4 remaining `manage_channels` hits (service :34,:56,:221 + controller :44) are all **stale header comments**, functionally inert. **Low doc-drift** (below), not a defect.

### 5. roleToDto nested flag + role DTOs — VERIFIED
- `rbac.service.ts:629-652` — `roleToDto` emits nested `permissions.manage_assignments: row.manage_assignments` (:652); create default `?? false` (:133); update patch guarded (:166).
- `packages/shared/src/rbac.ts` — `RolePermissionsSchema` carries `manage_assignments: z.boolean()` (:12); create (:54) + update (:69) DTOs carry optional boolean; `EffectivePermissionsSchema` (:97-103) has owner + 5 flags.

### 6. Role editor grantable — VERIFIED
- `apps/web/src/shell/ServerRolesPage.tsx:88-90` — `PERM_FLAGS` includes `{ key: 'manage_assignments', label: 'Manage Assignments', description: 'Post, edit, and delete assignments…' }`; rendered in the editor map (:1472). Permission is grantable in-product.

### 7. AssignmentsPanel CTA gate — VERIFIED
- `apps/web/src/shell/AssignmentsPanel.tsx:93-94` — `isOrganizer = permsStatus==='ready' && perms!==null && (perms.owner || perms.manage_assignments)`, sourced from `api.getMyPermissions(serverId)` (:81). Owner-OR-manage_assignments, NOT owner-only. Replaces wave-22 owner-only gate. Loading/error → CTA hidden (fail-safe).

### 8. Deploy hash serves merged state — VERIFIED
- LIVE: api `/health` → **200**; `/me/permissions` unauth → **401 (not 404)** proving the new-only route serves. C-2 records distinct new revisions (api 0ebf493d ≠ baseline 7ffaeaea; web 31fca925 ≠ baseline 66f4c715) via authoritative Railway deployment-state endpoint = SUCCESS. Stale-revision race excluded by route-flip proof.

### 9. Antipatterns — CLEAN
- **Claimed-but-not-built:** none. Every claimed symbol exists in merged code + serves LIVE.
- **Deferred-but-undocumented:** reminders (cron + NotificationsModule + Resend) correctly DEFERRED, logged `process/session/updates/pending-founder-asks.log:2` (Resend key cred-block, 2026-07-02, "no pause forced"). Matches spec "Out of scope" + BOARD condition. Honest.
- **Decorative tests:** real. `apps/api/src/rbac/rbac.service.spec.ts` — 7 `it()` under getEffectivePermissions (owner-superuser, per-flag, non-member 403, null-role, etc.) with behavioral `expect` assertions. `apps/api/src/assignments/assignments.service.spec.ts` — 28 `it()` blocks, 25 references to manage_assignments/assertOrganizer/403/Forbidden — exercises positive + negative (403) organizer paths, not coverage theater.

---

## Non-blocking findings (Low)

- **L1 — Stale comments reference `manage_channels` in swapped assertOrganizer path.** `assignments.service.ts:34,56,221` + `assignments.controller.ts:44` still say "can(…,'manage_channels')" in header/inline comments though live code is `manage_assignments`. Zero functional impact; misleads future readers. Fix at next touch, not a V-3 blocker.
- **L2 — Stale test description "all 4 permissions".** `rbac.service.spec.ts:164` describes an owner-superuser test as "all 4 permissions" though the union is now 5. Test body iterates real flags; label only. Cosmetic.

## Bottom line
The five load-bearing claims — permission-union 4→5, migration-0011-live, /me-endpoint-serving, assertOrganizer-swap, role-editor-grantable — are all VERIFIED against merged code, LIVE api probes (200 / 401-not-404), and C-2 direct-query evidence. Implementation matches spec ACs and carried BOARD conditions (backfill no-privilege-loss, session-derived IDOR-safe identity, honest-403 CTA path, fail-closed can()). **APPROVE.**
