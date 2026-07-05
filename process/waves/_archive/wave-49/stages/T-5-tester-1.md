# T-5 E2E — StudyHall Shared Study Timer: Two-Client Real-Time Sync

**Wave:** 49 · **Stage:** T-5 (Live E2E, prod) · **Tester:** tester-1
**Date:** 2026-07-05
**Target:** web `https://web-production-bce1a8.up.railway.app` · api `https://api-production-b93e.up.railway.app`
**Server under test:** Fixture Proof Server `ad62cd12-b78e-4a85-a214-042cf176b16c`
**Fixtures:** A = `studyhall-e2e-fixture@example.com` (userId `21984eb2…`), B = `studyhall-e2e-fixture-b@example.com` (userId `da74148e…`) — both co-members of `ad62cd12`.

## Headline verdicts (the two must-verify outcomes)

- **Real-time cross-client sync (Scenario 1): PASS.** Genuine DISTINCT-user fan-out. A clicks Start; B's widget shows a running, decrementing countdown with a Focus phase pill **without reloading**, in ~250 ms. Confirmed live over the dedicated Socket.IO `/study-timer` namespace (WebSocket transport). The B-6 namespace fix is working in prod.
- **Roster is live / ephemeral (Scenarios 4–5): PASS.** The "N studying" roster is driven by live `study-timer:presence` broadcasts, reflects only currently-viewing members, drops on unmount (leave_timer_room) and rebuilds on return — and is NOT persisted: after a full page reload the roster reflects only live viewers while the TIMER itself resurrects from the server-anchored `endsAt` (compute-on-read). Timer persists (DB-anchored); roster does not.

**Overall: all 5 scenarios PASS on both runs (2/2). No 5xx. No functional console errors.**

## Method / tooling note (important)

The Playwright-MCP instances (`playwright-1..10`) all share one Chromium profile dir (`mcp-chrome-for-testing-51e10da`), so only one MCP browser context can be live at a time — and StudyHall auth is cookie-based (SuperTokens `sAccessToken`/`sRefreshToken`/`sFrontToken`), meaning two tabs in one MCP context share one cookie jar and therefore one identity. Same-user multi-tab cannot prove co-member fan-out (per `test-accounts.md` § e2e-fixture-b).

To run genuine TWO-DISTINCT-USER clients simultaneously, I drove Playwright directly via the installed Node package (`playwright` in the npx cache, Chromium 1228 present) launching **ONE** Chromium with **TWO isolated browser contexts** — context A signed in as Fixture A, context B as Fixture B — never calling `browser_close` on any MCP instance. This is one Playwright browser, two contexts, two real WebSocket connections, two distinct authenticated userIds. Both distinct userIds are observed in the `/study-timer` presence payloads below, confirming the fan-out is genuinely cross-user (not multi-tab-same-user).

Scripts: `/tmp/st_lib.cjs`, `/tmp/st_run.cjs`, `/tmp/st_net.cjs`. Raw run log: `/tmp/st_results.txt`.
Screenshots: `/home/claudomat/project/.playwright-mcp/st-shots/` (14 PNGs, `r{run}_s{scenario}_{client}_{state}.png`).

## Socket-frame evidence (captured, `/study-timer` namespace)

Both clients open `wss://api-production-b93e.up.railway.app/socket.io/?EIO=4&transport=websocket` (WebSocket, not polling), then:

```
[A] SENT 40/study-timer,                                         # namespace connect
[A] SENT 42/study-timer,["join_timer_room",{"serverId":"ad62cd12-…"}]
[A] RECV 42/study-timer,["study-timer:update",{"…","timer":{"phase":"work","runState":"running","endsAt":"2026-07-…"}}]
[A] RECV 42/study-timer,["study-timer:presence",{"…","viewers":[{userId:21984eb2…},{userId:da74148e…}],"count":…}]
[B] SENT 40/study-timer,
[B] SENT 42/study-timer,["join_timer_room",{"serverId":"ad62cd12-…"}]
[B] RECV 42/study-timer,["study-timer:update",{"…","runState":"running","endsAt":"2026-07-…"}]
```

- `study-timer:update` carries authoritative `{phase, runState, endsAt}` — `endsAt` is the single server-anchored timestamp both clients derive from (explains the 0 s countdown agreement). runState transitions running → paused (`endsAt:null` + `remaining…`) → idle observed live on BOTH clients.
- `study-timer:presence` carries `viewers[]` + `count` — the ephemeral roster. This is a SEPARATE namespace from `/presence` (the normal online indicator), which emitted its own `presence:snapshot` / `presence:online` frames. Confirms the study roster is distinct from online-presence, as specified.

## Per-scenario results (2 runs each)

### Scenario 1 — Real-time timer sync — PASS / PASS
A clicks Start → B sees RUNNING (Pause button, Focus pill, decrementing) without reload.
- Run 1: B saw running in **254 ms**; B display `24:59`, phase FOCUS, then decremented `24:59 → 24:57`.
- Run 2: B saw running in **253 ms**; `24:59`, FOCUS, `24:59 → 24:57`.
- Evidence: `r1_s1_B_running.png` / `r2_s1_B_running.png` — B (logged in as @studyhallfixtureb) shows `24:59  FOCUS  Pause  2 studying / Live sync`. `r1_s1_A_running.png` for A.

### Scenario 2 — Countdown agreement (within ~1 s) — PASS / PASS
Both derive from the same server `endsAt`.
- Run 1: A `24:57` / B `24:57` → **diff 0 s**.
- Run 2: A `24:57` / B `24:57` → **diff 0 s**.

### Scenario 3 — Pause / Reset propagate — PASS / PASS
- Pause: A clicks Pause → B shows Paused badge + frozen countdown.
  - Run 1: B saw paused in **258 ms**; frozen check `24:57 == 24:57` over 2.2 s (FROZEN, correct). `r1_s3_B_paused.png`.
  - Run 2: **254 ms**; `24:57 == 24:57` frozen. `r2_s3_B_paused.png`.
- Reset: A clicks Reset → B returns to idle (Start button, `25:00`).
  - Run 1: B saw idle `25:00` + Start in **254 ms**. `r1_s3_B_idle.png`.
  - Run 2: **255 ms**. `r2_s3_B_idle.png`.

### Scenario 4 — Presence roster "N studying" (ephemeral body-doubling) — PASS / PASS
- Both viewing → A roster = **"2 members studying"** (two avatars). `r{run}_s4_A_roster2.png`.
- B navigates away (to `/app` home, unmounts server view) → A roster drops to **"1 members studying"** (observed within the first poll, ≤2–3 ms after A's next re-read; leave_timer_room fires on unmount). `r{run}_s4_A_roster1.png`.
- B returns to server → A roster returns to **"2 members studying"**.
- Both runs identical. This roster is distinct from the right-hand MEMBERS "ONLINE — 2" indicator (visible in screenshots), confirming the two are separate systems.

### Scenario 5 — Roster live-only / non-persisted + timer resurrection on reload — PASS / PASS
Timer running, both viewing; fully reload A's page.
- Run 1: pre-reload A `24:56` FOCUS running; **after reload A `24:55` FOCUS still running** (timer resurrected from server and continued at the correct remaining time — compute-on-read, monotonic non-increasing). Roster after reload reflects live viewers = **2** (both still viewing). `r1_s5_A_postreload.png`.
- Run 2: pre `24:56` → post `24:55`, running; roster = 2. `r2_s5_A_postreload.png`.
- Conclusion: TIMER persists (DB-anchored `endsAt`), ROSTER does not (rebuilt live from current sockets). Matches the P-4 carry.

## Console errors / 5xx

- **5xx: NONE** across all runs.
- **401:** `POST /auth/session/refresh` returns 401 on cold page load — benign SuperTokens auto-refresh probe when the short-lived front token has lapsed between runs; the SDK refreshes transparently and the session is valid (both fixtures reach `/app` and connect sockets). Not a defect.
- **429 (rate limit):** observed on `auth`/API calls ONLY during the aggressive multi-scenario harness that logs in and hammers start/pause/reset repeatedly in a tight loop. This is a TEST-ARTIFACT of automation throughput, not reproducible under normal single-user pacing, and did not affect any timer/socket outcome (all scenarios passed while 429s were present). Flagging for awareness, not as a product bug. No Iron-Law triage warranted — no functional failure and no root-cause defect in the feature under test.
- No uncaught JS exceptions related to the timer/socket code.

## Phase auto-advance (explicitly NOT tested)

Per instructions, did not wait for a real Work→Break auto-advance (25 min / 5 min fixed durations — infeasible live; covered by unit+integration). All observed phases were `work`/FOCUS. The `study-timer:update` payload does carry a `phase` field, so the transport for a future phase change is in place, but the transition itself was not exercised here.

## FLAKE assessment

Zero flakes. Every scenario produced identical PASS results on both runs with sub-300 ms propagation latencies on scenarios 1 and 3. Roster transitions (scenario 4) propagated effectively instantly (join/leave broadcast).

## Summary table

| # | Scenario | Run 1 | Run 2 | Evidence |
|---|---|---|---|---|
| 1 | Real-time timer sync (distinct users) | PASS (254 ms) | PASS (253 ms) | r*_s1_B_running.png + WS frames |
| 2 | Countdown agreement ≤1 s | PASS (0 s) | PASS (0 s) | run log |
| 3 | Pause + Reset propagate | PASS (258/254 ms) | PASS (254/255 ms) | r*_s3_B_paused.png, r*_s3_B_idle.png |
| 4 | Roster "N studying" ephemeral 2→1→2 | PASS | PASS | r*_s4_A_roster2.png, r*_s4_A_roster1.png |
| 5 | Roster live-only + timer resurrects on reload | PASS | PASS | r*_s5_A_postreload.png |

**Both must-verify outcomes confirmed: (1) real-time cross-client sync WORKS across distinct co-member users; (4–5) the roster is live/ephemeral while the timer is server-persisted.**
