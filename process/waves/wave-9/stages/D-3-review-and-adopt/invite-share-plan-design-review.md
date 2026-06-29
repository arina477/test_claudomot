# Design Review — invite-share.html (wave-9 delta)

**Reviewer:** Reviewer A (fresh context)
**Date:** 2026-06-29
**Subject:** `design/staging/invite-share.html` — permanent-default link + revoke flow (delta over wave-8 approved modal)
**Brief:** `process/waves/wave-9/stages/D-1-brief/invite-share-brief.md`
**Design system ref:** `design/DESIGN-SYSTEM.md`

---

## Per-Dimension Scores

### 1. Visual Hierarchy — 9/10

**Verdict: Passes.**

State 1 (Default) unambiguously presents the permanent invite link as the primary action: the emerald "Copy link" button is the only filled/colored button in the body, the section header reads "Server invite link" with an explicit "Permanent" pill badge, and explanatory copy confirms "This link doesn't expire." The "Generate a limited invite" secondary action appears below a `border-t` hairline divider with a muted `bg-surface-700` button carrying lower visual weight — exactly the demotion brief §1 and §9 require.

The delta check (8b) is satisfied: the default does NOT look like "mint a fresh ad-hoc invite." The permanent link reads first, largest, and in emerald. The only minor gap: in the compact view used in states 5 and 6 (limited-invites list), the permanent link section loses the "Permanent" label pill and the descriptive copy line — it becomes just a bare input + Copy button. This is acceptable compression for a secondary context but slightly reduces the "permanent" signal. It does not rise to a blocking issue.

No change needed to reach 10 for state 1. Consider re-adding the "Permanent" pill to the compact row in states 5/6 if the developer has room (optional; non-blocking).

---

### 2. Spacing Rhythm — 9/10

**Verdict: Passes.**

The implementation rigorously follows DESIGN-SYSTEM.md §3 base-4 scale throughout:
- Panel padding: `px-4 py-4` = 16px (correct per §3 "panel padding 16px").
- Section gaps: `gap-4` = 16px within the body, consistent across all 8 states.
- List-row padding: `px-3 py-2.5` = 12px × 10px — §3 specifies "sidebar item padding 8px×12px"; the 10px vertical is a 2px deviation, but it reads proportionally correct and does not feel off against the dark background. Minor.
- List-row gap: `gap-1.5` = 6px, acceptable as a sub-rhythm step between 4px and 8px.
- Section divider between permanent link and secondary action: `border-t` correctly separates the two hierarchy levels.

Header padding `px-4 py-4` matches the footer, giving consistent frame weight. The `gap-4` body rhythm is consistent across all 8 state panels.

One small deviation: the revoke-confirm (State 7) uses `gap-2 mt-2.5` for the inline confirm action buttons — `mt-2.5` (10px) is not a strict base-4 step. At a 2px off-grid level this is not visible in practice. Non-blocking.

---

### 3. Brand Coherence — 10/10

**Verdict: Passes.**

The design is calm, academic, and quiet throughout. No gaming-neon or aggressive color use. The modal pattern (surface-900 body, surface-800 header strip, hairline borders, shadow-pop, rounded-lg) mirrors `create-server.html` exactly as brief §8 and §4 require. The revoked state uses danger (#ef4444) for text and icon, but it is muted via opacity-70 and the danger application is proportionate — it conveys "this is broken/gone" without alarming the eye. The emerald appears only on the primary Copy action, success feedback, and the active-rail indicator in the background shell — never as decoration. Geist Mono for code strings, Geist sans for all chrome. The dimmed/blurred app-shell behind each modal state provides the proper layered spatial hierarchy per DESIGN-SYSTEM.md §5 elevation order. Toast follows the emerald left-bar pattern from §8 Toast primitive.

---

### 4. Edge-Case / State Handling — 9/10

**Verdict: Passes.**

All 8 declared states (brief §3) are present and visually coherent:

1. **default-permanent** (State 1) — permanent link, Copy, secondary Generate. Clear.
2. **copied** (State 2) — Copy button morphs to "Copied" with `ph-check`, opacity dims to 80%, emerald Toast with `role="status"`. Correct.
3. **loading** (State 3) — skeleton shimmer on the link field AND on 2 limited-invite list rows; Copy disabled with `aria-busy`; dialog has `aria-busy="true"`. Comprehensive.
4. **error** (State 4) — `role="alert"` banner with `ph-warning-circle`, danger border on input, `aria-invalid="true"`, Retry CTA in footer. Correct.
5. **limited-list-populated** (State 5) — scrollable list (max-h-[180px]) with 2 rows, usage/expiry metadata, per-row trash revoke buttons. Correct.
6. **limited-list-empty** (State 6) — dashed-border empty state with centered icon, honest copy, and a "Generate a limited invite" CTA. Correct.
7. **revoke-confirm** (State 7) — inline row expansion to confirm panel with `role="alert"`, danger border, explicit Cancel + danger Revoke button. No one-click accidental revoke. Correct.
8. **revoked** (State 8) — row transitions to dimmed (opacity-70), struck code text (line-through), `ph-prohibit` icon in danger color, "Revoked — this link no longer works." text + Toast. Correct.

One observation: in State 7 (revoke-confirm), the permanent link section is absent from the modal body — the modal jumps directly to the limited-invites list. In the running app this is consistent with State 5/6 layout but it means a first-time reviewer might not realize the permanent link is always present. This is acceptable for a confirm-focused state. Not blocking.

---

### 5. Accessibility — 9/10

**Verdict: Passes.**

**Focus rings:** `.focus-ring` (emerald glow-focus) applied to all interactive controls: close button, link input, Copy button, Generate button, Done/Cancel buttons, all trash revoke buttons (States 5/6), Cancel in State 7. The destructive Revoke confirm button correctly uses `.focus-ring-danger` (glow-danger per DESIGN-SYSTEM.md §5). This satisfies brief §6 and §9.

**ARIA:**
- All 8 dialogs carry `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to a `<h3>` title.
- Loading state uses `aria-busy="true"` on the dialog, `role="status"` on the skeleton div.
- Error state uses `role="alert"` on the error banner.
- Revoke confirm uses `role="alert"` on the confirm panel — correct; this is a destructive action requiring attention.
- Toast uses `role="status"` / `aria-live="polite"` — correct for non-urgent feedback.
- Input fields have `<label for>` (visible or `sr-only`), `aria-label` on the link inputs.
- Icon-only buttons carry `aria-label` describing the specific invite being revoked (e.g., "Revoke limited invite ending pA8wQs") — correct per brief §6.

**Revoked state — not color alone:** State 8 conveys revocation through three parallel channels: (a) `ph-prohibit` icon in danger color, (b) `line-through` text decoration on the code, (c) text "Revoked — this link no longer works." This satisfies WCAG SC 1.4.1 (use of color). Brief §9 criterion met.

**One gap:** In State 3 (loading), the second skeleton `div` carries `aria-hidden="true"` (decorative duplicate) but the first carries `role="status"` with `aria-label="Loading limited invites"`. The disabled "Copy link" button does not carry an `aria-label` explaining it is disabled or why — a screen reader user would hear "Copy link, dimmed" which is adequate but not exceptional. Non-blocking.

**Contrast:** `text-surface-950` on emerald (#10b981) for the primary Copy button — WCAG AA requires 4.5:1; emerald on near-black yields ~4.7:1, borderline passing. The danger (#ef4444) "Revoked" text appears on surface-800 (#1c1c1f) background: contrast ratio ~4.6:1, passes AA for normal text. White text (0.92 opacity) on surface-900 easily passes. All confirmed adequate.

---

### 6. Responsive Behavior — 10/10

**Verdict: Passes.**

The modal is declared `max-w-[460px]` across all 8 state panels, matching brief §5 exactly. No layout reflow is introduced — the modal is a fixed-width overlay on the desktop canvas. The limited-invites list uses `max-h-[180px] overflow-y-auto`, providing internal scroll for >4 rows per brief §5. The custom 6px dark scrollbar (`::-webkit-scrollbar` with `#3f3f46` thumb) matches DESIGN-SYSTEM.md §9 scrollbar spec. The showcase grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`) is for the staging page only and does not affect the modal itself.

---

## Key Delta Checks

### (8b) Permanent link as default — PASS

State 1 (Default) presents the PERMANENT server invite link as the primary visual element. The emerald "Copy link" CTA, the "Permanent" pill, and the sub-label "This link doesn't expire" all make this unambiguous. "Generate a limited invite" is below a divider with a surface-700 secondary button — clearly demoted. The default does NOT present "mint a fresh ad-hoc invite" as primary.

### (revoke) Revoke flow — PASS

- Active limited invites are listed per-row with code excerpt + usage/expiry metadata (States 5, 6, 7, 8).
- Each row has a trash icon-button with a `focus-ring-danger` and `aria-label`.
- Clicking trash does NOT immediately revoke: State 7 shows an explicit inline confirm panel with descriptive consequences ("It will stop working immediately. People who already joined stay in the server."), Cancel, and a danger Revoke button.
- State 8 shows an honest "Revoked — this link no longer works" row with `ph-prohibit`, struck text, and a Toast confirmation. The revoked row is not silently removed.

All four revoke requirements from brief §9 are satisfied.

---

## Minor Items (non-blocking, optional polish)

1. **State 5/6 compact permanent link strip:** The "Permanent" pill label is dropped in the compact view. Consider retaining it as a tiny pill on the input or as a tooltip on the globe icon to preserve the labeling clarity from State 1. (brief §9, §4 — typography badge pattern.)

2. **State 3 loading — Generate button absent:** The loading state does not render the "Generate a limited invite" secondary section, only the link skeleton and list skeleton. If the Generate button is always present for owner/creators, its loading/disabled form should appear during load. Non-blocking for this delta wave.

3. **State 7 revoke-confirm — permanent link not shown:** The modal body in the confirm state only shows the limited-invites list. No regression (permanent link is in a prior scroll region), but if the modal height allows, a collapsed permanent-link bar above the list would maintain spatial consistency with States 5/6.

4. **Revoked Toast accent bar is emerald (success green):** The "Invite revoked" toast in State 8 uses the emerald left bar. A neutral/grey or danger-tinted bar might read more appropriately for a destructive completion (revoke is not a "success" in the positive sense). Low priority — brief §4 only mandates emerald for success; revoke completion is ambiguous.

---

## Summary Table

| Dimension | Score | Pass/Fail |
|---|---|---|
| 1. Visual hierarchy (permanent-primary, generate-secondary) | 9 / 10 | Pass |
| 2. Spacing rhythm (base-4 scale) | 9 / 10 | Pass |
| 3. Brand coherence (calm/academic/dark, modal pattern match) | 10 / 10 | Pass |
| 4. Edge-case / state handling (all 8 states) | 9 / 10 | Pass |
| 5. Accessibility (focus-rings, ARIA, not-color-alone) | 9 / 10 | Pass |
| 6. Responsive behavior (460px fixed, internal list scroll) | 10 / 10 | Pass |
| **Delta: (8b) permanent-link-as-default** | — | **PASS** |
| **Delta: (revoke) confirm + honest revoked state** | — | **PASS** |

All dimensions score 9 or 10. No dimension falls below the 8-point threshold requiring a concrete change for approval.

---

VERDICT: APPROVE
