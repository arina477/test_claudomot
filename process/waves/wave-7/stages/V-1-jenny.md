# V-1 — Semantic Spec Verification (jenny)

**Wave:** 7 · M2 servers/channels (first bundle, multi-spec, 4 blocks)
**Spec source:** `tasks.id = a47ed9bc-039d-4ffb-ba34-0228d75fabdf` (DB spec-contract head)
**Verified against:** live deployed `main @ 585112f` (PR#17) + API `https://api-production-b93e.up.railway.app`
**Method:** read shipped source (`apps/api/src/servers/`, `apps/api/src/db/schema/servers.ts`, `apps/api/drizzle/migrations/0002_certain_miek.sql`, `packages/shared/src/servers.ts`, `apps/web/src/shell/*`, `apps/web/src/auth/api.ts`, `router.tsx`, `pages/AppHome.tsx`); probed live endpoints; cross-checked canonical designs.

## Verdict: APPROVE

All 4 claimed specs MATCH shipped behavior. Scope is held to STRUCTURE-only (no real-time, no invites/RBAC/admin). No gold-plating, no M3 pull-forward. Two Low-severity cosmetic/extra-field notes, neither blocking.

---

## Live probe evidence
| Request | Expected | Observed |
|---|---|---|
| `POST /servers` (no session) | 401 | **401** |
| `POST /servers` (no session, `{}`) | 401 (auth before validation) | **401** |
| `GET /servers` (no session) | 401 | **401** |
| `GET /servers/:id` (no session) | 401 | **401** |

201-on-create + `#general` seeding confirmed by C-2 and corroborated by the shipped service code (`HttpStatus.CREATED`, atomic seed txn). App-DB URL not held by this agent, so the create path is verified by code-read + C-2, not by a live authenticated round-trip.

---

## Per-block findings

### a47ed9bc — Server model + create-server API + owner membership — **MATCHES**
- Migration `0002_certain_miek.sql` creates `servers` (id uuid pk, name text not null, owner_id text→users.id, created_at tz) + `server_members` (id, server_id→servers **cascade**, user_id→users.id, **role_id uuid nullable**, joined_at, **UNIQUE(server_id,user_id)**). Schema in `apps/api/src/db/schema/servers.ts:5-28` matches AC verbatim.
- `POST /servers` is `@UseGuards(AuthGuard)` + `@HttpCode(201)` (`servers.controller.ts:30-44`). Body validated via `CreateServerSchema` (`packages/shared/src/servers.ts:3-5`: `z.string().trim().min(1).max(100)`) → 400 `BadRequestException` on parse failure; unauthed → 401 (probed).
- Atomicity: server + owner `server_members` insert wrapped in single `db.transaction` (`servers.service.ts:14-46`). No orphan-server path.
- Response shape `{id,name,ownerId,createdAt}` (ISO string) — `service.ts:40-45`, matches `ServerResponse`.

### a87341fe — Default category + #general channel seeded on create — **MATCHES**
- Migration adds `categories` (id, server_id→servers cascade, name, position) + `channels` (id, server_id→servers cascade, category_id→categories nullable [`set null`], name, type text default 'text', position, created_at) — `0002_certain_miek.sql:1-17`, `schema/servers.ts:30-50`.
- The SAME create transaction inserts `'General'` category (position 0) then `#general` text channel under it (`service.ts:24-38`) — rolls back together with server/membership. Every new server has >=1 channel.
- `type` enum scaffolded ('text' only used); no branching on unused types (edge-case honored).

### e32b50dd — List-my-servers + server-detail read APIs — **MATCHES**
- `GET /servers` (auth) → member-scoped via `innerJoin server_members ON user_id` (`service.ts:50-66`), returns `[{id,name,ownerId}]`, empty array when none.
- `GET /servers/:id` (auth, member-only) → existence check first (404 `NotFoundException`), then membership check (403 `ForbiddenException`), then categories (ordered by position) + channels grouped by category (ordered by position) — `service.ts:73-123`. Member-scoping enforced **server-side**, not just UI.
- Unauthed → 401 on both (probed). Response shapes match `ServerSummary` / `ServerDetail`.

### d62d6ce3 — Rail/sidebar + create-server flow (UI) — **MATCHES**
- Server rail (`ServerRail.tsx`) lists MY servers from `GET /servers` via `ServerContext`, initials per server, loading/empty/error/loaded states; `+` "Add a server" button opens the modal.
- Selecting a server → `GET /servers/:id` → `ChannelSidebar.tsx` renders categories + channels; `#general` visible; no-server / loading / error / loaded states handled.
- Create flow: modal (`CreateServerModal.tsx`) name input → `api.createServer` → on success `appendServer` (optimistic add + select) + background refetch reconcile (`ServerContext.tsx:121-136`); new server appears selected, its `#general` loads. Matches canonical `design/create-server.html` + `design/server-rail-sidebar.html` (six modal states, empty rail, loaded sidebar with #general).
- Auth-gated: `AppHome` (which mounts `ServerProvider` → `AppShell`) sits behind `AuthGuard` (`router.tsx:67-69`). 403/404/network all funnel to the sidebar "Couldn't load channels." error state — acceptable for create-and-see scope.

---

## Scope discipline — clean
- Controller exposes only `POST /`, `GET /`, `GET /:id` — no DELETE/PATCH/invite/role/kick/ban/admin endpoints (verified). `role_id` is the spec-permitted nullable scaffold, unused.
- Real-time deliberately absent: `connectionState` is a static prop in `AppShell` (`AppShell.tsx:31`), not wired to a socket. No M3 pull-forward.
- `server-settings.html` design exists but is NOT implemented this wave (correct — later M2).

## Low-severity notes (non-blocking, no rework required)
1. **Extra column — `channels.is_private boolean default false`** (`schema/servers.ts:47`, surfaced as `isPrivate` in `ServerDetail`). Not named in the a87341fe AC. It is defaulted-false and never branched on (same posture as the scaffolded `type` enum), so it is harmless scaffolding rather than functional drift — flag for awareness only.
2. **Hardcoded active-channel heuristic** — `ChannelSidebar.tsx:205` marks a channel active by `ch.name === 'general'`. Cosmetic only (no channel routing this wave / M3); acceptable for create-and-see. Modal header copy "Create a Server" vs design "Create a server" — trivial casing, spec did not fix the string.

## T-9 deferrals — assessed as intentional/tracked (NOT drift)
rollback-test-mocked, no-browser-E2E for the new flow, no-visual-regression, no-verified-fixture, no-rate-limit — all consistent with create-and-see AC sizing and the STRUCTURE-only scope. Carry to V-2 triage; none block the V-1 semantic verdict.

**Cross-agent:** pair with @karen V-1 output for completion-reality; @task-completion-validator can confirm the authenticated 201 create round-trip against the app DB if a verified fixture is later required (currently a tracked T-9 deferral).
