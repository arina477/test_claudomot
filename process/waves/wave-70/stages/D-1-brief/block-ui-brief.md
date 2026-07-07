# D-1 Brief — Block UI (wave-70, M14)

## §1 What we need
The visual surfaces for user-to-user **Block**: (a) a Block / Unblock affordance a student uses to block another user (from a member row / profile / DM header), with a confirm, and (b) a "Blocked users" list in user settings where they review + unblock the people they've blocked.

## §2 Where it lives
- Block affordance: on a member row (MemberListPanel), a user profile/popover, and the DM conversation header — a control (kebab item or button) that opens a small confirm.
- Blocked-users list: a section in the USER settings home (/settings/privacy — user-level, NOT a server-scoped dialog), reachable from settings nav.

## §3 Audience + states
- Audience: any signed-in student (blocking is a personal safety action; not moderator-gated).
- Block confirm dialog states: default / confirming (submitting) / success (toast + affordance flips to "Unblock") / error (non-destructive).
- Blocked-users list states: loading (skeleton rows) / list (each row: blocked user avatar+name + Unblock action) / empty ("You haven't blocked anyone") / actioning (unblock in-flight) / error.
- Blocked affordance states: not-blocked (Block) / blocked (Unblock) — the control reflects current state.

## §4 DESIGN-SYSTEM references (≥6 primitives)
- Colors: surface-950/900/800 layering (dialog/list bg), --danger-btn #b91c1c (destructive Block confirm, the wave-69 AA token), --text-secondary (informational), --accent-emerald (n/a for destructive — Block confirm is danger, Unblock is a neutral/ghost).
- Typography: Geist; §2 type scale (row name medium, meta xs).
- Spacing: 4px base; list-row rhythm per §8 list pattern.
- Radius: radius-md (buttons), radius-lg (dialog), radius-full (avatar).
- Shadows: shadow-pop (dialog), shadow-sm (row hover).
- Icons: Phosphor — prohibit/no-entry (block), user, x, spinner. Icon-only Block on a member row uses a tooltip/aria-label.
- Components: Modal/Dialog (§8 confirm), Button (destructive #b91c1c + ghost), List/skeleton (§8 lists), Settings surface (wave-68 Overview shell idiom), Badge/Avatar.

## §5 Responsive contract
- Block confirm dialog: centered modal ≥640px; full-width bottom sheet <640px (per §8 + the wave-69 report-dialog fix — portal to body so it escapes transformed drawers).
- Blocked-users settings list: full-width rows; on mobile the settings surface stacks (reuse the wave-68 settings responsive behavior).

## §6 Interaction patterns
- Block: click Block → confirm dialog ("Block <name>? They won't be able to DM you and you won't see their content.") → confirm (danger button) → success toast + affordance → "Unblock". Esc/Cancel closes. Double-click disabled on submit.
- Unblock: from the affordance or the settings list → immediate (or light confirm) → row leaves the blocked list / affordance flips to "Block".
- Blocked-users list: loads on settings open; inline Unblock per row → row animates out; empty state when none.
- A11y: dialog role=dialog + focus-trap + aria; toast role=alert (error) / role=status (success); Block control has an aria-label when icon-only; keyboard-reachable.

## §7 Data shape
- Block DTO: { id, blockerId, blockedId, createdAt } (shared BlockSchema).
- Blocked-users list: GET /blocks → { blocks: Block[] }; each row needs the blocked user's display name + avatar (resolve from the user/profile the row references).
- Block/unblock: POST /blocks {blockedUserId} / DELETE /blocks/:blockedUserId.

## §8 Prior art (match visual language)
- design/member-moderation.html (member-row kebab / action menu pattern — the block affordance host idiom).
- design/moderation-report.html (wave-69: confirm dialog chrome, danger #b91c1c button, toast a11y, mobile bottom-sheet, list rows w/ inline action — the blocked-users list mirrors the report inbox rows).
- design/server-settings.html (wave-68 Overview settings shell — the blocked-users list section host, adapted to a USER-level settings surface).

## §9 Success criteria (≥5)
- [ ] Block affordance shown on member row + profile + DM header, reflecting not-blocked/blocked state (Block ↔ Unblock).
- [ ] Block confirm dialog: danger (#b91c1c) confirm + ghost cancel, dark-on-nothing (danger not emerald), focus-trap, Esc, mobile bottom-sheet, submitting/success/error states.
- [ ] Blocked-users settings list: rows (avatar + name + Unblock), loading skeleton, empty state, inline unblock removes the row.
- [ ] Toast a11y (role=alert error / role=status success); Block control aria-label when icon-only.
- [ ] DESIGN-SYSTEM tokens only (no invented hex; danger-btn for the destructive confirm; Phosphor icons; Geist).
- [ ] Block affordance NOT shown on the viewer's own row/self (aligns with spec-D member-row fix).

## §10 Non-goals
Group-DM block UI nuance (deferred), report/moderation surfaces (wave-69), the who_can_dm privacy toggle (separate BETA), platform-admin takedown. No new tokens expected.

## §11 Reviewer briefing
Judge: does the Block confirm read as a clear, reversible safety action (not alarming)? Is the destructive-confirm correctly danger #b91c1c (not emerald)? Does the blocked-users list match the report-inbox row idiom + settings shell? Dark-theme AA on all text/buttons. Mobile bottom-sheet (portal-safe). Block affordance never on self.

mask_mode_signoff: PASS
signoff_note: "All placeholders filled; §4 cites 7 primitives; §8 names 3 prior-art mockups; §9 has 6 checkboxes."
