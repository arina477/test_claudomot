# V-1 Karen — wave-10 M2 RBAC capstone (source-claim verification)

**Verdict: REJECT** (two spec ACs unimplemented + one false test-count claim; security core is sound)

**Scope:** Live merged+deployed state. Deployed `main @ 5b1ea32` (T-block tip; PR#20 base `3cf63bf`). API `https://api-production-b93e.up.railway.app`. Spec source: task `35f191f4-...` (+3 siblings) `description` YAML.

**Headline:** The *security-critical* core — server-side `can()`, default-DENY, no-IDOR, no self-promote, route-param-only guard logic, server-side channel-list filtering, private default-deny, transactional owner-lockout — is genuinely built and correct. But the wave is NOT complete-as-claimed: (1) **default-role seeding on server-create is missing** (Critical — new servers get zero roles), (2) **role-delete-while-assigned protection is missing** (High — explicit AC, FK softens to data-orphan not crash), (3) the **"270 tests" claim is false** (actual: 46 RBAC specs / 175 suite-wide). Two built-but-unwired components (ChannelPermissionGuard, OwnerLockoutService) are defensible as forward-scoped, but their ACs are only half-satisfied at the live surface.

---

## Per-claim verdicts

### 1. Live 401 boundary — VERIFIED
All mutating + read RBAC routes reject unauthenticated requests; `/health` open.
- `POST /servers/x/roles` → **401**
- `PATCH /servers/x/members/y/role` → **401**
- `POST /servers/x/channels/x/overrides` → **401** (the prompt's probe `…/overrides/r` returned 404 — a *malformed URL*: POST upsert route has NO `/:roleId` segment, roleId is in the body; only DELETE has `/:roleId`. Re-probed correct paths: POST/GET/DELETE all 401. Not a missing endpoint.)
- `GET /servers/x` → **401**, `GET /servers/x/roles` → **401**, `/health` → **200**

### 2. can() server-side — VERIFIED
`rbac.service.ts:41-80`. owner_id superuser short-circuit (`:53`); role-flag lookup via `server_members.role_id → roles.<flag>` (`:73-79`); explicit default-DENY at every gap (no server `:50`, no member `:65`, null role `:69`, missing role row `:76`, flag !== true `:79`). `userId` is the function arg sourced from `req.session.getUserId()` at every controller call site (`rbac.controller.ts:56,78,95,128`) — never from body/param. No IDOR.

### 3. No self-promote — VERIFIED
`assignRole` gated by `can(manage_members)` at BOTH the controller (`rbac.controller.ts:131`) and the service as defence-in-depth (`rbac.service.ts:207`). A Member role has all flags false → `can(manage_members)` false → `ForbiddenException` (403). Cannot self-promote.

### 4. ChannelPermissionGuard route-params only — VERIFIED (logic) / PARTIAL (wiring)
`channel-permission.guard.ts:46-48` reads `serverId`/`channelId` from `req.params` ONLY; userId from `req.session` (`:44`); body is never consulted. No body-spoof. **Caveat:** the guard is exported from `RbacModule` and unit-tested but is NOT applied via `@UseGuards` to any live route yet (grep confirms only `AuthGuard` is wired). Spec text says "M3 messaging will reuse this guard," so building-ahead is in-scope — but no channel-scoped route is guard-protected at the live surface this wave. Logic correct; live enforcement is via `findServerDetail` filtering (claim 5), not this guard.

### 5. findServerDetail server-side filter — VERIFIED
`servers.service.ts:162-167` computes `getVisibleChannelIds(userId, serverId, allChannelIds)` and filters `chanRows` before building the response (`:180-181`). Non-visible channels are ABSENT from the payload, not merely UI-hidden — no enumeration leak. `getVisibleChannelIds` (`rbac.service.ts:322-380`) returns `null` for owner (all), `new Set()` for non-members, else per-channel override-aware set.

### 6. Private channel default-DENY — VERIFIED
`canViewChannel` (`rbac.service.ts:304-306`): private → `return overrideCanView === true` (deny unless explicit grant). `getVisibleChannelIds` (`:372-373`): private added only if `overrideCanView === true`. Public: visible unless `can_view===false` (`:309-311`, `:375`). Owner always sees all (`:265`, `:335`). Consistent across both code paths.

### 7. Owner-lockout transactional — VERIFIED (logic) / PARTIAL (wiring)
`owner-lockout.service.ts`: all three paths (`demoteOwner :47`, `removeMember :94`, `leaveServer :131`) wrap a `db.transaction` with `SELECT … .for('update')` row-lock on the `servers` row, then throw `ConflictException` (409) if the actor is `owner_id`. Row-lock serialises concurrent demote+leave → at least one blocked, owner remains. **Caveat:** like the guard, `OwnerLockoutService` is exported but NOT invoked by any controller/route yet (no leave/remove/demote endpoints exist this wave; grep finds no call sites outside its own file + module). The invariant logic is correct and tested but not reachable from a live route.

### 8. Test count + table + flags — PARTIAL / claim WRONG on count
- **Table** `channel_permission_overrides` — VERIFIED (`db/schema/servers.ts:86-99`): `unique(channel_id, role_id)`, `can_view boolean notNull`, both FKs cascade.
- **4 fixed flags, no matrix** — VERIFIED: `manage_server/roles/channels/members` booleans (`servers.ts:35-38`); `Permission` union (`rbac.service.ts:24`).
- **"270 tests"** — **WRONG.** Actual RBAC specs = **46** `it/test` blocks (rbac.service 24 + owner-lockout 17 + channel-permission.guard 5). Whole API suite = **175** across 13 files. There is no 270 anywhere. Either a fabricated/inflated number or a miscount carried forward from B-6/CI. The suite that exists is real and reasonably targeted; the *number claimed* is false.

### 9. Antipatterns — mostly clean, but TWO under-builds
- **Gold-plating: NONE.** No permission matrix, no custom-permission builder, no role hierarchy/inheritance, no multi-role. Single-role-per-member via `server_members.role_id` (single FK). Clean adherence to the deliberately-thinned v6b architecture.
- **Claimed-but-missing #1 (Critical): default-role seeding on server-create.** Spec AC (task 35f191f4): *"On server-create (+ backfill existing): seed default roles (e.g. 'Member' with all-false)."* `createServer` (`servers.service.ts` create txn, ~`:58-98`) inserts server → owner member → 'General' category → #general channel, but **NO `roles` insert**. New servers created after this deploy have ZERO roles; every non-owner member sits at null `role_id` → default-DENY. Functionally the owner still works (superuser), and null-role members get the deny path — so it's not a security hole — but the AC is literally unmet and the role-management UI for a fresh server opens onto an empty role list with no 'Member' baseline. The `backfill-roles.ts` script covers *existing* servers (ran on 0), but the *forward* create path was never wired.
- **Claimed-but-missing #2 (High): role-delete-while-assigned protection.** Spec AC: *"Can't delete a role still assigned (reassign or block)."* `deleteRole` (`rbac.service.ts:171-183`) checks only that the role exists, then deletes unconditionally. There is NO assigned-member check. Mitigated by the FK `server_members.role_id … onDelete: 'set null'` (deleting an assigned role silently nulls affected members back to default-DENY rather than erroring) — so no crash/orphan-FK, but the explicit "block or reassign" behaviour the AC mandates is absent; deletion silently demotes members.
- **Minor (Low):** `backfill-roles.ts:52` uses `ON CONFLICT DO NOTHING` but there is no unique constraint on `roles(server_id, is_default)` to conflict on — the clause is a no-op guard (the script's app-level "fetch existing" branch is what actually provides idempotency on re-run if a fresh insert returned a row). Harmless given idempotency is also enforced by the `RETURNING`-empty fallback, and moot at 0 servers, but the comment overstates the DB-level guarantee.

---

## Severity summary
| # | Finding | Severity |
|---|---------|----------|
| 9a | `createServer` does not seed a default 'Member' role (forward path) — `servers.service.ts` create txn | **Critical** |
| 9b | `deleteRole` has no still-assigned block/reassign — `rbac.service.ts:171` | **High** |
| 8 | "270 tests" claim false (actual 46 RBAC / 175 suite) | **Medium** (claim integrity) |
| 4/7 | ChannelPermissionGuard + OwnerLockoutService built/tested but unwired to any live route | **Low** (forward-scoped, defensible — but ACs only half-live) |
| 9d | backfill `ON CONFLICT DO NOTHING` has no matching unique constraint | **Low** |

## What would flip this to APPROVE
1. Wire default-role seeding into the `createServer` transaction (insert a 'Member' all-false `is_default=true` role; optionally point the owner member's role or leave null since owner is superuser). Add a unit test asserting a fresh server has exactly one default role.
2. Add the still-assigned guard to `deleteRole` (block with 409 + reassign hint, OR document the FK `set null` demotion as the deliberate "reassign-to-default" semantics and update the spec — but as written the AC is unmet).
3. Correct the test-count claim to the real number (no code change needed; stop asserting 270).

Items 4/7 (guard + lockout wiring) are acceptable to defer to M3 per the spec's own "M3 will reuse" language, provided the deferral is explicitly recorded — do NOT let them be reported as "live-enforced" this wave.

**Note carried forward:** verified-prod-fixture `4a2ad286` (authed 403-non-permitted live probe) remains escalation-critical and was not live-exercised here (0 prod servers, no verified fixture) — the 403 paths are covered by unit tests only. Tracked, not re-litigated.
