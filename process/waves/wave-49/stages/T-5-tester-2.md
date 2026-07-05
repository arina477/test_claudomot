# T-5 E2E — Tester 2: StudyHall Shared Study Timer (single-client)

**Target:** https://web-production-bce1a8.up.railway.app (prod, LIVE)
**Account:** Fixture A (`studyhall-e2e-fixture@example.com`), member of shared study server `ad62cd12`
**Widget:** `data-testid="study-timer-widget"` — Pomodoro, above the message list in the server main column (server-scoped shared state)
**Tool:** Playwright MCP (instance `playwright-1`; instances share one Chrome-for-testing profile so only one holds the browser — resolved by acquiring the lock on playwright-1). `browser_close` NOT called.
**Date:** 2026-07-05

## Scope note — SHARED server + concurrent testers (environmental confound)
Server `ad62cd12` is a genuinely **server-shared** timer, and multiple T-5 testers were driving the SAME fixture account / SAME server concurrently during this run. I repeatedly observed the shared timer being started/reset out from under me by another client (roster flipping to "2 studying", `updatedBy` remaining Fixture A but session churning running→idle→running). This is expected for a shared widget and is NOT a product defect. To keep the persistence assertion sound I guarded every measurement against the server's authoritative `GET /servers/{id}/study-timer` endpoint and only trusted a before/after-reload comparison when the `endsAt` was byte-identical across the window (proving no cross-client mutation occurred during that specific measurement).

---

## Verdict summary

| Scenario | Result | Notes |
|---|---|---|
| 1. State matrix — Idle | PASS (2×) | 25:00, `btn-start`, "Start a focus session" |
| 1. State matrix — Running-Work | PASS (2×) | decrements, emerald FOCUS pill, `btn-pause`+`btn-reset` |
| 1. State matrix — Paused | PASS (2×) | frozen, PAUSED badge, `btn-resume`+`btn-reset-paused` |
| 1. State matrix — Running (resumed) | PASS (2×) | continues from frozen value, PAUSED badge gone |
| 1. State matrix — Idle again (Reset) | PASS (2×) | back to 25:00 + `btn-start` |
| 2. **Compute-on-read reload persistence** | **PASS (2×)** | drift 0s / −1s vs authoritative `endsAt`; guarded same-session |
| 3a. Phase pill aria-live (role=status, polite) | **PASS** | on both FOCUS and PAUSED |
| 3b. Paused badge aria-atomic="true" | **PASS** | both badges aria-atomic=true |
| 3c. Controls are real `<button>` (Enter/Space) | **PASS** | Enter starts, Space pauses; all tabindex 0 |
| 3d. Narrow-viewport slim-bar left-border indicator | **FAIL** | class applied but border-left clobbered by inline style — see BUG-1 |
| 3e. prefers-reduced-motion suppresses blink | **PASS (2×)** | colon animation → `none`, opacity 1 |
| 4. Loading skeleton | PASS | `timer-skeleton` ~150ms on mount, then widget |
| 4. Error state + retry | PASS | graceful `timer-error` + "Retry Connection", recovers |

No 5xx. No uncaught exceptions. Console errors present are all explained (rate-limit 429 from concurrent testers + my own deliberate offline/route-abort) — see Console section.

---

## Scenario 1 — State matrix (run 1 + run 2, both PASS)

All states read directly from the widget DOM. Controls exposed as stable testids: `btn-start`, `btn-pause`, `btn-reset`, `btn-resume`, `btn-reset-paused`.

- **Idle:** `timer-display` = `25:00`; subtitle "Start a focus session"; single button `btn-start` (aria-label "Start session"). Screenshot: `t5-t2-01-idle-run1.png`.
- **Running-Work:** after Start, display decremented 25:00 → 24:51 → 24:42 (live countdown). Phase pill text "FOCUS"; controls `btn-pause` (aria "Pause session") + `btn-reset` (aria "Reset timer"). Emerald accent confirmed: pill dot + glow computed bg `rgb(16,185,129)` = emerald-500. Screenshot: `t5-t2-02-running-work-run1.png`.
- **Paused:** after Pause at 24:24, display froze at 24:23 and stayed 24:23 after a 3s wait (frozen confirmed). "PAUSED" badge present; controls `btn-resume` (aria "Resume session") + `btn-reset-paused` (aria "Reset timer"). Screenshot: `t5-t2-03-paused-run1.png`.
- **Running (resumed):** after Resume, display 24:23 → 24:13 (continued DOWN from the frozen value, NOT reset). PAUSED badge gone, FOCUS pill + `btn-pause`/`btn-reset` restored.
- **Idle again (Reset):** after Reset from 24:23, display → 25:00, single `btn-start`, "Start a focus session".

Run 2 re-drove the full cycle: Idle 25:00 → Running 24:58 (FOCUS, role=status) → Paused 24:45 (frozen after 2.5s, both badges aria-atomic=true) → Resumed 24:45→24:44 (no PAUSED badge) → Idle 25:00. Identical behavior.

---

## Scenario 2 — Compute-on-read persistence (anti-drift) — PASS (2×) — HEADLINE RESULT

Method: start timer (Fixture A), capture authoritative `endsAt` from `GET /servers/ad62cd12/study-timer`, do a **full page navigation reload** (fresh JS mount, clears in-memory countdown), re-select the server, read the resurrected `timer-display`, and compare against the remaining time recomputed from the SAME `endsAt` at the display-read instant. Guarded: comparison only trusted when post-reload `endsAt` === pre-reload `endsAt` (no concurrent mutation).

- **Run 1:** pre-reload `endsAt = 2026-07-05T14:59:02.323Z` (running, `updatedBy` = Fixture A `21984eb2…`). After full reload: resurrected display = **24:35**, `runState=running-work`. `sameSessionAsPreReload = true`. Expected-from-endsAt = **24:35**. **Drift = 0s.** Did NOT reset to 25:00, did NOT go to 0. Screenshot: `t5-t2-04-persistence-reload-run1.png`.
- **Run 2:** pre-reload `endsAt = 2026-07-05T14:59:47.572Z`. After full reload: resurrected display = **24:36** vs expected **24:35**. `sameSessionAsPreReload = true`. **Drift = −1s** (sub-second rounding at the read boundary; within the ±1–2s tolerance).

**Conclusion: compute-on-read reload persistence PASSES.** The client provably derives the countdown from the server's authoritative absolute `endsAt`, not a local timer — confirmed additionally by the server API returning `{phase, runState, endsAt, remainingMs, running, updatedBy}` and the pre-reload display already matching endsAt-derived time exactly (24:48 == 24:48). The Retry-recovery step (Scenario 4) independently re-confirmed this: after a forced error, retry resurrected the widget at ~20:57 (mid-countdown, matching the shared server state), never 25:00.

---

## Scenario 3 — Accessibility (D-3 carries)

### 3a. Phase pill aria-live — PASS
The FOCUS phase pill (`data-testid="phase-pill"`) is a `<div role="status" aria-live="polite" aria-atomic="true">`. Screen readers will announce Work↔Break transitions. Confirmed in both running and paused states.

### 3b. Paused badge aria-atomic — PASS
The "PAUSED" badge is a `<div role="status" aria-live="polite" aria-atomic="true">`. Both the FOCUS pill and PAUSED badge carry `aria-atomic="true"`.

### 3c. Controls are real keyboard-operable `<button>` — PASS
All controls are `<BUTTON type="button" tabindex="0">`. Verified genuine keyboard activation (real key events, not synthetic clicks):
- Focus `btn-start`, press **Enter** → timer started (→ `btn-pause`/`btn-reset`, FOCUS, 24:55).
- Focus `btn-pause`, press **Space** → timer paused (→ `btn-resume`/`btn-reset-paused`, PAUSED, 24:43).
(Note: a first Enter attempt "failed" only because an intervening `browser_snapshot` blurred focus to BODY; when focus was verified immediately before the keypress, Enter activated correctly. This is a test-harness artifact, not a product issue.)

### 3d. Narrow-viewport slim-bar phase indicator — **FAIL (BUG-1)**
See BUG-1 below. The `.timer-phase-work` / `.timer-phase-break` class IS applied and the intended CSS left-border IS authored, but it never renders because an inline `border` shorthand overrides it. What DOES render is an always-on 1px emerald **top** accent bar (present at both 1440px and 500px), plus the full phase-pill which never hides at narrow widths. The specified "slim-bar phase indicator (colored **left border**, emerald/amber)" is effectively invisible.

### 3e. prefers-reduced-motion — PASS (2×)
With `prefers-reduced-motion: reduce` emulated:
- Colon `.sh-timer-colon`: computed `animation-name = none`, `animation-duration = 0s`, `opacity = 1` — blink fully suppressed.
- Toggled both directions twice: no-preference → `sh-colon-blink` active; reduce → `none`. Consistent. Matches `globals.css:302-306`.

---

## Scenario 4 — Error / loading — PASS

- **Loading skeleton:** on fresh mount, `data-testid="timer-skeleton"` rendered at t≈340ms and swapped to the live `study-timer-widget` at t≈498ms (~150ms visible). Clean transition, no flash of error. `sawSkeleton=true`, `sawError=false`.
- **Error state + retry (induced):** aborting only the `GET /servers/*/study-timer` request (rest online) put the widget into a graceful error state — `data-testid="timer-error"`, message "**Timer sync disconnected** — Lost connection to the study server. Local session paused.", and a real `<button>` "**Retry Connection**". No crash / no blank widget. Screenshot: `t5-t2-06-error-state.png`.
- **Retry recovery:** removing the block + clicking "Retry Connection" re-fetched and restored the live widget (resurrected at 20:57 from server state). Full error → retry → recovery loop works.
- **Full offline reload:** app shell loads from cache (offline-first PWA) showing "Reconnecting…"/"Failed to load" in the server rail; the server list can't load offline so the widget can't be reached that way — noted, not a timer defect.

---

## BUG-1 (MAJOR, a11y/D-3 carry) — narrow-viewport slim-bar left-border never renders

**Severity:** Major (documented D-3 accessibility carry not met; loss of the non-color-only… actually color-only but responsive phase affordance at <1024px).

**Symptom:** At <1024px viewport with a running Work session, the widget root has class `timer-phase-work` but its computed `border-left` is `1px solid rgba(255,255,255,0.06)` (the neutral chrome border) instead of the intended `2px solid #10b981` emerald slim bar.

**Evidence (deterministic, computed style @ 800px, running Work):**
```
classList: "w-full relative overflow-hidden rounded-lg timer-phase-work"
hasPhaseWorkClass: true
inline style: "…; border: 1px solid rgba(255,255,255,0.06); …"
computed border-left-width: 1px
computed border-left-color: rgba(255, 255, 255, 0.06)   ← NOT rgb(16,185,129)
```

**Root cause (for triage — NOT fixed):**
- `apps/web/src/shell/StudyTimerWidget.tsx:476` sets inline `style={{ … border: '1px solid rgba(255,255,255,0.06)' … }}` on the widget root (the same element that receives the `timer-phase-work` class at line 473).
- `apps/web/src/styles/globals.css:310-315` defines `.timer-phase-work { border-left: 2px solid #10b981 }` (and `.timer-phase-break { … #f59e0b }`), removed at `@media (min-width:1024px)`.
- The inline `border` shorthand expands to `border-left-*` inline properties, and **inline styles outrank stylesheet class rules** by specificity, so the class's `border-left` never wins. The slim-bar phase indicator is authored correctly but suppressed at every viewport.
- Suggested direction (for the fix owner, not applied): move the neutral border to CSS (or use `border` on a non-phase element / an inset wrapper), or have the phase classes set the left border via a higher-specificity/inline path so the phase color can win at <1024px. The `break`/amber branch is presumed to have the same defect (could not be verified live — Work→Break auto-advance is out of scope per instructions).

**Reproduction:** login Fixture A → open server ad62cd12 → Start timer → resize <1024px → inspect widget root computed `border-left` (or visually: no emerald left bar appears).

---

## Console / network

- **No 5xx.** All functional study-timer calls returned 200: `GET /servers/ad62cd12/study-timer`, `POST …/start`, `…/pause`, `…/resume` — all `[200]`.
- **429 (rate limit)** on `GET /me/mentions` and `GET /servers/ad62cd12/me/permissions` — caused by many concurrent testers sharing the one fixture account; NOT timer-related, NOT a 5xx, and not on any `/study-timer` endpoint. Flagged as environmental (shared-fixture contention), worth noting if it recurs under single-tenant load.
- **ERR_INTERNET_DISCONNECTED** and **ERR_FAILED /study-timer** — my own deliberate offline emulation + route-abort during Scenario 4; not product errors.
- No uncaught JS exceptions observed at any point.

## Artifacts (screenshots, absolute paths under the MCP output dir `/home/claudomat/project/.playwright-mcp/` … actually saved to CWD)
- `t5-t2-01-idle-run1.png` — Idle 25:00
- `t5-t2-02-running-work-run1.png` — Running-Work, emerald FOCUS pill
- `t5-t2-03-paused-run1.png` — Paused, PAUSED badge
- `t5-t2-04-persistence-reload-run1.png` — resurrected running timer after full reload (drift 0s)
- `t5-t2-05-narrow-800px.png` — narrow viewport (phase-pill visible, slim-bar absent — BUG-1)
- `t5-t2-06-error-state.png` — Timer sync disconnected + Retry Connection

## Final state
Environment left clean: online restored, route interception removed, reduced-motion reset to no-preference, widget healthy. `browser_close` NOT called (per instructions).
