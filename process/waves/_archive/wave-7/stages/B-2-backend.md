# Wave 7 — B-0/B-1/B-2 Backend (rebuilt post-restart, commit-per-spec)
- B-0 schema (0d0f609): servers/server_members/channels/categories (+is_private, unique(server_id,user_id), cascade FKs, category_id set-null). Migration 0002_certain_miek.sql (applies on deploy — no local PG).
- B-1 shared (3928094): packages/shared/src/servers.ts (CreateServer/ServerResponse/ServerSummary/ServerDetail/CategoryWithChannels/ChannelSummary), .js re-exports, built to dist.
- a47ed9bc create-server (29c270c): atomic db.transaction (server+owner-member+default General category+#general channel). POST /servers AuthGuard+Zod→201. @Controller('servers') bare path (no /api/v1 — matches /me,/profile; not breaking live routes).
- a87341fe (44d2cee): default category/#general folded into the txn + tests.
- e32b50dd reads (f72ef79): findMyServers (innerJoin server_members, server-scoped); findServerDetail (404 exists-first then 403 member-check; categories+channels grouped). GET /servers + /servers/:id AuthGuard.
79/79 api tests.
