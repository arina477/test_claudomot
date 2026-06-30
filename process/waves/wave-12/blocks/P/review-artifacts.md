# Wave 12 — P-block review artifacts
**Block:** P · **Wave topic:** M3 real-time messaging (first bundle: REST data plane + Socket.IO gateway + message UI) · **Gate:** P-4 · **Status:** in-progress
| Stage | Deliverable | Status |
|---|---|---|
| P-0 | stages/P-0-frame.md | done (PROCEED; channel-gate/WS-auth/no-leak/no-spoof + WS-infra flags; design TRUE) |
| P-1 | done (multi-spec, whole chain; security→P-2) |
| P-2 | done (3-block; messages model + channel-gate/WS-auth/no-leak ACs) |
| P-3..P-4 | pending | |
## Context
- wave_db_id (wave 12); M3 6198650e. claimed [a0c322b4 MessagingModule-REST(seed), 723b5b6a Socket.IO-gateway, d999d29c message-UI]. multi-spec (~3200 LOC). UI wave → D-block. Delivers M3 success metric (2 students exchange messages real-time <1s).
- Builds on M2 (servers/channels/membership/RBAC). REUSES wave-10 ChannelPermissionGuard (gate who posts/reads in a channel). Socket.IO WS-upgrade auth via SuperTokens session. messages schema + cursor pagination + idempotency-key dedup (decomposer contracts). DEFERRED: reactions/threads/mentions/attachments/presence/typing (later M3).
- SECURITY: auth + channel-permission (post/read gated by RBAC) + Socket.IO WS-upgrade session-auth. T-8 mandatory + T-8 rule 1 (live-probe authed message paths via the wave-11 verified fixture). PUSH after each B/D stage. Autonomous mode: automatic.
