# T-5 — E2E (prod, headless Playwright)

**Wave:** 32 (M6 voice occupancy — pre-join occupancy indicator + graceful degradation)
**Pattern:** active-execution
**Target:** DEPLOYED PROD web `https://web-production-bce1a8.up.railway.app` (merge 45b08c3 live)
**Driver:** Playwright chromium launched with `--no-sandbox` (the environment lacks user-namespace privileges → the
Playwright MCP `chrome` channel and the gstack browse daemon both fail with `sandbox … Permission denied (13)`;
`@playwright/test` chromium with `--no-sandbox` is the working harness). No `browser_close` swarm issue — single
context, closed cleanly at script end.
**Auth:** logged in through the real UI as fixture `studyhall-e2e-fixture` (`/login` → `#email`/`#password` → "Sign in"
→ lands `/app`). Voice channel `t8-voice-probe` created in "Fixture Proof Server" for the pre-join surface, torn down
after (prod restored + verified).

## Scenarios (traced to acceptance criteria)

| Scenario | AC ref | Entry / action | Expected observable | Observed | Verdict |
|----------|--------|----------------|---------------------|----------|---------|
| S1 pre-join renders | AC6 (client indicator on pre-join) | select voice channel | `voice-study-room` surface renders; occupancy indicator present | surface present; indicator rendered | PASS |
| S2 fail-soft on 503 | AC7 + edge "creds unset → 503, no crash" | occupancy poll fires → endpoint 503 | indicator shows **error/fail-soft** state, not crash | "Occupancy data currently unavailable" chip shown (design State 4) | PASS |
| S3 **Join stays reachable** (LOAD-BEARING) | AC6/AC7 fail-soft | inspect Join CTA while occupancy = error | Join button visible + enabled | "Join voice" — visible: true, enabled: true | PASS |
| S4 no console 500 / no crash | AC7 no-crash | capture console + network across flow | no 500; no JS exception; only by-design 401/503 | see below | PASS |
| S5 graceful degrade on Join | AC7 "app degrades gracefully, not a white screen" | click "Join voice" (LiveKit connect fails, no creds) | clean error state + retry, shell intact | "Couldn't connect to the study room / Try again" (design State 5); shell intact | PASS |

## Network + console evidence

Occupancy/token requests captured live:
- `GET /channels/c0000032…0001/voice/participants` → **503** (occupancy poll — by design, creds unset → drives fail-soft)
- `POST …/voice/token` on Join → **503** (token mint — by design, creds unset → drives the "couldn't connect" state)

Console errors (all expected, none are app faults):
- `401` — the unauthenticated session probe on first landing (before login); standard SuperTokens session check.
- `503` (×2) — the browser logging the by-design non-2xx occupancy + token responses. These are network-resource log
  lines, **not** JavaScript exceptions or unhandled rejections. **No 500, no white screen, no thrown error.**

## Load-bearing result — fail-soft Join reachability

The occupancy endpoint 503s (creds unset) → `useVoiceOccupancy` `.catch` → `status:'error'` → indicator renders the
calm "Occupancy data currently unavailable" chip. **Critically, this does NOT block Join** — the "Join voice" CTA sits
below the fail-soft chip, visible and enabled. This is the wave's load-bearing fail-soft acceptance criterion: broken
occupancy telemetry must never gate the core action. Confirmed live. (Screenshot: `voice-study-room-region-1440.png`.)

## Graceful degradation on Join

Clicking "Join voice" attempts a LiveKit connect that fails (no creds). The app degrades to the design's Error state
(State 5): a danger icon, "Couldn't connect to the study room — Voice is not available right now. Try again in a
moment.", and a "Try again" retry button. The `voice-study-room` surface and full app shell (server rail, channel
sidebar, member list) stay intact — **no white screen, no crash**. (Screenshot: `voice-after-join-degrade-1440.png`.)

## Boundary (documented, non-blocking)

Populated occupancy (real participant names/avatars) and a real LiveKit media-plane connect are NOT headless-testable —
`LIVEKIT_*` unset in prod, and LiveKit's media plane (ICE/DTLS/track state) is boundary-mocked by policy regardless.
Verified here at the DOM/control level: indicator states + Join reachability + graceful-degrade. Populated-state
live-verify deferred to founder-supplies-keys.

```yaml
test_pattern: active
skipped: false
testers_spawned: 0        # head-tester drove directly (MCP chrome channel + browse daemon both sandbox-blocked; @playwright/test --no-sandbox harness used)
driver: "@playwright/test chromium --no-sandbox"
scenarios:
  - {id: S1, criterion_ref: AC6, verdict: PASS, evidence_path: T-6-layout/screens/voice-study-room-region-1440.png}
  - {id: S2, criterion_ref: AC7, verdict: PASS, evidence_path: T-6-layout/screens/voice-study-room-region-1440.png}
  - {id: S3, criterion_ref: AC6-AC7-failsoft, verdict: PASS, evidence: "Join voice visible+enabled with occupancy=error"}
  - {id: S4, criterion_ref: AC7-nocrash, verdict: PASS, evidence: "console: 401(pre-login probe)+503(by-design); no 500/no JS exception"}
  - {id: S5, criterion_ref: AC7-graceful-degrade, verdict: PASS, evidence_path: T-6-layout/screens/voice-after-join-degrade-1440.png}
flakes_observed: []
fix_up_cycles: 0
db_fixtures_cleaned: true
findings:
  - {severity: info, scenario: S4, description: "pre-login 401 session-probe + by-design 503s surface as browser console 'Failed to load resource' log lines (non-2xx responses); not app faults — no fix needed"}
```
