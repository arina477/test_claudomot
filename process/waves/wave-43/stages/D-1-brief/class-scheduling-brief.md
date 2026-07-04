# D-1 Brief — Class scheduling UI

## §1 What we need
The UI for **class scheduling** on a server: (a) a member-visible **class calendar / agenda view** — a date-grouped list of the server's scheduled study sessions (title, time range, recurrence, organizer); (b) an educator **session authoring modal** to create/edit a session (title, description, start/end, one-off or weekly recurrence); (c) a **session detail** view with role-gated Edit/Delete for organizers. **CRUD only — NO reminders, NO RSVP/attendance, NO timezone controls, NO calendar export/ICS.**

## §2 Where it lives
- **Assignments/Schedule area** of a server (the `/servers/:id` shell, alongside the shipped Assignments panel; page-14 family). A **"Schedule" / calendar surface** shows the class calendar/agenda.
- **Calendar/agenda view:** a date-grouped vertical agenda (upcoming sessions grouped by day: "Today", "Tomorrow", weekday+date headers), each row a session card (title, time range, recurrence chip, organizer avatar+name). An **empty state** ("No sessions scheduled") when the server has none.
- **Authoring modal** (organizer-only, `manage_assignments`): a "New session" CTA opens a modal (mirror `design/`'s AssignmentForm pattern) with title, description, start + end datetime, and a recurrence control (None / Weekly + an "until" date when Weekly).
- **Session detail:** opening a session shows its full detail; an organizer sees Edit + Delete affordances, a non-organizer member sees read-only.
- Route: no new top-level route — an in-shell surface + overlays.

## §3 Audience + states
Audience: educators/facilitators (P3, `manage_assignments`) author; all members view. Desktop-first. States:
- **Calendar — loaded** (date-grouped agenda of session cards).
- **Calendar — empty** ("No sessions scheduled yet"; organizers also see the New-session CTA).
- **Calendar — loading** (skeleton rows).
- **Authoring modal — create** (empty form) / **edit** (prefilled).
- **Authoring modal — submitting** (button spinner) / **error** (calm inline: invalid range, save failed).
- **Session detail — organizer** (with Edit/Delete) / **member** (read-only).
- **Session detail — not-found** (soft-deleted/unknown → calm "Session not found").
- **Recurrence display:** a one-off session shows its single date; a weekly session shows a "Weekly" chip + its occurrences on each relevant day within the viewed window.
- **Empty/N-A:** a non-organizer never sees New-session / Edit / Delete controls (only view).

## §4 DESIGN-SYSTEM.md references (≥6 primitives)
1. **Surfaces `--surface-800`/`--surface-900`** — session cards + the agenda container + modal (match shipped assignment rows + `#27272a` popover); **radius-md** on cards/modal.
2. **`--accent-emerald` / `--success`** — a subtle "upcoming/active" accent or the recurrence "Weekly" chip (calm positive); **`--accent-amber`** — a "starting soon / today" subtle indicator (consistent with due-soon amber).
3. **Button** — `primary` for New session / Save; `ghost` for Edit / Cancel; `destructive` for Delete; focus-visible ring, 44px targets.
4. **Dialog / modal** — the shipped `role="dialog" aria-modal` pattern (AssignmentForm / member-moderation): focus trap, Esc close + restore focus, aria-live for save.
5. **Iconography — Phosphor** (16–20px, `--text-secondary`): `calendar-blank`/`calendar-dots` (schedule), `clock` (time), `arrows-clockwise`/`repeat` (recurring), `dots-three` (row actions), `pencil-simple` (edit), `trash` (delete), `user` (organizer).
6. **Typography:** `--text-primary` (title), `--text-secondary` (time/metadata), `--text-muted` (empty state); **radius-full** for the recurrence + time chips; **`--glow-focus`** focus ring; **Motion** for modal + row transitions matching existing menus/cards.

## §5 Responsive contract
- Desktop (≥1024): the schedule surface + agenda visible; modal centered/anchored, in-viewport; session detail as an overlay or inline panel.
- <1024: the panel collapses per the shipped `/servers/:id` responsive behavior; scheduling is desktop-first this slice (matches shipped panels). No separate mobile design.

## §6 Interaction patterns
- **View calendar:** the agenda renders date-grouped session cards; clicking a card opens its detail.
- **Create (organizer):** New-session CTA → modal → fill title/desc/start/end/recurrence → Save → the new session appears in the agenda. Invalid (end ≤ start; weekly "until" before start) → calm inline error, modal stays.
- **Edit/Delete (organizer):** from a session card row-action (`dots-three`) or the detail view → Edit reopens the modal prefilled; Delete confirms (destructive) then removes from the agenda.
- **Recurrence:** the modal's recurrence control is None / Weekly; choosing Weekly reveals an optional "until" date. A weekly session renders on each relevant day in the agenda with a "Weekly" chip.
- **Non-organizer:** sees the agenda + detail read-only; no New/Edit/Delete controls.
- Modal a11y: reuse the shipped dialog pattern (focus trap, Esc close+restore, aria-live).

## §7 Data shape
- Session (list row + detail): `{ id, serverId, organizerId, title, description: string|null, startsAt, endsAt, recurrence: 'none'|'weekly', recurrenceUntil: string|null, organizer: {displayName, username, avatarUrl} }`.
- List: `GET /servers/:serverId/scheduled-sessions?from&to` → `{ sessions: [...occurrences within window] }`. Create: `POST /servers/:serverId/scheduled-sessions`. Edit: `PATCH /scheduled-sessions/:id`. Delete: `DELETE /scheduled-sessions/:id`. Detail: `GET /scheduled-sessions/:id`. Organizer controls gated on `getMyPermissions(serverId).manage_assignments`.

## §8 Prior art (2–3 mockups to match)
- **`design/assignments-panel.html`** — the assignments panel (rows: title, due, status). The agenda session cards + the schedule surface match THIS panel's row layout, spacing, and chip treatment.
- **`design/assignment-submissions.html`** (wave-42) — the shipped `role=dialog` modal + calm state-chip treatment (emerald/amber) the authoring modal + recurrence chip reuse.
- **`design/notifications-center.html`** / shipped MessageList popover — the `role=menu` row-action popover for Edit/Delete.

## §9 Success criteria (≥5 checkboxes)
- [ ] The class calendar renders a date-grouped agenda of session cards (title, time range, recurrence chip, organizer); a weekly session shows a "Weekly" chip + its occurrences; a one-off shows once; empty → calm "No sessions scheduled".
- [ ] The New-session CTA + the row Edit/Delete affordances render ONLY for a viewer with `manage_assignments`; a non-organizer sees the agenda + detail read-only.
- [ ] The authoring modal reuses the shipped `role=dialog aria-modal` pattern (focus trap, Esc close+restore, aria-live), with title/description/start/end + a None/Weekly recurrence control (+ optional "until" when Weekly); invalid range → calm inline error, no layout break.
- [ ] Delete uses the `--danger`/destructive treatment (with a confirm), Edit uses `ghost`; the session detail shows a calm "Session not found" for a deleted/unknown session.
- [ ] Tokens are DESIGN-SYSTEM only (surface-800/900, radius-md, emerald/amber chips, --glow-focus, Phosphor calendar/clock/repeat icons) — no invented hex; dark-only; WCAG-AA.
- [ ] Fully in-viewport at 1024/1280/1440; the `/servers/:id` panel <1024 collapse behavior is unchanged.

## §10 Non-goals
- NO reminders/notifications, NO RSVP/attendance, NO timezone-picker/negotiation (display server-local), NO calendar export / ICS, NO drag-to-reschedule, NO month-grid calendar widget (a date-grouped agenda list is the slice — a full month grid is deferred).
- NO custom recurrence beyond None/Weekly (no RRULE/iCal, no per-occurrence overrides).
- NO mobile-specific design (desktop-first; panel collapses <1024 per shipped behavior).

## §11 Reviewer briefing
Judge against: (a) does the calendar read as calm/academic (a clean date-grouped agenda, not a heavy month-grid calendar app)? (b) does it faithfully reuse the shipped assignment-row + `role=dialog` modal + DESIGN-SYSTEM tokens (no token fragmentation, no new modal/popover system)? (c) is the recurrence display clear (Weekly chip + occurrences) without implying an RRULE engine? (d) is organizer-gating visually obvious (non-organizers never see New/Edit/Delete)? (e) is the destructive Delete treatment correct + restrained? (f) desktop-first, in-viewport, dark-only, AA.

```yaml
mask_mode_signoff: PASS
signoff_note: "One coherent gap (class scheduling UI). Real new surface = date-grouped class calendar/agenda view. Authoring modal mirrors shipped AssignmentForm role=dialog; session detail mirrors card/detail — briefed together as one surface. Agenda-list scope (no month-grid), CRUD only."
```
