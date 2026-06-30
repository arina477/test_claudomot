# Wave 12 — T-8 Security (active — MANDATORY; messaging = auth + channel-access + WS-auth). 4 invariants:
```yaml
test_pattern: active
applicable_probes: [access_control, ws_auth, auth_smoke, secret_grep]
results:
  - "(1) Channel-gating: POST send + GET list @UseGuards(AuthGuard, ChannelMessageGuard) — channelId-only route-param (IDOR-safe), canViewChannelById (private default-DENY), default-DENY. Live: 401 unauthed, 403 non-permitted. Tested."
  - "(2) WS-upgrade auth: io.use() at CONNECT — sAccessToken from handshake cookie (+auth fallback) → getSessionWithoutRequestResponse → assertClaims(isVerified) → reject unauth at connect (socket.data.userId). LIVE: unauth socket → connect_error Unauthorized. Tested (5 scenarios)."
  - "(3) No cross-channel leak: join_channel re-derives canViewChannelById server-side; @OnEvent→server.to('channel:id').emit room-only (never broadcast-all). LIVE: a non-joined socket received NOTHING. Tested."
  - "(4) Author no-spoof: author_id=req.session.getUserId(); SendMessageSchema has no authorId. Tested."
  - "Idempotency: UNIQUE(channel_id,idempotency_key) on-conflict-return. Tested."
  - "Two-client <1s: message:new in 93ms/87ms (LIVE, via wave-11 verified fixture — T-8 rule 1 satisfied). Secret grep clean."
findings:
  - {severity: info, category: rbac-revoke, description: "no live-socket eviction on RBAC revoke (join-time gate correct) → H2 (B-6 reconciled)"}
  - {severity: info, category: msg-race, description: "null-idempotency-key send race unreachable on prod path (client always sends key) → V cleanup (B-6)"}
```
T-8 PASS: all 4 access-control invariants tested + LIVE-verified (two-client 93ms, WS-auth reject, no-leak). No critical/high. The conversational core's security holds.
