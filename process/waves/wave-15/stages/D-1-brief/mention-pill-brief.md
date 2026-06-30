# Design Brief — inline mention-pill

## 1. What we need
Render `@username` tokens inside message bodies as styled inline pills; a pill that targets the CURRENT viewer gets a distinct emphasis treatment.

## 2. Where it lives
`design/server-channel-view.html` — inside message-row body text (the MESSAGE LIST rows, ~L194+). Inline within message content.

## 3. Audience + states
Any member reading messages. States: **mention-other** (someone else mentioned), **mention-self** (viewer is the target — emphasis), **in-tombstone** (deleted message → no pill).

## 4. DESIGN-SYSTEM.md references (≥6)
- `--accent-emerald` — self-mention emphasis (tint/text), the academic accent.
- `--surface-700` — other-mention pill background (subtle, inline).
- `--radius-sm`/`--radius-md` — pill corner (§4, inline tags).
- `--text-primary` pill text; sufficient contrast on pill bg.
- Typography §2 — pill at body scale, medium weight (distinct from plain text).
- `--glow-subtle` or emerald ring — self-mention pill accent (restrained, no neon).

## 5. Responsive contract
- Pills inline with text, wrap naturally; never break the message line layout.
- Self-mention emphasis legible at all widths.

## 6. Interaction patterns
- Pill is presentational this wave (no click-to-profile — non-goal). Hover may subtly lift (optional).
- Self-mention: emerald-tinted bg or emerald text + subtle ring; other-mention: muted `--surface-700` chip.

## 7. Data shape
From MessageResponse.mentions[] ({userId, username}); viewer-target = mention.userId === current user.

## 8. Prior art (match)
- server-channel-view.html reaction-pill (L78 comment + pill rows) — pill shape/radius language (mention-pill is DISTINCT but same family).
- server-channel-view.html message-row body text (L204) — inline text treatment.
- DESIGN-SYSTEM emerald accent usage (active channel, online presence) — emerald = "this concerns you" signal.

## 9. Success criteria (≥5)
- [ ] @username renders as an inline pill (not plain text), body scale, medium weight.
- [ ] Self-mention pill visually distinct (emerald emphasis) from other-mention (muted chip).
- [ ] Both variants ≥4.5:1 contrast on the message-row surface (DESIGN-PRINCIPLES rule 1, calculated).
- [ ] Pills wrap inline without breaking row layout.
- [ ] Tombstoned message shows no pill.
- [ ] Tokens only; no neon; reads as same family as reaction-pill.

## 10. Non-goals
Click-to-profile/DM; hovercards; @role/@everyone styling; animated pills.

## 11. Reviewer briefing
Verify self vs other distinction is clear AND both pass WCAG AA by calculation (rule 1 — emerald-on-dark and chip-on-dark both ≥4.5:1). Mention-pill must not be confused with reaction-pill.

mask_mode_signoff: PASS
signoff_note: ""
