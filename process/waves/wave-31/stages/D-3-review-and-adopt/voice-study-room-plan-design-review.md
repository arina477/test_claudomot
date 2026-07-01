# D-3 Design Review — voice-study-room (Reviewer A / `/plan-design-review`)

**Artifact:** `design/staging/voice-study-room.html`
**Brief:** `process/waves/wave-31/stages/D-1-brief/voice-study-room-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`
**Prior-art shells:** `design/server-channel-view.html`, `design/invite-join.html`
**Method:** designer's-eye critique per `/plan-design-review` (7-dimension 0-10 scoring + KEEP-OUT audit). This is a review of a rendered staging mockup, not a live-site audit; the skill's interactive mockup-generation path is not applicable to a single fixed artifact.

---

## OVERALL VERDICT: APPROVE

The mockup renders all 5 mandated states cleanly inside the 3-pane shell, honors the zinc+emerald token system, respects every KEEP-OUT axis, and reads calm/academic rather than as a conferencing dashboard. The residual gaps are minor polish notes, not blockers — none breaks a §9 success criterion or a KEEP-OUT rule. I am not gating on any of them; they are logged as OPTIONAL nits for B-3 or a future pass.

---

## Dimension scores

### 1. Visual hierarchy — 9/10
- **Pre-join:** Join dominates correctly. Emerald fill on near-black, centered, `min-w-[160px]`, only interactive element in the panel — the eye lands on it in under a second. Speaker glyph → title → subtext → CTA is a clean top-to-bottom priority ladder. This is textbook "one strong visual anchor."
- **In-room populated:** participant tile cluster is the visual mass; the mic/Leave control cluster is anchored bottom-center with `shadow-pop`, floating clearly above the tiles without competing. Both correctly dominate. Participant count chip is appropriately quiet (secondary text, top-right).
- **In-room alone:** own tile + calm empty line are the only content, well centered. Good.
- **Error:** danger icon → headline → cause → retry ladder mirrors the pre-join ladder, which is the right parallel structure.
- Why not 10: the staging-scaffold chrome (the "P-1 Decompose · wave-31" eyebrow, the matrix explainer paragraph, per-state `1 · / 2 · …` labels) is review-harness furniture, not product. It is correctly scoped to the staging file and won't ship, so it does not cost hierarchy in the real surface — but within the staging document itself it is the loudest emerald text on first paint (the eyebrow at line 202 outweighs the actual product headline). Harmless for a staging artifact; noted only so B-3 does not carry the eyebrow into `VoiceStudyRoom.tsx`.

### 2. Spacing rhythm (4px base, DESIGN-SYSTEM §3) — 9/10
- Padding and gaps sit on the 4px grid: `py-4 gap-3` rail, `p-3 gap-5` sidebar, `px-8` canvas, tile `px-4 py-8`, control-bar `p-1.5 gap-1.5`, section `gap-16`. Panel header `h-14` (56px) matches the shell. Control cluster `gap-1.5` (6px) and `p-1.5` are on-grid.
- Tile padding `px-4 py-8` (16px / 32px) is generous but intentional for an audio-only face-tile — reads calm, not cramped, consistent with the brief's "calm centered cluster."
- Why not 10: two off-grid one-offs — the muted-icon anchor is `w-[26px] h-[26px]` (26px is not a 4px multiple; 24 or 28 would snap to grid) and the presence dot border is `border-[2.5px]`. Both are sub-visual-threshold and defensible as optical adjustments, but they are the only two values that break the otherwise-perfect 4px discipline. Cosmetic.

### 3. Brand coherence (calm academic zinc+emerald; coheres with shell chrome) — 10/10
- Token palette is a byte-for-byte match to the shell: `study.950=#0a0a0b … study.500=#52525b`, `accent.emerald=#10b981`, `danger=#ef4444`, plus `danger-text=#f87171` and the `text.*` / `border.*` opacity ramps straight from DESIGN-SYSTEM §1. No off-system hex anywhere.
- Shell structure matches `server-channel-view.html`: 72px server rail, active-server emerald left-edge indicator bar + `rounded-xl` morph, `#`/speaker channel glyphs, `h-14` headers, hairline borders, Geist font, 6px dark scrollbar, `prefers-reduced-motion` block. The voice room genuinely sits inside PANEL 3 as one coherent screen.
- Emerald is used with restraint — Join fill, own-presence dot, active-channel text, mic-ON glyph, focus ring — exactly the §4 mapping. Danger is fill/border/tint only. Calm, academic, low-noise. This is the strongest dimension.

### 4. Edge-case handling (all 5 states present + clear; error actionable) — 9/10
- All 5 brief §3 states present and unambiguous: (1) pre-join with Join CTA, (2) connecting with spinner + `aria-busy` + `sr-only` "Connecting…" on the button (correctly a button-spinner, never a full-screen spinner per §8), (3) in-room populated (4 tiles, count chip = 4, own tile "(You)", mic + Leave), (4) in-room alone (own tile + "No one else here yet — the door's open." + `aria-live=polite`), (5) error with danger icon + cause + **Try again** retry, `role="alert"`.
- Nice touches: state 3 shows both mute states (muted tiles carry the danger-tint mic-slash badge; active mic deliberately carries NO icon — line 312 comment "to reduce noise"), and state 4 demonstrates the mic control in its *muted* pressed state while state 3 shows it unmuted, so both toggle states are covered across the matrix.
- Why not 10: the brief §6/§7 name several distinct error causes (403 "You don't have access to this room", 503 "Voice is temporarily unavailable", generic "Couldn't connect"). The mockup renders only the generic timeout copy. That is acceptable for a staging file (one representative error panel is the D-block convention), but B-3 must implement the full cause→copy map from §7 — this mockup does not visually prove the 403/503 variants. Flagging so it isn't lost. Not a gate: the error *pattern* (icon + cause line + retry) is proven and the variants are copy-swaps within it.

### 5. Accessibility (dark contrast, focus, keyboard — design-critique level) — 9/10
- Focus discipline is exemplary: `.focus-ring` / `.focus-ring-danger` classes on every interactive control (Join, mic, Leave, retry, rail buttons, sidebar items), emerald `--glow-focus` and danger `--glow-danger` rings via the exact §5 shadow tokens, `outline: none` only ever paired with a `:focus-visible` box-shadow — no bare browser default, no un-focusable control.
- Contrast: danger text uses `#f87171` (`danger-text`) on the `danger/10` tint per the §1 WCAG-AA note (6.30:1 PASS), not raw `#ef4444` (would FAIL). Muted empty-state copy uses `text-muted` (0.40) — the DESIGN-PRINCIPLE-1 minimum; it passes AA for the 14px non-essential empty line on `#1c1c1f`, and the load-bearing headline/cause use `text-primary`/`text-secondary`. Correct tiering.
- Semantics: participant list is a real `<ul role="list">` with `role="listitem"`; mic is a `<button>` with `aria-pressed` (false in state 3, true in state 4); muted tiles carry `aria-label="Microphone muted"`; join/leave-region uses `aria-live=polite`; error panel is `role="alert"`. Presence is conveyed by text + icon, not color alone. No keyboard trap in the static markup.
- Why not 10 (all OPTIONAL, none a gate):
  - The active-mic tile intentionally has no mic icon (noise reduction) — defensible, but it means "mic on" is conveyed only by *absence* of the muted badge. Acceptable for audio-first calm, but a screen-reader user gets no positive "mic on" signal on remote tiles. Consider a visually-hidden "mic on" label on active tiles in B-3.
  - The pre-join Join button carries no visible icon and the connecting button hides its label behind the spinner with only an `sr-only` string — fine, but confirm the `M` mic shortcut (§6, "documented, non-essential") is surfaced somewhere (tooltip/help) in the real build.
  - `body` has `select-none` — harmless for this surface but worth confirming it doesn't leak to selectable content elsewhere.

### 6. Responsive behavior (DESIGN-SYSTEM §9 desktop breakpoints; mobile out of scope) — 8/10
- The `.layout-grid` collapses the channel sidebar at `max-width:1024px` (`.channel-sidebar { display:none }`), server rail persists — matches the shell's collapse rule and §9's 1024 breakpoint. Participant grid is `grid-cols-2 md:grid-cols-3 xl:grid-cols-4`, so tiles reflow 2→3→4 columns across breakpoints per §5's "tiles wrap in a responsive grid / reflow to fewer columns." Control cluster is absolutely positioned bottom-center and stays reachable at every width. Hit targets: Join `py-3` (~48px), mic `40px` height, Leave `h-[40px]` — meet the ≥44px intent for the primary CTA; mic/Leave at 40px are marginally under the 44px touchscreen target §9 calls for.
- Why not 10: (a) the brief §5 "Narrow (<1024): channel sidebar becomes an **overlay drawer**" — the mockup *hides* the sidebar (`display:none`) rather than converting it to a drawer, so the narrow drawer affordance is not demonstrated. This is a known shell-level behavior and arguably out of this surface's scope, but the brief names it explicitly, so it's an honest gap in the staging proof. (b) mic/Leave at 40px are just under the 44px touch target §9 requires "where the desktop app runs on a touchscreen." Both are OPTIONAL polish — the drawer is shell-owned and the 40px controls are keyboard/mouse-first — neither breaks a §9 APPROVE checkbox. B-3 should bump control height to 44px if touch is in scope.

---

## KEEP-OUT audit (brief §10) — CLEAN

Every barred axis checked against the markup:

| KEEP-OUT axis | Present? | Evidence |
|---|---|---|
| Camera / video UI, camera toggle | NO | `video={false}` intent; tiles are avatar-initials only, no camera track, no cam button anywhere. |
| Camera grid / speaker-vs-grid switcher | NO | Grid is an audio-tile cluster (`grid-cols-2/3/4`), no layout switcher. |
| Screen-share | NO | No screen-share control or region. |
| Speaking / voice-presence rings | NO | Own tile uses a bottom-right emerald **presence dot** (line 293), explicitly commented "Not a speaking ring." No ring around any avatar. Correct — brief §4 says presence dot OK, presence RING is KEEP-OUT. |
| Audio-level animations / speak-pulse | NO | Only animation is `.anim-spin` on the connecting spinner. No audio bars, no pulse. |
| Bandwidth / network-health diagnostics | NO | No latency/bitrate/health readout anywhere. |
| Reconnection UI | NO | No reconnecting state, no amber. |
| Occupancy sidebar sub-list | NO | Channel sidebar shows the voice channel item only; no expanded occupant sub-list under it (correctly split to future task per §10). |
| Glassmorphism / backdrop-blur | NO | Fills are solid `study.*`; the only alpha is `bg-study-800/90` on inner headers (translucency for layering, not a blur material) — no `backdrop-blur`. |
| Spring / bouncy easing | NO | Timing is `cubic-bezier(0.25,0.1,0.25,1)` + `150ms ease` + `linear` spin. No spring. |
| Amber (`--accent-amber`) | NO | No `#f59e0b`, no `amber` token in the config. Mic-muted uses **danger tint** per §4/§9. Confirmed. |

No leakage on any axis.

---

## §9 success-criteria cross-check

All 10 §9 checkboxes hold: exact tokens (no new hex / no glass / no spring) ✓ · all 5 states rendered ✓ · in-room shows audio tiles + own presence + mic toggle + Leave, nothing from KEEP-OUT ✓ · camera OFF, no camera/screen-share/ring/bandwidth/reconnection/occupancy ✓ · every control has visible emerald focus + keyboard-operable ✓ · WCAG-AA dark contrast incl. danger-on-tint via `danger-text` ✓ · mic-muted = danger tint, no amber ✓ · coheres with `server-channel-view.html` chrome ✓ · all Phosphor icon names real (`ph-speaker-high`, `ph-microphone`, `ph-microphone-slash`, `ph-sign-out`, `ph-spinner`, `ph-warning-circle`, `ph-users`, `ph-arrow-counter-clockwise`) ✓ · hierarchy reads at a glance (Join dominates pre-join; tiles+controls dominate in-room; calm) ✓.

---

## Change requests

**None are blocking.** VERDICT is APPROVE. The following are OPTIONAL polish notes for B-3, not gate conditions:

1. **(OPTIONAL, brief §7)** Implement the full error cause→copy map (403 / 404 / 400 / 503 / generic) in `VoiceStudyRoom.tsx`; the mockup proves only the generic-timeout panel. Pattern is proven; variants are copy swaps.
2. **(OPTIONAL, brief §5 / DESIGN-SYSTEM §9)** Narrow (<1024) currently `display:none`s the channel sidebar; §5 calls for an overlay drawer. Shell-owned behavior — confirm the drawer exists at the shell level so this surface inherits it.
3. **(OPTIONAL, DESIGN-SYSTEM §9)** Bump mic/Leave control height from 40px to ≥44px if the desktop app targets touchscreens.
4. **(OPTIONAL, accessibility)** Add a visually-hidden "mic on" label to active (non-muted) remote tiles so mic-on is not conveyed by badge-absence alone to screen readers.
5. **(OPTIONAL, hierarchy hygiene)** Do not carry the staging eyebrow ("P-1 Decompose · wave-31") or the per-state matrix labels into the production component.
6. **(OPTIONAL, spacing)** Snap the muted-badge anchor `w-[26px] h-[26px]` to a 4px multiple (24 or 28) if convenient.

---

**Reviewer A verdict: APPROVE** — ships as the adopted design; the six notes above are polish deferrable to B-3.
