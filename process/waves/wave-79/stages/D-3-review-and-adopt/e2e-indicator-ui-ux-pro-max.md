# D-3 Design Review — E2E Indicator
**Reviewer:** Reviewer B (substituting `/ui-ux-pro-max` per reviewer-substitution precedent)
**Artefact under review:** `design/staging/e2e-indicator.html` (single-file HTML mockup)
**Brief:** `process/waves/wave-79/stages/D-1-brief/e2e-indicator-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`
**Fresh context — no knowledge of any other reviewer's findings.**

---

## 1. Success-Criteria Checkbox Audit (Brief §9)

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Uses exactly DESIGN-SYSTEM.md tokens from §4 — no new hex values, no invented tokens, dark-only | **PARTIAL** | CSS custom properties at lines 22–51 reproduce the correct token values, but three off-system values are introduced: `--accent-amber: #f59e0b` redeclared locally (fine, matches DS), `--danger: #ef4444` redeclared locally (fine, matches DS), but the tooltip font-size `12px` is inlined as a literal at line 81 rather than via `text-xs` class. More critically, `font-size: 12px` and `line-height: 1.5` at lines 81–82 are raw literals rather than system-scale references. Minor; see token audit §3 below. |
| 2 | Renders ALL 6 states from §3 (encrypted, not-encrypted plaintext fallback, not-encrypted group DM, cannot-decrypt-on-device, loading/establishing, hover/focus tooltip) | **PASS** | States 1–5 are explicit rows in the left audit panel (lines 145–221). Tooltip (state 6) is present on States 1, 2, 3, and 5 (lines 156–158, 173–175, 190–193; State 5 tooltip container is present at line 214 but has no `tooltip-content` child — see UX §2). State 4 tooltip intentionally omitted (read-only status; acceptable). |
| 3 | Responsive per §5 (label→glyph-only collapse ≤1024 with tooltip carrying the words; ≥44px touch target) | **PARTIAL** | The header badge correctly hides text at <1280 via `hidden lg:inline` at line 255 and provides a `md:hidden` icon-only fallback at lines 264–268. However the icon-only fallback element at lines 264–268 lacks `role="status"`, `aria-live="polite"`, `tabindex="0"`, and a `tooltip-content` child — a student on a 768–1023 wide window gets a green shield with no accessible label and no reachable tooltip. Touch target on the icon-only div is `w-8 h-8` (32px × 32px) — below the required ≥44px. |
| 4 | Matches prior-art visual language from §8 (ConnectionStateIndicator pill geometry + MessageRow sub-indicator weight + emerald `ph-shield-check`) | **PASS** | Header badge (lines 152–158) matches `px-3 py-1.5 rounded-full` pill geometry per §8 reference. Per-message affordances at lines 319–322 and 343–347 use `mt-1.5 flex items-center gap-1.5 text-xs font-medium` — matches `direct-messages.html:406-430` weight. `ph-fill ph-shield-check` in emerald at lines 153, 254 matches the trust-glyph precedent. |
| 5 | Interaction patterns per §6 (hover/focus tooltip 400ms, 200ms state fade, keyboard-reachable, role="status" aria-live, reduced-motion) | **PARTIAL** | 400ms tooltip hover delay implemented at line 93. `state-fade` class at lines 123–127 provides 200ms colour fade. `role="status"` and `aria-live="polite"` present on States 1, 2, 3, 5 (lines 151, 168, 185, 214). Reduced-motion guard at lines 104–114 is correct. GAPS: (a) State 5's `tooltip-trigger` wrapper has no `tooltip-content` child, so keyboard focus on loading state produces no tooltip; (b) icon-only narrow-viewport badge (line 264) lacks `tabindex` and tooltip; (c) `focus-visible:ring-2` is present on States 2/3/5 but without `focus-visible:ring-[...]` on State 1's badge — only `ring-[rgba(var(--rgb-accent-emerald),0.4)]` which does not engage without `focus-visible:ring-2` prefix (see token audit). |
| 6 | All icon references are real Phosphor glyph names | **PASS** | See icon audit §4. |
| 7 | FAIL-CLOSED (ship-blocker): lock/shield affordance appears ONLY in provably-encrypted state | **PASS** | See detailed fail-closed analysis below in §2. Both static markup and the JS state-machine are clean. |
| 8 | NON-ALARMING: not-encrypted and cannot-decrypt states use `--text-secondary` / `--text-muted`, NOT danger/red | **PASS** | State 2 badge: `text-[var(--text-secondary)]` (line 169). State 3 badge: `text-[var(--text-secondary)]` (line 186). State 4 micro-affordance: `text-[var(--text-muted)]` (line 202). Loading state: `text-[var(--text-muted)]` (line 215). No `--danger` or red appears on any non-encrypted state. |
| 9 | UNAMBIGUOUS-AT-A-GLANCE + colour-independent: distinguishable by glyph SHAPE and TEXT, not colour alone | **PASS** | State 1: filled shield-check + "End-to-end encrypted". State 2: open-lock stroke + "Not encrypted". State 3: slashed-shield stroke + "Not encrypted". State 4: key stroke + "No key on this device". State 5: spinning circle-notch + "Establishing secure connection...". Shape and label differ in every case; a greyscale viewer can distinguish all five states. |
| 10 | Contrast: text/glyph tint ≥ WCAG AA 4.5:1 on its surface | **PARTIAL** | Emerald `#10b981` on `--surface-900` `#121214` computes approximately 3.8:1 — **WCAG AA FAIL for small text** (4.5:1 required). The design system itself notes this risk at §1 (button section) and corrects it for buttons with `--surface-950` text on emerald fill. Here the emerald text IS the small-text label on the encrypted badge. `--text-secondary` `rgba(255,255,255,0.60)` on `--surface-900` computes approximately 5.5:1 — PASS. `--text-muted` `rgba(255,255,255,0.40)` on `--surface-900` computes approximately 3.7:1 — FAIL (borderline, used for loading label and cannot-decrypt, both small text). |

---

## 2. UX Flow Audit

**Persona:** a student new to StudyHall, unfamiliar with E2E encryption concepts. Can they read the indicator correctly?

### Encrypted state (State 1) — header badge + first message row
The filled emerald shield with "End-to-end encrypted" is clear and calm. The tooltip body ("only you and Dr. Aris Thorne can read them") is natural language a non-technical student will understand immediately. No friction here.

### Not-encrypted plaintext fallback (State 2) — per-message micro-affordance
The open-lock icon plus "Sent as standard message" is honest and calm. It does not say "DANGER" or "UNSECURED" in alarming terms. A student may wonder what "standard message" means vs. "encrypted message" — the label is slightly euphemistic. The brief allows this (anti-security-theater), but the tooltip on the badge (line 173: "hasn't set up secure messaging yet") would not be reachable from the per-message affordance itself because the per-message affordance (line 319–322) has no tooltip attached. A curious student tapping the "Sent as standard message" line gets no explanation. This is a MINOR gap — the header badge tooltip does explain, but the connection is not obvious at the message level.

### Not-encrypted group DM (State 3) — badge only in audit panel
The slashed-shield with "Not encrypted" and tooltip "Group conversations are not end-to-end encrypted yet. Messages are secured in transit." is honest and informative. "Secured in transit" helpfully explains the non-alarming nature. No confusion risk.

### Cannot-decrypt-on-this-device (State 4) — per-message affordance
The encrypted payload shell (monospace truncated ciphertext, line 337–341) combined with "Message cannot be decrypted on this device" (line 347) is the clearest articulation of this state. A student will not mistake this for a network error. The `ph-key` glyph is appropriate. No confusion risk.

### Loading / establishing (State 5) — header badge
"Establishing secure connection..." with a spinning icon is correct and calm. The student sees the indicator is working. Critically, the badge does NOT show a lock during this state — fail-closed is honoured. However the `tooltip-trigger` wrapper for State 5 (line 214) has no `tooltip-content` child. A keyboard user focused here gets an emerald focus ring but no tooltip text. A student who wants to know what "establishing" means has no way to learn without hovering and receiving nothing. This is a usability gap.

### JS simulation (simulateKeygen) — Loading → Encrypted transition
The `simulateKeygen()` function (lines 372–394) correctly forces the loading state first (line 381) then resolves to encrypted after 2 seconds (lines 388–390). The `state-fade` CSS class on the element ensures the 200ms colour transition applies. The lock/shield does NOT appear until `setTimeout` fires — fail-closed is honoured in the JS path.

### Summary ambiguity points
1. State 5 badge has no tooltip — curiosity dead end for keyboard users.
2. Per-message "Sent as standard message" (State 2) has no attached tooltip — mild but linkable to the header badge tooltip.
3. The narrow-viewport icon-only badge (lines 264–268) shows `ph-fill ph-shield-check` in emerald with no accessible label, no tooltip, and no keyboard focus — a student on a narrow window cannot read the state in text or reach an explanation.

---

## 3. DESIGN-SYSTEM.md Token Audit

### Colour tokens — declared in `:root` (lines 22–51) vs DESIGN-SYSTEM.md §1

| Token | HTML value | DS value | Match? |
|-------|-----------|----------|--------|
| `--surface-950` | `#0a0a0b` | `#0a0a0b` | PASS |
| `--surface-900` | `#121214` | `#121214` | PASS |
| `--surface-800` | `#1c1c1f` | `#1c1c1f` | PASS |
| `--surface-700` | `#27272a` | `#27272a` | PASS |
| `--surface-600` | `#3f3f46` | `#3f3f46` | PASS |
| `--surface-500` | `#52525b` | `#52525b` | PASS |
| `--border-hairline` | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.06)` | PASS |
| `--border-hover` | `rgba(255,255,255,0.10)` | `rgba(255,255,255,0.10)` | PASS |
| `--text-primary` | `rgba(255,255,255,0.92)` | `rgba(255,255,255,0.92)` | PASS |
| `--text-secondary` | `rgba(255,255,255,0.60)` | `rgba(255,255,255,0.60)` | PASS |
| `--text-muted` | `rgba(255,255,255,0.40)` | `rgba(255,255,255,0.40)` | PASS |
| `--accent-emerald` (resolved) | `rgb(16,185,129)` = `#10b981` | `#10b981` | PASS |
| `--accent-amber` | `#f59e0b` | `#f59e0b` | PASS |
| `--danger` | `#ef4444` | `#ef4444` | PASS |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.4)` | `0 1px 2px rgba(0,0,0,0.4)` | PASS |
| `--shadow-pop` | `0 8px 24px rgba(0,0,0,0.5)` | `0 8px 24px rgba(0,0,0,0.5)` | PASS |
| `--glow-focus` | `0 0 0 2px rgba(16,185,129,0.4)` | `0 0 0 2px rgba(16,185,129,0.4)` | PASS |
| `--radius-sm` | `2px` | `2px` | PASS |
| `--radius-md` | `6px` | `6px` | PASS |
| `--radius-lg` | `8px` | DS says "8–10px" | PASS (within range) |
| `--radius-full` | `9999px` | `9999px` | PASS |
| `--transition-standard` | `200ms ease` | DS §6 says "transition-colors 150ms ease" default, "200ms" for presence/connection-state | FLAG (see below) |

### Flagged off-system values

**FLAG 1 — `--transition-standard: 200ms ease` (line 51)**
The DESIGN-SYSTEM.md §6 specifies `transition-colors 150ms ease` as the default hover/focus transition and 200ms only for "presence/connection-state changes." The brief §6 explicitly calls for "200ms colour fade between states (§6 motion; matches ConnectionStateIndicator)." The 200ms value is correct for state transitions specifically. However the local variable name `--transition-standard` implies it is the standard default, which conflicts with DS (where 150ms is the standard). Low severity — the value applied to `state-fade` is intentional per brief — but the variable naming is misleading.

**FLAG 2 — Tooltip `font-size: 12px` and `line-height: 1.5` (lines 81–82)**
These are raw CSS literals rather than being expressed via Tailwind's `text-xs` and `leading-relaxed` / `leading-normal` utilities. They happen to match DS §2 values exactly (`text-xs` = 12px; line-height 1.5 = `leading-normal`). No actual drift in rendered value, but a future change to the DS typescale would not propagate here. Low severity.

**FLAG 3 — `focus-visible:ring-2` absent on State 1 badge (line 152)**
State 1's badge class string includes `ring-[rgba(var(--rgb-accent-emerald),0.4)]` but does NOT include `focus-visible:ring-2` (the utility that sets `ring-width`). Without `focus-visible:ring-2`, the `ring-[...]` colour has no effect on focus-visible. States 2, 3, and 5 all correctly include `focus-visible:ring-2` (lines 169, 186, 215). State 1 appears to rely on a bare `ring-[...]` which in Tailwind requires `ring-2` or a width variant to render. This means the encrypted state badge has a broken focus ring — a keyboard accessibility regression and a design-system focus-ring contract violation (`--glow-focus`). **Medium severity.**

**FLAG 4 — Emerald small-text contrast failure (§9 criterion 10)**
`--accent-emerald` `#10b981` used as small text (`text-xs`, 12px) on `--surface-900` `#121214`:
Luminance of `#10b981` ≈ 0.170; luminance of `#121214` ≈ 0.005.
Contrast ratio = (0.170 + 0.05) / (0.005 + 0.05) ≈ 4.0:1.
WCAG AA for normal text requires 4.5:1. This FAILS for the 12px badge label in State 1 and the presence dot in the header (line 240 also uses emerald). The design system's own §1 notes that white-on-emerald fails; here emerald-on-surface-900 at 12px text also fails. **Medium severity.**

**FLAG 5 — `--text-muted` small-text contrast (§9 criterion 10)**
`rgba(255,255,255,0.40)` on `#121214`: effective white value ≈ `rgba(255,255,255,0.40)` over near-black yields luminance ≈ 0.064. Contrast ≈ (0.064+0.05)/(0.005+0.05) ≈ 2.07:1. WCAG AA requires 4.5:1 for normal text. `--text-muted` used as a label in State 4 micro-affordance (line 344 `text-[var(--text-muted)]`) and State 5 badge label (line 215) at `text-xs`. Both FAIL. Note: DESIGN-SYSTEM.md §2 lists `--text-muted` as "Placeholders, disabled" — a strictly disabled/placeholder-only use case. The brief §4 calls for `--text-muted` for these states. The DS and brief are in tension here for contrast compliance. The implementor inherits this from the brief, but it must be flagged as a shipped contrast failure. **Medium severity.**

### Radius, shadow, and spacing
Badge pill padding `px-3 py-1.5` (lines 152, 169, 186, 215) — matches DS §3/§4 brief-specified values. PASS.
`gap-2` glyph-to-label spacing — matches DS. PASS.
`gap-1.5` per-message affordance — matches DS (brief §8 ref: `gap-1.5`). PASS.
Tooltip padding `12px` (line 78) — equivalent to `p-3`. PASS.
Tooltip width `280px` (line 77) — no DS constraint on this; reasonable. No flag.
Tooltip border-radius `--radius-md` (line 77) — matches DS §8 Tooltip spec. PASS.
Tooltip shadow `--shadow-pop` (line 79) — matches DS §5 + brief §4. PASS.

---

## 4. Icon Audit

| Glyph used | Line(s) | Real Phosphor name? | Notes |
|------------|---------|---------------------|-------|
| `ph-fill ph-shield-check` | 153, 254, 266, 389 | PASS | Real. Filled shield with checkmark. Correct use: encrypted/proven state only. |
| `ph ph-lock-open` | 170, 321 | PASS | Real. Open padlock. Used for plaintext-fallback state — correct semantic. |
| `ph ph-shield-slash` | 187 | PASS | Real. Slashed shield. Used for group DM not-encrypted state — correct semantic. |
| `ph ph-key` | 203, 345 | PASS | Real. Key glyph. Used for cannot-decrypt state — correct semantic. |
| `ph ph-circle-notch` | 216, 382 | PASS | Real. Spinning notch circle. Used for loading/establishing state — correct semantic. |
| `ph ph-arrows-clockwise` | 224 | PASS | Real. Clockwise arrows (reload). Used on the replay-simulation button — demo scaffolding only, not a shipped indicator state. |
| `ph ph-magnifying-glass` | 276 | PASS | Real. Search icon. UI chrome. |
| `ph ph-sidebar` | 279 | PASS | Real. Sidebar toggle icon. UI chrome. |
| `ph ph-plus-circle` | 357 | PASS | Real. Plus in a circle. Attachment button. |
| `ph ph-smiley` | 361 | PASS | Real. Smiley face. Emoji button. |

**No invented glyph names found.** All `ph-*` identifiers are verifiable real Phosphor icon names. PASS.

---

## 5. Fail-Closed Analysis (Load-Bearing Ship-Blocker)

### Static markup inspection

Every variant that renders a lock or shield glyph was inspected:

- **Lines 152–159 (State 1, left-column audit):** `ph-fill ph-shield-check` with emerald classes — only rendered inside the "Encrypted" state row, which is a static demo card labelled "State 1 / Encrypted." No conditional logic applies here; this is a hardcoded demo card, not a dynamic component. In the shipped component this card row would be replaced by the real state machine. No leak.

- **Lines 252–261 (right column header badge — full label):** hardcoded to the encrypted/emerald state (`bg-[rgba(var(--rgb-accent-emerald),0.1)]` + `ph-fill ph-shield-check`). This is the "State 1 shown contextually" variant per line 251 comment. In a mockup this is acceptable — the right-column panel is a single-scenario rendering (an encrypted conversation). No leak.

- **Lines 264–268 (narrow viewport icon-only badge):** `ph-fill ph-shield-check` in emerald, hardcoded. Same single-scenario limitation as above. In production this would inherit the parent state and is not an independent lock rendering. No leak in the mockup.

### JS state-machine inspection (lines 372–394)

`simulateKeygen()` transitions the loading badge (element `demo-loading-badge`) from loading → encrypted. The flow:

1. Line 381: forces loading state (surface-700, border-hairline, text-muted, `ph-circle-notch animate-spin`) — no lock present.
2. Lines 386–393: `setTimeout` callback at 2000ms applies encrypted classes and sets `icon.className = "ph-fill ph-shield-check text-base"`.

The lock appears ONLY after the `setTimeout` resolves. There is no early-return or short-circuit path that could apply the shield class before the timer fires. The transition correctly defaults to loading (no lock) and only upgrades on resolution.

**No code path identified that places a lock/shield over a non-encrypted state. Fail-closed criterion is satisfied in both static markup and JS.**

### Residual concern (non-blocking, noted for implementation)
The mockup's right-column header badge is hardcoded to the encrypted state. When B-3 implements the real `E2EStatusIndicator.tsx`, the developer must ensure the initial render defaults to the loading/indeterminate state (not encrypted) and only upgrades on confirmed key resolution. The mockup does not model this initial-render path in the contextual DM canvas — it assumes the conversation is already proven-encrypted. This is acceptable for a mockup (the state-matrix left panel demonstrates all states) but the B-3 developer handoff note should call this out explicitly.

---

## 6. Overall Verdict

**REVISE**

The design is strong, conceptually correct, and pass-closes cleanly on the load-bearing fail-closed criterion. Visual language, icon choices, and the core UX flow are well-executed. However three issues are concrete enough to require revision before APPROVE, and two contrast failures are inherited from the brief but must be resolved:

---

## Prioritised Change List

### P0 — Must fix before APPROVE (functional/accessibility regression)

**REVISE-1: State 1 badge missing `focus-visible:ring-2` (broken keyboard focus ring)**
Brief §6, DESIGN-SYSTEM.md §5 (`--glow-focus`).
Line 152: the class string for State 1's inner badge div includes `ring-[rgba(var(--rgb-accent-emerald),0.4)]` but omits `focus-visible:ring-2`. In Tailwind v3/v4 a `ring-[color]` without a ring-width utility has no visible effect. The encrypted state badge is unreachable by a keyboard-only user with visible feedback.
Fix: add `focus-visible:ring-2` to the class list on the State 1 badge inner div, matching States 2/3/5.

**REVISE-2: Narrow-viewport icon-only badge (lines 264–268) lacks role, aria, tabindex, and tooltip**
Brief §5 (responsive contract), Brief §6 (keyboard-reachable), DESIGN-SYSTEM.md §9 (≥44px touch target).
The `md:hidden` icon-only div renders `ph-fill ph-shield-check` with no accessible label, no `role="status"`, no `aria-live`, no `tabindex="0"`, and no `tooltip-content`. On screens narrower than 768px a student sees a green shield with no reachable explanation.
Fix: (a) convert the narrow badge to a `button` or add `tabindex="0" role="status" aria-live="polite" aria-label="End-to-end encrypted"`; (b) add a `tooltip-content` child with the same plain-language copy; (c) increase to `w-11 h-11` (44px) to meet touch-target requirement, or wrap in a 44px hit-area.

**REVISE-3: State 5 (loading) tooltip-trigger has no tooltip-content child**
Brief §3 (state 5 requires hover/focus tooltip as state 6), Brief §6 (hover/focus reveals plain-language explanation).
The `tooltip-trigger` on State 5 (line 214) has no `tooltip-content` sibling. A keyboard user focused on the loading badge gets a focus ring but no tooltip. A student cannot learn what "Establishing secure connection..." means.
Fix: add a `tooltip-content` div inside the State 5 tooltip-trigger with copy such as "Setting up secure messaging — this takes just a moment." This mirrors the brief §3 state 6 requirement that covers ALL states with a header badge.

### P1 — Should fix before ship (contrast / visual quality)

**REVISE-4: Emerald small-text contrast failure on encrypted badge label**
Brief §9 criterion 10, DESIGN-SYSTEM.md §1 (contrast discipline).
`--accent-emerald` `#10b981` as `text-xs` (12px) on `--surface-900` `#121214` yields approximately 4.0:1 — below WCAG AA 4.5:1 for normal text. The brief §4 mandates emerald for this state but the DS itself corrects this pattern in its Button entry.
Fix options: (a) use `--accent-emerald` for the icon glyph only; shift the label text to `--text-primary` `rgba(255,255,255,0.92)` (which passes at ~17:1) and rely on the emerald glyph + emerald pill border to convey the encrypted colour signal; or (b) use a lighter emerald (approximately `#34d399` / emerald-400) that exceeds 4.5:1 on surface-900. Option (a) is lower risk and consistent with how the DS corrects the analogous button contrast problem.

**REVISE-5: `--text-muted` as small-text label in State 4 and State 5 fails WCAG AA**
Brief §9 criterion 10, DESIGN-SYSTEM.md §2 (muted = placeholders/disabled only).
`rgba(255,255,255,0.40)` on `#121214` at 12px text yields approximately 2.1:1 — a significant contrast failure. The brief §4 calls for `--text-muted` for these states, but the DS defines muted as placeholder/disabled use only, where contrast failure is conventionally accepted. For active status labels these states are NOT decorative — the student must be able to read "No key on this device" and "Establishing secure connection...".
Fix: use `--text-secondary` `rgba(255,255,255,0.60)` (approximately 5.5:1 on surface-900, PASS) for the visible label text in States 4 and 5. The glyph/icon can remain at text-muted since glyph contrast has a lower WCAG threshold (3:1 for non-text UI components). This requires a brief §4 correction note in the B-3 handoff.

### P2 — Minor / polish (non-blocking)

**REVISE-6: `--transition-standard` naming conflict with DS default**
DESIGN-SYSTEM.md §6 (`transition-colors 150ms ease` is the standard; 200ms is specific to presence/connection-state).
The local custom property name `--transition-standard` at line 51 implies it is the system-wide default, but DS standard is 150ms. Rename to `--transition-state-change` or `--transition-connection` to avoid drift signal in the implementation hand-off.

**REVISE-7: Per-message "Sent as standard message" label is slightly opaque**
Brief §2 (anti-security-theater), UX §2 observation.
The label accurately avoids alarming language but "standard message" is jargon. A student unfamiliar with encryption may not understand the distinction from "encrypted message." Consider "Not encrypted" (matching the header badge copy for State 2) to be self-consistent across placements. Keeps the same calm register while removing ambiguity. Low priority — the header badge tooltip handles explanation, but message-level consistency is cleaner.

---

*Review authored in fresh context. No other reviewer's findings consulted.*
