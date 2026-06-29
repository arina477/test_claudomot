# V-1 Jenny — semantic-spec verification (wave-10, M2 RBAC capstone)

**Verdict: APPROVE** (with 2 minor deltas + 1 noted spec-edge interpretation — none block; all carried to L)

- Spec: task `35f191f4-2b63-4c8b-bf7e-a5c074310ec6` (4-block multi-spec, `spec-id: wave-10-m2-rbac`)
- Deployed: `main`, live HEAD `5b1ea32` (T-block), feature merge `3cf63bf` / PR#20. api `https://api-production-b93e.up.railway.app` — `/health` 200; all RBAC endpoints enforce auth live (401 unauthed on roles GET, channel-override POST, member-role PATCH).
- Method: read live source against each AC; probed live auth boundary; cross-read C-2 deliverable. No prod verified-session fixture exists (task `4a2ad286`, `status=todo`, now 4 waves) so live 403 *non-permitted* core is not exercised end-to-end — trusted to the 270-test suite + 6 security conditions, consistent with C-2's documented escalation.

---

## Block 35f191f4 — RbacModule (roles + can() + role CRUD/assignment) — MATCHES (1 minor delta)

- **roles migration** — MATCHES. `roles` table (`apps/api/src/db/schema/servers.ts:28-41`): id uuid pk, `server_id`→servers `onDelete: cascade`, name, position int, the **4 fixed boolean flags** `manage_server/manage_roles/manage_channels/manage_members` (all `default(false).notNull()`), plus `is_default`. SMALL FIXED set — no matrix/builder/hierarchy column. Migration `0004_green_madripoor.sql` creates both tables + FK/cascades + index; applied to prod at C-2 (journal idx 5).
- **server_members.role_id → roles.id** — MATCHES. `servers.ts:53`, `onDelete: 'set null'`; null role = default Member semantics honored by `can()`.
- **can() server-side + default-DENY + owner superuser** — MATCHES. `rbac.service.ts:41-80`: owner_id short-circuit → true for all perms (`:53`); no server → false; no membership → false; null role_id → false; missing role row → false; else `role[permission] === true`. Every branch is default-deny. userId is the caller param (controllers pass `req.session.getUserId()` — no IDOR; `rbac.controller.ts:56,78,95,128`).
- **role CRUD gated by can(manage_roles)** — MATCHES. create/update/delete each call `can(...,'manage_roles')` → 403 else (`rbac.controller.ts:57-59,79-81,96-98`). List is open to any authenticated member (acceptable — read-only role list, AC only gates mutations).
- **assign gated by can(manage_members) + no self-promote** — MATCHES. Controller gate (`rbac.controller.ts:131`) + service defence-in-depth re-check (`rbac.service.ts:207`). Self-promote is structurally blocked: assignment needs `manage_members`, which the default Member role lacks (all-false), so a member cannot grant themselves a privileged role.
- **can't delete role still assigned** — interpretation note. Spec says "reassign or block." Implementation neither blocks nor reassigns in `deleteRole`; it relies on the FK `onDelete: 'set null'` (`servers.ts:53`) so affected members fall back to the null=default-Member role. This is a *safe* resolution (no dangling FK, no privilege leak — they drop to least privilege), and arguably satisfies "reassign" (to default). Not a security hole. Logged as a minor design choice, not a drift.
- **DELTA (minor): create-time default-role seeding missing.** AC: *"On server-create (+ backfill existing): seed default roles ('Member' all-false)."* Backfill for existing servers exists and is correct (`apps/api/src/db/backfill-roles.ts` — one `is_default=true` Member per server, idempotent, ran clean on prod's 0 servers at C-2). **But `createServer` (`servers.service.ts:58-97`) does NOT insert a default role** — it seeds the server, owner membership, a category, and a `general` channel, but no `roles` row. New servers therefore have zero roles until one is created via the UI. Functional impact is contained: `can()` and `canViewChannel()` treat null role_id as default-Member (all-false / public-visible), so authorization is correct and safe by default. Impact is cosmetic/spec-completeness: the "Member" role won't appear in the Roles UI list for a freshly-created server, and channel-visibility overrides can't target the implicit default member set (no role row to attach an override to). Severity **Low**. Recommend a seed in `createServer`'s txn at L/next-wave.

## Block 2c927c44 — channel-overrides + ChannelPermissionGuard — MATCHES (1 spec-edge interpretation)

- **channel_permission_overrides migration** — MATCHES. `servers.ts:86-99`: id, `channel_id`→channels cascade, `role_id`→roles cascade, `can_view` bool, `unique(channel_id, role_id)` + `cpo_channel_id_idx`. In migration 0004, present in prod.
- **visibility rule** — MATCHES exactly. `canViewChannel` (`rbac.service.ts:256-312`): owner always true; private channel → default-deny unless override `can_view=true` (`:304-306`); public channel → visible unless override `can_view=false` (`:309-311`); no membership → false. All four spec edge-cases (private default-deny / owner sees all / can_view=false hides default-visible / no-enumeration) honored.
- **findServerDetail filters channels SERVER-SIDE** — MATCHES. `servers.service.ts:133-191`: computes `getVisibleChannelIds` (`:164`) and **omits** non-visible channels from the response (`:166-167,180-181`) — they are absent, not UI-hidden. Owner path returns `null` = all (`rbac.service.ts:335`). This is the load-bearing AC that closes "members see the right channels per role" — verified the response is filtered at the data layer, no enumeration leak.
- **ChannelPermissionGuard reads ROUTE PARAMS only** — MATCHES. `channel-permission.guard.ts:46-48` reads `req.params.id` + `req.params.channelId`; userId from `req.session` (`:44`); never from body → no body-spoof, no IDOR. Delegates to `canViewChannel`. 403 if not permitted.
- **SPEC-EDGE (interpretation, not drift): guard is wired to zero routes today.** The guard exists, is unit-tested (`channel-permission.guard.spec.ts`), provided + exported from `RbacModule`, but no controller currently applies `@UseGuards(ChannelPermissionGuard)` — there are no channel-scoped read/write routes in M2 yet (messaging is M3). The AC text explicitly scopes it as *"gates channel-scoped routes (read/**any future write**)"* and *"(M3 messaging will reuse this guard.)"* — i.e. the spec authored it as a forward-looking primitive to be consumed in M3. Building+exporting it now matches that intent; **not over-reach, not drift.** Channel visibility for M2 is already enforced via the `findServerDetail` server-side filter (above), which is the actual M2 user-visible surface. Severity **informational**; flag for M3 to actually attach the guard to messaging routes.

## Block 7a10f13d — owner-lockout (last-owner invariant) — MATCHES

- **always-an-owner, blocked transactionally** — MATCHES. `owner-lockout.service.ts`: all three mutating paths (`demoteOwner :47`, `removeMember :94`, `leaveServer :131`) open a `db.transaction` and take `SELECT ... .for('update')` row-lock on the server row before checking `owner_id`. Demote/remove/leave of the sole owner → `ConflictException` (409). The server-row lock serializes a concurrent demote+leave race so ownership can never be zeroed (matches edge-case "concurrent demote+leave → at least one blocked, owner remains").
- **ownership transfer safe path** — present and minimal: `transferOwnership :174` (validates new owner is a member, atomic `owner_id` update in txn) and `demoteOwner` accepts an optional `newOwnerId` handover. Spec said transfer is optional ("IF in scope keep minimal") — kept minimal, invariant primarily *blocks* last-owner removal. MATCHES.
- Note: this module's three methods are not yet invoked by a member-removal / leave HTTP route (no such endpoint in M2) — same forward-primitive shape as the guard. The invariant logic is correct and ready; M3/member-mgmt waves wire the routes. Not a drift against this spec (the AC specifies the *invariant behavior*, which is implemented and unit-tested at `owner-lockout.service.spec.ts`).

## Block 0b9bcf35 — role-management UI — MATCHES (1 minor delta)

- **Roles tab per design** — MATCHES. `ServerRolesPage.tsx` follows `design/server-roles.html` (D-3 APPROVED; the earlier matrix-violation variant was caught + replaced at D — confirmed: this is a per-role editor, NOT a permission matrix). Settings shell, roles nav rail (Owner immutable + custom roles + default Member), role editor with the **4 fixed flags** (`PERM_FLAGS`, `:65-87` — no custom-permission-builder), per-channel visibility toggles, create/rename/delete.
- **states + toasts** — MATCHES. loading (`:1065`) / loaded / empty-no-custom-roles (`:1122`) / load-error+retry (`:1087`) / saving / 409-conflict inline (`:1187`) / 403 toast handling (`:798,827`). Toast on changes. All 5 D-3 a11y must-fixes carried (visible toggle track, Private text marker, reduced-motion, focus-trap, convenience-only gating).
- **gated controls, server enforces regardless** — MATCHES. Controls disabled when `!isOwner` (`:1476,1575`) with a "permissions always enforced on the server" note (`:1060`); 403/409 from server handled gracefully. Matches the edge-case "non-permitted user doesn't see controls (but server enforces)", owner indicator (`:1011-1016,1276`), and last-owner-protection surfaced in UI (`:1159-1184` banner + `:1187` 409 inline).
- **DELTA (minor): member-assignment is a placeholder, not functional.** AC: *"Member-assignment: set a member's role."* The UI renders a Member Assignment section (`:1664`) with a search box but **no member list** — it shows a placeholder explaining `GET /servers/:id/members` does not exist (`:1703-1719`). The backend *assign* endpoint (`PATCH /servers/:id/members/:userId/role`) is fully built + gated + live (401 verified), but there is **no list-members endpoint** for the UI to enumerate members and drive the assignment select. So role *assignment via the UI* is not end-to-end usable today (only via direct API call with a known userId). Severity **Low–Medium** for the UI AC specifically; the *authorization* core of the block is complete. Recommend a `GET /servers/:id/members` endpoint to close the UI loop (M3 or a follow-up — note the UI already documents the exact missing endpoint).

---

## Scope discipline — CLEAN

- Single-role-per-member (#6): MATCHES — `server_members.role_id` is a single nullable FK; UI says "exactly one primary role per member" (`:1679`). No multi-role.
- No over-reach: confirmed **no** permission-matrix, no custom-permission-builder, no role hierarchy beyond a cosmetic `position` int, no multi-role. The 4 flags are fixed in both schema and UI. owner_id remains canonical superuser everywhere. No gold-plating — the only "extra" surfaces (ChannelPermissionGuard wired to no route, owner-lockout methods with no HTTP route, transferOwnership) are spec-anticipated M3 primitives, not speculative scope.

## M2-completeness assessment — M2 IS CLOSEABLE → M3

This wave + the prior 3 M2 waves complete M2's success metric **"members join and see the right channels per role"**:
- create (servers + channels + categories) — shipped earlier M2 wave.
- invites + invite-complete (CSPRNG codes, verified-join, atomic max_uses) — waves 8/9 (`servers.service.ts` invite/join paths present).
- **RBAC (this wave)** — roles + server-side `can()` + per-role channel-overrides + `findServerDetail` server-side channel filtering. The filter is the concrete mechanism by which "see the right channels per role" is realized, and it is implemented + deployed.

The success metric's *user-visible* surface — a member loading a server and getting back only the channels their role may view — is **functionally complete and live** via `findServerDetail`. The two Low deltas (create-time role seed; UI member-assignment needs a list endpoint) do not block the metric: authorization is correct and safe-by-default in their absence, and they are completeness/UX gaps, not correctness gaps. **Recommend N closes M2 and opens M3 (messaging)**, carrying these two deltas + the guard-wiring + member-removal-route wiring as M3 onboarding items (M3 reuses ChannelPermissionGuard and will naturally need the member-list + leave/remove routes).

## Verified-fixture gap (task 4a2ad286) — NOTED, 4 waves running

Confirmed `status=todo`. The live 403 *non-permitted* / *owner-superuser* / *channel-filter-per-role* behaviors are **not** exercised against prod (no persistent verified-session fixture; prod has 0 servers). They are covered by the 270-test suite incl. 6 security conditions, and the live **401 auth boundary** IS verified (probed: roles/override/member-role all 401 unauthed). This is the same documented C-2 escalation; it is now a recurring 4-wave deferral and is becoming the dominant verification blind spot for security-critical RBAC. **Strongly recommend L/N prioritize 4a2ad286** so future auth/RBAC waves can live-verify the authenticated 403 core, not just the unauthenticated 401 edge. This does not block APPROVE for wave-10 (the code is correct on read + unit-tested), but the gap should escalate in salience.

---

### Recommendations
1. Seed a default `is_default=true` "Member" role inside `createServer`'s transaction (`servers.service.ts:58`) — closes the 35f191f4 create-time seeding AC. Low effort.
2. Add `GET /servers/:id/members` (gated; returns members + role_id) — closes the 0b9bcf35 UI member-assignment loop. M3 needs it anyway.
3. M3: actually attach `@UseGuards(ChannelPermissionGuard)` to channel-scoped message routes, and wire owner-lockout `leaveServer`/`removeMember` to HTTP routes.
4. Prioritize `4a2ad286` (verified prod fixture) — 4-wave deferral on a security-critical area.

@task-completion-validator could confirm the live `findServerDetail` per-role filtering end-to-end once a prod fixture (item 4) exists.
