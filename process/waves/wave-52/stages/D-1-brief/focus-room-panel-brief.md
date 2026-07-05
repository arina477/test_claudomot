# Design Brief — Focus-room panel

## 1. What we need
A **focus-room panel** in the StudyHall server view: a list of open focus rooms (name + live "N focusing" count) with a create-room affordance, and — once a member JOINS a room — the live roster of everyone focusing in that room plus a leave control. The visible body-doubling "we are studying together right now" surface. The room's shared Pomodoro timer reuses the shipped study-timer widget (NOT designed here).

## 2. Where it lives
The server view (`apps/web/src/shell/`), alongside/near the existing StudyTimerWidget (which is the server-level ambient timer). The focus-room panel is a NEW, distinct surface — the explicit-join rooms — separate from the study-timer's ambient "who's viewing" roster. Not a new route (in-view panel). Canonical mockup: `design/focus-room-panel.html`.

## 3. Audience + states
Any server member. States to design:
- **Empty (no open rooms):** an empty state inviting the member to create the first focus room (create affordance prominent).
- **Open-rooms list (not joined):** list of open rooms, each showing name + a live "N focusing" count (+ small avatars/roster preview optional), each joinable in one click; the create-room affordance present.
- **Creating:** naming a new room (inline input + confirm) — pending state.
- **Joined:** the joined room's live roster (who's focusing together, updating as people join/leave) + a clear LEAVE control; the room's shared timer (the study-timer widget, room-scoped) sits with it.
- **Loading:** brief skeleton on first mount.
- **Error / room-vanished:** graceful state if the joined room is removed live (returns to the list) or a socket error.

## 4. DESIGN-SYSTEM.md references (REQUIRED)
1. `--surface-900`/`--surface-800` panel/card layering; `--surface-700` borders/hover; `--border-hairline` default.
2. `--accent-emerald` (#10b981) primary create/join actions + "focusing now" affordance (matches the study-timer focus accent); `--accent-amber` reserved for any break/secondary state.
3. `--danger` (#ef4444) leave/destructive (border/text) if used.
4. Typography: `text-sm` room names + roster, `text-xs` counts/labels/metadata, weight 500 room names / 600 section titles + primary buttons.
5. `--radius-md` (6px) buttons/inputs, `--radius-lg` (8-10px) room cards/panel, `--radius-full` avatars + presence indicators.
6. Reuse the `.btn`/`.btn-primary`/`.btn-ghost` chrome + input styling from `design/study-timer.html`; presence avatars/dots per the existing member-panel + study-timer roster pattern.

## 5. Responsive contract
- **≥1024px:** the panel comfortably shows the open-rooms list / joined roster; sits with the study-timer widget in the server view without crowding the channel/message content.
- **<1024px (slim):** the panel collapses to a compact form (e.g. a compact rooms list / a collapsible section) that does NOT crowd the hero content or the study-timer slim-bar. Prefer a compact/collapsed entry at slim width.
- Reduced-motion: any join/leave/list transitions respect `prefers-reduced-motion` (instant).

## 6. Interaction patterns
- Create room: an affordance → inline name input → confirm → the room appears in the list (optimistic) + you're joined.
- Join: one click on a room → joined state (roster + leave + room timer).
- Leave: a clear control → back to the open-rooms list.
- Live updates: rooms appear/vanish, counts + rosters change in real time (no manual refresh).
- Empty vs populated list; joined vs not-joined are visually distinct.

## 7. Data shape
Open room: `{id, name, count}`. Roster: `{roomId, viewers[] (userId/displayName/avatar), count}`. Ephemeral (in-memory server-side; the UI just renders the live socket state). NO persisted history.

## 8. Prior art (match this visual language)
1. `design/study-timer.html` — the study-group surface this sits beside; MATCH its card/`.btn`/roster/emerald-focus chrome + the presence-roster visual (avatars + count).
2. `design/DESIGN-SYSTEM.md` — surfaces, accents, radius, presence dots/avatars.
3. The existing member-panel / server-channel-view roster (avatars + presence) — match roster styling.

## 9. Success criteria (APPROVE checklist)
- [ ] All states shown + distinct: empty, open-rooms-list (not joined), creating, joined (roster + leave), loading, error/room-vanished.
- [ ] Room cards + roster reuse study-timer.html/DESIGN-SYSTEM chrome (surfaces, `.btn`, emerald focus accent, avatars) — NO invented hex, NO new component class beyond a room-card.
- [ ] The "N focusing" count + live roster read as a body-doubling "who's studying together" surface, visually DISTINCT from the study-timer widget's ambient roster (this is explicit-join rooms).
- [ ] Create + join + leave affordances are clear, keyboard-accessible (real buttons/inputs), with aria-labels; live roster updates announced (aria-live) reasonably.
- [ ] The panel does NOT crowd/overlap the study-timer widget, channel, or message content at any breakpoint; <1024 shows a compact form.
- [ ] Reduced-motion honored; dark-theme only.

## 10. Non-goals
- NO voice/video controls (LiveKit — slice-2, deferred).
- NO persisted room attendance/history/stats, NO scheduled/reservable rooms, NO multi-room admin/moderation, NO whiteboard.
- The room's shared TIMER is the shipped study-timer widget (room-scoped) — do NOT redesign the timer here.
- NO redesign of the existing study-timer widget or member panel.

## 11. Reviewer briefing (D-3)
Judge whether the focus-room panel reads as a natural, restrained study-group surface beside the shipped study-timer (not a bolted-on separate app), whether all states are legible + token-compliant, whether the explicit-join rooms + live roster clearly convey body-doubling (distinct from the ambient timer roster), whether it stays out of the way of the timer/channel/message content at every breakpoint, and whether create/join/leave are accessible. Reject any voice/video UI, persisted-history UI, or new invented tokens (scope-fenced).

```yaml
mask_mode_signoff: PASS
signoff_note: "1 gap (focus-room panel); extends the study-group surface beside design/study-timer.html; reuses card/.btn/roster/emerald chrome; room-timer reuses the shipped study-timer widget (no new design); scope-fenced (no voice/persistence/scheduling/whiteboard)."
```
