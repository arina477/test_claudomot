# Wave 10 — B-6 Gate Verdict (M2 RBAC capstone — access-control CORE)

**Block:** B · **Wave:** 10 (`wave-10-m2-rbac`) · **Gate:** B-6 Review · **Verdict:** **APPROVED**
**Gating head:** head-builder (fresh spawn) · **Date:** 2026-06-29
**Build health:** 270 tests green (173 API + 97 web); typecheck + lint + test all pass via `turbo run`.

---

## Load-bearing security conditions — verified against code (not prose)

Each verified by reading the implementation AND confirming a test asserts it. This is the highest-stakes M2 surface; every server-side-enforcement claim was checked in the source.

### 1. `can()` SERVER-SIDE + default-DENY — PASS
`RbacService.can(userId, serverId, permission)` (`rbac.service.ts:41-80`):
- Owner path: `server.owner_id === userId → true` (superuser, all 4 perms).
- Default-DENY at **every** branch: server missing → false; not a member → false; `role_id` null → false; role row missing → false; flag not `true` → false.
- `userId` is supplied by callers from `req.session.getUserId()` only (controllers `rbac.controller.ts:56,78,95,128`, `channel-override.controller.ts:62,81`) — never from body/param → no IDOR.
- Tests: `rbac.service.spec.ts` covers server-missing, not-member, null `role_id`, flag-false, owner-superuser-on-all-4, and flag-resolution (manage_members false when only manage_roles=true). **Tested.**

### 2. No self-promote — PASS
`assignRole` requires `can(callerUserId, serverId, 'manage_members')` in **both** the controller guard (`rbac.controller.ts:131`) and the service as defence-in-depth (`rbac.service.ts:207`). A Member lacks `manage_members` → `ForbiddenException` (403). Test `rbac.service.spec.ts:512` "throws ForbiddenException when a Member (no manage_members) tries to self-promote". **Tested.**

### 3. `ChannelPermissionGuard` route-params-only (no body-spoof) — PASS
Guard reads `req.params.id` / `req.params.channelId` only; `req.body` is never consulted for authz (`channel-permission.guard.ts:47-48`); userId from session. Test `channel-permission.guard.spec.ts:75` asserts `canViewChannel` is called with route-param values and explicitly `not.toHaveBeenCalledWith(..., 'attacker-server', ...)` — route-param provably wins over body. **Tested.**

### 4. Channel-list server-side filter (no enumeration) — PASS
`findServerDetail` (`servers.service.ts:162-167`) computes `getVisibleChannelIds` and filters `chanRows`; non-visible channels are **absent** from the response (not UI-hidden). Tests `servers.service.spec.ts:411,445` assert `channelIds).not.toContain('ch-2')` / `not.toContain('ch-private')`. **Tested.**

### 5. Private channel default-DENY — PASS
`canViewChannel` (`rbac.service.ts:304-306`): private (`is_private`) → returns `overrideCanView === true`, i.e. deny unless an override grants `can_view=true`. `getVisibleChannelIds` mirrors this (`:372-373`). Tests `rbac.service.spec.ts:428` (private default-deny → false) and `:442` (visible when override grants true). **Tested.**

### 6. Owner-lockout TRANSACTIONAL — PASS
`owner-lockout.service.ts`: `demoteOwner`, `removeMember`, `leaveServer`, `transferOwnership` each open `db.transaction` with `SELECT ... .for('update')` row-lock on the `servers` row, throwing `ConflictException` (409) on the last-owner case. The row-lock serialises concurrent demote+leave so ownership cannot be zeroed. Tests `owner-lockout.service.spec.ts:272-325` model the concurrent demote+leave race (transfer-then-leave succeeds; both-as-owner → at least one 409). **Tested.**

---

## Data model + architecture — PASS

- **Schema** (`servers.ts`): `roles` (4 fixed flags `manage_server/roles/channels/members`, no matrix) + `channel_permission_overrides` with `UNIQUE(channel_id, role_id)` and `cpo_channel_id_idx` INDEX; `server_members.role_id` FK → `roles.id` `ON DELETE set null`. Table name `channel_permission_overrides` per product-decision.
- **Migration** `0004_green_madripoor.sql` — generated + committed; creates both tables, the UNIQUE constraint, the index, all FKs/cascades. No `migrate()` call in `src/`; no startup migration wiring in `main.ts` / `app.module.ts` → no auto-migrate. Backfill is app-side (`backfill-roles.ts`).
- **Contract** (`packages/shared/src/rbac.ts`): single Zod source of truth (4 fixed flags); all DTOs (`Role`, `ChannelOverride`, Create/Update/Assign/Upsert inputs) derive from it; controllers `safeParse` against the shared schemas.
- **Wiring:** `RbacModule` exports `RbacService` + guard + lockout; `ServersModule` imports `RbacModule` (`servers.module.ts:8`). Single-role-per-member (#6) honored.

## Scope discipline — PASS
v6b-thinned model held: NO permission-matrix, NO custom-builder, NO role hierarchy, NO multi-role. UI gating (`ServerRolesPage.tsx`, `ChannelSidebar.tsx`) is convenience only — server enforces at every door. No scale gold-plating (no Redis/queue/replica).

## Build-health honesty — PASS
De-flake commit `e312ce9` is a proper fix: wraps two post-fetch `toHaveValue` assertions in `waitFor()` so they retry until the fetch+auto-select effect settles. NOT a `--retry` mask, NOT a try/catch swallow, NOT a `.skip`. Secret-grep over the branch diff: only hit is `name: 'secret'` (a test-fixture role name) — no real credential.

## Commit-per-spec (Action 6) — PASS
- `35f191f4` → `114bf5f` (can() + role CRUD + assignment)
- `2c927c44` → `71eccf8` (channel overrides + guard + server-side filter)
- `7a10f13d` → `c5d24db` (transactional owner-lockout)
- `0b9bcf35` → `c258d49` (roles UI) + `e312ce9` (de-flake)
Each of the 4 spec tasks carries ≥1 commit.

---

## Stage-exit checklist (B-block)
- [x] B-1 Zod single source; NestJS DTOs derive; error responses use Nest exception shape.
- [x] B-1 every new table has a generated, committed Drizzle migration; no startup auto-migrate.
- [x] B-2 every protected route composes `AuthGuard` + service-level `can()` permission check (+ `ChannelPermissionGuard` for channel scope).
- [x] B-2 server-side enforcement at every door; IDOR-safe (userId from session).
- [x] B-5 build health green on real Postgres path (270 tests, full turbo 2x-stable).
- [x] B-6 reviewed by an agent other than the author (this head, fresh spawn) against the 6 load-bearing conditions.
- [x] No over-engineering for MVP scope (thinned model held).

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: B-6
  reviewers:
    head-builder: APPROVED   # fresh-spawn gate, code-level verification of 6 security conditions
  failed_checks: []
  rationale: >
    M2 RBAC capstone is built correctly and in order: contract locked in @studyhall/shared
    before logic, migration 0004 generated+committed with no auto-migrate, backend and
    frontend against one shape, wired (RbacModule→ServersModule) and green on the real
    Postgres path. All six load-bearing security conditions were verified IN CODE and each
    has an asserting test: can() is server-side with default-DENY at every branch and userId
    from session (no IDOR); self-promote is blocked (Member lacks manage_members → 403);
    ChannelPermissionGuard reads route-params only with a test that proves route-param wins
    over a spoofed body; findServerDetail filters channels server-side so non-visible
    channels are ABSENT (no enumeration); private channels default-DENY unless an override
    grants can_view=true; owner-lockout is transactional with SELECT FOR UPDATE row-locks and
    a modelled concurrent demote+leave race. The v6b-thinned model held (no matrix/builder/
    hierarchy/multi-role), UI gating is convenience-only, and the de-flake (e312ce9) is a
    genuine waitFor fix, not a retry-mask. No unguarded door, no contract drift, no migration
    gap, no scale gold-plating. Ship to C-block.
  next_action: PROCEED_TO_C
```
