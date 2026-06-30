# Wave 18 — T-5 E2E (thread fan-out — LIVE two-client probe)
F-1 (unproven thread realtime fan-out) CLOSED via a live two-client socket.io wire probe vs prod (Playwright MCP chrome-channel-blocked host-side → canonical socket.io path, as waves 12-15). Two verified fixtures A+B co-members of server ad62cd12, #general 93982063, parent 8bf6b3b6:
- A POSTs reply (201) → B (joined non-author) RECEIVED thread:reply:created, payload match → FAN-OUT PROVEN.
- C (connected, never join_channel) RECEIVED NOTHING (C_leaked=0) → room-scoped, no leak.
- A soft-deletes (204) → B RECEIVED thread:reply:deleted {replyCount:0, lastReplyAt:null} → delete-decrement realtime PROVEN.
```yaml
test_pattern: active
skipped: false
disposition: COVERED-BY-CI + live-two-client-PASS (F-1 closed)
scenarios:
  - {id: 2-two-client-fanout, verdict: PASS}
  - {id: thread-reply-deleted-decrement, verdict: PASS}
  - {id: room-scoped-no-leak, verdict: PASS}
findings:
  - {severity: resolved, scenario: F-1, description: "two-client thread fan-out + no-leak + delete-decrement proven live"}
  - {severity: info, scenario: F-CARRY-2, description: "Playwright MCP chrome-channel-blocked host-side; socket.io wire path used"}
```
