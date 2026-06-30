# Design Brief — @mention autocomplete dropdown

## 1. What we need
A member-picker dropdown that appears above/near the composer when the user types `@` + query, listing channel/server members to pick from; selecting inserts the canonical `@username`.

## 2. Where it lives
`design/server-channel-view.html` — anchored to the COMPOSER region (around L427+). Floating popover above the composer input. Composes onto the canonical channel view.

## 3. Audience + states
Authenticated member typing in the composer. States: **hidden** (no @-trigger), **open-with-results** (member rows), **open-empty** ("No members match"), **active-row** (keyboard-highlighted), **loading** (members fetching, brief).

## 4. DESIGN-SYSTEM.md references (≥6)
- `--surface-800`/`--surface-900` — popover background (elevated above composer).
- `--shadow-pop` (0 8px 24px) — popover elevation (§5, "modals, popovers, tooltips").
- `--border-hover` — popover border.
- `--surface-700` + `--radius-md` — active/hover row fill (§4).
- `--text-primary` member name; `--text-secondary` @handle/secondary.
- `--glow-focus` emerald — active-row ring / selected indicator (§5).
- `--radius-full` — member avatar (§4); `--presence-online` dot optional (reuse member-list pattern).

## 5. Responsive contract
- Popover width ~280px, max-height ~240px scrollable, anchored to the @-token caret position (or composer-left at narrow widths).
- Never overflows viewport; flips/clamps at top edge.

## 6. Interaction patterns
- Opens on `@` after whitespace/start; filters by prefix as the user types.
- Keyboard: ↑/↓ move active row (clamp/wrap), Enter selects (does NOT send), Esc dismisses; click selects.
- Active row: `--surface-700` fill + emerald focus ring; selection inserts `@username` + closes.
- Closes on select / Esc / blur / broken @-token (space/delete).

## 7. Data shape
Rows from GET /servers/:id/members (ServerMember {userId, displayName, avatarUrl}); filter by displayName/username prefix.

## 8. Prior art (match)
- server-channel-view.html COMPOSER (L427+) — anchor + recessed-input language.
- server-channel-view.html ADD-REACTION POPOVER (the existing emoji popover ~L361) — popover open/close + Esc/outside-click pattern to mirror.
- server-channel-view.html member-list rows (L474+) — avatar+name row treatment to match.

## 9. Success criteria (≥5)
- [ ] Popover opens on @-trigger above the composer, ~280px, scrollable, `--shadow-pop`.
- [ ] Member rows: avatar + name; active row has `--surface-700` fill + emerald ring.
- [ ] Empty state ("No members match") + loading state shown.
- [ ] Keyboard nav (↑/↓/Enter/Esc) demonstrated; Enter selects not sends.
- [ ] Tokens only (no invented hex); active-row + text ≥4.5:1 (DESIGN-PRINCIPLES rule 1).
- [ ] Anchors to caret / clamps to viewport; matches the reaction-popover family.

## 10. Non-goals
@everyone/@here/@role rows; rich member cards; cross-server search; presence sorting (optional dot only).

## 11. Reviewer briefing
Verify popover elevation + Esc/outside-close mirror the reaction popover; active-row contrast ≥4.5:1; reads as the same family as composer + member-list. No neon.

mask_mode_signoff: PASS
signoff_note: ""
