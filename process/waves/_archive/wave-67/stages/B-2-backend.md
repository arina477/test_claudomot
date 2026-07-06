# B-2 Backend — wave-67
Specialist: backend-developer (a3d89dc5). Files: servers.service.ts (+discoverServers, +joinPublicServer), servers.controller.ts (+2 routes). GET /servers + joinViaInvite UNCHANGED.
- discoverServers({q,limit,offset}): WHERE is_public=true; memberCount via correlated scalar subquery COUNT(server_members); ILIKE q on name/description/topic; limit cap 50 + offset; order memberCount DESC, name ASC.
- joinPublicServer(serverId,userId): transaction → read server → is_public gate (404 NotFound if missing, 403 Forbidden if private) → reuse joinViaInvite idempotent onConflictDoNothing insert core → JoinResult. SECURITY: private-server join rejected (INSERT never reached — asserted in test).
- Endpoints: GET /servers/discover + POST /servers/:id/join-public (both AuthGuard).
Tests: +21 (11 service + 10 controller); npm test 752/752; typecheck + biome clean. DB-integration tests CI-gated (no local Postgres).
Deviation (ACCEPT): correlated scalar subquery for memberCount vs LEFT JOIN — semantically equivalent, mock-compatible, documented.
```yaml
skipped: false
services_touched: [servers.service.ts, servers.controller.ts]
deviations: ["correlated subquery vs LEFT JOIN for memberCount — equivalent, accepted"]
```
