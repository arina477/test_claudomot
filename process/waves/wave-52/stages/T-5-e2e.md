# T-5 — E2E (wave-52 joinable focus room)
**Pattern:** B (active) against LIVE prod. 1 ui-comprehensive-tester (playwright node package, 2 isolated contexts). Fixtures A+B on server ad62cd12. **1 fix-up cycle** (FAIL → fix → redeploy → PASS).

## Fix-up cycle 1
- **Initial run: FAIL (functional)** — the focus-room panel stuck on its loading skeleton PERMANENTLY. Root cause: the client connected to /study-room but NEVER emitted a "subscribe to the server's rooms" handshake; the backend only pushed the open-rooms list on room-JOIN → chicken-and-egg (no list without joining, no joining without the list). Unit tests mocked the socket + fired events directly → missed the initial-snapshot flow. (This is the E2E-catches-what-unit-mocks-hide class.)
- **Fix (Iron Law, node+react-specialist):** backend `subscribe_server_rooms` handler (a70cc02) — on subscribe: assertMember, join study-room:server:<id> channel, immediately emit STUDY_ROOM_ROOMS_EVENT with current open-rooms list (empty=[] resolves skeleton); frontend emit subscribe_server_rooms on mount + reconnect re-subscribe, skeleton resolves on ANY rooms event (7534f4c). Merged PR #67 (725f7b6), both api+web redeployed SUCCESS.
- **Re-run: PASS** (all scenarios, 2 runs each, 2 distinct users + socket frames).

## Scenario verdicts (re-run, post-fix)
| # | Criterion | Verdict (2 runs) | Evidence |
|---|---|---|---|
| S0 | Skeleton resolves (the fix) | **PASS** | SEND subscribe_server_rooms → RECV study-room:rooms {rooms:[]} → empty state (not skeleton) |
| S1 | Create + auto-join | **PASS** | creator auto-lands joined, roster 1, no redundant join emit |
| S2 | 2-client join + roster sync (crux) | **PASS** | B sees "1 focusing" → joins → both rosters count 2 live, no reload |
| S3 | Room-timer sync | **PASS** | A start → B countdown 24:59→24:57 live; A pause → B Paused frozen (roomId-scoped) |
| S4 | Leave + ephemeral removal | **PASS** | B leave → A roster 1; A leave → RECV rooms:[] both, room vanishes |
| S5 | Layout (→ T-6) | **PASS** | dark, all states, <1024 compact non-crowding, NO voice, roster a11y (role=list/aria-live/aria-current) |

## Findings (→ V-2): none remaining (the FAIL was fixed in-cycle; L-2 note below).
## Non-findings: transient 429 (rate-limit) under rapid reload burst — benign.
## L-2 note: E2E caught a live-blocking bug (permanent skeleton) that unit tests missed because both the socket + its events were mocked — the initial-server-rooms-snapshot handshake was never exercised by a real client. Candidate lesson: a realtime feature's INITIAL server-push handshake (not just event round-trips) needs a live/real-socket E2E, because event-mocked unit tests assume the subscription already happened.
```yaml
test_pattern: active
skipped: false
testers_spawned: 1
fix_up_cycles: 1
scenarios:
  - {id: S0, criterion_ref: skeleton-resolves, verdict: PASS}
  - {id: S1, criterion_ref: create-auto-join, verdict: PASS}
  - {id: S2, criterion_ref: two-client-join-roster-sync, verdict: PASS}
  - {id: S3, criterion_ref: room-timer-sync, verdict: PASS}
  - {id: S4, criterion_ref: leave-ephemeral-removal, verdict: PASS}
  - {id: S5, criterion_ref: layout, verdict: PASS}
findings: []
```
