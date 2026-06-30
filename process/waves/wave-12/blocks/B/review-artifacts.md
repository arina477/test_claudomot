# Wave 12 — B-block review artifacts (multi-spec, commit-per-spec; order REST→gateway∥UI)
**Block:** B · **Wave topic:** M3 real-time messaging · **Gate:** B-6 · **Status:** in-progress
| Stage | Status | Notes |
|---|---|---|
| B-0 | done | branch wave-12-m3-messaging; claimed 3 |
| B-0..B-2 | done | REST+gateway (200 api; WS-auth, ChannelMessageGuard) |
| B-3 | done | real-time UI (24 web) 495e799 |
| B-5 | done | full green ~224; pushed |
| B-6 | pending | gate |
## CARRY (P-4, load-bearing): ChannelMessageGuard (channelId-only; canViewChannelById resolves server_id from channels.server_id-notNull then canViewChannel; route-param IDOR-safe; default-DENY) on POST+GET messages — NOT the 2-param wave-10 guard. author_id session-derived (no spoof). @nestjs/event-emitter + EventEmitterModule.forRoot() (B-0, non-optional). Socket.IO WS-UPGRADE auth via getSessionWithoutRequestResponse (supertokens-node 24) — reject unauth at connect; room-per-channel + canViewChannelById on join (no cross-channel leak); message.created→server.to('channel:id').emit('message:new') room-only fan-out. single-pod in-memory (NO Redis). idempotency UNIQUE(channel_id,idempotency_key). websocket-engineer absent → node-specialist (wiring) + supertokens-integration (WS-auth). Design: design/server-channel-view.html (message-row 3 states + composer). T-8: live-probe via wave-11 fixture + TWO-CLIENT <1s + WS-auth-reject + no-leak. C-2: verify Railway WS-Upgrade. PUSH after each stage.
