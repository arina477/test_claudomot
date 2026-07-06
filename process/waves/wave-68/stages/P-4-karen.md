# P-4 Karen — wave-68 reality check (M11 publish-write-half + memberCount fix)

**Scope:** verify the load-bearing claims in the wave-68 spec (`tasks` row `2bd37c4c`) + P-3 plan against real code on `main`. Per-claim VERIFIED / UNVERIFIED / WRONG, then overall verdict.

**Overall: APPROVE** — every load-bearing claim holds against real code. One material scope correction on the settings UI (Claim 5): the "server-settings surface" the plan says to *extend* does not exist as a general/Overview settings surface — the only settings entry point opens a Roles-only page. B-3 builds the publish/Overview UI net-new (not "reuse the existing Overview shell"). This does not block APPROVE (owner-gate idiom + memberCount bug + real-DB test tier all confirmed), but B-3 effort is larger than the plan's "extend existing" framing implies.

---

## Per-claim findings

### Claim 1 — Owner-authz idiom exists — VERIFIED
- `apps/api/src/servers/servers.service.ts:368` — invite-revoke gate: `if (server.owner_id !== callerId && invite.created_by !== callerId) throw new ForbiddenException(...)`. This is the owner-*or-creator* variant.
- **Cleaner exact match for the new updateServer:** `apps/api/src/servers/servers.service.ts:408` — invite-code rotate is strictly **owner-only**: `if (server.owner_id !== callerId) throw new ForbiddenException("Not authorized to rotate this server's invite code");`. The wave's `updateServer` should reuse the `:408` owner-only shape (not `:368`, which additionally allows the creator). The spec cites `~:368`; the plan should prefer the `:408` owner-only idiom — noted, not blocking.
- `servers` table has `owner_id`: `apps/api/src/db/schema/servers.ts:25` (`owner_id: text('owner_id').notNull()...`). Confirmed. `ForbiddenException` imported at `servers.service.ts:4`.

### Claim 2 — No PATCH /servers/:id yet — VERIFIED
- `apps/api/src/servers/servers.controller.ts` routes: `@Post()` (:44), `@Get()` (:60), `@Get('discover')` (:73), `@Get(':id')` (:86), `@Get(':id/members')` (:101), `@Post(':id/join-public')` (:122), `@Post(':id/invite-code/rotate')` (:141), `@Post(':id/invites')` (:155). **No `@Patch`/`@Put` anywhere** — PATCH is net-new. Confirmed.
- Routes use `req.session.getUserId()` (session interface declared at `:36`; callers at `:56, :63, :92, :107, :128, :147, :168`). Confirmed.

### Claim 3 — memberCount bug location — VERIFIED
- `apps/api/src/servers/servers.service.ts:550-554` — the correlated scalar subquery is exactly as described:
  ```
  const memberCountExpr = sql<number>`(
    SELECT count(*)::int
    FROM server_members sm
    WHERE sm.server_id = ${servers.id}
  )`;
  ```
  Reused in both SELECT projection (`:576`) and `orderBy(desc(memberCountExpr), ...)` (`:582`) inside `discoverServers` (`:537`). This is the query the wave rewrites to LEFT JOIN + GROUP BY. `is_public` filter (`:557`), ILIKE search over name/description/topic (`:560-566`), stable ORDER BY (`:582`), limit-cap-50 (`:542-543`) + offset all present — the plan's "keep the filter/search/order/limit" is accurate. Confirmed.

### Claim 4 — pg-harness / real-DB integration tier exists — VERIFIED (strong)
- `apps/api/test/integration/pg-harness.ts` — real Postgres harness (wave-17+): `Pool` from `pg`, `drizzle-orm/node-postgres`, runs `migrate(...)` against `DATABASE_URL_TEST` (header comment + `:18-22, :26-30`). Not a mock.
- `apps/api/vitest.integration.config.ts` — dedicated integration test config.
- 15+ existing real-DB specs under `apps/api/test/integration/` (e.g. `servers-member-gate.spec.ts`, `invite-code-rotate.spec.ts`, `presence-comembers.spec.ts`), several already exercising the `servers`/`server_members` tables. The mandatory live-DB memberCount test has a proven tier + seeding pattern to copy. Confirmed.

### Claim 5 — Server-settings surface — VERIFIED-WITH-CORRECTION (affects B-3 scope)
- `design/server-settings.html` **exists** (44 KB). Its nav lists three tabs — **Overview / Roles / Members** — but the *built-out content* is the "Roles & Permissions" page only. Grep of the HTML: `publish` / `is_public` / `description` / `topic` / `discover` → **zero hits**. "Overview" appears only as a nav label. So the design shell gives you tabbed chrome, but **no publish/Overview content is designed**.
- `apps/web/src/shell/ChannelSidebar.tsx:257-266` — the only "Server settings" entry point (`data-testid="server-settings-btn"`, `aria-label="Server settings — Roles"`) calls `setRolesPageOpen(true)` → renders **`ServerRolesPage`** (`ChannelSidebar.tsx:307`).
- `apps/web/src/shell/ServerRolesPage.tsx` (1754 lines) is a **Roles-management-only** surface — roles nav rail, permission matrix, member-role assignment. It has **no Overview tab, no is_public/publish toggle, no description/topic edit** (grep of the file: no `is_public`/`publish`/`description`/`topic`). It *does* carry the owner-gate pattern to reuse: `const isOwner = currentUserId !== null && currentUserId === ownerId;` (`ServerRolesPage.tsx:675`) and takes `ownerId`/`currentUserId` props (`:51, :662, :675`).
- **Correction to the plan (P-3 line 7 + line 24):** the plan says "extend the existing settings surface … server-settings surface exists, reachable via ChannelSidebar; reuse it." Reality: the reachable surface is Roles-only, and the spec explicitly forbids touching the Roles permission matrix ("do NOT touch the superseded Roles-tab permission matrix"). There is **no Overview/general-settings React component to extend**. B-3 must **build the publish/Overview settings UI net-new** (new component or a new tab wired into a new tabbed shell + a new ChannelSidebar entry point/route), reusing only: the DS form primitives, the `isOwner` gate pattern from `ServerRolesPage.tsx:675`, and the design HTML's tab chrome as a visual reference. This is more work than "extend existing"; flag it for B-3 sizing so it isn't under-scoped.

### Claim 6 — Shared shapes + schema columns — VERIFIED
- `packages/shared/src/servers.ts`: `ServerSummarySchema`/`ServerSummary` (`:16, :21`), `ServerDetailSchema`/`ServerDetail` (`:45, :49`), plus `DiscoverServer` (`:85-92`). All present for response reuse. No `UpdateServerSchema` yet → net-new per B-1 (correct).
- `servers` schema has the wave-67 (migration 0024) columns: `is_public boolean default false notNull` (`apps/api/src/db/schema/servers.ts:30`), `description text` (`:31`), `topic text` (`:32`), plus `servers_is_public_idx` (`:34`). NO schema change needed — confirmed, matches plan line 9 + spec `data` contract.
- Bonus check: `apps/web/src/auth/api.ts` has `createServer`/`getServers`/`getServerDetail`/`getServerMembers`/`listRoles` etc. but **no `updateServer`** — net-new per B-3 (correct).

---

## Summary table

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| 1 | Owner-authz idiom + `servers.owner_id` | VERIFIED | service.ts:368 (owner-or-creator), :408 (owner-only, cleaner match); schema/servers.ts:25 |
| 2 | No PATCH /servers/:id; routes use getUserId | VERIFIED | controller.ts routes :44–:155, no @Patch; getUserId :56–:168 |
| 3 | memberCount correlated-subquery bug | VERIFIED | service.ts:550-554 (in discoverServers :537) |
| 4 | Real-DB (pg-harness) integration tier | VERIFIED | test/integration/pg-harness.ts + vitest.integration.config.ts + 15 specs |
| 5 | Server-settings surface to extend | VERIFIED w/ CORRECTION | Only Roles page exists (ChannelSidebar.tsx:257-266 → ServerRolesPage.tsx); no Overview/publish content in code OR design/server-settings.html → B-3 builds net-new |
| 6 | ServerSummary/ServerDetail + is_public/description/topic | VERIFIED | shared/servers.ts:16,21,45,49; schema/servers.ts:30-34; no updateServer in api.ts |

## Load-bearing verdict
The three claims Karen must gate on all hold: **owner-gate idiom (service.ts:368/:408) ✓, memberCount bug (service.ts:550-554) ✓, real-DB test tier (pg-harness.ts) ✓.** → **APPROVE.**

## Note for downstream (B-3 / head-product)
Server-settings UI is **thinner than the plan assumes**: no general/Overview settings surface exists — only a Roles page (which the spec forbids modifying). B-3 must create the publish-settings surface net-new (component + entry point/route), reusing DS primitives + the `isOwner` gate from `ServerRolesPage.tsx:675`. Recommend head-product acknowledge the "extend existing" → "build net-new (owner-gated Overview/publish surface)" reframe so B-3 isn't under-scoped, and that jenny check AC5 against the built-new surface rather than an assumed-existing one.
