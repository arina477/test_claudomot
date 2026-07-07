# D-3 Plan-Design Review — Moderation Report Surfaces
## Reviewer: ui-designer — CYCLE 4 (POST-REWORK RE-REVIEW)

Artifact reviewed: `design/staging/moderation-report.html`
Brief: `process/waves/wave-69/stages/D-1-brief/moderation-report-brief.md`
Design system: `design/DESIGN-SYSTEM.md`
Prior review (Cycle 3): this file, superseded by this document.

---

## Primary Verification: Toast ARIA Fix (Surviving Defect from Head-Designer Gate)

The head-designer gate identified one surviving defect after Cycle 3 APPROVE: the `showToast()` function emitted toasts with no ARIA semantics — no `role=alert/status`, no `aria-live` — making the toast invisible to screen readers and causing a WCAG 4.1.3 failure for the inbox-action error state (the only feedback channel for that error).

### Verification of the fix

**Lines 807–808 of `design/staging/moderation-report.html`:**

```js
toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
```

Both `setAttribute` calls execute immediately after `const toast = document.createElement('div')` (line 805) and before `toast.className = ...` (line 816) and `toast.innerHTML = ...` (line 817). This sequencing is correct: the ARIA role and live-region designation are stamped onto the element before it is inserted into the DOM via `container.appendChild(toast)` (line 819). Screen readers observe the live-region contract at insertion time; setting role and aria-live before appendChild is the required pattern.

**Role mapping — correct:**
- `type === 'error'` → `role="alert"` + `aria-live="assertive"`. The DESIGN-SYSTEM §8 Toast primitive specifies `role="alert"` for errors. Assertive live regions interrupt the screen reader immediately — appropriate for an action failure that requires user attention (retrying the report submission or the inbox action).
- All other types (`'success'`, `'info'`, default) → `role="status"` + `aria-live="polite"`. Polite live regions announce at the next idle point — appropriate for confirmations that do not require immediate re-engagement.

**Toast text inside the role-bearing element — confirmed:**
`toast.innerHTML` at line 817 sets content directly on the `toast` div that carries the role. The message text lives in a child `<span class="font-medium">${message}</span>`. The role-bearing element is the container; all text content is a descendant. Screen reader live-region announcement fires on the container's subtree. This is the correct structure.

**Error path call-sites — both covered:**
1. `submitReport()` line 728: `showToast("Network error: Failed to submit report. Please try again.", "error")` — triggers `role="alert"` + `aria-live="assertive"`.
2. `handleAction()` line 764: `showToast("Network error: Failed to process action. Please try again.", "error")` — triggers `role="alert"` + `aria-live="assertive"`.

Both inbox-action error states (form submission failure and row-action failure) are now screen-reader-announced. WCAG 4.1.3 PASS.

**Success path call-sites — both covered:**
1. `submitReport()` line 739: `showToast("Report submitted successfully.", "success")` — `role="status"` + `aria-live="polite"`. Correct.
2. `handleAction()` line 782: `showToast("${actMsg} successfully.", "success")` — `role="status"` + `aria-live="polite"`. Correct.

**Toast ARIA fix status: VERIFIED. No remaining WCAG 4.1.3 concern.**

---

## Regression Check: All Prior-Cycle Fixes

### Cycle 3 concerns (5 items)

| ID | Concern | Line(s) | Verdict |
|----|---------|---------|---------|
| C1 | Nav badge uses `--danger-btn` (#b91c1c) not `--danger` (#ef4444) | Line 238: `bg-[var(--danger-btn)] text-white text-[10px] font-bold`. `--danger-btn: #b91c1c` at line 44. White on #b91c1c = 6.47:1. WCAG AA PASS. | NO REGRESSION |
| C2 | Modal close button has visible focus ring | Lines 172–177: `.modal-close { outline: none; } .modal-close:focus-visible { box-shadow: var(--glow-focus); }`. Close button at line 536 carries class `modal-close`. `--glow-focus = 0 0 0 2px rgba(16,185,129,0.4)`. WCAG 2.4.7 PASS. | NO REGRESSION |
| C3 | Informational text uses `--text-secondary` not `--text-muted` | "Reason provided" labels lines 315, 355, 399; rail section headers lines 444, 466, 483; timestamps lines 304, 346, 388, 489 — all `text-[var(--text-secondary)]`. `--text-muted` confined to: lock icon (line 227, decorative), char-count (line 548, placeholder-class indicator), JS char-count color resets (lines 683, 700). All legitimate uses. ~5.97:1 on surface-800. WCAG AA PASS. | NO REGRESSION |
| C4 | `handleAction()` has network-error branch (error toast, row stays) | Lines 758–765: `if (!window._inboxErrorShown)` guard — first action fires error path, restores button, leaves row in place, shows error toast. Subsequent actions succeed. | NO REGRESSION |
| C5 | Viewport meta has no `maximum-scale` | Line 10: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`. `maximum-scale` absent. WCAG 1.4.4 PASS. | NO REGRESSION |

### Cycle 1 / Cycle 2 earlier-cycle items

| Item | Evidence | Verdict |
|------|----------|---------|
| Danger buttons #b91c1c / white ≥4.5:1 | `.btn-danger { background-color: var(--danger-btn); color: #ffffff; }` lines 134–136. White on #b91c1c = 6.47:1. Hover #991b1b = 8.31:1. All three inbox buttons (r1 Delete, r2 Timeout, r3 Delete File) carry `btn-base btn-danger`. | NO REGRESSION |
| Emerald primary DARK text ≥4.5:1 | `.btn-primary { background-color: var(--accent-emerald); color: var(--surface-950); }` lines 129–131. #0a0a0b on #10b981 = 7.80:1. DESIGN-SYSTEM §8 explicit: "surface-950 dark text". Submit button uses `btn-base btn-primary`. | NO REGRESSION |
| Nav badge on `--danger-btn` not #ef4444 | Line 238: `bg-[var(--danger-btn)]`. Confirmed above as #b91c1c. | NO REGRESSION |
| Informational text `--text-secondary` | Confirmed above under C3. | NO REGRESSION |
| Modal `role=dialog` + focus-trap | `role="dialog" aria-modal="true" aria-labelledby="modal-title"` line 514. `trapFocus()` lines 621–641; `document.addEventListener('keydown', trapFocus)` line 643. Escape fires `closeModal()`. | NO REGRESSION |
| Skeleton loading | `#loading-skeletons` block lines 262–281; two `.skeleton-shimmer` rows. `DOMContentLoaded` hides skeletons after 1500ms and fades in list (lines 591–600). Shimmer keyframe lines 103–106. | NO REGRESSION |
| Mobile bottom sheet | Modal: `items-end sm:items-center sm:p-4` line 514. Panel: `rounded-t-[var(--radius-lg)] sm:rounded-b-[var(--radius-lg)] rounded-b-none` line 520. Close animation: `translateY(100%)` on <640px, `translateY(20px) scale(0.96)` on desktop (lines 670–675). Footer buttons: `w-full sm:w-auto` + `flex-row-reverse sm:flex-row` lines 573–576. | NO REGRESSION |
| Report affordances on all 3 target types | Server card flag: `aria-label="Report Server"` line 457. Member row flag: `aria-label="Report Member"` line 475. Message hover-bar flag: `aria-label="Report Message"` line 499. All present and labeled. | NO REGRESSION |
| Phosphor icons only | All icon elements use `ph` / `ph-fill` class prefix throughout. No SVG inlines, no alternate icon library. Spinner: `ph ph-spinner` line 578. | NO REGRESSION |
| Token discipline | All `:root` tokens lines 21–63 match DESIGN-SYSTEM §1 hex values exactly. `--danger-btn: #b91c1c` declared in `:root` with rationale comment. One carry-over minor note: line 392 `bg-[#10b981]` is the exact `--accent-emerald` value — not an invented color. Non-blocking implementation note. | NO REGRESSION |

**All prior-cycle fixes confirmed. Zero regressions.**

---

## Dimension Scores

### 1. Visual Hierarchy — 9 / 10

The three-surface hierarchy is intact and unchanged from Cycle 3.

**Dialog:** Flag icon with danger-tint background anchors modal purpose. Title and contextual subtitle read as a unified two-line header. The bounded textarea is the single focal point in the body. Character counter is paired at the trailing edge of the label row — appropriate inline placement. Footer differentiates as an action zone via surface-950 tinted background and top border. The 2px gradient top-edge accent provides a depth signal without adding visual weight.

**Inbox rows:** Three-tier content hierarchy holds across all three report types: target artifact (message bubble / member chip / file tile) at highest weight; reason block at body weight; action row at base. Avatar column anchors reporter context on wider viewports. Time metadata at 11px `--text-secondary` recedes correctly.

**Affordances rail:** Three-block layout with 11px uppercase prefix labels clearly demonstrates the consistent flag entry-point pattern across all three target surfaces.

**Residual gap (non-blocking, consistent with prior cycles):** The "Active Reports" section header carries no count badge. On narrow viewports where the sidebar collapses, the only count signal disappears. Adding a count chip inline with the header would close this on narrow viewports. Low priority.

---

### 2. Spacing Rhythm — 8 / 10

4px base grid is consistent throughout. Row padding `py-6 px-4` = 24px / 16px matches DESIGN-SYSTEM §3 section-gap value. Modal body `p-6` = 24px; footer `py-4` = 16px — correct density step for a footer zone. Form label-to-input stack uses `gap-2` (~8px), matching §8 "8px stack" pattern. Skeleton rows faithfully mirror live row proportions.

Affordances rail uses `space-y-8` (32px) between the three example blocks — deliberate and appropriate for distinctly different target types in a 320px panel.

**Carry-over minor note (non-blocking):** Empty state uses `min-h-[400px]` inside a `flex-1 overflow-y-auto` container. On short viewports this floor could push content below the fold. `h-full flex items-center justify-center` without the min-h floor would be more robust. Implementation-level note.

---

### 3. Brand Coherence — 10 / 10

Aesthetic ("calm, academic, low-noise dark mode") fully executed with no drift.

Zinc surface stack matches DESIGN-SYSTEM §1 role definitions exactly: surface-950 app frame, surface-900 sidebar and modal panels, surface-800 inbox canvas. Emerald appears only in: active nav indicator, presence dot, primary Submit button, focus glow ring, empty-state resolve icon — all within "primary accent / academic focus / success" semantic brief. Amber appears only at the char-count near-limit warning — "secondary accent / warning" role. Danger red appears at: destructive action buttons, nav count badge, quoted-message left-edge accent bar, and flag icon tint in the modal header — all within "destructive / error" semantic brief. No color appears outside its documented semantic role.

Iconography: Phosphor only. Line-weight regular for inactive states; filled variants reserved for active/semantic states. Spinner uses CSS `spin` keyframe — correct; DESIGN-SYSTEM §8 "never spinners for content lists" applies to full-panel content loading, not submit-button loading states.

---

### 4. Edge-Case / State Handling — 10 / 10

**Dialog states — all verified:**
- Default: textarea empty, char-count "0 / 300", placeholder visible.
- Submitting: `submitBtn.disabled = true`, label opacity 0, spinner shown, dimensions preserved. Double-submit prevented.
- Success: success toast + `closeModal()` which resets value, char-count, error state, and button state.
- Error (network): `reason.toLowerCase().includes('error')` triggers error toast (`role="alert"` + `aria-live="assertive"` — now ARIA-correct), re-enables submit, focuses `reasonInput`, modal stays open with form content intact.
- Validation (empty submit): `input-error` class applies `--glow-danger` ring; `#form-error` div with danger-tint background and `--danger-text` label; `clearInlineError()` fires on next keystroke.

**Inbox states — all verified:**
- Loading: `#loading-skeletons` visible on DOMContentLoaded, replaced after 1500ms by list fade-in.
- List: three rows with correct actions per target type (Delete for message/resource, Timeout for member, Dismiss ghost on all).
- Per-row actioning: button locked to width, label replaced with spinner, disabled during async wait.
- Error (action failure): `window._inboxErrorShown` guard ensures first action fires error path — toast type "error" (`role="alert"` + `aria-live="assertive"` — now ARIA-correct), button restored, row stays.
- Resolved: `row-dismiss` keyframe collapses height + opacity + padding; `row.remove()`, `reportCount--`, `updateInboxState()` after 400ms. Nav badge decrements.
- Empty: `#empty-state` reveals with `animate-modal-enter` when `reportCount` reaches zero. Check-circle + "All clear" + contextual copy.

Brief §3 state matrix: fully satisfied.

---

### 5. Accessibility — 10 / 10

**Toast ARIA (the surviving defect) — FIXED AND VERIFIED:**
`showToast()` at lines 807–808 stamps `role` and `aria-live` onto each toast element before DOM insertion. Error toasts: `role="alert"` + `aria-live="assertive"`. Success/info toasts: `role="status"` + `aria-live="polite"`. Toast text is a descendant `<span>` of the role-bearing element — live-region announcement fires on the container's subtree. Both error call-sites (`submitReport()` and `handleAction()`) use `type='error'`, both success call-sites use `type='success'`. WCAG 4.1.3 PASS.

**Full contrast matrix (all passing):**
- Primary button dark text on emerald: #0a0a0b on #10b981 = 7.80:1 PASS.
- Danger button white text: white on #b91c1c = 6.47:1 PASS. Hover #991b1b = 8.31:1 PASS.
- Nav badge white on #b91c1c: 6.47:1 PASS.
- Danger text #f87171 on tinted error background: ~6.19:1 PASS.
- `--text-secondary` on surface-800: ~5.97:1 PASS.
- `--text-secondary` on surface-900: ~6.59:1 PASS.
- Amber #f59e0b on surface-800 (char-count warning): ~5.44:1 PASS.

**Structural ARIA — all correct:**
- Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"` with matching `id="modal-title"`.
- Scrim: `aria-hidden="true"`.
- Close button: `aria-label="Close dialog"`, `.modal-close:focus-visible { box-shadow: var(--glow-focus); }` — visible 2px emerald ring. WCAG 2.4.7 PASS.
- Flag affordance buttons: `aria-label="Report Server"`, `aria-label="Report Member"`, `aria-label="Report Message"`.
- Focus trap: Tab/Shift+Tab wrap; Escape closes.
- `aria-current="page"` on active nav item.
- Viewport meta: `maximum-scale` absent. WCAG 1.4.4 PASS.
- Informational 11px text: `--text-secondary` throughout. WCAG AA PASS.

**Residual non-blocking implementation note (unchanged from Cycle 3):** The React (`title="React"`) and Reply (`title="Reply"`) floating action bar buttons in the message-hover affordances section (lines 495–496) carry only `title` attributes, not `aria-label`. These are demo-context buttons in a staging file, outside the brief's primary scope. The Report button on the same bar has both `title` and `aria-label="Report Message"` — correct. Noted for implementation handoff; does not affect design approval.

**Accessibility score promoted from 9 to 10:** The one WCAG 4.1.3 failure that prevented a clean 10 in prior cycles has been corrected. The two carry-over non-blocking notes are implementation-level observations on a staging file, not design failures.

---

### 6. Responsive — 10 / 10

**Dialog mobile bottom sheet:** Modal container `items-end sm:items-center justify-center sm:p-4` (line 514). Panel `rounded-t-[var(--radius-lg)] sm:rounded-b-[var(--radius-lg)] rounded-b-none` (line 520). Close animation `translateY(100%)` on <640px vs `translateY(20px) scale(0.96)` on desktop (lines 670–675). Footer buttons `w-full sm:w-auto` with `flex-row-reverse sm:flex-row`. `max-h-[90vh] sm:max-h-[85vh]` prevents viewport consumption. All correct.

**Inbox rows:** `flex-col sm:flex-row` with avatar `hidden sm:block` collapses to single-column on narrow viewports. Action buttons use `flex-wrap`. Correct.

**Multi-column breakpoints:** Sidebar `hidden lg:flex` (absent <1024px). Affordances rail `hidden md:flex` (absent <768px). On medium viewports inbox+rail only; on narrow viewports inbox-only — full report workflow operable. Correct.

**Toast container:** `fixed bottom-6 right-0 left-0 sm:left-auto sm:right-6` (line 586) — full-width on mobile, bottom-right on desktop. Matches DESIGN-SYSTEM §8 Toast placement. Correct.

**Viewport zoom:** `maximum-scale` absent. WCAG 1.4.4 PASS. Correct.

---

## Token / Hex Discipline Audit

All `:root` CSS custom properties match DESIGN-SYSTEM §1–§6 token names and hex values exactly. `--danger-btn: #b91c1c` declared in `:root` with rationale comment — a correct design-system extension, not an ad-hoc inline override. `--danger-tint: rgba(239,68,68,0.1)` and `--danger-text: #f87171` match DESIGN-SYSTEM §1 exactly.

Remaining inline hex: line 392 `bg-[#10b981]` = exact `--accent-emerald` value. Not an invented color; non-blocking token hygiene note for production (use `bg-[var(--accent-emerald)]`).

No off-palette hex values. Phosphor icons only. Token discipline: PASS.

---

## Brief §9 Success Criteria Checklist

- [x] Report dialog: modal with bounded reason field + primary Submit + Cancel, dark-theme, matching create-server chrome; success + error + validation states.
- [x] Report control (flag icon) on all 3 target types: server discovery card (`aria-label="Report Server"`), member row (`aria-label="Report Member"`), message hover action bar (`aria-label="Report Message"`).
- [x] Owner inbox: list with target artifact + reason + reporter + time; Timeout (danger, member), Delete (danger, message/resource), Dismiss (ghost); correct per target type.
- [x] Inbox loading skeleton: two shimmer skeleton rows, fade-out after 1500ms.
- [x] Inbox empty state: check-circle + "All clear" + contextual copy + entrance animation.
- [x] Inbox action error state: first action always triggers error toast, restores button, leaves row in place.
- [x] Destructive actions use `--danger-btn` fill with white text — 6.47:1 PASS.
- [x] Primary Submit uses `--accent-emerald` with `--surface-950` dark text — 7.80:1 PASS per DESIGN-SYSTEM §8.
- [x] Dismiss / Cancel use ghost variant.
- [x] Moderator-only inbox gated under "Moderation" nav section with lock-key icon and `moderate_members` tooltip.
- [x] WCAG AA — nav badge: white on `--danger-btn` #b91c1c = 6.47:1 PASS.
- [x] WCAG 2.4.7 — close button focus ring: `.modal-close:focus-visible { box-shadow: var(--glow-focus); }` — visible emerald ring. PASS.
- [x] WCAG AA — informational 11px text: `--text-secondary` throughout — ~5.97:1 PASS.
- [x] WCAG 1.4.4 — `maximum-scale` absent from viewport meta — mobile zoom permitted. PASS.
- [x] WCAG 4.1.3 — toasts carry `role="alert"` / `role="status"` and `aria-live="assertive"` / `"polite"` respectively; error toast text is inside the role-bearing element. PASS.
- [x] All colors/type/spacing/icons from DESIGN-SYSTEM; Phosphor only.
- [x] 3px decorative danger accent strip on message bubble is non-text — no contrast rule. Correct.

All brief §9 criteria satisfied.

---

## Summary

Cycle 4 post-rework re-review. The one surviving defect identified by the head-designer gate — WCAG 4.1.3 failure due to missing ARIA semantics on toasts — is fully and correctly fixed. `showToast()` now calls `setAttribute('role', ...)` and `setAttribute('aria-live', ...)` at lines 807–808, before DOM insertion, on the element whose `innerHTML` carries the toast text. Error toasts receive `role="alert"` + `aria-live="assertive"`; success and info toasts receive `role="status"` + `aria-live="polite"`. Both error call-sites and both success call-sites are covered. The fix is structurally correct per the live-region announcement model.

No regressions are present on any of the prior five Cycle 3 concerns or the earlier-cycle fixes. All twelve checked items — danger button contrast, emerald primary contrast, nav badge token, informational text token, modal ARIA, focus-trap, skeleton loading, mobile bottom sheet, report affordances, Phosphor icons, token discipline, and viewport meta — are confirmed unchanged and correct.

The accessibility dimension score advances from 9/10 to 10/10 as the WCAG 4.1.3 failure is resolved. All other dimension scores are unchanged. The two carry-over non-blocking notes (inline hex #10b981 at line 392; `aria-label` absent on React/Reply demo buttons in the affordances rail) remain implementation-level observations that do not constitute design failures.

---

## Verdict

**APPROVE**

The toast ARIA fix is correct: `role="alert"` + `aria-live="assertive"` for error toasts, `role="status"` + `aria-live="polite"` for success/info toasts, both set on the role-bearing element before DOM insertion, with all toast text as descendants of that element. No regressions on any prior fix. The artifact meets WCAG AA contrast and focus requirements, WCAG 4.1.3 live-region requirements, WCAG 1.4.4 zoom requirements, the brief §3 state matrix, the brief §9 success criteria, and DESIGN-SYSTEM §1–§8 token and component conventions. Ready for B-block implementation.
