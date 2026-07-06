# P-3 Plan — wave-68 (M11 publish-write-half + memberCount fix, single-spec)

## Approach
### Architecture deltas
**1. servers domain (apps/api) — publish/update.** New `PATCH /servers/:id` → `updateServer(serverId, userId, patch)` service method, OWNER-gated (`server.owner_id !== userId → ForbiddenException`, reusing the :368 idiom; 404 if missing). Partial update of is_public/description/topic only. Alternative: PATCH /servers/:id vs dedicated POST /servers/:id/publish — PATCH WINS (RESTful partial update covers is_public + description + topic in one owner-gated mutation; a /publish endpoint would need a sibling for description/topic edit). Failure-domain: a new owner-gated WRITE door exposing a server to a PUBLIC directory — owner-authz is security-critical (non-owner publish = the failure mode); must be SERVICE-side + tested.
**2. discover memberCount fix (apps/api).** Rewrite the memberCount aggregation in discoverServers (servers.service.ts ~550) from the correlated scalar subquery (returns 0 at runtime) to a LEFT JOIN server_members + GROUP BY servers.id + count(sm.user_id) (robust, single-pass). Alternative: fix the correlated-subquery correlation vs LEFT JOIN+GROUP BY — LEFT JOIN WINS (deterministic, avoids the Drizzle correlation ambiguity that produced 0; also computes once). Keep the is_public filter, ILIKE search, stable ORDER BY (memberCount desc, name, id), limit/offset. Failure-domain: read-path query only.
**3. web server-settings (apps/web) — publish toggle.** Add a publish toggle (is_public) + description/topic edit to the server-settings surface (owner-only), reusing the canonical design/server-settings.html Overview shell + DS form primitives. Alternative: extend the existing settings surface vs a new modal — extend existing (server-settings surface exists, reachable via ChannelSidebar; reuse it). Save → api.updateServer → PATCH.

### Data model: NO schema change (is_public/description/topic + index exist from wave-67 migration 0024). discoverServers memberCount query rewrite only.
### API contracts
- `PATCH /servers/:id` (AuthGuard, OWNER-gated) body { is_public?, description?, topic? } → updated ServerSummary/ServerDetail. 403 non-owner / 404 missing / 400 invalid.
- `GET /servers/discover` — memberCount now correct (no response-shape change).
### New deps: none. ### SDK: N/A.

## Plan (file-level, by B-stage)
**B-1 Contracts:**
| packages/shared/src/servers.ts | modify | UpdateServerSchema/DTO (partial is_public?/description?/topic?, capped lengths) + index re-export; reuse ServerSummary/ServerDetail | typescript-pro | 1st |
**B-2 Backend:**
| apps/api/src/servers/servers.service.ts | modify | updateServer(serverId,userId,patch) OWNER-gated (403/404) partial update; memberCount LEFT JOIN+GROUP BY fix in discoverServers | backend-developer | after B-1 |
| apps/api/src/servers/servers.controller.ts | modify | PATCH /servers/:id (AuthGuard, req.session.getUserId) | backend-developer | with service |
| apps/api/src/servers/*.spec + pg-harness integration | create/modify | updateServer owner-reject (non-owner 403, row unmodified) + publish/unpublish; **LIVE-DB memberCount test (real Postgres, seed servers w/ 0/1/2 members → assert memberCount==N)** | backend-developer | after B-2 |
**B-3 Frontend:**
| apps/web/src/auth/api.ts | modify | api.updateServer(serverId, patch) → PATCH /servers/:id | react-specialist | after B-1 |
| apps/web/src/shell/<server-settings surface> | modify/create | owner-only publish toggle + description/topic edit (reuse server-settings Overview shell + DS form primitives); reflect state; save→api.updateServer; non-owner hidden/disabled | react-specialist | after api.ts |
| apps/web settings tests | create | owner sees toggle + saves (PATCH called); non-owner doesn't; publish/unpublish reflects state | react-specialist | after B-3 |

## Specialist routing (AGENTS.md): typescript-pro (shared DTO), backend-developer (PATCH+service+memberCount+pg-harness live-DB test), react-specialist (settings UI+client+tests). All present.
## Parallelization: B-1 → then B-2 (backend) ∥ B-3 api.ts+UI (both consume the B-1 DTO; B-3 UI needs the PATCH shape but can build against the DTO). B-2 memberCount fix independent of B-3. Within B-2 serial (service→controller→tests).
## Self-consistency sweep: AC1-3 owner-gated PATCH → B-2; AC4 DTO → B-1; AC5-7 settings UI → B-3; AC8 memberCount fix → B-2; AC9 live-DB test → B-2 (pg-harness). Every step has a specialist. design_gap_flag=false. Contracts concrete. No deps/TBD. Clean.
