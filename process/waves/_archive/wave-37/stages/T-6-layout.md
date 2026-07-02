# Wave 37 — T-6 Layout (live prod, desktop) — PASS

**Target:** web https://web-production-bce1a8.up.railway.app (bundle `index-DCKZ02HB.js`), fixture A in `#general` / Fixture Proof Server.
**Viewports:** 1440×900, 1280×800, 1024×768 (desktop popover). Dark theme.

## Result: PASS — no overflow/overlap/broken layout, tokens honored

### Header bell + badge
- Bell in the MainColumn header top bar (Search · Pinned · Notifications cluster). Renders at all three widths.
- Badge is emerald pill: computed `background rgb(16,185,129)` (emerald-500), `color rgb(10,10,11)` (near-black text on emerald — legible), `border-radius 9999px`.
- **9+ cap:** with A at unreadCount=10, `aria-label="Notifications, 10 unread"` but badge **text is capped to "9+"** (not "10"). Cap works.
- Screenshots: `t6-01-bell-badge.png`.

### Panel popover (desktop)
- Opens as a right-anchored popover on the dark surface `rgb(10,10,11)`; header "Notifications" + "Mark all as read"; scrollable row list; "Browse channels" CTA in the empty state.
- Emerald accent used for unread affordances (row tint, dot) and the mention pills in message content.
- Screenshots: `t6-02-panel-1440.png`, `t6-03-panel-1280.png`, `t6-04-panel-1024.png`, `t6-05-panel-mix.png` (read/unread mix), `t5-08-B-emptystate.png` (empty state).

### Unread vs read — visually distinct (PASS, quantified)
- Against a deliberate 7-read / 7-unread first-page mix:
  - **Unread rows:** `background rgba(16,185,129,0.06)` (emerald tint) + an emerald rounded **unread dot** (bg contains `16,185,129`, `border-radius:9999px`). 7/7 unread rows carried the tint+dot.
  - **Read rows:** transparent background (`rgba(0,0,0,0)`), no dot. 7/7 read rows plain.
  - Two distinct row backgrounds present exactly: `["rgba(0,0,0,0)","rgba(16,185,129,0.06)"]`. Clear, correct distinction.

### Mention vs reminder rows — mention PASS, reminder deferred
- Mention rows render distinctly (actor + "mentioned you in" + `#channel` + excerpt + relative time). Verified live across all runs.
- **Reminder rows not live-diffable** — no reminder-type notifications exist in prod (Resend-key-blocked; see F37-T5-1). Reminder row visual compliance is component-level only this wave. LOW/informational, not a layout regression.

### Overflow / overlap
- Horizontal overflow check (`scrollWidth > clientWidth`): **false** at 1440, 1280, and 1024. No overlap of panel with header/members rail observed in screenshots.

### Regressions
- None observed. The bell insertion into the header cluster did not displace Search/Pinned or the members rail. Message-content mention pills unchanged.

**Verdict: T-6 Layout PASS.**
