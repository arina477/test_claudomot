# P-3 Plan — wave-67 (M11 server discovery bundle #1, multi-spec)

## Approach

### Architecture deltas
**1. servers domain (apps/api) — spec A.** `servers` table gains is_public/description/topic (opt-in, default false). New read path `GET /servers/discover` (member-count derived via server_members join, ILIKE search, limit+offset). Alternative: separate `public_servers` table vs columns on `servers` — COLUMNS win (a server is either public or not; a second table duplicates identity + risks drift). member-scoped `GET /servers` untouched. Failure-domain: new read endpoint, no change to existing auth/membership writes.
**2. membership (apps/api) — spec C.** New `joinPublicServer` reuses the joinViaInvite idempotent insert core, gated on is_public server-side. Alternative: generalize joinViaInvite with an optional-invite param vs a sibling method sharing the core — SIBLING METHOD win (keeps the invite path's validation intact; shares only the transactional insert). Failure-domain: a new membership-write door — MUST reject non-public (404/403) or it's a backdoor into private servers (security-critical AC).
**3. web discovery surface — spec B+C.** New `/discover` route + ServerDiscoverPage (separate from ServerContext's member-scoped list); new api client fns; Join wired to ServerContext.refetch()+auto-select. Alternative: fold discovery into ServerContext vs a standalone surface — STANDALONE win (discovery is a distinct, unauth-of-membership browse surface; folding it bloats the member-scoped context).

### Data model (spec A)
- `servers` += `is_public boolean NOT NULL DEFAULT false`, `description text NULL`, `topic text NULL`. Backward-compatible (existing rows private). Migration DRIZZLE-GENERATED (`npm run db:generate` in apps/api → drizzle/migrations), schema + .sql committed together. No backfill. memberCount DERIVED (COUNT server_members per server) — no column. Index: consider a partial/plain index on is_public for the discover filter (specialist judgment; small tables early — optional).

### API contracts (spec A + C)
- `GET /servers/discover?limit=&offset=&q=` → `{ servers: DiscoverServer[] }`, AuthGuard. DiscoverServer = {id, name, description|null, topic|null, memberCount:number}. Only is_public=true. Shared Zod (packages/shared).
- `POST /servers/:id/join-public` → JoinResult (existing shape), AuthGuard. Gated on is_public=true; 404/403 otherwise; idempotent.
- Existing `GET /servers`, invite-join — UNCHANGED.

### New deps: none. ### SDK: N/A.

## Plan (file-level, grouped by B-stage)
**B-0 Schema:**
| apps/api/src/db/schema/servers.ts | modify | +is_public/description/topic | database-administrator (or backend-developer) | 1st |
| apps/api/drizzle/migrations/<gen>.sql | create (generated) | `npm run db:generate` output | database-administrator | after schema |
**B-1 Contracts:**
| packages/shared/src/servers.ts (or discover.ts) | modify/create | DiscoverServer DTO + Zod + discover query/response; reuse JoinResult | typescript-pro (or backend-developer) | after B-0 |
**B-2 Backend:**
| apps/api/src/servers/servers.service.ts | modify | discoverServers(q,limit,offset) [is_public + memberCount join + ILIKE] + joinPublicServer(serverId,userId) [reuse invite insert core, is_public gate] | backend-developer | after B-1 |
| apps/api/src/servers/servers.controller.ts | modify | GET /servers/discover + POST /servers/:id/join-public (AuthGuard) | backend-developer | with service |
**B-3 Frontend:**
| apps/web/src/auth/api.ts | modify | api.getDiscoverServers + api.joinPublicServer | react-specialist | after B-2 |
| apps/web/src/shell/ServerDiscoverPage.tsx | create | /discover page: searchable card list + empty/loading/error + Join button (per D-3 design) | react-specialist | after api.ts + D-3 |
| apps/web/src/router.tsx | modify | /discover route | react-specialist | with page |
| apps/web/src/shell/ServerRail.tsx (+AppShell) | modify | discover entry-point affordance | react-specialist | with page |
**B-5 Verify (tests):**
| apps/api discover + join-public tests (unit + contract) | create | discover filter/search/pagination/memberCount; join-public is_public-gate (reject private) + idempotency | backend-developer | after B-2 |
| apps/web ServerDiscoverPage + join tests | create | render/search/empty-state/join→refetch | react-specialist | after B-3 |

## Specialist routing (validated against AGENTS.md): database-administrator (schema/migration), typescript-pro (shared contract), backend-developer (NestJS service+controller+api tests), react-specialist (web page+client+web tests). All confirmed present.
## Parallelization: B-0→B-1 serial (contract derives from schema). B-2 (backend) and D-block (design) can overlap. B-3 frontend after B-2 + D-3. Within B-2 the two endpoints are one service file → serial. Within B-3 the page waits on api.ts + D-3 design.
## Self-consistency sweep: every AC → step (spec-A schema/discover → B-0/B-2; spec-B page → B-3; spec-C join → B-2/B-3); every step has a specialist; design_gap_flag=true (→ D-block for ServerDiscoverPage before B-3); contracts concrete; no deps; no TBD. Clean.
