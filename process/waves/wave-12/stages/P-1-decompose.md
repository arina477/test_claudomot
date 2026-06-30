# Wave 12 — P-1 Decompose
- wave_type: multi-spec (3 tasks). design_gap_flag: TRUE (message UI component-level; server-channel-view.html exists).
- Sizing: ~3200 LOC. KEEP WHOLE — the REST data plane → Socket.IO fan-out → UI is a required dependency chain delivering ONE observable outcome (a message sent appears real-time <1s). Both P-0 reviewers: NOT RESCOPE-AUTO-SPLIT — REST-first-Socket.IO-later ships a wave whose only deliverable is unreachable (fails V-1); the real-time <1s metric can't be met by REST-poll so it's not deferrable. The chain (message.created→message:new broadcast→render) is the tie-breaker vs the LOC flag.
- Bundle: seed a0c322b4 (messages schema + send/list REST, the contract foundation) → 723b5b6a (Socket.IO gateway, depends on the schema/events) + d999d29c (message UI, depends on the REST contract + the socket events).
- CARRY TO P-2/T-8 (messaging = auth + channel-access): send+list ChannelPermissionGuard-gated (can post/read per role; IDOR via route-param channelId); WS-upgrade SuperTokens-session-auth (on upgrade, reject unauth); room-per-channel + re-derive can('read') on join (no cross-channel leak); author_id session-derived (no spoof); idempotency UNIQUE(channel_id,idempotency_key); cursor pagination; single-pod in-memory adapter (NO Redis). T-8 live-probe via wave-11 fixture + two-client <1s proof; verify Railway WS at C-2.
- verdict: PROCEED (multi-spec, whole chain, UI → D-block).
```yaml
wave_type: multi-spec
design_gap_flag: true
claimed_task_ids: [a0c322b4-72de-4c8d-ac27-bb51dda5f464, 723b5b6a-5565-438f-bde4-7e85ba283781, d999d29c-4f60-497b-95fb-875ae40410b9]
