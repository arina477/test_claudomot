# D-3 Plan Design Review — Block UI (re-review)
wave-70 · reviewer: ui-designer · artifact: `design/staging/block-ui.html`
review-pass: 2 (re-review after REVISE refine)

---

## Sources reviewed
- `design/staging/block-ui.html` (the candidate, post-refine)
- `process/waves/wave-70/stages/D-1-brief/block-ui-brief.md`
- `design/DESIGN-SYSTEM.md`

---

## Verification of prior REVISE items

### [A11y-1] Tab-cycle focus trap — FIXED

The prior verdict cited the absence of a `keydown` Tab interceptor inside `#block-modal`. The refine adds `handleModalKeydown` (lines 452–476), registered via `document.addEventListener('keydown', handleModalKeydown)` on modal open (line 433) and removed on close (line 443). Within that handler:

- `if (e.key === 'Escape')` — closes the modal (lines 453–455). Pre-existing behavior, confirmed still present.
- `if (e.key === 'Tab')` — enters a focus-cycling branch (line 457).
  - Queries `modal.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')` to obtain all focusable children (line 458).
  - `if (e.shiftKey)` (Shift+Tab): if focus is on the first element, `e.preventDefault()` and move to `last` (lines 464–467).
  - `else` (Tab): if focus is on the last element, `e.preventDefault()` and move to `first` (lines 469–474).

Two distinct Tab-direction paths are present within the single listener, satisfying the "2 Tab keydown handlers" description. Initial focus is seeded to `confirmBtn` on open (line 429). Focus is restored to `previousActiveElement` on close (line 446). This is a structurally complete focus trap meeting WCAG 2.1 SC 2.1.2 and DESIGN-SYSTEM §8 Modal/Dialog spec. **FIXED.**

---

### [Token-1] `bg-danger-hover` → registered `#991b1b` — FIXED

The prior verdict noted `hover:bg-danger-hover` was an unregistered class. The confirm button at line 350 now carries:

```
hover:bg-danger-btnHover
```

The Tailwind config at line 54 registers `danger.btnHover: '#991b1b'`. This makes `bg-danger-btnHover` a valid generated utility class resolving to `#991b1b` (≈8.3:1 white-on-fill per DESIGN-SYSTEM §1 `--danger-btn` annotation: "hover darkens to `#991b1b` ≈8.3:1"). The old unregistered `bg-danger-hover` class is gone. **FIXED.**

---

### [Token-2] `text-danger-text` token registration — FIXED

The prior verdict noted `danger.text` was absent from the Tailwind config, making `text-danger-text` resolve to undefined/inherit. The Tailwind config at line 56 now registers:

```js
danger: {
    ...
    text: '#f87171',
}
```

This makes `text-danger-text` a valid generated utility resolving to `#f87171`. DESIGN-SYSTEM §1 documents `--danger-text: #f87171` with the note "6.30:1 (PASS)" on `danger/10` tint. The dropdown Block trigger at line 285 (`text-danger-text`) and the error toast icon at line 605 (`text-danger-text`) both now resolve correctly. **FIXED.**

---

## Regression check — all earlier-approved items

| Item | Status | Evidence |
|---|---|---|
| Destructive confirm = `--danger-btn` `#b91c1c` white ≥4.5:1 | PASS | Line 350: `bg-danger-btn`; Tailwind config line 53 maps `danger.btn: '#b91c1c'`. `text-white`. White-on-`#b91c1c` ≈6.5:1. Comment on line 349 explicitly calls this out. |
| `#ef4444` (danger.base) used only for non-text/decorative | PASS | `bg-danger-base` on toast accent bar; `hover:bg-danger-base/10` on dropdown hover tint; `border-danger-base/20` on error toast button border. None are button fills under white text. |
| Toast `role=alert` / `role=status` | PASS | `showToast`: `const role = type === 'error' ? 'alert' : 'status'` (line 597). Injected toast HTML at line 602 uses `role="${role}"`. |
| Modal `role=dialog` + `aria-modal` + `aria-labelledby` | PASS | Line 322: `role="dialog" aria-modal="true" aria-labelledby="dialog-title"`. Title element at line 332 carries `id="dialog-title"`. |
| Esc closes modal | PASS | `handleModalKeydown` lines 453–455: `if (e.key === 'Escape') { closeBlockModal(); return; }` |
| Focus on open | PASS | Line 429: `setTimeout(() => { confirmBtn.focus(); }, 100)` — seeds focus to the confirm button 100ms after open, after CSS transition. |
| Mobile bottom-sheet portal-safe | PASS | `#block-modal-backdrop` at line 319 is a direct child of `<body>`, `fixed inset-0 z-50`. `items-end` at mobile, `items-start` at desktop. No transformed ancestor. |
| Informational text uses `--text-secondary` | PASS | Dialog body line 338: `text-text-secondary`. Settings description line 167: `text-text-secondary`. Row metadata lines 203, 218: `text-text-secondary`. |
| Block affordance NOT on own self-row | PASS | Self-row (lines 249–260) has a kebab `<button>` with no `onclick="openBlockModal()"` and no `block-trigger-btn` class. Block item is absent from its DOM entirely. |
| Phosphor icons | PASS | CDN load at line 23: `https://unpkg.com/@phosphor-icons/web`. All icons use `ph ph-*` classes. |
| Geist typography | PASS | Google Fonts load at line 20. `fontFamily.sans: ['Geist', ...]` at line 31. Body uses Geist. |
| Tokens-only (no invented hex in class attributes) | PASS | All color utilities in class attributes resolve to named Tailwind token extensions defined in the config block. No `text-[#...]` raw hex overrides in class attributes. |

No regressions detected.

---

## Per-dimension scores (updated)

### 1. Visual Hierarchy — 9 / 10
No change from prior pass. Structural hierarchy is unchanged and still sound. The minor drag-handle/title overlap on mobile noted previously is still present but remains a polish item, not a blocking concern.

### 2. Spacing Rhythm — 9 / 10
No change from prior pass. All spacings remain 4px-multiples and match DESIGN-SYSTEM §3.

### 3. Brand Coherence — 9 / 10
No change from prior pass. Calm/academic tone maintained. The "for your safety" empty-state copy phrasing remains; still a minor tone item, not a design-system violation.

### 4. Edge-Case / State Handling — 10 / 10
No change from prior pass. All dialog and list states are present and interactive. The focus-trap fix does not alter any state-handling logic.

### 5. Accessibility — 9 / 10
Prior score: 7/10. Structural gap [A11y-1] (focus trap) is now closed. Token gaps [Token-1] and [Token-2] are both registered. Updated score reflects:

- [A11y-1] Focus trap: FIXED (now cycles Tab/Shift+Tab within `#block-modal`).
- [Token-1] `danger-hover` hover class: FIXED (`bg-danger-btnHover` = `#991b1b`).
- [Token-2] `text-danger-text` token: FIXED (`danger.text: '#f87171'` registered).
- Remaining polish items from prior pass (not blocking): self-row kebab lacks `aria-hidden` or `aria-label`; no explicit `focus-visible:ring-*` classes for DESIGN-SYSTEM `--glow-focus` emerald ring. These were noted as non-blocking in the prior review and remain so — they are implementation-layer polish items, not structural WCAG failures that block design adoption.

Score: 9/10. One point held for the two remaining polish items.

### 6. Responsive — 9 / 10
No change from prior pass. Bottom-sheet and settings-list responsive behavior unchanged and correct.

---

## Key check results (per brief §11 / rubric)

| Check | Result |
|---|---|
| Destructive confirm uses `--danger-btn` `#b91c1c` | PASS |
| `#ef4444` used only as non-text/decorative | PASS |
| Toast `role=alert` (error) / `role=status` (success) | PASS |
| Modal `role=dialog` + Esc + focus-on-open | PASS |
| Tab-cycle focus trap inside `#block-modal` | PASS — added in refine |
| Mobile bottom-sheet portal-safe | PASS |
| Informational text uses `--text-secondary` | PASS |
| Block affordance NOT on viewer's own row | PASS |
| Phosphor + Geist + tokens-only | PASS |
| `danger-hover` hover token registered | PASS — `bg-danger-btnHover` (#991b1b) |
| `danger-text` token registered | PASS — `danger.text: '#f87171'` |

All 11 checks pass.

---

## Verdict

**APPROVE**

All three items from the prior REVISE verdict are remediated:

1. The Tab/Shift+Tab focus trap is implemented in `handleModalKeydown` and correctly cycles focus within `#block-modal`'s focusable children with first↔last wrapping in both directions.
2. The confirm button hover uses `hover:bg-danger-btnHover` resolving to the registered `#991b1b` token; `bg-danger-hover` is gone.
3. `danger.text: '#f87171'` is registered in the Tailwind config; `text-danger-text` is now a valid, resolving utility class.

No regressions detected on any of the seven earlier-approved criteria. The design file is ready for adoption into `design/`.

Brief refs: §6 (focus-trap + a11y), §9 (all 6 success criteria met), §11 (danger #b91c1c confirmed, reversible safety copy, bottom-sheet, portal-safe) · DESIGN-SYSTEM refs: §1 (`--danger-btn`, `--danger-btnHover`, `--danger-text`), §8 Modal ("focus-trap, role=dialog, aria-modal, Esc"), §8 Toast ("role=alert/status").
