# B-6 Phase-2 Adversarial Review — wave-23 (M5 bundle 2: delegated assignment-organizer authz)

**Reviewer:** code-reviewer (adversarial security pass)
**Scope:** AUTHZ boundary change — `manage_channels` → `manage_assignments` for assignment writes + NEW `GET /servers/:serverId/me/permissions` endpoint.
**Verdict summary:** Both authz boundaries are **AIRTIGHT**. Zero Critical, zero High. 3 Low findings (stale comments + a defensible design note). Recommend **APPROVE** with an optional Low-severity comment cleanup.

---

## Boundary 1 — assignment-write door: VERDICT PASS (airtight)

**Trace:** `assignments.controller` write routes → `assignments.service` → `assertOrganizer(userId, serverId)` → `rbacService.can(userId, serverId, 'manage_assignments')`.

Verified negative path — a user WITHOUT `manage_assignments` and NOT owner is denied on every write:

- **Every write method calls `assertOrganizer`** (confirmed via grep at service lines 231, 343, 411, 477):
  - `createAssignment` (L225/231) — `assertOrganizer(organizerId, serverId)`
  - `updateAssignment` (L329/343) — `assertOrganizer(organizerId, existing.server_id)` (serverId derived from row → IDOR-safe)
  - `softDeleteAssignment` (L411) — `assertOrganizer(organizerId, existing.server_id)` (row-derived)
  - `presignAttachmentUpload` (L472/477) — `assertOrganizer(organizerId, serverId)`
- **Read/status routes correctly use `assertMember`, NOT `assertOrganizer`** — `listAssignments` (L288), `getAssignment` (L316), `toggleStatus` (L446). Correct: any member may list/read/mark-own-status; only organizers write. No route skips its gate.
- **Swap is complete.** `grep manage_channels` in `apps/api/src/assignments/` returns ONLY comments (see Low-1); the live `can()` call at service L61 is `'manage_assignments'`. No lingering `manage_channels` code path on the write door.
- **`can()` fails CLOSED, not open.** `rbac.service.ts:90` returns `role[permission] === true` — strict boolean equality. A `false`, `undefined`, or missing flag → `false` (deny). Default-deny is enforced at every early exit: no server (L60→false), not a member (L75→false), null role_id (L79→false), missing role row (L86→false). There is no fail-open branch.
- **Owner short-circuit correct** — `can()` L64 `server.owner_id === userId → true`, matched to the assignment write path via `assertOrganizer`.

**Repro attempt (expected DENY, confirmed):** member with a role that has `manage_assignments=false` calling `POST /servers/:serverId/assignments` → `can()` loads role, `role.manage_assignments === true` is `false` → `assertOrganizer` throws `ForbiddenException` (403). Backed by `assignments.service.spec.ts` (28 tests pass).

---

## Boundary 2 — /me/permissions door: VERDICT PASS (airtight)

**Trace:** `ServerPermissionsController.getMyPermissions` (`rbac.controller.ts:113–122`) → `userId = req.session.getUserId()` → `rbacService.getEffectivePermissions(userId, serverId)`.

- **userId is strictly session-derived (no IDOR).** `rbac.controller.ts:120` `const userId = req.session.getUserId();`. There is NO `userId` param/query/body input to this route — a caller CANNOT read another user's effective permissions. The only path input is `:serverId`. Confirmed airtight against the "read another user's perms" vector.
- **Non-member gets 403, not a silent all-false leak.** `getEffectivePermissions` (`rbac.service.ts:290–297`): after the owner short-circuit, a `server_members` lookup with no row → `throw new ForbiddenException('You are not a member of this server')`. It does NOT fall through to an all-false 200. A member WITH a null role_id or a dangling role row DOES get all-false 200 (L300–318) — correct, because they are a legitimate member with no permissions.
- **Server-existence enumeration is masked.** Missing server → `ForbiddenException('Server not found or access denied')` (L285–287) — 403, same status class as the non-member 403. A caller cannot distinguish "server does not exist" from "server exists but you're not a member" by status code. (Minor message-string difference exists — see Low-2 — but both are 403; no HTTP-status oracle.)
- **Owner short-circuit correct & consistent with `can()`.** Owner → `{owner:true, all 5 flags true}` (L287–296), mirroring `can()`'s owner=all-true. The two methods agree, so the client gate cannot diverge from server enforcement.
- **Cross-server read blocked.** `serverId` scopes both the server lookup and the `server_members` lookup (`and(server_id, user_id)` at L291). No way to read perms for a server you don't belong to — you get the non-member 403.

**Repro attempts (all expected DENY, confirmed):**
- `GET /servers/<other-users-server>/me/permissions` as non-member → 403 (not 200-all-false). ✓
- Read another user's perms → impossible; no userId input. ✓
- Enumerate servers via status differential → both cases 403. ✓

Backed by `rbac.service.spec.ts` — 8 new `getEffectivePermissions` tests (server-not-found→403, owner→all-true, non-member→403, member-null-role→all-false, member-with-role→role flags). 33/33 pass.

---

## SQL safety: PASS

- **Migration `0011_rainy_wild_child.sql`:** `ALTER TABLE roles ADD COLUMN manage_assignments boolean DEFAULT false NOT NULL;` then `UPDATE roles SET manage_assignments = true WHERE manage_channels = true;`. Static SQL, no interpolation, no injection surface. The `WHERE manage_channels = true` backfill is INTENTIONAL and correct — it preserves the pre-wave behavior (anyone who could write assignments via `manage_channels` keeps that ability under the new flag), so no organizer loses access at cutover. Column def (NOT NULL, default false) matches `servers.ts` schema and the drizzle snapshot (`0011_snapshot.json:830–836`). Journal entry (idx 11, tag match) is consistent.
- **`backfill-roles.ts`:** parameterized `$1` query; the new `manage_assignments` column added to the column list with literal `false` in VALUES, `ON CONFLICT DO NOTHING` preserved → idempotent, seed parity with a fresh migration. No injection.
- **`getEffectivePermissions` queries:** all drizzle `eq`/`and` builders — parameterized, no raw SQL. WHERE clauses present on every select; `.limit(1)` on all three. No missing-WHERE full-table read.

---

## Null-access / 500 review: PASS

`getEffectivePermissions` guards every row destructure:
- `[server]` missing → 403 (L285), never property-access on undefined.
- `[member]` missing → 403 (L294).
- `member.role_id` null → early all-false return (L300).
- `[role]` missing (dangling FK) → all-false return (L312) — does NOT 500. Good defensive handling of data inconsistency.

No unguarded `.property` on a possibly-undefined query result anywhere in the new code.

---

## Contract-mismatch review: PASS

`EffectivePermissions` shape is consistent across all three layers:
- **shared** (`rbac.ts:96–105`): `{owner, manage_server, manage_roles, manage_channels, manage_members, manage_assignments}` — 6 booleans; exported from `index.ts`.
- **api response** (`rbac.service.ts` owner branch, member branches, role branch): all return exactly those 6 keys. Return type annotated `Promise<EffectivePermissions>` → compiler-enforced.
- **web consumer** (`AssignmentsPanel.tsx`): `api.getMyPermissions` typed `request<EffectivePermissions>`; gate reads `perms.owner || perms.manage_assignments` — both keys exist in the contract. No shape drift.

`RolePermissions` (the role-editor flags) also updated in lockstep: shared schema (5 flags), `Create`/`Update` schemas (`.optional()`), web `PERM_FLAGS` driven by `keyof RolePermissions` so the checkbox list auto-includes `manage_assignments`, and `editPerms` default state (`ServerRolesPage.tsx:684`) initializes it to `false`.

---

## Privilege-escalation / self-grant review: PASS

**Can a non-`manage_roles` member self-grant `manage_assignments`?** No.
- Role create/update/delete are ALL gated on `can(userId, serverId, 'manage_roles')` (`rbac.controller.ts:57, 79, 96`) — unchanged by this wave.
- `updateRole` service scopes the role by `and(roles.id, roles.server_id)` (`rbac.service.ts:152, 171`) — no cross-server role-edit IDOR.
- A member without `manage_roles` gets 403 before ever reaching the patch that sets `manage_assignments`. Adding the new flag to the role editor does NOT create a new self-grant path — it rides the existing `manage_roles` gate. This is the standard RBAC model (whoever manages roles manages all flags), not a regression.

---

## Owner-lockout / self-demotion interaction: PASS (no interaction)

`OwnerLockoutService` keys exclusively on `servers.owner_id` (demote/remove/leave all compare `server.owner_id === userId`). It does not read or reason about any role permission flag. Adding `manage_assignments` to `roles` is orthogonal — no new lockout or self-demotion vector introduced. Owner remains all-true via `owner_id` regardless of role flags.

---

## Findings

### Low-1 — Stale `manage_channels` references in comments (cosmetic, not a code path)
Three comments still say `manage_channels` for the now-`manage_assignments` organizer gate:
- `apps/api/src/assignments/assignments.service.ts:56` — `// assertOrganizer — gate on can(userId, serverId, 'manage_channels')`
- `apps/api/src/assignments/assignments.service.ts:221` — `// Organizer authz: can(organizerId, serverId, 'manage_channels').`
- `apps/api/src/assignments/assignments.controller.ts:44` — `//   - Organizer authz: service.assertOrganizer → can(userId, serverId, 'manage_channels')`

Impact: none on behavior (the live call at L61 is correct). Risk: future maintainer reads the stale comment and reasons about the wrong flag. **Recommend** updating the three comments to `manage_assignments`. (`assignments.service.ts:34` was correctly updated; these three were missed.)

### Low-2 — `/me/permissions` 403 message-string differs for missing-server vs non-member
`getEffectivePermissions` returns `'Server not found or access denied'` (missing server) vs `'You are not a member of this server'` (member lookup miss). Both are HTTP 403 so there is **no status-code enumeration oracle**, but the distinct message bodies technically confirm server existence to an attacker who can read the response body. Impact: Low — reveals only existence, not contents, and server IDs are opaque UUIDs (not enumerable by increment). **Optional:** unify to a single generic 403 message if strict non-enumeration is desired. Not blocking.

### Low-3 — Client hides CTA on `/me/permissions` fetch error (design note, defensible)
`AssignmentsPanel.tsx:87–89` sets `permsStatus='error'` and `isOrganizer` stays false on any fetch failure, hiding the create CTA. This is fail-safe (deny on uncertainty) and the server always enforces, so a legitimate organizer hitting a transient 5xx sees no CTA until reload. Acceptable per the documented "convenience-only client gate" design. No action required; noting for completeness.

---

## Test coverage confirmation
- `rbac.service.spec.ts` — 33/33 pass, incl. 8 new `getEffectivePermissions` boundary tests (owner all-true, non-member 403, server-not-found 403, member-null-role all-false, member-with-role flag passthrough).
- `assignments.service.spec.ts` — 28/28 pass, write-door authz swap covered.
- `assignments.test.tsx` / `server-roles.test.tsx` — updated to mock `getMyPermissions` and include the new checkbox.

## Final verdict: **APPROVE**
Both authz boundaries are airtight. No Critical, no High, no Medium. Three Low items (comment cleanup Low-1 recommended; Low-2/Low-3 optional). The wave's core objective — swap the assignment-write gate to `manage_assignments` and expose a session-scoped effective-permissions read — is implemented correctly with default-deny semantics, no IDOR, no fail-open, and no privilege-escalation surface.
