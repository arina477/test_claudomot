# Wave 12 — B-6 Review (gate) — APPROVE
## Phase 1 — head-builder APPROVED: 4 security invariants VERIFIED server-side+tested:
1. WS-upgrade auth at CONNECT (server.use()/io.use in afterInit; cookie sAccessToken + handshake.auth fallback → getSessionWithoutRequestResponse → assertClaims(isVerified); fail-closed; socket.data.userId; unauth socket rejected — tested).
2. Channel-gating server-side + private-default-deny: ChannelMessageGuard channelId-only @Param IDOR-safe default-DENY; canViewChannelById resolves server_id→canViewChannel (private→override-only). Tested (403 non-member private).
3. No cross-channel leak: join_channel re-derives canViewChannelById; @OnEvent→server.to('channel:id') room-only (never server.emit). Tested.
4. author no-spoof: author_id=session getUserId; SendMessageSchema has no authorId.
Migration 0005 (UNIQUE+FKs+cascade+index, no auto-migrate); idempotency ON CONFLICT; keyset pagination; single-pod in-memory; IoAdapter+EventEmitterModule wired; 316 tests. Commit-per-spec OK.
## Phase 2 — secret-grep clean. 3 MAJORs reconciled: event-emitter-peer=false-positive; null-key-send-race=unreachable-on-prod (client always sends idempotencyKey)→V cleanup; no-socket-eviction-on-RBAC-revoke=out-of-M3-scope (join-time gate correct)→H2.
## DOWNSTREAM: C-2 verify Railway WS-Upgrade (don't false-green on dead namespace). T-8/V: realtime_verified=FALSE at B-exit → needs TWO-CLIENT <1s cross-client proof (M3 success metric).
```yaml
phase1_head_builder_verdict: APPROVED
final_verdict: APPROVE
realtime_verified: false   # C-2/T-8 two-client proof pending
