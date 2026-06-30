# Wave 13 — B-block review artifacts (multi-spec, commit-per-spec; edit/delete→reactions∥UI)
**Block:** B · **Wave topic:** M3 message lifecycle (edit/delete + reactions) · **Gate:** B-6 · **Status:** in-progress
| Stage | Status | Notes |
|---|---|---|
| B-0 | done | branch wave-13-m3-lifecycle; claimed 3 |
| B-0..B-2 | done | edit/delete+reactions+gateway-events (219 api) |
| B-3 | done | lifecycle UI 8234287 |
| B-5 | done | full green; pushed |
| B-6 | done | head-builder APPROVED (authz PASS; d78df376 citation recorded) |
## CARRY (P-4, load-bearing): edit=AUTHOR-ONLY (session==author_id, 403); delete=author OR can(serverId, manage_channels) — resolve serverId from channels.server_id BEFORE can() (one select; canViewChannelById shows it); soft-delete (is_deleted/deleted_at, tombstone, no hard-delete, can't-edit-deleted); reactions toggle idempotent via UNIQUE(message_id,user_id,emoji), aggregated [{emoji,count,reactedByMe}]; realtime message.updated/deleted + reaction.added/removed → gateway server.to('channel:id') ROOM-ONLY (extend wave-12 @OnEvent). Reuses ChannelMessageGuard. specialist postgres-pro at B-0 (NOT database-administrator). table=message_reactions (record override vs _library `reactions`). Design: design/server-channel-view.html. T-8 two-client via wave-11 fixture. PUSH after each stage.
