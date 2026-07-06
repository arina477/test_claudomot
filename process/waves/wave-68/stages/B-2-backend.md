# B-2 Backend — wave-68
Specialist: backend-developer (ab1d8d4c). 
- updateServer(serverId,userId,patch): OWNER-only (copy :408 idiom — 404 missing / 403 non-owner) → partial update is_public/description/topic ('in patch' so explicit null clears) → return updated server. 
- PATCH /servers/:id (AuthGuard, req.session.getUserId, UpdateServerSchema Zod; 403/404/400).
- memberCount fix: correlated subquery → LEFT JOIN server_members + GROUP BY (count(server_members.user_id)::int; LEFT JOIN keeps 0-member public servers). is_public filter + ILIKE + stable ORDER BY + limit/offset preserved.
Tests: 5 updateServer unit + 6 controller (incl non-owner→403 row-unmodified security) + LIVE-DB integration spec (apps/api/test/integration/update-server-member-count.spec.ts: 5 updateServer real-PG incl security + 4 memberCount real-count 0/1/2). npm test 764/764 (+12); typecheck 4/4; lint clean. Integration CI-gated (DATABASE_URL_TEST unset locally).
Deviation (ACCEPT): 'description'/'topic' in patch vs !==undefined — explicit null must clear the field; sound + tested.
```yaml
skipped: false
services_touched: [servers.service.ts, servers.controller.ts]
deviations: ["'in patch' for null-clear semantics — accepted"]
```
