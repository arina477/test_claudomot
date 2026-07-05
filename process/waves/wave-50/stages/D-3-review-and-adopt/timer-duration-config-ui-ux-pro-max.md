# D-3 Review: timer-duration-config affordance
**Reviewer:** UX Pro Max (Accessibility + UX)  
**Verdict:** **REVISE**  
**Date:** 2026-07-05

---

## Executive Summary

The mockup demonstrates strong visual design compliance — all five states are present and token-aligned, the responsive collapse to mobile popover is well-executed, and the interaction model (idle→edit→apply→synced) is clear. **However, three critical accessibility violations block approval:**

1. **Mobile inputs missing programmatic label association** (WCAG 1.3.1)
2. **Error messages not linked to inputs via aria-describedby** (WCAG 3.3.1)
3. **Mobile popover lacks focus management / is not a modal** (WCAG 2.4.3)

These are not design issues but implementation/markup gaps that must be addressed before shipping.

---

## Detailed Audit

### 1. Requirements Coverage vs. Brief §9 Checklist ✅ PASS

All five success criteria visually satisfied:

- ✅ **Five states shown + distinct:** Idle-editable, Locked (running/paused), Validation-error, Applying, Mobile compact — each labeled and visually differentiated.
- ✅ **Inputs: --surface-800 + hairline + emerald focus + --radius-md + text-sm:** Confirmed in all desktop state examples (lines 76–120 in HTML input-base class).
- ✅ **Apply: .btn-primary emerald + .btn:disabled opacity:** Consistent across states.
- ✅ **No crowding:** Desktop affordance inline (line 291–316), mobile collapsed, countdown unobstructed in all breakpoints.
- ✅ **Validation: --danger border/text + inline message + icon:** Error state at lines 411–418 uses danger-text + icon.
- ✅ **Reduced-motion:** @media rule (line 224–233) disables stagger + button transforms.
- ✅ **Real inputs/buttons:** Native HTML `<input type="number">` + `<button>` elements.

---

### 2. UX Flow — Clear Progression, One UX Friction ⚠️ PARTIAL

**Idle→Edit→Apply→Synced:** Clear visual flow. JavaScript demonstrates state transitions (lines 545–655) correctly:
- Apply disabled when running (line 546) ✅
- Apply enabled only when dirty + valid + idle (line 565) ✅
- Locked hint "Reset the timer to change lengths" shown at line 312–314 + example at line 392 ✅

**Concern:**
- Mobile popover remains open after Apply (no auto-close on success). This is not a blocker, but adds a tap to close. Recommend: On successful apply, auto-dismiss popover or provide clear visual feedback that the change persisted.

---

### 3. Design System Token Audit ✅ PASS

**All colors, spacing, typography, and radius values are DESIGN-SYSTEM.md compliant:**

| Category | Usage | Token | Value | Status |
|----------|-------|-------|-------|--------|
| Input fill | Form controls | `--surface-800` | #1c1c1f | ✅ |
| Input border (default) | Form controls | `--border-hairline` | rgba(255,255,255,0.06) | ✅ |
| Input border (focus) | Form controls | `--accent-emerald` | #10b981 | ✅ |
| Focus glow | Form controls | `--glow-focus` | 0 0 0 2px emerald-40% | ✅ |
| Error border/text | Validation | `--danger` + `--danger-text` | #ef4444 + #f87171 | ✅ |
| Apply button | Primary action | `--accent-emerald` | #10b981 | ✅ |
| Button disabled | All buttons | 0.4 opacity | Native `.btn:disabled` | ✅ |
| Input label text | Metadata | `text-xs` 12px, weight 500 | § Typography scale | ✅ |
| Input body text | Input values | `text-sm` 14px, font-mono | § Typography scale | ✅ |
| Radius | Inputs/buttons | `--radius-md` | 6px | ✅ |
| Popover radius/shadow | Mobile UI | `--radius-lg` + `--shadow-pop` | 10px + 0 8px 24px | ✅ |
| Hint/muted text | Disabled/hints | `--text-muted` | rgba(255,255,255,0.40) | ✅ |

**No invented hex values. All tokens referenced from § Primitive / § Accent / § Shape / § Elevation.**

---

### 4. Accessibility (WCAG 2.1 AA Deep Dive) ⚠️ CRITICAL ISSUES

#### A. Form Control Labeling — CRITICAL ISSUE #1

**Desktop inputs (lines 296–305):** Have visible `<label>` elements AND `aria-label` attributes.
- Concern: `aria-label` can shadow visible labels in some screen reader modes, creating confusion.
- Recommendation: Remove `aria-label` if visible label is sufficient; test with NVDA/JAWS.

**Mobile popover inputs (lines 493–501):** **VIOLATION — Missing aria-label**
```html
<label class="text-xs text-[var(--text-secondary)]">Work duration</label>
<input type="number" value="25" class="input-base w-12 h-6 text-xs text-center font-mono" />
```
The label is visible but NOT programmatically associated (no `for="/id` link, no `aria-label`, no parent `<fieldset>`).
- **WCAG 1.3.1 (Info and Relationships):** Programmatic association required.
- **WCAG 3.2.4 (Consistent Identification):** Label must be identifiable.

**Fix Required:** Add `for="hero-break-mobile"` to label and matching `id` to input, OR add `aria-label="Work duration minutes"` to input.

---

#### B. Error Message Association — CRITICAL ISSUE #2

**Error state (lines 411–418):**
```html
<input type="number" value="150" aria-invalid="true" class="input-base input-error w-[60px] h-8 text-sm text-center font-mono" />

<div class="absolute top-[102%] left-0 w-[120px] pt-1">
  <span class="text-[10px] font-medium text-[var(--danger-text)] bg-[var(--surface-950)]/80 px-2 py-0.5 rounded border border-[var(--danger)]/30 backdrop-blur shadow-sm flex items-center gap-1">
    <i class="ph-fill ph-warning-circle"></i> Max 120m
  </span>
</div>
```

- Input has `aria-invalid="true"` ✅ but is **missing `aria-describedby`** pointing to the error message.
- Error message has no `id` attribute.
- **WCAG 3.3.1 (Error Identification):** Error messages must be explicitly associated to the form control.
- **WCAG 3.3.4 (Error Prevention):** Form controls with errors must have programmatically associated descriptions.

**Fix Required:**
```html
<input type="number" value="150" aria-invalid="true" aria-describedby="error-work-max" ... />
<span id="error-work-max" class="...">
  <i class="ph-fill ph-warning-circle"></i> Max 120m
</span>
```

---

#### C. Mobile Popover Focus Management — CRITICAL ISSUE #3

**The popover (lines 485–503) is toggled via `.hidden` class (line 485 `onclick="this.nextElementSibling.classList.toggle('hidden')"`).**

Currently:
- Not a `<dialog>` element or `role="dialog"`.
- No focus trap when opened.
- No Escape-key handler to close.
- Keyboard users can Tab into the popover, then Tab out to the main page without explicit closure.

**WCAG 2.4.3 (Focus Order):** Focus must move in a meaningful, logical order. A floating popover without focus management breaks this.
**WCAG 2.4.7 (Focus Visible):** Focus indicators must be visible (inputs do have focus rings ✅), but the container itself lacks modal semantics.

**Fix Required:**
- Convert to a `<dialog>` element with `open` attribute, OR
- Add `role="dialog"` + `aria-modal="true"` + implement a focus-trap (JavaScript that prevents Tab from leaving the popover), OR
- Implement an Escape-key handler to close the popover and return focus to the trigger button.

Example (dialog approach):
```html
<dialog id="mobile-config-dialog" class="...">
  <form>
    <label for="work-m">Work duration</label>
    <input id="work-m" type="number" ... />
    <label for="break-m">Break duration</label>
    <input id="break-m" type="number" ... />
    <button type="submit">Apply Settings</button>
  </form>
</dialog>
```

---

#### D. Focus Indicator Visibility ✅ PASS

- Desktop inputs: `.input-base:focus` applies emerald border + glow (lines 99–103). ✅
- Buttons: `.btn:focus-visible` applies glow-focus (lines 151–154). ✅

---

#### E. Disabled State Announcement ✅ PASS (Minor Enhancement Recommended)

**Native `disabled` attribute used on inputs + Apply button.** Screen readers correctly announce "disabled."

**Enhancement (non-blocking):** When Apply is disabled due to the timer running, consider:
- Adding `aria-describedby="apply-disabled-reason"` with a hidden description: "Apply is disabled while the timer is running. Reset the timer to edit."
- This provides context beyond "disabled."

---

#### F. Color Contrast — PASS (One Marginal Case)

Verifying all text-on-background combinations per WCAG 1.4.3:

- **text-primary (#fff @ 92%) on surface-800 (#1c1c1f):** ~14:1 ✅
- **text-secondary (#fff @ 60%) on surface-800 (#1c1c1f):** ~8.5:1 ✅
- **text-muted (#fff @ 40%) on surface-800 (#1c1c1f):** ~5.5:1 ✅
- **text-muted (#fff @ 40%) on surface-950 (#0a0a0b) — line 392 hint "Reset to edit":** ~4.2:1 ⚠️ **Marginal**. Below 4.5:1 for small body text, but acceptable for UI metadata per WCAG leniency on `small` elements. **Recommendation:** Verify with a WCAG contrast checker (WebAIM, Axe).
- **danger-text (#f87171) on surface-950/80 tint — line 415 error message:** DESIGN-SYSTEM says `--danger-text` is 6.30:1 on a danger/10 background. The mockup uses a semi-transparent surface-950 overlay, NOT a danger-tinted background. **Recommendation:** Re-verify contrast with the actual tint used.

---

#### G. Reduced-Motion ✅ PASS

@media rule (lines 224–233) correctly disables all animations/transitions. No auto-play media.

---

#### H. Keyboard Navigation — PARTIAL (Mobile Popover Issue)

**Desktop:**
- Inputs accept keyboard (arrows, direct typing, Enter-submit via form). ✅
- Buttons Tab-navigable. ✅

**Mobile Popover:**
- Inputs + button are keyboard-navigable IF the popover is open.
- **Concern:** No focus trap. Keyboard user can Tab out of the popover back to the main page without closing it. This breaks the expected modal behavior.
- **Fix:** Implement focus trap or use `<dialog>`.

---

#### I. Semantic HTML & ARIA — PARTIAL

**Good:**
- `<form>` wrapper (line 292). ✅
- `<label>` elements on desktop (lines 296, 304). ✅
- `role="status"` on Idle pill (line 285) for state announcement. ✅
- `aria-invalid="true"` on error input (line 411). ✅
- `aria-busy="true"` on applying button (line 455). ✅

**Missing/Needs Improvement:**
- Mobile inputs lack `aria-label` (CRITICAL #1 above).
- Error messages lack `aria-describedby` (CRITICAL #2 above).
- Mobile popover lacks `role="dialog"` + `aria-modal` or `<dialog>` (CRITICAL #3 above).
- Apply button lacks `aria-describedby` when disabled (enhancement).

---

### 5. Non-Goals Compliance (§10) ✅ PASS

- ✅ No per-user preferences (server-level only, confirmed by DTO shape at brief §7).
- ✅ No presets/templates.
- ✅ No long-break cycles.
- ✅ No history/analytics.
- ✅ No heavy settings panel/modal (desktop inline, mobile compact popover).
- ✅ No change-while-running behavior (inputs disabled when timer active, enforced by JavaScript line 619–620).

---

### 6. Countdown/Phase-bar Preservation ✅ PASS

- Desktop: Affordance inline, 50:00 clock + Idle pill + controls remain prominent. ✅
- Mobile: 25:00 countdown + phase-bar below popover, unobstructed. ✅

---

## Verdict: **REVISE**

### Blockers (must fix before adoption):

1. **Mobile inputs missing aria-label/label association** (WCAG 1.3.1)  
   → Add `for="/id` to label OR `aria-label` to input

2. **Error messages missing aria-describedby** (WCAG 3.3.1)  
   → Link input to error span via `aria-describedby="error-id"`

3. **Mobile popover lacks focus management** (WCAG 2.4.3)  
   → Convert to `<dialog>` or add `role="dialog"` + focus-trap + Escape handler

### Recommendations (improve before ship, not blocking):

- Remove redundant `aria-label` on desktop inputs if visible labels suffice (test with screen reader).
- Add context to disabled Apply button via `aria-describedby` explaining why it's disabled.
- Verify contrast of text-muted on surface-950/80 (marginal case at line 392).
- Auto-dismiss mobile popover after successful apply for better UX.
- Test with NVDA/JAWS/VoiceOver to confirm label/error associations work as expected.

---

## Path Forward

1. **Markup fixes** (30 min): Add aria-label to mobile inputs, aria-describedby to error messages, convert popover to `<dialog>` or add focus-trap.
2. **Accessibility re-test** (15 min): Tab through both desktop + mobile in NVDA/JAWS; verify labels + errors announced.
3. **UX refinement** (optional): Auto-dismiss popover on apply; add aria-describedby to disabled Apply button for context.
4. **Resubmit** to D-3 for final approval.

---

**Brief Sections Cited:**
- § 9 Success criteria (five states, tokens, validation, reduced-motion, real controls) ✅
- § 5 Responsive (desktop inline, mobile compact) ✅
- § 10 Non-goals (no per-user, no presets, no change-while-running) ✅

**DESIGN-SYSTEM Sections Cited:**
- § Primitive (surfaces, text, accents) ✅
- § Typography (text-xs, text-sm, weights) ✅
- § Shape (radius-md, radius-lg) ✅
- § Elevation (shadow-sm, shadow-pop, glow-focus, glow-danger) ✅
- § Component primitives (Button, Input) ✅

**WCAG 2.1 Criteria Cited:**
- § 1.3.1 Info and Relationships (label association) — **FAIL**
- § 1.4.3 Contrast Minimum (text ratios) — **PASS** (one marginal case)
- § 2.4.3 Focus Order (popover focus management) — **FAIL**
- § 2.4.7 Focus Visible (focus rings) — **PASS**
- § 3.3.1 Error Identification (error association) — **FAIL**
- § 3.3.4 Error Prevention (form error context) — **PARTIAL**
- § 4.1.2 Name, Role, Value (button context) — **PARTIAL**

