# P-4 Karen — wave-67 (M11 server discovery bundle #1, multi-spec)

**Scope:** Verify the load-bearing code claims in the multi-spec + P-3 plan are TRUE against real code (repo `/home/claudomat/project`, branch `main`). Spec source: `tasks` seed row `609c9bdd` (3 spec blocks) + siblings `37b78777`, `e363dac2`. Plan: `process/waves/wave-67/stages/P-3-plan.md`.

**Verdict: APPROVE** — every load-bearing claim holds against real code. The two most critical (the `joinViaInvite` idempotent reuse core and the `servers` schema for the Drizzle migration) are VERIFIED verbatim. No WRONG claims. One minor precision note (non-blocking) recorded below.

---

## Per-claim findings

### Claim 1 — `servers` pgTable exists, currently WITHOUT is_public/description/topic — VERIFIED
`apps/api/src/db/schema/servers.ts:14` — `export const servers = pgTable('servers', {...})`. Columns present: `id` (L15), `name` (L16), `owner_id` (L17-19), `invite_code` (L20), `created_at` (L21). NO `is_public`, `description`, or `topic` column anywhere in the table body (L14-22). The spec's "ADD is_public boolean NOT NULL default false / description text NULL / topic text NULL" is a genuine additive change to an existing table — backward-compatible as claimed (existing rows default `is_public=false`). Confirmed: the plan's "extend, do not create a new table" instruction is buildable.

### Claim 2 — Drizzle migration mechanism (`db:generate`) is real — VERIFIED
`apps/api/drizzle.config.ts:4` schema glob `schema: './src/db/schema/*'` (matches `servers.ts`); `:5` `out: './drizzle/migrations'`; `:6` `dialect: 'postgresql'`. `apps/api/package.json:14` — `"db:generate": "drizzle-kit generate"`. `drizzle-kit ^0.31.10` is a devDependency (`package.json:52`). The plan's "`npm run db:generate` in apps/api → drizzle/migrations, schema + .sql committed together" is accurate and executable. `db:migrate` (L15) also present for the apply path.

### Claim 3 — `joinViaInvite` idempotent transactional core (the reuse target for Spec C) — VERIFIED
`apps/api/src/servers/servers.service.ts:505-588` — `async joinViaInvite(code, userId): Promise<JoinResult>`, wrapped in `db.transaction` (L506). The reusable core Spec C builds `joinPublicServer` on:
- L539-543: `tx.insert(server_members).values({ server_id, user_id }).onConflictDoNothing().returning()` — this is the idempotent `INSERT ... ON CONFLICT (server_id,user_id) DO NOTHING RETURNING` core, exactly as the spec describes.
- L545: `const newMemberJoined = inserted.length > 0;` — re-join detection (idempotency contract in the doc-comment L503).
- L586: `return { serverId };` — matches the `JoinResult` shape.
The invite-specific validation (code resolution L508-535, use-consumption L556-584) is cleanly separable from the insert core, so the plan's "SIBLING METHOD sharing only the transactional insert, invite validation untouched" is realistic — the join-public path skips L508-535/L556-584 and adds an `is_public=true` gate instead. Buildable as specified.

### Claim 4 — existing member-scoped `GET /servers` (findMyServers) exists and is what stays UNTOUCHED — VERIFIED
`apps/api/src/servers/servers.controller.ts:54-59` — `@Get()` + `@UseGuards(AuthGuard)` → `listServers` → `serversService.findMyServers(userId)`. Member-scoped as claimed. The spec's new `GET /servers/discover` is a distinct route on the same `@Controller('servers')` (L34); leaving `GET /servers` unchanged is correct and non-conflicting.

### Claim 5 — `server_members` UNIQUE(server_id, user_id) constraint (the idempotency source) — VERIFIED
`apps/api/src/db/schema/servers.ts:45-64` — `server_members` pgTable; constraint at L61 `unique().on(table.server_id, table.user_id)`. This is precisely the constraint `onConflictDoNothing()` (Claim 3) relies on. The spec's "no schema change for join — reuse existing UNIQUE(server_id,user_id)" holds.

### Claim 6 — web: React Router v7, api.ts client-fn pattern, ServerContext.refetch() — VERIFIED
- **Router / React Router v7:** `apps/web/src/router.tsx:24` imports `BrowserRouter, Navigate, Route, Routes` from `react-router-dom`; routes registered declaratively L43-108 (`<Route path=... element=...>`). The plan's "add `/discover` route mirroring existing `/invite/:code` (L46) / `/app` (L77) pattern" is buildable.
- **api.ts client-fn pattern:** `apps/web/src/auth/api.ts:127` `export const api = {...}`; `:180` `getServers: () => request<ServerSummary[]>('/servers')`; `:197` `getInvitePreview`; `:203-204` `joinViaInvite: (code) => request<JoinResult>('/invites/${code}/join', { method: 'POST', body: '{}' })`. The `api.getDiscoverServers` / `api.joinPublicServer` siblings the specs propose have exact templates to mirror.
- **ServerContext.refetch():** `apps/web/src/shell/ServerContext.tsx:36` type `refetch: () => void`; `:274` provided as `refetch: fetchServers`. `InviteJoinPage.tsx:20` already documents calling `ServerContext.refetch()` post-join — the exact pattern Spec C's Join button reuses. Confirmed.

Bonus verification (Spec C response reuse): `JoinResult` shape is `{ serverId: string }` — `packages/shared/src/invites.ts:24-27` (`JoinResultSchema = z.object({ serverId: z.string() })`), exported from `packages/shared/src/index.ts:39-41`. The controller (`servers.controller.ts:19`) and api client (`api.ts:204`) both consume it. Spec C's "POST /servers/:id/join-public returns the same JoinResult shape" is grounded — client post-join handling reuses cleanly.

---

## Precision notes (non-blocking, for B-block awareness — NOT rework triggers)

1. **`joinViaInvite` lives on `InvitesController`, not `ServersController`.** The prompt/plan says join-public reuses the `joinViaInvite` *service* core — that is exactly right (`ServersService.joinViaInvite`, service-layer, shared by both controllers). But note the *route* the spec adds (`POST /servers/:id/join-public`) sits on `ServersController` (`servers.controller.ts:34`), whereas the existing invite-join route `POST /invites/:code/join` is on the separate `InvitesController` (`servers.controller.ts:151-159`). Both controllers inject the same `ServersService`, so the reuse is service-level and clean — no conflict. Flagging only so B-block places the new endpoint on the correct controller.

2. **Auth-guard consistency confirmed:** every existing `/servers` + `/invites/:code/join` write route uses `@UseGuards(AuthGuard)` (controller L39/55/77/152 etc.). The spec's "authed (AuthGuard) for v1" on both `/servers/discover` and `/servers/:id/join-public` matches the established posture. The security-critical AC (join-public MUST reject non-public 404/403 — not a backdoor) has no existing code contradiction; it is net-new gating logic the B-block must implement, correctly called out in P-3 approach note #2.

---

## Bottom line
All 6 load-bearing claims: **VERIFIED**. 0 UNVERIFIED, 0 WRONG. The plan is code-grounded: the schema-extension target, the Drizzle generate mechanism, the reusable `joinViaInvite` idempotent core, the untouched member-scoped `GET /servers`, the `server_members` UNIQUE idempotency, and every web integration point (router v7, api.ts sibling pattern, ServerContext.refetch, JoinResult reuse) all exist as described. **APPROVE.**
