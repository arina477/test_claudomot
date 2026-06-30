# Design Brief — Typing indicator ("X is typing…")

## 1. What we need
A transient "<name> is typing…" line shown to members viewing a channel when OTHER members are typing, rendered just above the composer in server-channel-view. Auto-expires when typing stops. Distinct from the composer's own send-state machine (which already exists).

## 2. Where it lives
`design/server-channel-view.html` — between the message-list foot and the composer (around the existing COMPOSER region L427). Composes onto the canonical channel view; no new page.

## 3. Audience + states
Authenticated member viewing the channel. States: **none** (no line — zero height, no layout shift), **one typer** ("Ada is typing…"), **2-3 typers** ("Ada, Ben and Cleo are typing…"), **many** ("Several people are typing…"), **expiring** (fades out after ~5s of no signal).

## 4. DESIGN-SYSTEM.md references (≥6)
- `--text-secondary` (0.60) — the typing text (metadata weight, not body).
- `--text-muted` (0.40) — the animated dots / lowest-emphasis.
- `--surface-800` (#1c1c1f) — sits on the main-canvas background (§1), ≥4.5:1 for the text.
- Typography §2 — small (`text-[12px]`/`text-xs`) metadata scale, matching timestamps.
- Spacing §3 — tight vertical padding so it occupies one compact line above the composer; reserves no space when empty.
- §6 Motion — subtle 3-dot pulse animation + ≤150ms fade in/out (no jarring layout jump).
- `--accent-emerald` used ONLY if a small live indicator is wanted (optional; default keep it text-only/muted to avoid noise).

## 5. Responsive contract
- All widths: single truncating line; never wraps to 2 lines (ellipsis on overflow at narrow widths).
- Reserves zero height when empty (no composer jump when a line appears/disappears).

## 6. Interaction patterns
- Appears on typing:active for the viewed channel; updates names live; disappears on typing stop / TTL expiry (~5s).
- Aggregation cap: >3 typers → "Several people are typing…".
- Self never appears in the line.
- Optional animated 3-dot ellipsis (`--text-muted`) pulsing per §6 motion.

## 7. Data shape
From `typing:active { channelId, typers: [{userId, displayName}] }` (channel-scoped). View renders names + "is/are typing…". No persistence.

## 8. Prior art (match this visual language)
- `design/server-channel-view.html` COMPOSER region (L427+) — adjacency + the composer's existing typing-state comment (L517) for placement/voice.
- `design/server-channel-view.html` message-row metadata (timestamps, `--text-secondary`) — match the small muted metadata type.
- `design/server-channel-view.html` ConnectionStateIndicator (L170, role=status) — precedent for a subtle status-region line.

## 9. Success criteria (APPROVE checklist)
- [ ] Line sits directly above the composer; zero reserved height when empty (no layout shift on appear/disappear).
- [ ] 1 / 2-3 / many states render correct grammar ("is typing" vs "are typing"; "Several people…" beyond cap).
- [ ] Text uses `--text-secondary`/`--text-muted` at metadata scale; ≥4.5:1 on `--surface-800`.
- [ ] Subtle motion (≤150ms fade; optional pulsing dots) per §6; no neon, no jarring jump.
- [ ] Self excluded; truncates (ellipsis) at narrow width, never 2 lines.
- [ ] Uses only DESIGN-SYSTEM tokens.

## 10. Non-goals
Per-message read receipts; "seen by" avatars; typing in the member list; rich typing animation beyond a simple pulse; persisting typing state.

## 11. Reviewer briefing
Verify zero-layout-shift when the line toggles (the key UX failure mode); contrast ≥4.5:1; metadata type scale matches timestamps; motion is subtle per §6; no color-only signal. Aggregation grammar correct.

mask_mode_signoff: PASS
signoff_note: ""
