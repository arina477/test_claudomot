# Wave 37 — T-5 E2E (live prod, Playwright bundled-chromium) — PASS

**Target:** web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app (deploy web bundle `index-DCKZ02HB.js`, api fa782b68)
**Fixtures:** A `studyhall-e2e-fixture` (username studyhallfixturea, `21984eb2…`) + B `studyhall-e2e-fixture-b` (studyhallfixtureb, `da74148e…`), co-members of "Fixture Proof Server" (`ad62cd12`), channel `#general` (`93982063…`).
**Tooling:** Playwright driver via bundled chromium (`chromium-1228`, `--no-sandbox`) — Playwright MCP instances are configured for the `chrome` channel which is not installed on this host (`/opt/google/chrome/chrome` absent), the known chrome-channel-absent carry from waves 27/34/35; worked around via bundled chromium exactly as prior waves. Never browser_close (N/A — driver owns lifecycle).

## Result summary: 4/4 flows PASS + NON-GOAL independence confirmed

### Flow 1 — header bell + badge (MainColumn header) — PASS
- Logged in as A via real SuperTokens `/login` (email+password), reached `/app`.
- Bell renders in the channel-view top bar (header cluster: Search · Pinned · **Notifications**). `aria-label="Notifications, N unread"`, numeric emerald badge child.
- With A at unreadCount=1 the bell read `aria-label="Notifications, 1 unread"` badge text `"1"` — count matches server `GET /me/notifications` unreadCount exactly.
- Screenshots: `t5-01-channel-header.png`, `t5-02-bell-badge.png`.

### Flow 2 — panel opens (popover) + §113 states — PASS
- Click bell → popover opens with header "Notifications" + "Mark all as read", sub-line "You have N unread notification(s)".
- **Loading skeleton (§113):** `animate-pulse` skeleton class present shortly after open (not a spinner). Confirmed programmatically at ~150ms post-open.
- **List state:** mention rows render newest-first — actor `studyhallfixtureb`, "mentioned you in", `#general`, relative time ("Just now" / "5m ago" / "6m ago"), message excerpt. Unread rows visually distinct (emerald tint + dot; see T-6).
- **Empty state:** verified as fixture B (0 notifications) — bell icon + headline "You're all caught up" + body "No new notifications. Go ace your classes." + "Browse channels" CTA. Screenshot `t5-08-B-emptystate.png`.

### Flow 3 — generate mention (B) → A reflects + click marks read — PASS
- As B, posted `@studyhallfixturea …` in `#general` via `POST /channels/:id/messages` → 201, mention resolved (`mentions:[{userId 21984eb2…, studyhallfixturea}]`).
- As A: persistent notification appeared fully enriched — `{type:"mention", actorDisplayName:"studyhallfixtureb", channelName:"general", messageExcerpt, serverId, messageId, readAt:null}`, unreadCount incremented. Panel-open reload picks it up.
- Click the unread mention row → fired `GET /channels/93982063…/messages` (navigate into channel to load the message) **AND** `PATCH /me/notifications/<id>/read` → 200; bell dropped `"1 unread"` → `"0 unread"` (dot clears, count decrements); panel closed.
  - Note on URL: navigation kept `/app` because StudyHall holds active-server/channel in SPA client state (no `/servers/:id`/`/channels/:id` URL segment — the whole app routes under `/app`; deep-links to `/servers/:id` bounce to `/`). Navigation is evidenced by the channel `messages` fetch + panel close, not a URL change. Not a defect — consistent with app-wide routing.

### Flow 4 — Mark all read — PASS
- With A at 2 unread, click "Mark all as read" → `POST /me/notifications/read-all` → 200; bell `"2 unread"` → `"0 unread"`, badge text cleared to empty string.
- Server re-check: unreadCount=0, 0 items still unread (persisted). Rows remain listed as read history (correct — mark-all clears unread state, not history).
- Screenshots: `t5-06-panel-2unread.png`, `t5-07-after-markall.png`.

### NON-GOAL — per-channel mention badge (useMentionBadge) independence — CONFIRMED
- Bell (new surface) and channel-list mention badge are computed independently: at one snapshot bell read `Notifications, 7 unread` (badge 7) while the `#general` channel button read `general channel, 46 unread mentions` (badge 46) — distinct counts, distinct subsystems. The mention badge still works and is untouched by the bell.

## Evidence
- Network (per flow): `GET 200 /me/notifications` (list+count on open), `PATCH 200 /me/notifications/<id>/read` (row click), `POST 200 /me/notifications/read-all` (mark-all).
- Console: 1 benign `401` on the pre-auth initial notifications fetch (fires before session hydration, then re-fetches 200); no functional errors.
- Reminder-type rows NOT exercised live — no reminder notifications exist in prod (Resend-key-blocked per wave-30 / checklist parked task `a1299e88`); mention rows fully exercised. Reminder row rendering is component-level only this wave (see findings F37-T5-1, LOW/informational).

**Verdict: T-5 E2E PASS.**
