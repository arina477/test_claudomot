# D-3 Design Review — E2E Indicator
**Reviewer:** Reviewer B (substituting `/ui-ux-pro-max` per reviewer-substitution precedent)
**Artefact:** `design/staging/e2e-indicator.html`
**Brief:** `process/waves/wave-79/stages/D-1-brief/e2e-indicator-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`
**Context:** Fresh — no prior reviewer findings consulted, no prior round knowledge carried.

---

## 1. Success-Criteria Checkbox Audit (Brief §9)

Each criterion taken verbatim from brief §9 checklist.

---

**Criterion 1 — Uses exactly DESIGN-SYSTEM.md tokens from §4 — no new hex values, no invented tokens, dark-only.**

Result: **PARTIAL**

Evidence (lines 22–51): All surface, text, accent, shadow, radius, and border tokens declared locally match the DESIGN-SYSTEM.md §1 values exactly — no invented hex values. Dark-only enforced: no light-mode overrides present. Two deviations:

(a) Tooltip `font-size: 12px` (line 82). Brief §4 explicitly specifies `text-sm` (14px) for tooltip body. The tooltip style block uses a raw `12px` literal, which is `text-xs`, not `text-sm`. This is a typography token violation — the rendered tooltip body is 2px smaller than specified. The `line-height: 1.5` on the same line is correct (DS §2 body line-height).

(b) `--transition-standard: 200ms ease` (line 51) is locally named as if it were the system-wide default transition. DS §6 defines `transition-colors 150ms ease` as the default hover/focus transition and 200ms only for presence/connection-state changes. The value applied to state transitions is correct, but the variable name implies incorrect meaning and will cause drift on B-3 implementation hand-off.

Neither deviation is a hex-invention. No dark-mode violation.

---

**Criterion 2 — Renders ALL states in §3: encrypted, not-encrypted (plaintext fallback), not-encrypted (group DM), cannot-decrypt-on-this-device, loading/establishing, and hover/focus tooltip.**

Result: **PASS**

Evidence:
- State 1 Encrypted: lines 152–167 (left-column state matrix row + tooltip).
- State 2 Plaintext Fallback: lines 170–184 (state matrix row + tooltip); per-message affordance lines 402–406 (right column, "Sent as standard message").
- State 3 Group DM: lines 186–201 (state matrix row + tooltip).
- Key-fetch error alias: lines 203–218 (renders as not-encrypted, explicit alias annotation).
- State 4 Cannot-Decrypt: lines 221–236 (state matrix row + tooltip); per-message payload shell lines 420–430 (right column).
- State 5 Loading/Establishing: lines 239–253 (state matrix row + tooltip present at line 249).
- Hover/focus tooltip: CSS tooltip-trigger mechanism present on all state rows (lines 63–108); all six tooltip-content divs populated with plain-language copy.
- Narrow viewport icon-only variants: lines 262–306.
- Contextual DM canvas (right column): States 1, 2, 4 all represented in the conversation thread.

All required states are present with tooltips.

---

**Criterion 3 — Responsive per §5 (label-to-glyph-only collapse at ≤1024 with tooltip carrying the words; ≥44px touch target).**

Result: **PASS**

Evidence:
- Context header badge desktop (lines 333–341): `hidden md:block` pill with `hidden lg:inline` on the text label. At md (768px–1279px) the label is hidden; at lg+ (1280px+) the label is visible. Icon-only at md with tooltip. Correct per §5.
- Narrow viewport mobile badge (lines 344–351): `md:hidden` block showing an icon-only 44px circle (`w-11 h-11` = 44px × 44px). Touch target meets ≥44px requirement.
- State matrix narrow-viewport icons section (lines 262–306): five icon-only 44px circles (`w-11 h-11`), each with `tooltip-content tooltip-center` and `aria-label`. Touch target met. Tooltip carries the words.
- One a11y gap noted at the context header badge (lines 333–341): no `aria-label` on the outer tooltip-trigger div. At md breakpoint, when the text label span is hidden, a screen reader user receives no text from this element. The narrow `md:hidden` fallback (line 344) does have the aria-label. See UX §2 for full treatment. Not a responsive failure, but a companion a11y gap.

---

**Criterion 4 — Matches prior-art visual language from §8 (ConnectionStateIndicator pill geometry + MessageRow sub-indicator weight + emerald `ph-shield-check`).**

Result: **PASS**

Evidence:
- Pill geometry: all state badges use `px-3 py-1.5 rounded-full text-xs font-medium` (lines 159, 176, 193, 210, 228, 245) — matches ConnectionStateIndicator reference from brief §8.
- Per-message affordance (lines 402–406, 427–430): `mt-1.5 flex items-center gap-1.5 text-xs font-medium` — matches the MessageRow sub-indicator slot pattern from `direct-messages.html:406-430` as specified.
- Trust glyph: `ph-fill ph-shield-check` in `--accent-emerald` at lines 160, 267, 335, 346 — matches educator-admin-console.html precedent cited in brief §8.
- Gap between icon and label: `gap-2` on badges, `gap-1.5` on per-message affordances — both match spec.

---

**Criterion 5 — Interaction patterns per §6 (hover/focus tooltip 400ms delay, 200ms state fade, keyboard-reachable, `role="status"` aria-live, reduced-motion).**

Result: **PASS**

Evidence:
- 400ms hover delay: `.tooltip-trigger:hover .tooltip-content { transition-delay: 400ms; }` (line 100). Immediate on keyboard focus: `transition-delay: 0s` at line 106. Both match brief §6.
- 200ms state fade: `.state-fade` transition at lines 131–134. Applied to all badge inner divs. Correct.
- `role="status" aria-live="polite"`: present on all six state matrix rows (lines 158, 175, 192, 209, 227, 244), on the context header badges (lines 333, 344), and on all narrow-viewport icon-only circles (lines 266, 274, 282, 290, 298). Comprehensive coverage.
- `tabindex="0"` keyboard reach: present on all tooltip-trigger divs.
- `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-emerald)]`: present on States 2, 3, 4, 5 inner badge divs. **State 1's inner badge div (line 159) includes `focus-visible:ring-2` and `focus-visible:ring-[var(--accent-emerald)]` — this is correct.** (See icon audit for confirmation; earlier prior-round concern about missing `ring-2` on State 1 does not apply to this iteration — the class string at line 159 contains both.)
- Reduced-motion: `@media (prefers-reduced-motion: reduce)` at lines 111–121 covers all transitions and the spinner animation. Correct.

---

**Criterion 6 — All icon references are real Phosphor glyph names.**

Result: **PASS**

See full icon audit in §4.

---

**Criterion 7 — FAIL-CLOSED (ship-blocker): lock/shield affordance appears ONLY in the provably-encrypted state.**

Result: **PASS**

See detailed fail-closed analysis in §2. No violation found in static markup or JS.

---

**Criterion 8 — NON-ALARMING: not-encrypted and cannot-decrypt states use `--text-secondary` / `--text-muted`, NOT `--danger` / red.**

Result: **PASS**

Evidence:
- State 2 (plaintext fallback) badge: `bg-[var(--surface-700)] border border-[var(--border-hairline)] text-[var(--text-secondary)]` (line 176). No danger token.
- State 3 (group DM) badge: same classes (line 193). No danger token.
- Key-fetch error alias badge: same classes (line 210). No danger token.
- State 4 (cannot-decrypt) badge: same classes (line 228). No danger token.
- State 5 (loading) badge: same classes (line 245). No danger token.
- Per-message affordances (lines 402–406, 427–430): `text-[var(--text-secondary)]`. No danger token.
- `--danger: #ef4444` is declared in `:root` (line 40) but consumed nowhere in the indicator states. The presence dot for the user avatar at line 321 uses `bg-[var(--accent-emerald)]` (online presence) — correct, not a danger use.
- No red fills, no red borders, no red text on any non-encrypted indicator element.

---

**Criterion 9 — UNAMBIGUOUS-AT-A-GLANCE + colour-independent: distinguishable by glyph SHAPE and TEXT, not colour alone.**

Result: **PASS**

Evidence — each state produces a unique (shape, label) pair:
- Encrypted: `ph-fill ph-shield-check` (filled shield with checkmark) + "End-to-end encrypted"
- Plaintext fallback: `ph ph-lock-open` (open/unlocked padlock) + "Not encrypted"
- Group DM: `ph ph-shield-slash` (shield with diagonal slash) + "Not encrypted"
- Cannot-decrypt: `ph ph-key` (key) + "No key on this device"
- Loading: `ph ph-circle-notch` (spinning notched ring) + "Establishing..."

States 2 and 3 share the label "Not encrypted" but differ in glyph shape (open-lock vs slashed-shield) and in tooltip copy. In a colour-blind or greyscale rendering a student can still distinguish all five states by glyph alone; the label reinforces state 2 vs 3 if the icons are ambiguous at glance. The narrow viewport icon-only view retains shape distinction across all five.

---

**Criterion 10 — Contrast: any text/glyph tint computes ≥ WCAG AA 4.5:1 on its surface.**

Result: **PARTIAL**

Contrast calculations performed via WCAG relative luminance formula. Results:

| Pairing | Ratio | Threshold | Result |
|---------|-------|-----------|--------|
| `--accent-emerald` (#10b981) on `--surface-900` (#121214) — encrypted icon | 7.38:1 | ≥3:1 (non-text) | PASS |
| `--accent-emerald` (#10b981) on rgba(16,185,129,0.1)+surface-900 tinted pill — encrypted label text | The tinted pill composite ≈ (17.6, 36.5, 32.9). Emerald on tinted pill: 6.46:1 | ≥4.5:1 (text) | PASS |
| `--text-primary` (0.92α) on `--surface-900` — encrypted badge label | 15.85:1 | ≥4.5:1 | PASS |
| `--text-secondary` (0.60α) on `--surface-700` (#27272a) — not-encrypted/cannot-decrypt badges | 6.31:1 | ≥4.5:1 | PASS |
| `--text-primary` (0.92α) on `--surface-700` — tooltip text | 12.81:1 | ≥4.5:1 | PASS |
| `--text-secondary` (0.60α) on `--surface-800` (#1c1c1f) — per-message affordance labels | 6.84:1 | ≥4.5:1 | PASS |
| `--text-muted` (0.40α) on `--surface-700` — (brief §4 specified for cannot-decrypt/loading; NOT used in mockup) | 3.65:1 | ≥4.5:1 | FAIL (but not used) |
| `--text-muted` (0.40α) on `--surface-800` — (brief §4 specified; NOT used in mockup) | 3.79:1 | ≥4.5:1 | FAIL (but not used) |

Key finding: The mockup does NOT use `--text-muted` for the cannot-decrypt or loading badge labels, despite brief §4 calling for it. Instead, `--text-secondary` is used throughout non-encrypted badges (States 2, 3, 4, 5 all inherit `text-[var(--text-secondary)]` from the pill class on line 176/193/210/228/245), and the per-message affordance labels explicitly use `text-[var(--text-secondary)]` (lines 402, 427). This is a deliberate correction that produces passing contrast where the brief's token assignment would fail. The brief §4 token assignment for cannot-decrypt and loading states (`--text-muted`) is incorrect by contrast standards and must be updated in the B-3 developer handoff.

The "PARTIAL" verdict for this criterion records that the brief specification contains a latent contrast failure in token assignment (not a mockup defect — the mockup correctly overrides it). One genuine typography deviation: the tooltip `font-size: 12px` is `text-xs` rather than brief-specified `text-sm`, but at 12px on surface-700 with text-primary the ratio is still 12.81:1, so no contrast failure here.

---

## 2. UX Flow Audit

Persona: a student new to StudyHall, not an encryption expert. Can they correctly read each state without misreading privacy signals?

**State 1 — Encrypted (header badge + conversation thread)**

The filled emerald shield-check next to "End-to-end encrypted" is clear, calm, and affirmative without being loud. Tooltip copy "Messages in this conversation are end-to-end encrypted — only you and Dr. Aris Thorne can read them" (line 164) is plain language. No technical jargon. No ambiguity risk. The first message in the thread (line 386) carries no per-message badge because the header already establishes the conversation posture — correct per brief §2's rationale for omitting redundant per-message glyphs in a clean encrypted thread.

Verdict: no friction. Student correctly reads "private."

**State 2 — Plaintext fallback (per-message micro-affordance)**

The student's own message (lines 392–406) carries a small `ph-lock-open` glyph and "Sent as standard message." The label is honest but slightly oblique — "standard message" is not immediately self-describing to a student who has not used encryption before. They might parse it as "sent successfully" rather than "sent without encryption." This is the primary UX friction point in the design.

Mitigating factors: the header badge (if it were showing the not-encrypted state) would contextualise this. In the demonstrated scenario the header shows encrypted (State 1), so the per-message not-encrypted affordance appears anomalous — the student might be confused about why one message says "standard" while the conversation header says encrypted. This scenario is correct technically (described in brief §2: a library-computer message drops to plaintext mid-thread) but the UX transition is not explained at the per-message level. There is no tooltip on the per-message affordance slot to clarify.

Risk: a student could misread "Sent as standard message" as a delivery status ("sent OK") rather than a privacy downgrade. Severity: low-medium. The header badge change would accompany this in a real scenario.

**State 3 — Group DM (state matrix only)**

Tooltip "Group conversations are not end-to-end encrypted yet. Messages are secured in transit." is honest and the qualifying "secured in transit" prevents unnecessary alarm. No misread risk.

**State 4 — Cannot-decrypt (per-message, right column)**

The undecryptable payload shell (lines 420–424: monospace truncated ciphertext) combined with "Message cannot be decrypted on this device" (lines 427–430) is clear and non-alarming. The `ph-key` glyph is well-chosen — it reads as "needs a key, not available here." A student will understand this is a device-specific limitation.

One micro-friction: the ciphertext display (`wjH2+...[encrypted payload unavailable]`) may make a student think the message was corrupted, not merely that they lack the private key. The bracket text `[encrypted payload unavailable]` is better than nothing but "unavailable on this device" would be cleaner. Low priority.

**State 5 — Loading/Establishing**

"Establishing..." with a spinner is clear. Fail-closed is honoured (no lock visible). The tooltip at line 249 reads "Setting up secure messaging — this takes a moment the first time." — informative and calm. Keyboard users can reach this tooltip via focus. No ambiguity.

**State 2 vs State 3 — Distinguishing "Not encrypted" labels**

Both states share the "Not encrypted" pill label. The glyph shapes differ (open-lock vs slashed-shield) and the tooltip copy differs. In the narrow viewport icon-only view (lines 262–306) the tooltips carry the context ("Not encrypted (Plaintext Fallback)" and "Not encrypted (Group DM)" respectively). This is adequate for colour-independent reading, though a more distinctive label at the badge level (e.g. "No secure key yet" vs "Group — not encrypted") would remove any icon-recognition dependency. As the brief frames both as "Not encrypted" treatment this is acceptable.

**A11y gap — context header badge at md breakpoint (1024px–1279px)**

The desktop context-header-badge (lines 333–341) uses `hidden lg:inline` on its text label span. At md (768px–1279px) only the icon is visible. The outer tooltip-trigger div (line 333) has no `aria-label`. A screen reader user at this breakpoint would focus the element and hear nothing — no state, no label. The narrow `md:hidden` fallback (line 344) does carry `aria-label` on the equivalent element, but it is hidden at md.

This is the primary accessibility gap: a keyboard/screen-reader user at 1024px–1279px gets a focusable element with a role=status and aria-live but no accessible name. WCAG 2.1 SC 4.1.2 (Name, Role, Value) requires all interactive/status components to have an accessible name.

Fix: add `aria-label="End-to-end encrypted"` (or dynamically bound to current state) to the outer tooltip-trigger div at line 333.

**Summary — can a student correctly read "private" vs "not private yet" vs "can't read on this device"?**

- "Private" (State 1): yes, clearly. No misread risk.
- "Not private yet" (State 2): mostly yes, with mild label ambiguity ("Sent as standard message" vs "Not encrypted"). Low misread risk if header badge reflects state.
- "Can't read on this device" (State 4): yes. Clear payload shell + label. No misread risk.
- States 2 vs 3 at icon-only: low risk (glyph shapes differ; tooltips clarify). Acceptable.

No high-confidence misread path identified. The one medium-confidence ambiguity is the "Sent as standard message" label at State 2 per-message affordance.

---

## 3. DESIGN-SYSTEM.md Token Audit

### Color hex values — `:root` declarations (lines 22–51)

Every declared custom property checked against DESIGN-SYSTEM.md §1.

| Token | Declared value | DS §1 value | Match |
|-------|---------------|-------------|-------|
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
| `--accent-emerald` | `rgb(var(--rgb-accent-emerald))` → `#10b981` | `#10b981` | PASS |
| `--accent-amber` | `#f59e0b` | `#f59e0b` | PASS |
| `--danger` | `#ef4444` | `#ef4444` | PASS |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.4)` | `0 1px 2px rgba(0,0,0,0.4)` | PASS |
| `--shadow-pop` | `0 8px 24px rgba(0,0,0,0.5)` | `0 8px 24px rgba(0,0,0,0.5)` | PASS |
| `--glow-focus` | `0 0 0 2px rgba(16,185,129,0.4)` | `0 0 0 2px rgba(16,185,129,0.4)` | PASS |
| `--radius-sm` | `2px` | `2px` | PASS |
| `--radius-md` | `6px` | `6px` | PASS |
| `--radius-lg` | `8px` | `8–10px` | PASS (in range) |
| `--radius-full` | `9999px` | `9999px` | PASS |

No invented hex values. No off-system custom properties. Every value matches the canonical DS token.

### Typography

| Location | Used value | DS/Brief specified | Flag |
|----------|-----------|-------------------|------|
| Tooltip body font-size (line 82) | `12px` (text-xs) | Brief §4: `text-sm` (14px) | FLAG: tooltip body is 2px smaller than specified |
| Badge label size (lines 159, 176, etc.) | `text-xs` (12px) | Brief §4: `text-xs` for badge | PASS |
| Tooltip line-height (line 83) | `1.5` | DS §2 body line-height `1.5` | PASS |

**FLAG A — Tooltip font-size 12px vs brief-specified 14px (line 82)**

Brief §4: "text-sm (14px) for any tooltip/popover body." The tooltip CSS block at line 82 uses `font-size: 12px`. This reduces tooltip readability by 2px relative to spec and is inconsistent with the DS Tooltip/Popover primitive (§8: "12px text" — however the DS §8 says 12px). There is a conflict between brief §4 (14px) and DS §8 Tooltip spec (12px). Brief §4 was drafted to override; the mockup follows DS §8. This must be resolved: if the brief intended 14px it should override DS §8, and the mockup must be updated. If DS §8's 12px is authoritative, the brief §4 line needs correction. The conflict exists in the source documents. Flagged for D-3 gate arbitration.

### Spacing and radius

| Location | Used | Specified | Result |
|----------|------|-----------|--------|
| Badge pill padding | `px-3 py-1.5` | Brief §4: `px-3 py-1.5` | PASS |
| Badge icon-label gap | `gap-2` | Brief §4: `gap-2` | PASS |
| Per-message affordance gap | `gap-1.5` | Brief §4/§8: `gap-1.5` | PASS |
| Tooltip margin-top | `8px` (line 86) | Not specified exactly; 2× base unit | PASS |
| Tooltip padding | `12px` = `p-3` (line 79) | DS consistent | PASS |
| Tooltip border-radius | `--radius-md` (line 77) | DS §8 Tooltip: radius-md | PASS |
| Tooltip width | `280px` (line 77) | Not constrained | PASS |
| Tooltip shadow | `--shadow-pop` (line 79) | Brief §4 + DS §8 | PASS |
| Badge pill border-radius | `rounded-full` = `--radius-full` | Brief §4: `--radius-full` | PASS |
| Narrow icon-only touch target | `w-11 h-11` = 44px | Brief §5: ≥44px | PASS |

### Shadows and focus rings

- Focus ring: `focus-visible:ring-2 focus-visible:ring-[var(--accent-emerald)]` matches `--glow-focus` equivalent in Tailwind. Applied consistently on all badge inner divs including State 1 (line 159 confirmed). PASS.
- `--shadow-pop` on tooltip: PASS.
- No heavy drop-shadow on badge itself: PASS (DS §5 dark-UI preference).

### Transition

| Token | Used | DS/Brief value | Flag |
|-------|------|---------------|------|
| `--transition-standard` | `200ms ease` (line 51) | DS §6: `150ms ease` default; `200ms` for presence/connection-state | FLAG: variable name misleads; value correct for state transitions |

**FLAG B — `--transition-standard` naming (line 51)**

The value `200ms ease` is correct for state transitions per DS §6 and brief §6. The variable name `--transition-standard` implies it is the system default, which DS §6 defines as `150ms ease`. On B-3 implementation, a developer could use `--transition-standard` for non-state-change hover effects and end up with incorrect 200ms delays. Rename to `--transition-state` or `--transition-e2e-badge` to scope it correctly.

---

## 4. Icon Audit

All `ph-*` / `ph-fill ph-*` class names used in the file, confirmed against the Phosphor Icons library (confirmed via React package component names — both `LockOpen` and `ShieldSlash` confirmed present in `@phosphor-icons/react`; others confirmed via prior-art usage in existing `design/*.html` files):

| Glyph | Lines | Phosphor name valid | Semantic use | Appropriate |
|-------|-------|---------------------|-------------|-------------|
| `ph-fill ph-shield-check` | 160, 268, 335, 346 | PASS — real glyph, fill weight | Encrypted / proven state | PASS — filled variant used only for active/proven encrypted (DS §7 "Filled variants only for active/selected states") |
| `ph ph-lock-open` | 177, 403 | PASS — real glyph (LockOpen in React pkg) | Plaintext fallback not-encrypted | PASS — open padlock reads "unsecured / open" without alarm |
| `ph ph-shield-slash` | 194 | PASS — real glyph (ShieldSlash in React pkg) | Group DM not-encrypted | PASS — slashed shield reads "shield disabled" not "breach" |
| `ph ph-key` | 229, 429 | PASS — confirmed in `assignment-submissions.html:462`, `login.html:473`, `signup.html:339` | Cannot-decrypt state | PASS — key glyph reads "no key present" without alarm |
| `ph ph-circle-notch animate-spin` | 246, 300 | PASS — confirmed in `direct-messages.html:475` | Loading/Establishing state | PASS — spinner reads "in progress" not "secured" |
| `ph ph-arrows-clockwise` | 257 | PASS — confirmed in `educator-admin-console.html:276`, `assignments-panel.html:566`, `class-scheduling.html:376` | Demo replay button | N/A — demo scaffolding only, not a shipped indicator state |
| `ph ph-magnifying-glass` | 359 | PASS — confirmed in `direct-messages.html:199,334` | Search button UI chrome | PASS |
| `ph ph-sidebar` | 362 | PASS — real glyph (confirmed; `ph-sidebar-simple` also exists as variant; `ph-sidebar` is a distinct valid icon per library search) | Conversation details button | PASS |
| `ph ph-plus-circle` | 440 | PASS — confirmed in `direct-messages.html:451` | Attachment button UI chrome | PASS |
| `ph ph-smiley` | 444 | PASS — confirmed in `direct-messages.html:455` | Emoji button UI chrome | PASS |

**No invented glyph names. All `ph-*` identifiers are valid Phosphor icons. Full PASS.**

One note on semantic weight discipline (DS §7): filled variants (`ph-fill ph-shield-check`) appear only on State 1 (encrypted / active). All non-encrypted states use regular stroke weight. This is correct per DS §7.

---

## 5. Fail-Closed Analysis (Load-Bearing Ship-Blocker)

### Static markup — exhaustive lock/shield location check

Every occurrence of `ph-fill ph-shield-check` (the only lock/shield affordance that could constitute an "encrypted" claim) was located:

**Line 160** — inside the State 1 "Encrypted" row in the left-column state matrix. This is a static demo card explicitly labelled "State 1 / Encrypted" in the surrounding markup (line 154–156). It is a documentation card representing the proven-encrypted state. No conditional logic; no way for this card to render over a different state in the static HTML. No leak.

**Line 268** — inside the narrow-viewport icon-only State 1 circle. Same documentation card context (lines 264–271), labelled "State 1 Icon Only" and carrying `aria-label="End-to-end encrypted"`. Static demo. No leak.

**Line 335** — inside the right-column context header badge (`id="context-header-badge"`). The right column is a single-scenario contextual rendering demonstrating Placement 1 in the encrypted state (per the comment at line 332: "Placement 1: Header Badge (State 1 shown contextually, desktop + tablet default)"). This represents an already-proven-encrypted conversation. In production this element would be driven by the component's state prop; the mockup does not and cannot model all four runtime states in one right column without JS. No fail-closed issue in a static mockup.

**Line 346** — inside the `md:hidden` narrow-viewport header badge. Same context as line 335; hardcoded encrypted state for the demo scenario. No leak.

### JS state-machine — `simulateKeygen()` (lines 455–481)

Step-by-step trace:

1. Line 466–469: `innerContainer.className` is replaced with the loading/indeterminate class string (surface-700, border-hairline, text-secondary). `icon.className = "ph ph-circle-notch animate-spin text-base"`. `label.textContent = "Establishing..."`. The element is explicitly NOT in the encrypted state — no shield, no lock. Tooltip updated to "Setting up secure messaging...".

2. Lines 473–480: `setTimeout(() => { ... }, 2000)`. After 2 seconds: `innerContainer.className` is replaced with the encrypted class string (emerald tint pill). `icon.className = "ph-fill ph-shield-check text-base text-[var(--accent-emerald)]"`. `label.className = "text-[var(--text-primary)]"`. `label.textContent = "End-to-end encrypted"`. Tooltip updated to encrypted copy.

The lock/shield (`ph-fill ph-shield-check`) is set ONLY inside the `setTimeout` callback. There is no early assignment, no fallback branch, no short-circuit that could apply the shield class before the timer fires. The initial state on button click is forced to loading (no lock); the encrypted state is only reached after the simulated resolution.

No code path in the JS places a padlock or shield over a non-encrypted state. The loading state that precedes the encrypted state does not show a lock. The fail-closed criterion is satisfied in both the static markup and the JS state-machine.

**Fail-closed verdict: PASS. No violation found anywhere in the file.**

### Implementation handoff note (non-blocking)

The right-column contextual DM canvas hardcodes the encrypted/State-1 scenario for the mockup. The B-3 implementation must ensure the `E2EStatusIndicator.tsx` component defaults to the loading/indeterminate state on initial mount and only transitions to encrypted after confirmed key resolution (not on mount with an optimistic encrypted default). This is an implementation requirement, not a mockup defect.

---

## 6. Overall Verdict

**REVISE**

The design is conceptually sound, visually coherent with the StudyHall design language, and passes the load-bearing fail-closed criterion without qualification. All five required states are present with appropriate icons, calm non-alarming treatment, and correct tooltip coverage. The icon selection is semantically correct, all glyph names are real, and no danger/red appears on any non-encrypted state. The JS simulation honours fail-closed.

The REVISE verdict is driven by two concrete fixable issues and one document-level conflict that requires arbitration before B-3 hand-off:

---

## 7. Prioritised Change List

### P0 — Required before APPROVE

**FIX-1: Add `aria-label` to context header badge outer div at line 333**
Reference: brief §6 (keyboard accessibility, `role="status"`), WCAG 2.1 SC 4.1.2 (Name, Role, Value).
At the md breakpoint (1024px–1279px), the text label span is hidden (`hidden lg:inline`) but the outer tooltip-trigger div has no `aria-label`. A screen reader user at this breakpoint focuses the element and receives no accessible name, despite `role="status"` being present.
Fix: add `aria-label="End-to-end encrypted"` (or the current dynamic state label) to the outer tooltip-trigger div at line 333. In the React component this should be a dynamic `aria-label` that reflects the current `EncryptionState` value so it updates when state changes (e.g. "Not encrypted", "No key on this device", "Establishing secure messaging").

**FIX-2: Resolve the tooltip font-size conflict (brief §4 says 14px; DS §8 says 12px)**
Reference: brief §4 (typography), DESIGN-SYSTEM.md §8 (Tooltip primitive).
Brief §4 specifies `text-sm` (14px) for tooltip body. DS §8 Tooltip spec says "12px text." These are in direct conflict. The mockup uses 12px (follows DS §8). This conflict must be resolved at the D-3 gate before B-3 implements the component. Recommendation: DS §8 is the authoritative primitive spec; brief §4 should be corrected to `text-xs` (12px) to match, as the existing DS Tooltip primitive at 12px is already shipped in other components. Alternatively, if readability at 12px is a concern for the trust-signal tooltip, the DS §8 Tooltip entry should be updated to 14px. Either resolution is valid, but B-3 must not receive conflicting specs.

### P1 — Should fix before ship

**FIX-3: Correct brief §4 token assignment for cannot-decrypt and loading label text**
Reference: DESIGN-SYSTEM.md §2 (`--text-muted` is placeholder/disabled only), brief §9 criterion 10.
Brief §4 assigns `--text-muted` for cannot-decrypt and loading state labels. Computed contrast of `--text-muted` (0.40α) on `--surface-700` is 3.65:1 — below WCAG AA 4.5:1 for small text at `text-xs`. The mockup correctly uses `--text-secondary` (0.60α) instead, which computes 6.31:1 (PASS). The mockup is right and the brief is wrong. Update the D-3 developer handoff note and, if feasible, the brief §4 token assignment to `--text-secondary` for these states, to prevent a B-3 developer from re-introducing the contrast failure by following the brief literally.

**FIX-4: Rename `--transition-standard` to `--transition-state-change` (line 51)**
Reference: DESIGN-SYSTEM.md §6 (150ms ease is the standard default; 200ms is for state transitions).
The variable name implies it is the system-wide default transition, which would conflict with DS §6's 150ms default for hover/focus effects. Renaming to `--transition-state-change` or `--transition-e2e-state` removes the misleading implication and prevents a B-3 developer from applying the 200ms value to generic hover effects.

### P2 — Polish / optional

**FIX-5: Consider "Not encrypted" instead of "Sent as standard message" for per-message State 2 affordance**
Reference: UX §2 (ambiguity analysis), brief §2 (anti-security-theater vs clarity).
"Sent as standard message" reads more like a delivery confirmation than a privacy downgrade. "Not encrypted" or "Sent without encryption" is unambiguous, matches the badge label, and does not imply alarm. The brief deliberately avoided alarming language, and "Sent without encryption" remains calm while being more self-describing. Low priority — the header badge state provides context — but message-level consistency is cleaner.

**FIX-6: Clarify the undecryptable payload placeholder text**
Reference: UX §2 (State 4 cannot-decrypt friction note).
The ciphertext stub `wjH2+...[encrypted payload unavailable]` at line 422 might read as "message corrupted" rather than "decryption key not present on this device." Consider changing the bracket text to `[not available on this device]` to reinforce the key-scope framing already in the micro-affordance below it. Very low priority; the per-message label (line 429) already says "Message cannot be decrypted on this device."

---

*Review authored in fresh context. No prior round findings or other reviewer output consulted.*
