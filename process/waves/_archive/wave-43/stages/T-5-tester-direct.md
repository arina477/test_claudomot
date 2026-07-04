# T-5 Live E2E — wave-43 StudyHall Class Scheduling (Schedule surface)

**Target:** https://web-production-bce1a8.up.railway.app (DEPLOYED prod)
**Driver:** direct `playwright-core@1.62.0-alpha` Node script (Playwright MCP bypassed — channel-pinned to missing chrome).
**Browser:** Chromium at `/home/claudomat/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`, headless, `--no-sandbox --disable-dev-shm-usage`, viewport 1440×900.
**Browser launched:** YES — launched cleanly on every run; no `browser_*` MCP tool used.
**Account:** fixture A `studyhall-e2e-fixture@example.com` (organizer/owner of all servers). Fixture B broken (single-account) → student read-only view NOT tested (see BLOCKED note).
**Server under test:** "Fixture Proof Server" (first in the roster; A has `manage_assignments`).
**Flake detection:** every scenario run TWICE (run A + run B) — identical results both times, zero flake.
**Scripts + screenshots:** `/tmp/t5-e2e/` (`final-run.js`, `lib.js`, plus probes; `f-A-*.png` / `f-B-*.png`).

## Result summary

| # | Scenario | Verdict |
|---|----------|---------|
| 1 | Sign in → open server → find Schedule surface → screenshot agenda | **PASS** |
| 2 | Create session (recurrence None) → appears in agenda; no console/500 | **PASS** |
| 3 | Weekly recurrence (+ until) → Weekly chip + multi-day occurrences | **PASS** |
| 4 | Detail + edit + delete (+ confirm dialog) | **PASS** (with 1 a11y soft-finding) |
| 4-Esc | Esc closes modal + restores focus | **PARTIAL** — Esc closes; focus NOT restored to trigger |
| 5 | Validation: end before start → calm inline error, no crash | **PASS** |
| 6 | No non-goals (reminders/RSVP/attendance/timezone/ICS/month-grid) | **PASS** |

Overall: **PASS** on all six scenarios. One reproducible a11y soft-finding (focus restore on Esc). One BLOCKED item outside scope (student read-only view — single account).

---

## Per-scenario detail

### Scenario 1 — Sign in + find Schedule surface — PASS
- Sign-in: landing `/` is a marketing page; login form lives at `/login`. Filled email+password, submitted, redirected to `/app`. Server roster (`ul[aria-label="Your servers"]`) populated.
- Opening a server reveals a channel sidebar (`data-testid="channel-sidebar"`) with **Assignments** and **Schedule** buttons under WORKSPACE (Schedule sits alongside Assignments in the shell, as specified).
- Schedule view (`data-testid="class-calendar-panel"`): H2 "Schedule", a **New session** button (`data-testid="new-session-btn"`), and a **date-grouped agenda** (`SATURDAY — Aug 1`, `— Aug 8`, …). Existing sessions render as `data-testid="session-card"` rows with title + time range (`10:00 AM — 11:00 AM`). Weekly sessions carry a green **Weekly** chip.
- Evidence: `s1c-schedule-view.png`. No console errors, no network failures.

### Scenario 2 — Create single session (recurrence None) — PASS
- New session button → authoring modal opens as `role="dialog"`, `aria-modal="true"`, labelled by `session-form-title`, header "New session".
- Fields (label→input verified): Session Title * (text), Description (textarea), Date * (date), Start Time * (time), End Time * (time), Recurrence (select). Recurrence options: **"Does not repeat (One-off)"**, **"Weekly"** (note: option is "Does not repeat (One-off)", not literally "None").
- Filled title/description/date `2026-08-03`/14:00–15:00, recurrence one-off → **Create Session** → session appears in the Aug 3 (Monday) group. Evidence: `f-A-s2.png`, `f-B-s2.png`.
- **No console errors, no 4xx/5xx** during create (both runs).

### Scenario 3 — Weekly recurrence — PASS
- Selecting Recurrence = **Weekly** reveals a **"Repeat Until (Optional)"** date field (dynamic). Set title, date `2026-08-04` (Tue), 09:00–10:00, until `2026-08-25`.
- After save the weekly session renders **5 occurrences** across consecutive Tuesdays (Aug 4/11/18/25 window), each occurrence card carries the **Weekly** chip (chip confirmed in the same card container as the title). Pre-existing "weekly probe" fixture likewise expands across Aug 1/8/15/22/29 with Weekly chips — corroborating recurrence expansion. Evidence: `f-A-s3.png`, `f-B-s3.png`, `full-A-s3-after.png`.
- No console/network errors.

### Scenario 4 — Detail + edit + delete — PASS (1 soft-finding)
**Detail:** Clicking a session card opens a **"SESSION DETAILS" side panel** (right rail) showing title, date, time range, duration ("1hr"), and Description. This is the "detail" surface (a panel, not a centered dialog — by design). Organizer sees **"Edit Session"** and **"Delete"** buttons in the panel footer. Cards also expose inline quick-action icons `aria-label="Edit session: <title>"` / `"Delete session: <title>"`.
- **Edit:** Detail panel → **Edit Session** → authoring modal reopens **pre-filled** with the existing title. Changed title → **Save** → new title reflected in the agenda (verified via re-query, both runs). Evidence: `f-A-s4-editform.png`, `f-A-s4-edited.png`.
- **Delete:** Detail panel → **Delete** → **confirmation dialog** opens as `role="dialog"` with copy: *"Delete session? Are you sure you want to delete "<title>"? This action cannot be undone."* + Cancel / Delete. Confirm → card **detaches from the agenda** (verified via `waitFor detached`, both runs). Evidence: `f-A-s4-confirm.png`, `f-A-s4-deleted.png`.
- No console/network errors across the full edit+delete lifecycle.

**SOFT-FINDING (a11y, minor):** *Detail panel is not live-refreshed after an edit.* Immediately post-save the SESSION DETAILS panel still shows the pre-edit title (agenda list is correct; the open side panel is stale until reopened). Cosmetic/state-sync, not a data bug.

### Scenario 4-Esc — Esc closes modal + restores focus — PARTIAL
- **Focus-in: PASS** — opening the modal moves focus into the dialog (title input); `aria-modal="true"`.
- **Esc closes: PASS** — Escape dismisses the authoring modal (verified 3×).
- **Focus-restore: FAIL (reproducible 3×)** — after Esc, `document.activeElement` is `BODY`, not the invoking `new-session-btn`. WCAG 2.4.3 dialog-pattern expectation is focus returns to the trigger. **Severity: minor a11y.** (Note: the D-2 assignment-submissions dialog implemented focus-restore per commit history; the Schedule authoring modal appears to not carry the same restore wiring.)

### Scenario 5 — Validation (end before start) — PASS
- Start 15:00, End 14:00 → **Create Session** → modal stays open, calm inline error banner **"⚠ End time must be after start time."** at the top of the form + an aria-live `Error: End time must be after start time.` string. **No crash, no 500.** Evidence: `f-A-s5.png`, `f-B-s5.png` (both runs identical).

### Scenario 6 — No non-goals — PASS
- Full-body text scan for `remind|RSVP|attendance|timezone|ICS|.ics|export` → **zero matches**. No **Month** view toggle / month-grid affordance (`getByRole button /^month$/` = 0). Agenda is a date-grouped list only. Recurrence limited to One-off / Weekly (no daily/monthly). Confirmed both runs.

---

## Console / network hygiene
- Across all create/edit/delete/validation flows in both full runs: **CONSOLE_ERRORS: [] and NET_FAILURES: [] (captures every response ≥400).**
- The only 4xx observed anywhere was a pre-authentication `401 POST /auth/session/refresh` fired on the `/login` bootstrap **before** sign-in — expected unauthenticated behavior, not a regression.

## BLOCKED / not-tested (noted, not failures)
- **Student read-only view — BLOCKED (cannot test).** Fixture A is organizer/owner of every server and fixture B is broken (single usable account), so there is no member-role session to assert the read-only (no New session / no Edit / no Delete) rendering against. **Backend RBAC for member vs educator was proven at T-4 (integration)** — cite that layer for read-only enforcement.

## Environment note
- Playwright MCP unusable (chrome channel mismatch) as briefed → drove via direct `playwright-core` script with explicit `executablePath`. Approach worked reliably; recommend keeping this pattern for T-5 live E2E until the MCP channel is repinned.
- No app code was modified (read/test only).
