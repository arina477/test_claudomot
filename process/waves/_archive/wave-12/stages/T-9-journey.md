# Wave 12 — T-9 Journey (gate + journey regen)

## Phase 1 — head-tester gate verdict: APPROVED
See `process/waves/wave-12/blocks/T/gate-verdict.md`. The M3 two-client real-time delivery is genuine
cross-client wire delivery (A POST → B `message:new` 93ms/87ms over two separate sockets; non-joined
third client no-leak), NOT a single-client echo — closes the B-6 `realtime_verified=FALSE` gap. All 4
T-8 invariants tested + live-verified. 316 CI tests green. No critical/high findings; 2 info findings
correctly non-blocking (null-key-race → V cleanup; no-socket-eviction-on-revoke → H2).

## Phase 2 — journey-map regen (REQUIRED — M3 messaging is a major new UI surface)
Regen ran (UI wave: B-3 frontend ran, design adopted at D-3, page 9 main column rebuilt). Crawl was
HTTP/code-level + the C-2 live two-client Socket.IO probe + a gate re-confirmation of the REST 401 door
(Playwright chrome channel absent — recurring fixture gap 4a2ad286). Map updated to v0.8.

### Regen diff vs prior (v0.7, wave-10)
- **Surfaces moved NOT-built → LIVE:**
  - Page 9 (server channel view, 3-pane main) real-time chat: message list + composer + live `message:new`.
  - `POST /channels/:id/messages` (send, ChannelMessageGuard-gated, idempotent).
  - `GET /channels/:id/messages` (list, keyset pagination, gated).
  - `/messaging` Socket.IO gateway (WS-upgrade auth at connect + room-per-channel fan-out).
- **Flow F3 (real-time messaging):** annotated LIVE; M3 success metric MET LIVE.
- **No routes removed.** Page 9 was already in the inventory (route `/servers/:id/:channelId`); this wave
  populated its real-time chat content (previously wave-7 hardcoded-`#general` placeholder main).
- **Coverage gaps (recorded, non-blocking):** authed full-browser click-through of the messaging UI not
  Playwright-driven (fixture 4a2ad286, carry-forward); multi-pod fan-out deferred (single-pod in-memory
  adapter); react/thread not built (later milestone).

### Live gate re-confirmation
- `POST /channels/:id/messages` unauthed → **401** ✓
- `GET /channels/:id/messages` unauthed → **401** ✓
- api `/health` → **200** ✓
- (WS-upgrade unauth rejection authoritatively proven by C-2's real Socket.IO client `connect_error:
  Unauthorized` — raw curl can't perform the namespace handshake, so the C-2 client probe stands.)

### Cross-wave regression check
No prior LIVE journey broke. M2 invites/join, RBAC, servers/channels surfaces unchanged. Page 9 gained
real-time chat without removing or regressing any existing surface. No critical/significant regressions.

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
journey_regen_skip_reason: ""
crawl_routes_visited: 4                 # /channels/:id/messages POST+GET, /messaging gateway, /health (HTTP/code-level + C-2 live two-client probe)
regen_diff:
  routes_added: ["POST /channels/:id/messages", "GET /channels/:id/messages", "/messaging (Socket.IO gateway)"]
  routes_removed: []
  coverage_gaps: ["authed messaging-UI browser click-through (fixture 4a2ad286, carry-forward)", "multi-pod fan-out (single-pod in-memory adapter)", "react/thread (later milestone)"]
scenarios_run: 0                        # no user-scenarios/ dir
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: a7e0fd5
findings:
  - {severity: info, journey: F3, description: "null-idempotency-key send-race — unreachable on prod path (client always sends key) → V cleanup"}
  - {severity: info, journey: F8/F3, description: "no live-socket eviction on RBAC revoke — out of M3 scope (join-time gate correct) → H2"}
  - {severity: info, journey: F3, description: "authed messaging-UI browser e2e deferred (no persistent verified-prod fixture 4a2ad286) — carry-forward coverage gap, not a regression"}
```
