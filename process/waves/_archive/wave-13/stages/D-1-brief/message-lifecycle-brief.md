# Design Brief — Message lifecycle (edit / delete-tombstone / reactions) on the message-row

**Wave:** 13
**Parent stage invoking:** P-2 (design_gap_flag: true)
**Blocking current wave:** yes
**Mode:** automatic (inherited from `process/session/.autonomous-session`)

## 1. What we need

Extend the existing wave-12 message-row in `design/server-channel-view.html` with three message-lifecycle primitives: (1) **inline edit** of your own message (row content → editable textarea with Save/Cancel; on save an `(edited)` indicator appears), (2) **delete** of your own message — or a moderator on others' — via a hover/focus row-action → confirm → a muted **tombstone** row ("This message was deleted", no content, no reactions), and (3) **reactions** — a reaction-pill row beneath a message (emoji + count, highlighted when `reactedByMe`), plus an add-reaction affordance with a small common-emoji set; clicking a pill toggles. Row-actions (react / edit / delete) appear on hover **and** keyboard focus of a message-row.

## 2. Where it lives

- **Route / file path:** `design/server-channel-view.html` (EXISTS — the canonical channel chat surface). Frontend consumer: `MessageRow` + sub-elements (`ReactionPill`, `EditedTag`) per DESIGN-SYSTEM § 8.
- **Navigation entry:** in-place — every message in PANE 3 (main chat canvas) of the channel view. No new route.

## 3. Audience + state

- **Who sees it:** authenticated student (message author), authenticated student (non-author — sees react only), moderator (`can(manage_channels)` — sees delete on others' messages too).
- **States to design:**
  - **Message default** (rest) — no actions visible.
  - **Message hover/focus** — row-action bar appears (react / edit own / delete own-or-mod).
  - **Inline-edit active** — content replaced by textarea + Save/Cancel + keyboard hint.
  - **Edited** — body shown with a muted `(edited)` indicator.
  - **Delete confirm** — inline confirm affordance (Delete / Cancel).
  - **Tombstone** — muted "This message was deleted", no body, no reactions, no row-actions except none.
  - **Reactions present** — pill row; pill default vs `reactedByMe` (highlighted).
  - **Add-reaction picker open** — minimal common-emoji popover.
  - (Existing states preserved: sent / pending / failed / empty-channel / loading-older.)

## 4. DESIGN-SYSTEM.md references (REQUIRED)

- **Colors:** `--surface-800` (#1c1c1f, canvas), `--surface-700` (#27272a, hover fill / pill bg / row-action bg), `--surface-600` (#3f3f46, textarea border), `--accent-emerald` (#10b981, `reactedByMe` ring + Save primary + active indicator), `--danger` (#ef4444, delete confirm), `--text-primary` (rgba 255/0.92, body), `--text-secondary` (rgba 255/0.60, `(edited)` tag / counts / timestamps), `--text-muted` (rgba 255/0.40, tombstone text / disabled). (§1)
- **Typography:** `text-sm` 14px body + textarea, `text-xs` 12px counts / `(edited)` / metadata, weight 500 medium (names / Save). (§2)
- **Spacing / radius:** 4px base; message-row vertical rhythm 8px; `--radius-md` 6px (buttons, inputs, message hover, pills if compact); `--radius-full` 9999px (reaction pills, add-reaction button). (§3, §4)
- **Shadows:** `--shadow-pop` `0 8px 24px rgba(0,0,0,0.5)` (emoji picker popover + floating row-action bar); `--glow-focus` `0 0 0 2px rgba(16,185,129,0.4)` (emerald focus ring on all interactive controls). (§5)
- **Motion:** `transition-colors 150ms ease` (hover/focus on pills, row-actions); respect `prefers-reduced-motion`. (§6)
- **Icons (Phosphor § 7):** `ph-pencil-simple` (edit), `ph-trash` (delete), `ph-smiley` / `ph-smiley-wink` (add-reaction), `ph-check` (Save), `ph-x` (Cancel). Line weight regular.
- **Components to reuse:** `MessageRow` (avatar + name + timestamp + body) and its **ReactionPill** + **EditedTag** sub-elements (§8 MessageRow — already specify "Hover: surface-800 highlight + action bar (react/reply/edit/delete)" and "ReactionPill (emoji + count, emerald ring if you reacted), EditedTag"); **Tooltip/Popover** primitive (§8 — "popover on click (menus, emoji picker)") for the emoji picker; **Button** ghost/destructive variants (§8) for row-actions.

## 5. Responsive contract

Per DESIGN-SYSTEM § 9 (desktop app; mobile out of scope):
- **Desktop full (1280+):** row-action bar floats top-right of the row on hover/focus; pills wrap under body; emoji picker is a click popover.
- **Desktop compact (1024):** member list collapses (existing behavior); message column unchanged — row-actions + pills behave identically.
- **Narrow (≤768):** channel sidebar becomes a drawer (existing); row-actions remain reachable by focus (touch-tap reveals); pills wrap. No new responsive primitive needed.
- **Touch:** row-action targets ≥ adequate hit area; add-reaction + pills are real buttons.

## 6. Interaction patterns

- **Row-actions:** appear on `:hover` of the row AND on `:focus-within` (keyboard Tab into the row reveals them — never hover-only). Each is a real `<button>` with `aria-label` + focus-visible emerald ring. Edit shown only on own messages; delete shown on own OR (moderator) others'.
- **Inline edit:** Edit → body swapped for an auto-grow `<textarea>` pre-filled with content + Save (emerald) / Cancel (ghost). **Enter saves, Esc cancels** (Shift+Enter newline). On save → body returns with a trailing muted `(edited)` tag.
- **Delete:** Delete → inline confirm (small "Delete this message?" with Delete [danger] / Cancel). Confirm → row becomes the tombstone. (Inline confirm chosen over modal to keep the lifecycle in-flow and low-noise per the calm brand; the Modal primitive remains available but is heavier than this action warrants.)
- **Reactions:** click a pill → toggles `reactedByMe` (optimistic). Add-reaction button → minimal popover of ~6 common emoji; pick → adds/toggles a pill. Pills and add-reaction are keyboard-reachable; popover closes on Esc and on outside-click; `aria-pressed` reflects `reactedByMe`.
- **ARIA:** row-action bar buttons labelled; tombstone conveyed in text (not color alone); `(edited)` is text, not an icon-only cue; emoji picker popover has focus management + Esc.

## 7. Data shape

- `PATCH /channels/:channelId/messages/:messageId {content}` → 200 MessageResponse with `isEdited: true`, `editedAt`.
- `DELETE /channels/:channelId/messages/:messageId` → 200/204; subsequent get/list returns a tombstone payload (`isDeleted: true`, no content).
- `POST /channels/:channelId/messages/:messageId/reactions {emoji}` → 200 `{reacted: bool}`.
- list/get messages include aggregated `reactions: [{emoji, count, reactedByMe}]` per message.
- Realtime: `message:updated` → re-render edited; `message:deleted` → tombstone; `reaction:added`/`reaction:removed` → update pills.
- **Edge payloads the design handles:** deleted message (tombstone, no content/reactions); message with zero reactions (no pill row); message with several reactions (pills wrap); a message where one pill is `reactedByMe` and others are not.

## 8. Prior art (match this visual language)

- **Message-row + states** → match `design/server-channel-view.html:175-253` (sent / pending / failed rows — avatar + name + timestamp + body, `hover:bg-study-700/30 rounded-md`, `group` hover pattern).
- **Composer textarea (inline-edit textarea should echo it)** → match `design/server-channel-view.html:260-273` (`bg-study-900` recessed-input, emerald focus ring, auto-grow).
- **Pill / focus-ring / danger-button language** → match `design/server-channel-view.html:246-251` (Retry button — danger tint + `focus-visible:ring`) and DESIGN-SYSTEM § 8 Badge/Pill.

## 9. Success criteria (APPROVE checklist)

- [ ] Uses exactly the DESIGN-SYSTEM.md tokens listed in § 4 (no new hex values, no invented tokens — Tailwind classes map to the existing `study`/`accent` config in the file's `<script>`).
- [ ] Renders all states listed in § 3 (rest, hover/focus actions, inline-edit, edited, delete-confirm, tombstone, reactions default + `reactedByMe`, add-reaction picker), AND preserves the existing wave-12 states (sent/pending/failed/empty/loading).
- [ ] Row-actions appear on BOTH hover and keyboard focus, are real `<button>`s with `aria-label` + visible focus ring (no hover-only affordance).
- [ ] Inline-edit: textarea pre-filled, Save/Cancel present, Enter-saves / Esc-cancels documented; `(edited)` indicator is muted text and ≥4.5:1 on `--surface-800`.
- [ ] Delete → confirm → tombstone; tombstone is clearly distinct (muted, no content, no reactions, no actions) and reads as deleted by text not color alone.
- [ ] Reaction pill `reactedByMe` state is visually unambiguous (emerald ring/tint) and distinct from a default pill at a glance; count text ≥4.5:1.
- [ ] All icon references are real Phosphor names (`ph-pencil-simple`, `ph-trash`, `ph-smiley`, `ph-check`, `ph-x`).
- [ ] Edit affordance shown only on own messages; delete shown on own + a moderator-on-others' example.

## 10. Non-goals

- Threads / replies, @mentions, attachments, presence/typing indicators (all DEFERRED to later M3 waves).
- A full emoji-picker library/search — only a small common-emoji set for add-reaction.
- Backend authz (enforced server-side; the design only *shows* affordances when permitted).
- Any change to the server rail, channel sidebar, member list, or composer beyond the inline-edit echo.

## 11. Reviewer briefing (D-3 review & adopt)

`/plan-design-review` should score: visual hierarchy (do row-actions/pills stay subordinate to message body?), spacing rhythm (8px message rhythm preserved with pills added), brand coherence (calm/academic/low-noise — not Discord-loud), edge-case handling (tombstone, zero-reactions, `reactedByMe`), accessibility (focus-reachable actions, dark contrast), responsive.
`/ui-ux-pro-max` should verify: § 9 criteria checkbox-by-checkbox, the edit→edited and delete→tombstone flows make sense, every Tailwind color/spacing/radius maps to the file's `study`/`accent` token config (flag any invented hex), every `ph-*` icon is a real Phosphor name.

```yaml
mask_mode_signoff: PASS
signoff_note: "All placeholders replaced; §4 cites 8+ DESIGN-SYSTEM primitives (colors/type/spacing/radius/shadow/motion/icons/components); §8 names 3 prior-art anchors in the existing file; §9 has 8 checkboxes. Delta brief — composes onto the existing canonical server-channel-view.html rather than a net-new surface."
```
