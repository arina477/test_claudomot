# D-1 Brief — Educator light-moderation UI (member timeout)

## §1 What we need
The UI affordances for an educator/moderator (a member whose role grants `moderate_members`) to perform light moderation on another member: **time out (temporarily mute) a member for a bounded duration**, and see **which members are currently timed out**. The delete-any-message action and the role-permission toggle are trivial extensions of shipped patterns (below) and are NOT the focus of this brief.

## §2 Where it lives
- **Member roster** (right-hand member panel in `design/server-channel-view.html`, page-9): each member row gains a moderation affordance — a small **"..." moderation control** (kebab / context trigger) visible ONLY to a viewer holding `moderate_members`, opening a small menu with **"Time out member"** (and, for a currently-timed-out member, **"Remove timeout"**). A **timed-out member indicator** (a muted glyph + muted-tint on the row/name) shows on any member currently under an active timeout.
- **Timeout duration selector**: on choosing "Time out", a small popover/menu offers a bounded set of durations (e.g. **5 min · 1 hour · 1 day**) — no free-text; one tap sets it.
- Route: no new route — an in-panel overlay on the existing `server-channel-view` member panel. (Reuses the shipped role=menu popover pattern from `MessageList`/`UserMenu`.)

## §3 Audience + states
Audience: educators/moderators (P3 persona) on desktop. States to render:
- **Default** (no moderation control for non-moderators; control present for moderators).
- **Menu open** (moderation menu: Time out / Remove timeout).
- **Duration popover** (5m/1h/1day).
- **Member timed-out** (muted indicator on the row: Phosphor `speaker-x`/`prohibit` glyph + muted-tint name, optional "muted 1h" hint).
- **Loading** (action in flight — brief spinner on the menu item).
- **Error** (action failed / cannot-moderate-above-you → inline toast/message, menu stays; the row unchanged).
- **Empty/N-A**: a viewer without `moderate_members` sees NONE of the controls (only the muted indicator, which is public state).

## §4 DESIGN-SYSTEM.md references (≥6 primitives)
1. **`--danger` `#ef4444`** (§1) — the destructive/moderation action (timeout is a restrictive action; use danger fill/border for the "Time out" item, per "ban/delete" mapping). `--danger-text` `#f87171` for danger text on a danger tint.
2. **`--accent-amber` `#f59e0b`** (§1) — the muted/warning state indicator (timed-out = a warning-tone state, consistent with due-soon/reconnecting amber).
3. **Button** primitive (§8) — `ghost` for the kebab trigger, `destructive` for the timeout confirm item; sizes sm(28px); focus-visible ring, 44px touch target.
4. **Select / menu** (§8) + the shipped `role="menu"` popover pattern (MessageList `AddReactionPopover`) — the moderation menu + duration popover.
5. **Iconography — Phosphor Icons** (§7), 16–20px, stroke `--text-secondary`: kebab (`dots-three`), timeout (`speaker-x` / `prohibit`), remove-timeout (`speaker-high`).
6. **Elevation `--glow-focus`** (§5/§7) focus ring + **radius-md** (§4) on the menu/popover; **surface-700/900** fills for the menu surface (match the shipped popover `#27272a`).
7. **Motion** (§6) — the popover open/close transition matching existing menus.

## §5 Responsive contract
- Desktop (≥1024): member panel visible; moderation control on hover/focus of a member row + always for keyboard. Menu + duration popover anchored to the row, in-viewport (flip up if near bottom).
- <1024: the member panel collapses (per the shipped server-channel-view §9 lg-breakpoint) — moderation is desktop-first this slice; no separate mobile design needed (matches the shipped member-panel responsive behaviour).

## §6 Interaction patterns
- Moderator hovers/focuses a member row → a kebab (`dots-three`) appears; click/Enter opens a `role="menu"` popover (Time out / Remove timeout).
- "Time out" → duration popover (5m/1h/1day) → select → action fires → member row shows the muted indicator; menu closes. Esc closes; outside-click closes; focus returns to the trigger (reuse the shipped popover a11y).
- "Remove timeout" (on a timed-out member) → clears the mute → indicator disappears.
- Cannot moderate a member ranked ≥ you (owner/manage_server/manage_roles) → the control is absent OR the action returns an inline error; never a raw failure.
- A non-moderator sees no controls; the muted indicator (public state) still renders.

## §7 Data shape
- Per member (already in the roster DTO): `{userId, displayName, avatarUrl, username}` + NEW `mutedUntil: string|null` (ISO; server-derived, present when timed out).
- Timeout action: `POST member timeout {userId, durationMinutes}` → sets `muted_until`; remove → clears it. Viewer's own `moderate_members` capability gates the controls (from the server membership/permissions context).

## §8 Prior art (2–3 mockups to match)
- **`design/server-channel-view.html`** — the member panel / roster (rows: avatar + name + presence dot). The moderation control + muted indicator extend THESE rows. Match its row layout, spacing, presence-dot treatment.
- **`design/server-roles.html`** — the roles/permissions surface (the `moderate_members` toggle is a trivial addition here — reuse its toggle-row pattern; NOT designed in this brief).
- **`design/notifications-center.html`** / the shipped `MessageList` reaction popover — the `role="menu"` popover pattern (surface `#27272a`, radius, shadow) the moderation menu + duration popover reuse.

## §9 Success criteria (≥5 checkboxes)
- [ ] Moderation kebab appears on member rows ONLY for a viewer with `moderate_members`; absent for others.
- [ ] The moderation menu (Time out / Remove timeout) + duration popover (5m/1h/1day) reuse the shipped `role=menu` popover pattern + tokens (no new popover system), keyboard-accessible (Enter/Space open, Esc close+refocus, outside-click close).
- [ ] A timed-out member shows a clear, calm muted indicator (amber-toned, Phosphor glyph + muted-tint name) on their roster row — visible to all viewers.
- [ ] The "Time out" action uses the `--danger` treatment (restrictive action) without being loud/alarming (academic, low-noise aesthetic); durations are a bounded tap-set, no free text.
- [ ] Cannot-moderate-above-you + error states surface calmly inline (no raw failure, no layout break); dark-only, dark-theme tokens, WCAG-AA contrast (danger text on tint uses `#f87171`).
- [ ] Fully in-viewport at 1024/1280/1440; the member-panel <1024 collapse behaviour is unchanged.

## §10 Non-goals
- NO bans, NO kick, NO audit log, NO full moderation queue/dashboard (later M8/H2 scope — "light" moderation only).
- NO mobile-specific design (desktop-first; the panel collapses <1024 per shipped behaviour).
- The delete-any-message affordance (reuses MessageList hover-actions) + the `moderate_members` role toggle (reuses server-roles toggle pattern) are trivial extensions — NOT designed here.
- NO free-text timeout duration; NO custom/scheduled mutes.

## §11 Reviewer briefing
Judge against: (a) does the moderation control read as calm/academic (not a loud Discord-style mod-hammer)? (b) does it faithfully reuse the shipped member-row + `role=menu` popover patterns + DESIGN-SYSTEM tokens (no token fragmentation, no new popover)? (c) is the muted-state indicator clear + accessible (amber-toned, glyph + tint, AA contrast)? (d) is the destructive/danger treatment correct + restrained? (e) desktop-first, in-viewport, dark-only.

```yaml
mask_mode_signoff: PASS
signoff_note: "1 real gap (member-moderation/timeout UI). role-toggle + delete-any = trivial pattern-extensions, not designed here."
```
