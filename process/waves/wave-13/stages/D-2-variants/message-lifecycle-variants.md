# D-2 — Message lifecycle variants (DELTA)

**Wave:** 13 · **Gap:** message-row edit / delete-tombstone / reaction-pill primitives
**Staging output:** `design/staging/server-channel-view.html`
**Mode:** automatic

## Approach (delta, not net-new)

The brief composes three lifecycle primitives onto the EXISTING canonical `design/server-channel-view.html` (wave-12 message-row + composer + send-states). Per the DELTA instruction and the design-system's `MessageRow` primitive (§8 already specifies "Hover: action bar (react/reply/edit/delete)" + "ReactionPill (emerald ring if you reacted), EditedTag"), the meaningful decisions are encoded directly rather than spread across throwaway full-screen variants. The genuine decision points and the choice made:

| Decision | Options considered | Chosen | Rationale (tied to brief §6 + brand) |
|---|---|---|---|
| **Edit interaction** | (a) inline in-place textarea; (b) modal edit dialog | **(a) inline in-place** | Brief §1/§6 mandates inline; keeps the edit in message context, lower-noise than a modal — matches calm/academic brand. Echoes the composer's recessed-input language (prior art L427-442). |
| **Delete confirmation** | (a) inline confirm in the row; (b) `Modal/Dialog` primitive (§8) | **(a) inline confirm** | A single destructive action on one row does not warrant a focus-trapped modal; inline keeps it in-flow and quiet. Modal primitive stays available for heavier flows. Documented in brief §6. |
| **Row-action reveal** | (a) hover-only; (b) hover + focus-within | **(b) hover + focus-within** | Hover-only is a keyboard-trap anti-pattern. `.msg-row:focus-within .row-actions` makes every action Tab-reachable (brief §6, success-criterion 3). |
| **reactedByMe cue** | (a) color/tint only; (b) tint + ring + bolder count | **(b) multi-signal** | WCAG: never color-alone. `.reacted-by-me` = emerald tint + inset emerald ring + emerald-300 bolder count (§8 "emerald ring if you reacted"). |
| **Add-reaction** | (a) full emoji-picker w/ search; (b) ~6 common emoji popover | **(b) minimal set** | Brief §10 non-goal: no full picker. 6 common emoji in a `role=menu` popover, Esc + outside-click close. |
| **Tombstone identity** | (a) greyed body kept; (b) body+reactions removed, muted italic + prohibit glyph | **(b) fully stripped** | Brief §3/§9: tombstone has NO content, NO reactions, NO actions; conveyed in text ("This message was deleted") not color alone. Distinct prohibit-avatar + italic muted text. |

## States rendered statically in staging (reviewer-evaluable without JS)

- Sent (other author) + reaction pills (one `reactedByMe`, one not) + add-reaction button + react-only row-action.
- Sent (own) + `(edited)` indicator + full own-message row-actions (react / edit / delete).
- Inline-edit ACTIVE (textarea + Save/Cancel + Enter-saves/Esc-cancels hint + "Editing" badge).
- Delete-CONFIRM (inline danger-tinted "Delete this message?" Delete/Cancel).
- TOMBSTONE (muted italic, prohibit glyph, no content/reactions/actions).
- Moderator delete on another's message (David C. row — react + delete, NO edit) + add-reaction POPOVER open (6-emoji menu).
- Preserved wave-12 states: sent / pending / failed / loading-older / empty-channel / composer typing+empty.

## Token discipline

All new visuals map to the file's existing `study` / `accent` Tailwind config (surface-700/600, emerald, danger) + DESIGN-SYSTEM §1-§7. New helper CSS (`.row-actions`, `.reacted-by-me`) compose existing token values (rgba of #10b981) — no new hex literals introduced. Candidate new design-system tokens: see D-3 adopt (likely zero — these reuse §8 MessageRow sub-elements already named in the system).

## Iteration

Iteration 1 (this file). No D-3 backedge yet. Cap: 3.
