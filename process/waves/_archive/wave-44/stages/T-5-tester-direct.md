# T-5/T-6 Live Verification — wave-44 (StudyHall M8 polish)

**Method:** Direct `playwright-core@1.61.1` Node scripts (Playwright MCP bypassed). Chromium
`/home/claudomat/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`, headless, `--no-sandbox`.
**Browser-launched status:** CONFIRMED (every script logged `BROWSER_LAUNCHED`).
**Target:** https://web-production-bce1a8.up.railway.app — **bundle `index-CX7LuM3C.js` CONFIRMED live** (matches expected).
**Auth:** Signed in as fixture A `studyhall-e2e-fixture@example.com` (organizer). Landed `/app`.
**Surface:** Server rail → "Fixture Proof Server" → "Schedule" (WORKSPACE nav). Sessions already present
(rl-1..rl-6, zt5oneA…). No need to create one. Each session is a `data-testid="session-card"`;
"New session" is `data-testid="new-session-btn"`.
**Key checks run twice** (T6-F1 @1024, Esc focus-restore, modal-stacking) — identical both runs.

---

## Per-check verdicts

### Check 1 — T6-F1 @ 1024 [MAJOR, headline] → **PASS**
At viewport **1024×900**, opening a session detail (rl-1):
- Renders as a proper **overlay dialog**: single `[role="dialog"]`, class `fixed inset-0 z-40 flex items-stretch justify-end` (full-viewport 1024×900, right-anchored slide-in "SESSION DETAILS" panel). Confirmed by both DOM inspection and screenshot `/tmp/t6-1024-detail.png`.
- **Agenda/detail card NOT crushed:** panel width 360px; inner detail card 311px wide; date/time block measures **~125px tall** (title "rl-1", "Aug 1", "10:00 AM — 11:00 AM (1hr)" all fully readable). Nowhere near the ~28px crush the fix targeted.
- Background schedule list + members panel are **dimmed/inert behind the backdrop** (visible in screenshot; members panel pushed off-screen right under the full-width overlay).
- **Esc dismisses:** PASS (dialog removed). **Backdrop click dismisses:** PASS (click at x=200,y=450 over dimmed area removed dialog). Close **X button present**.
- Reproduced identically on second run.

### Check 1b — 1280 + 1440 (should stay inline side-panel, unchanged) → **PASS**
- **1280:** `dialogPresent:false`, no `fixed inset-0` overlay. Detail renders as **inline SESSION DETAILS column** between the schedule list and the members panel; selected card highlighted; members panel still visible on far right. Screenshot `/tmp/detail-1280.png`.
- **1440:** `dialogPresent:false`, same inline behavior. Screenshot `/tmp/detail-1440.png`.
- Confirms the responsive breakpoint switches correctly: overlay only ≤1024, inline ≥1280.

### Check 2 — Esc focus-restore on authoring modal → **PASS**
- Focused + clicked `new-session-btn` → "New session" modal opens (`[role="dialog"]`, heading "New session").
- Press Esc → modal closes (`MODAL_CLOSED_ON_ESC: true`) AND `document.activeElement` = the **`new-session-btn` "New session" trigger** (`{"tag":"BUTTON","testid":"new-session-btn","txt":"New session"}`).
- Reproduced identically on second run.

### Check 3 — Modal-stacking regression @ 1024 → **PASS**
- Open rl-1 detail overlay → 1 dialog (`["SESSION DETAILS"]`).
- Click "Edit Session" → **2 stacked dialogs** (`["SESSION DETAILS","Edit session"]`), edit form on top (has inputs + Save). Screenshot `/tmp/stack-edit-open.png`.
- Press Esc → **form dialog closes only** (`count:1, hasForm:false`), the **detail overlay REMAINS** (`detailStillOpen:true`, `["SESSION DETAILS"]`). Esc did NOT dismiss the overlay behind it.
- Reproduced identically on second run. No stacking regression from the T6-F1 fix.

### Check 4 — Detail panel refreshes after edit → **PASS**
- Opened rl-2 detail (`DETAIL_OPENED_FOR:"rl-2"`), edited title → "rl2CHK99977", Save.
- Detail panel **immediately reflected the new title** (`AFTER_SAVE_PANEL_TITLE:"rl2CHK99977"`, `PANEL_SHOWS_NEW:true`) — not stale.
- Fixture cleaned up: title **reverted to "rl-2"** (`STILL_HAS_TEMP:false`).

### Check 5 — Authoring modal CTA copy → **PASS**
- Primary submit button reads exactly **"Save"** (`type:"submit"`), alongside a "Cancel" button. Reproduced both runs.

### Check 6 — Muted-member right-gutter padding → **BLOCKED (not reachable)**
- Members roster on this server (Fixture Proof Server) shows only **ONLINE (1)** + **OFFLINE (1)** members; **no timed-out/muted member** with an amber indicator exists in the fixture data (`amberCount:0`). Screenshot `/tmp/members-roster.png`.
- The muted-padding fix cannot be exercised without a timed-out member row. Producing one requires a moderation timeout action outside this verification's scope. **Not fixed (per instruction); noted only.**

---

## Console / network
No console errors and no HTTP ≥400 responses captured across any check (`ERRS:[]`, `NET_ERR:[]`) — including the edit/save round-trip.

## Summary
| # | Check | Verdict |
|---|-------|---------|
| 1 | T6-F1 @1024 — overlay dialog, card not crushed (~125px), Esc+backdrop dismiss | **PASS** |
| 1b | 1280 + 1440 inline side-panel unchanged | **PASS** |
| 2 | Esc closes authoring modal + restores focus to "New session" | **PASS** |
| 3 | Modal-stacking: Esc closes form, detail overlay remains | **PASS** |
| 4 | Detail panel refreshes after edit (not stale) | **PASS** |
| 5 | Authoring CTA reads "Save" | **PASS** |
| 6 | Muted-member right-gutter padding | **BLOCKED (no timed-out member in fixture)** |

**5/5 exercisable fixes verified live on deployed prod (bundle `index-CX7LuM3C.js`). Headline T6-F1 1024 fix confirmed landed. Check 6 unreachable in fixture data — not a failure signal, just no muted member to inspect.**

Screenshots: `/tmp/t6-1024-detail.png`, `/tmp/detail-1280.png`, `/tmp/detail-1440.png`, `/tmp/authoring-open.png`, `/tmp/stack-edit-open.png`, `/tmp/refresh-after-save.png`, `/tmp/members-roster.png`.
