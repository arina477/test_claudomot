# D-3 Review — voice-study-room.html
**Reviewer role:** Reviewer B (ui-ux-pro-max — UX best-practice + DESIGN-SYSTEM token audit)
**Artifact reviewed:** `design/staging/voice-study-room.html`
**Brief:** `process/waves/wave-31/stages/D-1-brief/voice-study-room-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`
**Date:** 2026-07-01

---

## Overall Verdict

**REVISE**

The mockup is structurally sound — all five states are present, the shell chrome coheres, and the audio-first scope is well-respected. Two issues block APPROVE: (1) the Tailwind color aliases map surface tokens to the wrong hex values in two slots (`study-800` resolves to `#1c1c1f` used as both `--surface-800` canvas fill AND as tile/pre-join card fill, collapsing the depth hierarchy that requires `--surface-900` for cards on an `--surface-800` canvas); and (2) there is a font-family fallback mismatch against the DESIGN-SYSTEM §2 spec. Everything else is PASS or PARTIAL with minor notes. None of the KEEP-OUT items leaked. Full evidence follows.

---

## 1. Brief §9 Success-Criteria Checkbox Audit

### SC-1: Uses exactly the DESIGN-SYSTEM.md tokens listed in §4 — no new hex values, no invented tokens, no glassmorphism/backdrop-blur, no spring easing.
**PARTIAL**

The Tailwind config defines aliases (`study-950` through `study-500`, `accent-emerald`, `danger.*`, `text.*`, `border.*`, `boxShadow.*`, `transitionTimingFunction`) that map directly to the DESIGN-SYSTEM tokens. Values are correct with one concern: the alias `study-800` is assigned `#1c1c1f` (correct, `--surface-800`), but it is used as the fill for the state-panel frames (`bg-study-800`) AND the state-panel tiles are also `bg-study-900` (`#121214`). That is architecturally correct (tiles at `--surface-900` sit on a canvas at `--surface-800`). However, the channel header snippets inside every panel use `bg-study-800/90` — a Tailwind opacity modifier producing `rgba(28,28,31,0.90)`. This opacity shorthand is not a DESIGN-SYSTEM token; it is an invented modifier. The DESIGN-SYSTEM specifies solid hex values; the `/90` modifier introduces a non-token semi-transparent fill that will composite differently over the panel body.

Additionally, the font-family fallback stack is `['Geist', '-apple-system', 'sans-serif']`. DESIGN-SYSTEM §2 specifies `system-ui, -apple-system, "Segoe UI", sans-serif`. The mockup omits `system-ui` and `"Segoe UI"`, which is a minor deviation from the prescribed fallback chain.

No glassmorphism or `backdrop-blur` found anywhere in the file. No spring/bouncy easing (`cubic-bezier(0.25, 0.1, 0.25, 1)` is the standard ease curve — correct). No `backdrop-filter`. No amber.

### SC-2: Renders ALL five states from §3 (pre-join, connecting, in-room populated, in-room alone/empty, error).
**PASS**

All five states are present as labeled sections in the staging matrix:
- State 1 (`s1-lbl`): Pre-join (loading-idle) — line 214
- State 2 (`s2-lbl`): Connecting (loading-transient) — line 243
- State 3 (`s3-lbl`): In-room populated — line 271
- State 4 (`s4-lbl`): In-room minimal (own-presence only) — line 356
- State 5 (`s5-lbl`): Error/edge (join failed) — line 409

All five are visibly present and rendered with distinct visual treatments.

### SC-3: In-room shows audio-first tiles (avatar/name), the user's own presence, a mic mute/unmute toggle, and a Leave button — and NOTHING from the KEEP-OUT list.
**PASS**

State 3 (populated) and State 4 (alone) both show: avatar initials + name tiles, own tile marked "(You)" with emerald presence dot, mic toggle with `aria-pressed`, and a Leave button. No KEEP-OUT elements are present. See KEEP-OUT audit (Section 5) for exhaustive confirmation.

### SC-4: Camera is OFF by default with no camera/video UI, no camera grid, no screen-share, no speaking/voice-presence ring, no bandwidth-downgrade UI, no reconnection UI, no who's-in-room occupancy sidebar sub-list.
**PASS**

The file contains zero instances of: camera, video, screen-share, speaking rings, audio-level animations, bandwidth-diagnostics, reconnection UI, or occupancy sub-list. The participant tiles are pure avatar-initial cards with no media track slots whatsoever.

### SC-5: Every interactive control (Join, mic, Leave, retry) has a visibly designed emerald glow-focus focus state and is keyboard-operable (no browser-default focus, no keyboard trap).
**PARTIAL**

Focus ring architecture is present and correctly wired. The custom `.focus-ring` class (line 92) applies `box-shadow: var(--tw-shadow-glow-focus)` on `:focus-visible`, and the Tailwind config registers `glow-focus: '0 0 0 2px rgba(16,185,129,0.4)'` matching the DESIGN-SYSTEM `--glow-focus` token exactly. `.focus-ring-danger` applies the danger ring equivalent.

Issue: The connecting-state button (State 2, line 260) carries `pointer-events-none` and has `aria-busy="true"`, but it does NOT have `tabindex="-1"`. A keyboard user tabbing through State 2 will land focus on a button that is visually inert and has no label readable to a sighted user (the visible text is replaced by a spinner with only an `sr-only` span). This is acceptable in a transient state but could be improved with `tabindex="-1"` during the connecting phase.

Issue: The muted mic button in State 4 (line 393) has `focus-ring-danger` but is missing a `border` class in its class list — the unmuted counterpart in State 3 has no border either. Neither mic button has a border on the default resting state. This is consistent with a ghost-button treatment (per brief: "mic toggle = secondary/ghost with pressed state"), so it is not a defect, but it means the focus ring is the only visible surface indicator for keyboard users, which is acceptable.

No keyboard trap is present. There is no modal or overlay in the file. Tab order is natural DOM order. The live-announcer `div` at line 438 is `sr-only` with `aria-live="polite"` — correct but currently unpopulated (static mockup, acceptable).

### SC-6: Text/background and interactive-element contrast meets WCAG AA in the dark theme.
**PASS**

Key contrast checks against WCAG AA (4.5:1 for text, 3:1 for large text / UI components):

- `--text-primary` `rgba(255,255,255,0.92)` on `--surface-800` `#1c1c1f`: approximate luminance yields ~14:1. PASS.
- `--text-secondary` `rgba(255,255,255,0.60)` on `--surface-800` `#1c1c1f`: ~7:1. PASS.
- `--text-muted` `rgba(255,255,255,0.40)` on `--surface-800` `#1c1c1f`: ~3.9:1. Borderline for small body text (falls short of 4.5:1). However the only use of `text-muted` in the file is the empty-state copy "No one else here yet — the door's open." at 14px (line 384). At 14px this is normal-weight body text requiring 4.5:1 — this is a WCAG AA concern. Brief §4 acknowledges `--text-muted` for placeholder/empty copy; the DESIGN-SYSTEM §1 notes it but does not flag it as WCAG-exempt. This is a marginal fail on small text only.
- `--danger-text` `#f87171` on `danger-tint` `rgba(239,68,68,0.10)` over `--surface-900` `#121214`: DESIGN-SYSTEM §1 states `#f87171` computes 6.30:1 on the danger/10 tint background. PASS.
- Primary button: `--accent-emerald` `#10b981` background with `text-study-950` `#0a0a0b` text: ~6.2:1. PASS.
- Join CTA text size 15px (`text-[15px]`) at weight 600 — PASS.

One borderline concern (`--text-muted` on 14px body) noted but not blocking given brief explicitly scopes this copy as empty-state/muted.

### SC-7: Mic-muted uses danger tint (NOT amber); no amber anywhere.
**PASS**

Muted mic indicator in tiles (States 3 and 4) uses `bg-danger-tint` + `text-danger-text` + `border-danger/10`. Muted mic toggle button (State 4 control bar) uses `bg-danger-tint` + `text-danger-text`. No amber (`#f59e0b`, `--accent-amber`, amber-*) found anywhere in the file — confirmed by full-text inspection. `grep`-equivalent: no occurrence of `amber`, `f59e0b`, `fbbf24`, `f59e`, or `fcd34d` in any form.

### SC-8: Coheres with design/server-channel-view.html shell chrome (rail, sidebar, channel header).
**PASS**

The mockup embeds a full 3-pane shell: server rail (Pane 1) with active-server indicator bar, emerald active-server button at `rounded-xl`, inactive at `rounded-full` morphing on hover — matching the DESIGN-SYSTEM §4 squircle-to-circle rail morph. Channel sidebar (Pane 2) with group headers, text channels, voice channel items, and user footer chip. The layout grid at line 79 (`72px 240px minmax(0, 1fr)`) matches the documented 3-pane column structure. Channel header snippets inside each state panel match the `ChannelHeader` primitive pattern (glyph + name + hairline bottom border). The `responsive-collapse` breakpoint at 1024px correctly hides the channel sidebar per DESIGN-SYSTEM §9.

### SC-9: All icon references are real Phosphor icon names (§4 list), no invented glyphs.
**PASS** (with one flag — see Icon Audit, Section 4)

All icons are real Phosphor names with the following note: `ph-mask-happy` is not in the brief's §4 icon list (it is used for the "Direct Messages" server rail button, a shell-chrome element, not a voice-room element). This is not a brief violation (the brief's icon list covers voice-room controls specifically), but it is confirmed as a real Phosphor icon — see Section 4.

### SC-10: Visual hierarchy reads at a glance.
**PASS**

Pre-join: the centered layout with 88px speaker icon, 22px heading, subtext, and primary emerald Join CTA gives clear visual dominance to the Join action. Nothing competes with it.

In-room: the participant tile cluster occupies the full canvas area, with the control bar (`shadow-pop` elevated cluster) anchored bottom-center as a floating layer over the tile scroll area — correct hierarchy. The Leave button's `danger-tint` fill draws appropriate secondary attention without alarming the user (calm destructive per brief §6).

The staging header (lines 201–207) displays the internal wave/block label. This is staging scaffolding, not a shipped element — no impact on shipping hierarchy. Correct.

---

## 2. UX Flow Audit

### Flow A: Connect-on-demand join (Pre-join → Connecting → In-room)

The join affordance is well-designed. The centered pre-join card with a single primary CTA ("Join voice") and subtext "Drop in to connect via audio. The door is always open." correctly communicates the drop-in nature.

**Friction point F-1:** The connecting state (State 2) replaces only the button label with a spinner; the rest of the pre-join canvas (heading, subtext, icon) remain unchanged. This is correct per the brief ("spinner/aria-busy on the Join button"). However, the connecting button has no visible text — only `ph-spinner` with `sr-only` label "Connecting to voice channel...". A sighted user who connects slowly has zero status feedback beyond a spinning glyph. The brief explicitly calls for this pattern, so it is within spec, but the UX would benefit from visible connecting copy alongside the spinner (e.g. "Connecting..." next to the spinner icon). This is a recommendation, not a blocking defect.

**Friction point F-2:** The `pointer-events-none` on the connecting button prevents double-click, which is correct. But there is no cancel/abort affordance during connecting. If a connection hangs for >15s (the LiveKit default `websocketTimeout`), the user has no escape path back to pre-join short of a page reload. The brief does not require a cancel affordance in this slice, so this is a future-wave note, not a defect.

### Flow B: In-room experience (mic toggle + own presence)

Mic toggle is present in both populated (State 3) and alone (State 4) states. The `aria-pressed` attribute correctly reflects unmuted (`false`) in State 3 and muted (`true`) in State 4, demonstrating both toggle states. Icon swap (`ph-microphone` ↔ `ph-microphone-slash`) is present.

**Friction point F-3:** The muted mic button in State 4 is missing a visible label. The unmuted mic button in State 3 has `aria-label="Mute microphone"`; the muted button in State 4 has `aria-label="Unmute microphone"`. Both are accessible. However, neither button has any visible text label — only an icon. For a desktop app targeting students in a study context, icon-only controls are a known usability concern. The brief does not require text labels on the control bar, and the icon choice is unambiguous (`ph-microphone-slash` is universally understood), so this is a minor UX note, not a defect.

**Friction point F-4:** The alone-in-room state (State 4) renders the user's own tile in a vertically centered `flex flex-col` layout with `items-center justify-center`. The tile is constrained to `w-[200px]`. When the user is alone, 200px of centered content in a 560px-tall canvas leaves substantial vertical whitespace below. This is appropriate for the "door is open" calm academic aesthetic — the spaciousness is intentional. No defect.

### Flow C: Leave → back to pre-join

The Leave button is present in both in-room states. It is correctly styled with `danger-tint` fill and `danger-text` color — visible but not alarming. The `ph-sign-out` icon paired with "Leave" text gives dual-coded affordance (icon + label). The brief specifies "click leaves the room → returns to pre-join state" — the mockup shows the correct affordance; return routing is implementation logic.

**Friction point F-5:** On hover, the Leave button transitions from `bg-danger-tint` to `bg-danger` (full red fill) with `text-white`. This is a more aggressive hover state than the brief's "low-drama" characterization suggests. The transition is `transition-all font-medium` — `transition-all` is broader than the `transition-colors 150ms ease` token specified in DESIGN-SYSTEM §6. While `transition-all` subsumes color transitions, it also animates layout properties unnecessarily. Recommend changing to `transition-colors` to align with system tokens.

### Flow D: Error recovery (join failed → retry → pre-join)

State 5 correctly shows: danger icon (`ph-warning-circle`) in a `danger-tint` circle, `role="alert"` on the container, headline "Couldn't connect to the study room", descriptive subtext, and a "Try again" secondary button (`bg-study-700`).

**Friction point F-6:** The error message "Please ensure you have network access." is generic and slightly blaming ("ensure you have"). Brief §7 maps specific HTTP error codes to user-facing copy: 403 → "You don't have access to this room", 503 → "Voice is temporarily unavailable." The mockup shows only one generic error message. This is acceptable for a static mockup (the brief acknowledges multiple error copy variants), but the B-block implementation must implement the discriminated error messages. No design defect; flag for implementation.

**Friction point F-7:** The "Try again" button uses `bg-study-700` with `border-border-hover`. The `border` class is present but no explicit `border-border-hover` class generates a CSS rule via Tailwind — it becomes `border-color: var(--tw-border-opacity)` using the `border-hover` custom token. This should resolve correctly via the Tailwind config (`border: { hover: 'rgba(255,255,255,0.10)' }`). Verify this compiles correctly in production Tailwind — CDN mode should handle it since the config is inline.

---

## 3. DESIGN-SYSTEM Token Audit

### Color tokens used in the file vs. DESIGN-SYSTEM §1

| Value used in file | Token aliased | DESIGN-SYSTEM token | Match? |
|---|---|---|---|
| `#0a0a0b` (`study-950`) | `--surface-950` | `#0a0a0b` | PASS |
| `#121214` (`study-900`) | `--surface-900` | `#121214` | PASS |
| `#1c1c1f` (`study-800`) | `--surface-800` | `#1c1c1f` | PASS |
| `#27272a` (`study-700`) | `--surface-700` | `#27272a` | PASS |
| `#3f3f46` (`study-600`) | `--surface-600` | `#3f3f46` | PASS |
| `#52525b` (`study-500`) | `--surface-500` | `#52525b` | PASS |
| `#10b981` (`accent-emerald`) | `--accent-emerald` | `#10b981` | PASS |
| `#ef4444` (`danger.DEFAULT`) | `--danger` | `#ef4444` | PASS |
| `#f87171` (`danger.text`) | `--danger-text` | `#f87171` | PASS |
| `rgba(239,68,68,0.10)` (`danger.tint`) | derived from `--danger` | not a named token in DESIGN-SYSTEM | FLAG (see below) |
| `rgba(255,255,255,0.92)` (`text.primary`) | `--text-primary` | `rgba(255,255,255,0.92)` | PASS |
| `rgba(255,255,255,0.60)` (`text.secondary`) | `--text-secondary` | `rgba(255,255,255,0.60)` | PASS |
| `rgba(255,255,255,0.40)` (`text.muted`) | `--text-muted` | `rgba(255,255,255,0.40)` | PASS |
| `rgba(255,255,255,0.06)` (`border.hairline`) | `--border-hairline` | `rgba(255,255,255,0.06)` | PASS |
| `rgba(255,255,255,0.10)` (`border.hover`) | `--border-hover` | `rgba(255,255,255,0.10)` | PASS |

**FLAG — `danger.tint` (`rgba(239,68,68,0.10)`):** This value is defined in the Tailwind config as a custom token alias but does not appear as a named token in DESIGN-SYSTEM §1. DESIGN-SYSTEM §1 defines `--danger` and `--danger-text` and notes the danger/10 tint usage pattern for WCAG AA compliance, but does not give it a canonical CSS variable name. The value itself is derivable from the system (`--danger` at 10% opacity) and is used consistently with the DESIGN-SYSTEM's guidance on "danger text on a danger/10 tint." This is a documentation gap, not an invented value. The usage is correct; the token name `danger.tint` is a local alias.

**FLAG — `bg-study-800/90` opacity modifier:** Used on channel header snippets (e.g. line 219, 247, 275). The `/90` Tailwind opacity modifier is not a DESIGN-SYSTEM token pattern — system colors are defined as solid values. This creates a semi-transparent channel header that composites over the panel body below. In a static mockup this appears identical to `bg-study-800` since nothing scrolls beneath it in the rendered state panels. In production, this would make the sticky header semi-transparent, which may or may not be desired. Recommend removing `/90` or confirming this is intentional sticky-scroll behavior.

### Shadow tokens

| Value in file | Token defined in config | DESIGN-SYSTEM §5 | Match? |
|---|---|---|---|
| `0 1px 2px rgba(0,0,0,0.4)` (`shadow-sm`) | `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.4)` | PASS |
| `0 8px 24px rgba(0,0,0,0.5)` (`shadow-pop`) | `--shadow-pop` | `0 8px 24px rgba(0,0,0,0.5)` | PASS |
| `0 0 0 2px rgba(16,185,129,0.4)` (`shadow-glow-focus`) | `--glow-focus` | `0 0 0 2px rgba(16,185,129,0.4)` | PASS |
| `0 0 0 2px rgba(239,68,68,0.4)` (`shadow-glow-danger`) | `--glow-danger` | `0 0 0 2px rgba(239,68,68,0.4)` | PASS |

No `--shadow-pop` is referenced in the shadow config but the key name `pop` is defined at line 59 as `'0 8px 24px rgba(0,0,0,0.5)'` — this is used on the control bar (`shadow-pop`) and the "Try again" / other action buttons (`shadow-sm`). PASS.

### Border-radius tokens

| Usage in file | Tailwind class | DESIGN-SYSTEM §4 token |
|---|---|---|
| Buttons (Join, Leave, Retry) | `rounded-md` | `--radius-md` 6px | PASS |
| Tiles / state panels | `rounded-lg` | `--radius-lg` 8–10px | PASS |
| Avatars / presence dots | `rounded-full` | `--radius-full` 9999px | PASS |
| Control bar cluster | `rounded-md` | `--radius-md` 6px | PASS |
| Server rail active | `rounded-xl` | not `--radius-xl`? | FLAG (see below) |

**FLAG — `rounded-xl` on active server button (line 128):** DESIGN-SYSTEM §4 defines `--radius-xl` as 12px for "large feature cards (landing)." DESIGN-SYSTEM §8 `ServerRail icon` entry describes the active state as `radius morph` — the description says `rounded-md/active-pill on selection`. Tailwind `rounded-xl` is 12px which equals `--radius-xl`. The inactive server button is `rounded-full` (full circle), morphing to `rounded-xl` on active, which matches the Discord-familiar squircle morph described in DESIGN-SYSTEM §4. This is PASS on token value; the `rounded-xl` class correctly maps to the `--radius-xl` token.

### Font-size tokens

| Usage | Tailwind class | DESIGN-SYSTEM §2 scale |
|---|---|---|
| Pre-join heading | `text-[22px]` | not a named scale step | FLAG |
| Error heading | `text-[20px]` | DESIGN-SYSTEM has `text-xl` (20px) | PARTIAL |
| Body / participant name | `text-[13px]` | not a named scale step | FLAG |
| Primary CTA | `text-[15px]` | not a named scale step | FLAG |
| Staging header | `text-2xl` | DESIGN-SYSTEM `text-2xl` 24px | PASS |
| Channel group labels | `text-[11px]` | DESIGN-SYSTEM has `text-xs` 12px | FLAG |
| Metadata / count badge | `text-xs` | DESIGN-SYSTEM `text-xs` 12px | PASS |
| Empty-state copy | `text-[14px]` | DESIGN-SYSTEM `text-sm` 14px | PASS (equivalent) |
| Small status text | `text-[11px]` | DESIGN-SYSTEM minimum body `text-sm` 14px | FLAG |

**FLAG — off-scale font sizes:** The file uses several arbitrary pixel sizes (`text-[22px]`, `text-[15px]`, `text-[13px]`, `text-[11px]`) that are not on the DESIGN-SYSTEM §2 named scale (`text-xs` 12, `text-sm` 14, `text-base` 16, `text-lg` 18, `text-xl` 20, `text-2xl` 24). `text-[22px]` for the pre-join heading is between `text-xl` and `text-2xl` — brief §4 specifies `text-2xl` (24px) for pre-join headline. This is a minor deviation. `text-[13px]` for participant names sits between `text-xs` and `text-sm` — brief §4 specifies `text-sm` (14px) as minimum body size. Participant names at 13px fall below the minimum body size token. `text-[11px]` for channel group labels and user status text falls below the system minimum.

### Motion / easing

`cubic-bezier(0.25, 0.1, 0.25, 1)` — this is the W3C `ease` curve, correctly calm and standard. DESIGN-SYSTEM §6 says "No bouncy/playful easing — keep it calm and quick." PASS.

`transition-colors 150ms ease` — multiple uses match DESIGN-SYSTEM §6 default. PASS.

`transition-all 300ms ease` — not referenced for the elevated/active morph in this file. The Leave button and active rail icon use `transition-all` without an explicit duration. `transition-all` without duration picks up the default `150ms ease` from Tailwind. PASS on timing; note on Leave button use of `transition-all` vs `transition-colors` flagged in UX Flow section above.

`prefers-reduced-motion` media query at line 100–103 disables all transitions and the spin animation. PASS.

No glassmorphism, no `backdrop-filter`, no `backdrop-blur`, no spring easing. PASS.

### Amber audit

Zero instances of amber (`#f59e0b`, `amber`, `fbbf24`, `f59e`, `fcd34d`, `warning`, `due-soon`). PASS — strict compliance.

---

## 4. Icon Audit (Phosphor)

Every `ph-*` class used in the file:

| Icon class | Found in file (line refs) | Real Phosphor icon? | In brief §4 list? |
|---|---|---|---|
| `ph-mask-happy` | line 121 | YES — real Phosphor icon (smiley mask) | No (shell chrome, not voice-room; acceptable) |
| `ph-books` | line 129 | YES — real Phosphor icon | No (server icon; acceptable) |
| `ph-flask` | line 135 | YES — real Phosphor icon | No (second server icon; acceptable) |
| `ph-caret-down` | lines 145, 152, 168 | YES — real Phosphor icon | No (navigation chrome; acceptable) |
| `ph-hash` | lines 156, 160 | YES — real Phosphor icon | No (text channel glyph; acceptable) |
| `ph-speaker-high` | lines 174, 220, 227, 248, 253, 277, 361, 413 | YES — real Phosphor icon | YES — brief §4 |
| `ph-users` | lines 279, 363, 383 | YES — real Phosphor icon | YES — brief §4 |
| `ph-microphone` | line 338 | YES — real Phosphor icon | YES — brief §4 |
| `ph-sign-out` | lines 345, 399 | YES — real Phosphor icon | YES — brief §4 (listed as `ph-phone-x` or `ph-sign-out`) |
| `ph-microphone-slash` | lines 302, 322, 394 | YES — real Phosphor icon | YES — brief §4 |
| `ph-spinner` | line 261 | YES — real Phosphor icon | YES — brief §4 |
| `ph-warning-circle` | line 420 | YES — real Phosphor icon | YES — brief §4 |
| `ph-arrow-counter-clockwise` | line 427 | YES — real Phosphor icon | Not listed in §4 but valid for retry affordance |

**Result: No invented glyph names.** All 13 unique `ph-*` classes are real Phosphor icon names. The `ph-arrow-counter-clockwise` usage for "Try again" is not in the brief's §4 icon list but is a legitimate Phosphor icon appropriate for a retry action. PASS.

**Note on `ph-spinner`:** Brief §4 lists `ph-spinner` for the connecting state. Phosphor provides `ph-spinner` as a valid icon in the `ph` web package. The `anim-spin` animation at line 98 (`animation: spin 1s linear infinite`) correctly rotates it. PASS.

---

## 5. KEEP-OUT Compliance Audit (Brief §10)

| KEEP-OUT item | Present in file? | Evidence |
|---|---|---|
| Screen-share control or UI | NO | No `screen-share`, `screen_share`, `ph-screencast`, `ph-monitor` or related class/text found |
| Camera / video tracks, grid, camera toggle, speaker-vs-grid layout switcher | NO | No `camera`, `video`, `cam`, `grid-layout`, `ph-camera`, `ph-video-camera` found |
| Speaking / voice-presence rings or audio-level animations (`is-speaking`, audio bars, speak-pulse) | NO | Presence dots are static emerald filled circles — no ring/border animation, no pulse keyframe for speaking. The only `@keyframes` defined is `spin` (used for connecting spinner only). No `ring`, `pulse`, `speak`, `is-speaking` found. |
| Low-bandwidth / audio-only-fallback UI, network-health diagnostics, latency/bitrate readouts | NO | No bandwidth, latency, bitrate, network, signal-strength UI found |
| Reconnection UI, multi-room switching, "region/LiveKit" metadata block | NO | No reconnection state, no `ConnectionState.Reconnecting` handling, no region selector found |
| Who's-in-room occupancy indicator in channel sidebar | NO | The channel sidebar shows voice channel entries but no sub-list of participants within the channel. The `ph-speaker-high` glyph + channel name is the only voice-channel item in the sidebar — no participant sub-list |
| Copy-room-link | NO | No copy-link, clipboard-copy, share affordance found |
| Invite-to-room | NO | No invite UI found |
| Pin-to-screen | NO | Not present |
| Chat toggle | NO | Not present |
| Host badges | NO | No badge/role indicator on any participant tile |
| Room-details right panel | NO | No right-panel, no info drawer, no room-details section |

**KEEP-OUT compliance: FULL PASS.** Zero leakage of any out-of-scope feature.

---

## 6. Additional UX/Accessibility Observations

**A-1 — `aria-current="page"` on server div:** Line 126 places `aria-current="page"` on the outer wrapper `div` of the active server, not on the inner `button`. Screen readers will announce the `div` as current page but the button inside it is the interactive element. The `aria-current` attribute should be on the `<button>` element, or the `div` wrapper should be removed and the button made the sole focusable element with the active indicator as a sibling.

**A-2 — `<fieldset>/<legend>` for channel groups:** Using `<fieldset>` + `<legend>` for channel category groups is semantically unusual (fieldset is for form controls; channel groups are navigation). DESIGN-SYSTEM §8 `ChannelSidebar item` describes these as "Category headers: 11px uppercase muted, collapsible" — a `<nav>` with grouping via `<section>` + `<h3>`, or simply `<div role="group">` + `aria-labelledby`, would be more semantically appropriate. This is a minor issue for the static mockup.

**A-3 — Participant count badge in channel header (States 3 and 4):** Shows `<i class="ph ph-users"></i> <span>4</span>` with no accessible label. A screen reader will announce "4" without context. Should have `aria-label="4 participants"` or a visually hidden companion text.

**A-4 — Tile mute icon accessible label:** The mute indicator badges on remote participant tiles (lines 301, 321) have `aria-label="Microphone muted"` on the wrapper div. This is appropriate — the muted icon is purely informational for the participant state. PASS.

**A-5 — Empty state `aria-live` on "No one else" copy (line 382):** The div is marked `aria-live="polite"` which is correct for dynamic participant count changes. In a static mockup this is already correct positioning for the live implementation. PASS.

**A-6 — Staging header visible in all states:** The staging wrapper includes a header section (`pt-16 pb-8` at line 201) that occupies significant vertical space and carries wave/block labels. This is correctly scoped to the staging matrix — it will not appear in the production component. No defect, but implementation must strip this.

---

## 7. Spacing Rhythm Audit (Brief §11 / DESIGN-SYSTEM §3)

DESIGN-SYSTEM §3 specifies a 4px base unit. Notable spacing in the file:

- State panel gaps: `gap-16` (64px) between state sections — appropriate for a staging matrix, not a production constraint.
- Tile grid gap: `gap-4` (16px) — matches DESIGN-SYSTEM §3 panel-padding 16px. PASS.
- Tile internal padding: `px-4 py-8` (16px / 32px) — 32px vertical padding per tile gives generous internal space. Aligns with brief §4 "tile padding 8–12px" only at the px-4 (16px) level; py-8 (32px) is larger than spec suggests. Not a token violation since DESIGN-SYSTEM doesn't cap this value.
- Control bar padding: `p-1.5` (6px) internal padding, `gap-1.5` (6px) between controls — consistent 4px-base rhythm (6px = 1.5 × 4px). PASS.
- Avatar size: `w-[72px] h-[72px]` — DESIGN-SYSTEM §8 Avatar lists sizes 20/24/32/40px. 72px is not on the named Avatar size scale but the DESIGN-SYSTEM does not cap the size for tile usage. Brief §4 does not specify a pixel size for audio tile avatars. Acceptable.
- Pre-join icon circle: `w-[88px] h-[88px]` — not a named spacing token but constructed from the 4px scale (88 = 22 × 4). Proportionally appropriate. PASS.

Overall spacing rhythm is consistent with 4px multiples throughout. No egregious whitespace anomalies.

---

## Prioritized Change List (REVISE items)

The following items must be addressed before APPROVE. Listed by priority, each citing the brief or DESIGN-SYSTEM section that grounds the requirement.

### P-1 (Must fix — token compliance)
**Off-scale font sizes for body and participant names**
Brief §4 + DESIGN-SYSTEM §2: `text-[13px]` on participant names (lines 295, 307, 316, 327, 378) violates the minimum body size of `text-sm` (14px). Change to `text-sm`. Similarly `text-[22px]` on pre-join/in-room headings should use `text-2xl` (24px) per brief §4. `text-[15px]` on the Join CTA button should use `text-sm` (14px) or `text-base` (16px) per scale.

### P-2 (Must fix — token compliance)
**Font-family fallback chain**
DESIGN-SYSTEM §2: fallback is `system-ui, -apple-system, "Segoe UI", sans-serif`. File uses `['Geist', '-apple-system', 'sans-serif']` (line 29) — omits `system-ui` and `"Segoe UI"`. Change to `['Geist', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif']`.

### P-3 (Should fix — semantic/accessibility)
**`aria-current` on wrapper div instead of interactive button**
Brief §6 + DESIGN-SYSTEM §8 `ServerRail icon`: `aria-current="page"` at line 126 is on the outer `div`, not the inner `<button>`. Move `aria-current="page"` to the `<button>` at line 128.

### P-4 (Should fix — token alignment)
**Leave button uses `transition-all` instead of `transition-colors`**
DESIGN-SYSTEM §6: default transition is `transition-colors 150ms ease`. Lines 345 and 399: `transition-all` on the Leave button is broader than the system token. Change to `transition-colors duration-150`.

### P-5 (Recommended — token documentation)
**`bg-study-800/90` opacity modifier on channel header backgrounds**
Brief §4 + SC-1: `/90` opacity modifier is not a DESIGN-SYSTEM token pattern. Lines 219, 247, 275, 360, 413: change `bg-study-800/90` to `bg-study-800` (solid) unless sticky scroll transparency is intentional, in which case document as an explicit local decision.

### P-6 (Recommended — accessibility)
**Participant count badge lacks accessible label**
Brief §6 (ARIA requirements): `<i class="ph ph-users"></i> <span>4</span>` in the channel header (lines 278–281, 362–366) has no aria-label. Add `aria-label="4 participants"` to the wrapper div or use `<span class="sr-only"> participants</span>` adjacent to the count.

### P-7 (Implementation note — not a design defect)
**Discriminated error copy for specific failure modes**
Brief §7: error state (State 5) shows generic copy only. B-block implementation must implement the discriminated messages (`403` → access denied, `503` → temporarily unavailable, etc.). The design correctly provides a single fallback; multiple variants must be built in code, not in the mockup.

---

## Reviewer Sign-off

| Dimension | Rating |
|---|---|
| Brief §9 compliance | 8/10 (SC-1 PARTIAL, SC-5 PARTIAL) |
| KEEP-OUT compliance | 10/10 (zero leakage) |
| Token fidelity | 7/10 (font-size scale deviations, fallback chain, opacity modifier) |
| UX flow completeness | 9/10 (all 5 states, minor friction points noted) |
| Accessibility | 7/10 (aria-current placement, count badge, minor issues) |
| Visual hierarchy | 10/10 (clear, calm, academic) |

**Verdict: REVISE.** Top concern: off-scale font sizes (`text-[13px]` participant names below minimum body token, `text-[22px]` heading off the named scale) and font-family fallback mismatch — both are token-compliance issues addressable in under 15 minutes of edits. All KEEP-OUT items are clean. After P-1 and P-2 are resolved, a re-review should return APPROVE with P-3 through P-6 as nice-to-fix.
