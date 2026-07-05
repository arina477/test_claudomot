# T-5 E2E RE-RUN — Joinable Focus Room (two-client) — StudyHall wave-52

**Verdict: PASS — the subscribe handshake fix is confirmed LIVE and end-to-end.**

- **Target:** https://web-production-bce1a8.up.railway.app (web) / wss://api-production-b93e.up.railway.app (`/study-room` namespace)
- **Fix under test:** merge `725f7b6` — client emits `subscribe_server_rooms` on mount → backend pushes open-rooms list → loading skeleton resolves. Prior run was interrupted with the panel stuck on `focus-room-skeleton`.
- **Method:** Installed `playwright` node package driven directly (NOT `mcp__playwright-*`), TWO isolated `browser.newContext()` sessions (A + B), headless Chromium, desktop viewport 1360×900 (compact checks at 900px). No browser process killed. WebSocket frames, console errors, 5xx, and roster/timer DOM state captured per client.
- **Accounts:** Fixture A `studyhall-e2e-fixture@example.com` + Fixture B `studyhall-e2e-fixture-b@example.com`, both members of server `ad62cd12-b78e-4a85-a214-042cf176b16c` ("Fixture Proof Server"). No non-fixture creds used.
- **Runs:** Every lifecycle scenario (S0–S4) executed **2× full iterations** (rooms `GrindA-123025`, `GrindB-136391`); S5 layout verified desktop + compact + a dedicated joined-roster a11y capture.
- **Cleanup:** Both clients left all rooms; final post-run probe shows `empty` state, `skeleton:false`, `joined:false`, `cards:[]` — no lingering/ephemeral rooms left behind.

Evidence: `process/waves/wave-52/stages/T-5-evidence/` (26 screenshots + `run-log.txt` + `results.json`).

---

## Scenario results

| # | Scenario | Iter 1 | Iter 2 | Answer |
|---|----------|--------|--------|--------|
| S0 | Skeleton resolves (the fix) | PASS | PASS | **YES — skeleton resolves** |
| S1 | Create + auto-join | PASS | PASS | **YES — creator auto-lands joined, roster 1** |
| S2 | Two-client join + roster sync (crux) | PASS | PASS | **YES — live roster→2 both clients, no reload** |
| S3 | Room-timer sync | PASS | PASS | **YES — start/pause propagate room-scoped** |
| S4 | Leave + ephemeral removal | PASS | PASS | **YES — roster→1, then room vanishes both** |
| S5 | Layout (T-6) | PASS | — | **YES — matches design, dark, compact clean, a11y present** |

---

### S0 — Skeleton resolves (the bug that was fixed) — PASS ×2
A opens the server view; panel resolves **past** `focus-room-skeleton` to the empty state (no open rooms at start), never stuck.
- DOM: `skeleton=false, empty=true, joined=false, panelPresent=true` (both iterations).
- Frame proof (A): `SEND 42/study-room,["subscribe_server_rooms",{"serverId":"ad62cd12…"}]` → `RECV 42/study-room,["study-room:rooms",{"serverId":"ad62cd12…","rooms":[]}]`. The empty `rooms:[]` response is exactly what resolves the skeleton — the handshake works.
- Evidence: `iter1-S0-A-panel.png`, `iter2-S0-A-panel.png`.

### S1 — Create + auto-join — PASS ×2
A creates a distinctively-named room; A lands **joined** with itself in the roster, count 1.
- DOM: `joined=true, rosterCount=1, rosterNames=["S You"], focusing="1 focusing now", header="GrindA-123025"` (iter1; iter2 identical for `GrindB-136391`).
- Frame proof: A `SEND create_focus_room` → `RECV study-room:presence` (viewers = A only) + `RECV study-room:rooms` (count 1). No second `join_focus_room` emitted (server auto-joins creator — matches the code contract).
- Evidence: `iter1-S1-A-joined.png`, `iter2-S1-A-joined.png`.

### S2 — Two-client join + roster sync (crux) — PASS ×2
B opens the server view, sees A's open room labelled **"1 focusing"**, joins; both rosters go to 2 live.
- B card observed: `aria-label="Join GrindA-123025, 1 focusing"` — "1 focusing" confirmed on B **before** joining.
- After B joins: **B** roster `count=2` names `["S studyhall-e2e-fixture","S You"]`; **A** roster updates live to `count=2` names `["S You","S studyhall-e2e-fixture-b"]`, header `"2 focusing now"` — **without reload**.
- Frame proof: B `SEND join_focus_room` → both clients `RECV study-room:rooms` count 2 + `RECV study-room:presence` with both viewers. A received the count=2 rooms + presence fan-out with no page navigation.
- Evidence: `iter{1,2}-S2-B-sees-room.png`, `-S2-B-joined.png`, `-S2-A-roster2.png`.

### S3 — Room-timer sync — PASS ×2
Both joined. A starts the room timer → B sees it counting down live; A pauses → B sees it paused/frozen. Room-scoped, distinct from the server study timer.
- Running: B display advanced `24:59 → 24:57` (Δ over ~2.2s, `changed=true`), B shows Pause control — countdown live on the observer.
- Paused: B shows `Paused` badge + Resume control; B display frozen `24:57 → 24:57` over ~1.8s.
- Frame proof: A `SEND study_room_timer_start` → both `RECV study-room:timer_update {runState:"running", endsAt:"…22:13:48Z", remainingMs:1500000}`; A `SEND study_room_timer_pause` → both `RECV timer_update {runState:"paused", remainingMs:1497318}`. Timer events are keyed on `roomId` (room-scoped), not the server study-timer channel.
- Evidence: `iter{1,2}-S3-B-running.png`, `-S3-B-paused.png`.

### S4 — Leave + ephemeral removal — PASS ×2
B leaves → A's roster drops to 1; A leaves → room is removed and vanishes from both clients' lists.
- After B leave: A roster `count=1`, `focusing="1 focusing now"` (live).
- After A leave: `RECV study-room:rooms {rooms:[]}` on both — room gone from A and B; A returns to list/empty, B's list no longer contains the card.
- Frame proof: B `SEND leave_focus_room` → A `RECV rooms count 1`; A `SEND leave_focus_room` → both `RECV rooms:[]`. Ephemeral: last-member leave disbands the room.
- Evidence: `iter{1,2}-S4-A-roster1.png`, `-S4-A-removed.png`, `-S4-B-removed.png`.

### S5 — Layout (T-6) — PASS
Matches `design/focus-room-panel.html`.
- **Dark:** body background `rgb(10,10,11)` = `--surface-950`. Deep-zinc surfaces throughout.
- **States present:** open-rooms list, Create Room, joined roster + "N focusing now" + Leave Room, and a distinct **Room Timer** section (separate "ROOM TIMER 25:00" below the server-level "Start a focus session" study timer) — the two timers coexist without crowding.
- **Compact (<1024px, tested at 900px):** joined room collapses to a single-line compact bar (`Layout-51096 | 1 peers` + leave icon) that does **not** crowd the study-timer widget or channel intro above it — matches design §05.
- **No voice/video:** panel innerHTML scan `hasVoiceVideo=false` (no camera/microphone/video/screen-share/webrtc/voice controls) — scope fence respected.
- **Roster a11y (captured while joined):** roster `role="list"`, `aria-live="polite"`, `aria-label="Active roster"`; self listitem `aria-current="true"`, `aria-label="studyhall-e2e-fixture (You)"`; region landmark `role="region" aria-label="Active Focus Room: …"`; Leave button `aria-label="Leave focus room"`; "N focusing now" wrapped in `aria-live="polite"`.
- Evidence: `S5-desktop-1360.png`, `S5-compact-900.png`, `S5-compact-joined-bar.png`, `S5-roster-a11y-joined.png`.

---

## Console / network health
- **5xx: NONE** on either client across the entire run.
- **Console errors:** only transient `Failed to load resource: 429` on both clients during the rapid multi-iteration reload burst (rate limiting). Non-blocking — no functional impact, and a follow-up single-session probe reproduced **zero** 429s (`429_urls: []`). Not a defect in the focus-room feature; an artifact of the test hammering re-auth/reloads back-to-back.
- No `pageerror`, no namespace mismatch — socket connected to `/study-room` and all `subscribe/create/join/leave/timer` verbs round-tripped.

## Bottom line
The study-room subscribe handshake fix (`725f7b6`) is **live and correct**. The previously skeleton-stuck panel now resolves on mount for every load, and the full two-client body-doubling lifecycle — create/auto-join, cross-client join with live roster fan-out, room-scoped timer sync, and ephemeral last-member removal — works end-to-end with no 5xx and no functional console errors. No code changes made; no browser process killed.
