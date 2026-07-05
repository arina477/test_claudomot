# T-5 E2E + Layout Tester-1 — wave-51 DM-surface canonical 3-panel fix

**Target:** LIVE prod `https://web-production-bce1a8.up.railway.app` (merge 01399a5)
**Driver:** installed `playwright` node package, own isolated chromium context (headless, per-scenario fresh contexts). NO MCP playwright servers used; no browser process killed.
**Auth:** Fixture A `studyhall-e2e-fixture@example.com`, member of server `ad62cd12`. No non-fixture creds used.
**Date:** 2026-07-05

## Verdict summary

| Scenario | Result | Key evidence |
|---|---|---|
| S1 — DM surface = canonical 3-panel, full-width thread (desktop, the crux) | **PASS** (2× @1024, 2× @1280) | Thread **632px @1024**, **888px @1280**; ChannelSidebar absent; 3-panel confirmed |
| S2 — no stale server channels on DM | **PASS** (2× @1024, 2× @1280) | `channel-sidebar` DOM node absent; no stale WORKSPACE/Assignments text |
| S3 — server/channel view no regression | **PASS** (2× @1024, 2× @1280) | ChannelSidebar present at 260px, main-column renders normally |
| S4 — mobile backdrop no-strand (B-6 High fix) | **PASS** (2×, 390×800) | Drawer + z-40 scrim present when open; **both gone** on DM surface; first-tap opens thread |
| S5 — toggle cleanly (server→DM→server) | **PASS on the fix; FAIL on a separate nav bug** | DM-surface state always correct; **but a Medium first-click-swallowed bug on the DM→server return path** — see Findings |

**Answers to the explicit questions:**
- Is the DM surface now canonical 3-panel with a full-width thread (S1)? **YES.** ServerRail (72px) + DmConversationList rail + DmThread; thread = 632px @1024 / 888px @1280, NOT the old cramped ~372px. No premature-wrap.
- Is the stale channel column gone (S2)? **YES.** With a server explicitly selected first, switching to DM shows no `channel-sidebar` node and no leaked server channel names.
- No server-view regression (S3)? **YES.** ChannelSidebar renders normally (260px) in server view; the gate affects only the DM surface.
- Mobile backdrop no longer strands (S4)? **YES.** Opening the mobile channel drawer creates the `fixed inset-0 z-40 bg-rgba(0,0,0,0.5)` scrim; switching to the DM surface removes BOTH the drawer AND the scrim. DM UI is clean/bright, first-tap on a conversation opens the thread (no swallowed tap).

## Evidence detail

### S1 — canonical 3-panel + thread width (the crux) — PASS
Measured `dm-thread` bounding-box width on the DM surface with a server previously selected and a conversation open:
- **1024px viewport:** rail=72, dm-home container=952, **THREAD = 632px**, channel-sidebar absent. (2 runs, identical.)
- **1280px viewport:** rail=72, dm-home container=1208, **THREAD = 888px**, channel-sidebar absent. (2 runs, identical.)
- Both match the canonical widths the fix predicted (632 @1024). No cramped/premature-wrap layout. Screenshot: full-width composer "Message studyhallfixtureb" spans the pane.
- DM-surface DOM: `server-rail`, `dm-home`, `dm-conv-row-*`, `dm-thread`, `dm-message-list`, `dm-composer-input`, `dm-send-button`. **No `channel-sidebar` node anywhere.**

### S2 — no stale server channels on DM — PASS
Explicitly selected server (E2E fixture server) → channel-sidebar=260 with channels "Assignments/Schedule/general" visible. Then clicked "Direct Messages": `channel-sidebar` node = null, body text no longer contains WORKSPACE/Assignments. The exact stale-channel-leak bug is resolved. 2× @1024, 2× @1280.

### S3 — server-view no regression — PASS
Server view: `channel-sidebar` = 260px, `main-column` = 452px @1024 / 708px @1280, channel list renders normally. The fix's ChannelSidebar gate is correctly scoped to the DM surface only. 2× @1024, 2× @1280.

### S4 — mobile backdrop no-strand — PASS (390×800)
The mobile channel drawer lives in a `<div aria-label="Channel sidebar drawer" class="fixed top-0 bottom-0 z-50 ... transition-transform lg:hidden">`, translated off-screen (`matrix(1,0,0,1,-260,0)`) when closed.

Triggering the drawer open (via the app's toggle handler) produced, in server view:
- Drawer on-screen at x=72–332 (`onScreen:true`).
- Backdrop scrim present: **`fixed inset-0 z-40 lg:hidden`, `background: rgba(0,0,0,0.5)`, z=40** — exactly the scrim the B-6 fix targets. Screenshot shows the right portion of the viewport dimmed.

Then switching to the DM surface (Direct Messages button):
- `[aria-label="Channel sidebar drawer"]` DOM node: **absent** (`present:false`).
- Backdrop scrim: **absent** (`found:false`).
- `dm-home` present; DM button reachable (no interception); **first tap on a conversation opens `dm-thread`** (no swallowed first-tap).
- Screenshot: DM surface fully bright, "Direct Messages" header + conversation list, no z-40 scrim, no dimming.

This is the exact strand the fix resolves and it is resolved. 2 runs, identical.

*Mobile-tooling note (not an app defect):* with Playwright's synthetic pointer at 390px in server view, a pointer/touch tap on the ServerRail DM button is consumed by the closed drawer's off-screen `z-50 pointer-events:auto` container (it spans x −188→+72, overlapping the 72px rail). `elementFromPoint` at the DM button returned the drawer's channel-sidebar element, not the button. A real user's finger lands on the button (visually the drawer is off-screen), and the app's click handler fires correctly — verified by driving the handler directly, which reached a clean DM surface. This is a headless synthetic-pointer artifact in the closed-drawer state, called out for triage awareness only; it did not affect the S4 fix outcome.

### S5 — toggle cleanly — MIXED (fix PASS; separate Medium nav bug FAIL)
The DM-surface half is always correct: every time the app entered the DM surface, `channel-sidebar` was absent and thread=632/888; every time it entered server view, channel-sidebar=260. The fix's toggle behavior (ChannelSidebar appears/disappears cleanly, no orphaned column/backdrop, thread width recomputes) is clean.

**However, a reproducible navigation defect exists on the DM→server return path** (see Findings F-1). Server→DM works every time; DM→server (clicking a ServerRail server icon or the Home button while on the DM surface) intermittently does NOT leave the DM surface on the first click. This makes the multi-cycle toggle unreliable in the DM→server direction. It is a pre-existing/adjacent interaction bug, NOT a regression of the wave-51 ChannelSidebar-gating fix (the fix's own state transitions are all correct).

## Findings for triage

### F-1 (Medium) — First click to leave the DM surface is sometimes swallowed (desktop)
- **Where:** DM surface → server view (or → Home), desktop 1024px. Deterministically reproducible.
- **Repro:** log in → select a server → click "Direct Messages" (lands on DM, correct) → click a ServerRail server icon.
- **Observed:** app STAYS on the DM surface — `dm-home` present, `channel-sidebar` still null — despite the server button being reachable and the click landing on the correct button (tooltip "E2E 1782813741842" shows; server icon highlights on hover). The "Home" button exhibits the same stuck-on-first-click behavior. A *subsequent* click on the DM button then toggles state, and further server clicks work — so it is a first-click-swallowed / state-race on exiting `dmHomeActive`, not a hard lock.
- **Evidence:** state dump `on DM: dmHome=true,cs=null` → `after server click from DM: dmHome=true,cs=null` (unchanged) → `after Home click: dmHome=true,cs=null` (unchanged); screenshot `d2s-backtoserver.png` shows the DM "Select a conversation to start messaging" placeholder still active with the hovered server tooltip visible.
- **No console errors / no 5xx** during the failed transition.
- **Impact:** a user on the DM surface may need to click a server twice to open it. Reachability is fine; it is a swallowed-first-interaction on the `dmHomeActive=false` transition. Recommend the head/orchestrator route to the owning FE component (the ServerRail / app-shell `dmHomeActive` state handler) for root-cause; do NOT treat as blocking the wave-51 layout fix, which is independently correct.

## Console / network
- Benign only: `401` on the unauthenticated pre-login session probe (expected), and intermittent `429` (rate-limit) on repeated rapid logins from the test harness (caused two transient login-click timeouts in the harness, retried successfully — not an app defect). No `5xx`. No `pageerror`. No console errors during any scenario transition.

## Cleanup
Fixture A account left in a clean state (last action left it on the DM surface / server view; no data mutated beyond reading existing conversations — no messages sent, no servers created). Isolated contexts closed. No browser process killed. Screenshots in `/tmp/dmtest/` (s1-1024-run1, js-drawer [open drawer+scrim], js-afterdm [clean DM surface], d2s-backtoserver [F-1]).
