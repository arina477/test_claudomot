# D-3 Design Review — notifications-center.html
**Reviewer role:** Phase-1 Reviewer A ("plan-design-review" lens)
**Artifact:** `design/staging/notifications-center.html`
**Brief:** `process/waves/wave-37/stages/D-1-brief/notifications-center-brief.md`
**Design System:** `design/DESIGN-SYSTEM.md`
**Date:** 2026-07-02

---

## Verdict: REVISE

No hard REJECT conditions fire (no invented hex outside the token set, no spinner for the content list loading state, all four panel states present). However, five fixable issues — panel padding shortfall, off-token raw hex, off-token custom shadow, missing 9+ badge cap, and a missing static 0-unread bell illustration — prevent an unqualified APPROVE. All issues are correctable without a redesign.

---

## Dimension Scores

| # | Dimension | Score | Threshold met? |
|---|-----------|-------|---------------|
| 1 | Visual hierarchy | 8 / 10 | Yes |
| 2 | Spacing rhythm | 7 / 10 | Borderline |
| 3 | Brand coherence | 8 / 10 | Yes |
| 4 | Edge-case / state handling | 7 / 10 | Borderline |
| 5 | Accessibility | 8 / 10 | Yes |
| 6 | Responsive | 8 / 10 | Yes |

**Composite: 7.7 / 10**

---

## Dimension 1 — Visual Hierarchy (8 / 10)

**What works.** The bell → badge → panel → rows → actions chain reads cleanly. The unread emerald left-dot establishes a consistent scan-anchor, the type icon (@ vs calendar-check) differentiates notification kinds at a glance, and the "Mark all read" action is correctly elevated into the panel header rather than buried in rows. The separator line between unread and read sections provides a natural break. The actor name bolded (`font-medium text-text-primary`) inside `text-text-secondary` body text creates good within-row hierarchy.

**Concern.** The "Loaded" panel state is only present in the interactive prototype section (Section 1). The static State Dictionary in Section 2 documents three states (Empty, Error, Loading) but omits a standalone loaded/populated panel tile. Reviewers and implementers comparing the static dictionary cannot see the loaded-state hierarchy in isolation.

**What would make it a 10.** Add a fourth tile to the Section 2 grid showing the loaded state at rest (3+ rows, unread + read mix), matching the dictionary's own "Exhaustive configuration" label. Keep all other hierarchy decisions as-is.

---

## Dimension 2 — Spacing Rhythm (7 / 10)

**Brief §4 / DESIGN-SYSTEM §3 requirement.** Panel padding 16px; row 8px × 12px (vertical × horizontal left); section gaps 24px.

**What works.** The panel header (`h-14 px-4`) correctly uses 16px horizontal padding. Rows use `p-2 pl-3` which yields 8px vertical / 12px left, matching the row rhythm spec exactly. The loading skeleton panel uses `p-4` (16px body padding) — consistent with the spec for that state. Document section gaps use `gap-6` (24px) — correct.

**Concern (brief §4 violation).** The scrollable body in the loaded and interactive prototype panels uses `p-2` (8px) as the container inset, not `p-4` (16px). This means rows sit 8px from the panel edge instead of the 16px specified, creating a narrower visual margin than the header and loading skeleton. The gap between rows is `gap-0.5` (2px), which is not a named step on the base-4 scale (§3 scale: 0 / 4 / 8 / 12 / 16 / 24 / 32 / 48px). The `gap-0.5` reads as pixel-tight compression rather than deliberate rhythm.

**What would make it a 10.** Change the panel body scroll container from `p-2` to `p-4` across loaded + interactive prototype panels. Replace `gap-0.5` between rows with no gap (`gap-0`) and rely on row hover fill for separation, or `gap-1` (4px) — the smallest named base-4 step.

---

## Dimension 3 — Brand Coherence (8 / 10)

**What works.** Dark surfaces use the correct token stack (surface-950 background, surface-900 panel, surface-800 row hover). Emerald is the sole primary accent for unread dots, the count badge, and focus rings. Amber is correctly restricted to assignment/due-soon metadata (`text-accent-amber` on the assignment row timestamp) — consistent with DESIGN-SYSTEM §1 semantic mapping "warning / due-soon → accent-amber". The `danger-text` token (#f87171) is correctly applied for the error state body text on a `bg-danger/10` tinted background, matching the exact use-case documented in DESIGN-SYSTEM §1 ("On-dark-tint danger text … `#ef4444` computes 3.93:1 there (WCAG AA FAIL); `#f87171` computes 6.30:1 (PASS)"). The aesthetic is calm, academic, and restrained.

**Concern 1 — Raw hex on badge text (brief §9 criterion 1).** The badge label uses `text-[#0a0a0b]` as a Tailwind arbitrary value. The hex `#0a0a0b` is the canonical value of `--surface-950` (DESIGN-SYSTEM §1 palette table), so this is not an invented color. However, citing a token value as a raw hex string bypasses the token abstraction and would not survive a palette update. Replace with `text-surface-950` via the Tailwind config's custom `surface.950` key (already defined at line 34 of the HTML's tailwind config block).

**Concern 2 — Off-token unread dot glow.** Unread dots carry `shadow-[0_0_8px_rgba(16,185,129,0.5)]`, a custom shadow not in the design token set. DESIGN-SYSTEM §5 defines `--glow-focus` (`0 0 0 2px rgba(16,185,129,0.4)`) and `--glow-subtle` (`0 0 15px rgba(255,255,255,0.05)`). Neither is the dot glow, and no dot-glow token exists. This is a minor off-token value, not an invented hue. Options: remove the dot glow entirely (emerald fill alone reads clearly on dark surfaces), or register a `--glow-dot` token in DESIGN-SYSTEM.md if the team wants to keep the effect.

**What would make it a 10.** Replace `text-[#0a0a0b]` with `text-surface-950`. Resolve dot glow via token registration or removal. Zero raw hex or arbitrary shadow values outside the token set.

---

## Dimension 4 — Edge-Case / State Handling (7 / 10)

**What works.** Loading state uses skeleton rows with a CSS shimmer via `::after` pseudo-element — no spinner anywhere in the panel content area, correctly honoring brief §11 / DESIGN-SYSTEM §8 ("never spinners for content lists"). Empty state has bell-z icon + headline + one-line + CTA button ("View Server Directory"). Error state has danger-circle icon + cause text + retry button, and correctly uses `danger-text` on the tinted background. The "Mark all read" button momentarily shows a `ph-spinner animate-spin` inside the button itself during the simulated request — this is a button-action loading indicator as defined in DESIGN-SYSTEM §8 Button primitives ("loading: spinner, label hidden, aria-busy") and does NOT constitute a content-list spinner, so it does not fire the REJECT condition.

**Concern 1 — Missing 9+ badge cap (brief §3).** Brief §3 specifies "9+ cap" for the badge display. No capping logic exists in the JS, and no design illustration shows the capped state. The badge would display "12" or "99" rather than "9+" for high unread counts, breaking the specified affordance.

**Concern 2 — 0-unread bell not statically illustrated.** Brief §3 requires both bell states to be shown. The 0-unread state is handled interactively (JS hides the badge when count hits 0) but no static frame shows the no-badge bell icon in context. The state dictionary covers four panel states but does not cover the two bell states.

**Concern 3 — Loaded state absent from state dictionary.** As noted in Dimension 1, the loaded panel appears only in the interactive prototype. Section 2 does not enumerate it.

**What would make it a 10.** Add: (a) badge display capping at "9+" in both the JS demo and a labeled design illustration; (b) a static bell-state tile showing the 0-unread bell (icon only, no badge) next to the N-unread bell; (c) a fourth tile in the state dictionary for the loaded state.

---

## Dimension 5 — Accessibility (8 / 10)

**What works.** Bell uses `aria-label="Notifications, 3 unread"` per brief §6. Panel has `role="dialog"` + `aria-modal="true"` + `aria-label="Notifications"`. The scroll body carries `role="list"` and every row `role="listitem"`. The Escape key returns focus to the bell (`bellBtn.focus()`). Click-outside-on-desktop closes correctly. The emerald `--glow-focus` focus ring is applied to all interactive elements via the `.focus-ring` utility using `:focus-visible` (not `:focus`, correctly avoiding visible rings on mouse click). The `danger-text` token usage on the error body text passes WCAG AA at 6.30:1 as documented in DESIGN-SYSTEM §36 / §1.

**Concern 1 — Badge aria-label not updated on per-row reads.** When a user clicks an individual row to mark it read, the JS decrements the visible badge number and hides the badge at 0, but never updates `aria-label` on the bell button. The aria-label is only updated on mark-all-read (`bellBtn.setAttribute('aria-label', 'Notifications, 0 unread')`). Screen reader users clicking individual rows will hear a stale count in the bell label.

**Concern 2 — aria-busy not set during mark-all-read.** The button enters a loading/spinner state but does not set `aria-busy="true"` on the button element. DESIGN-SYSTEM §8 Button primitive specifies `aria-busy` for the loading state.

**Concern 3 — No aria-live region for count changes.** Count updates from socket events (brief §6: "a new mention increments the bell badge without opening the panel") have no announced live region. Screen reader users won't know the count changed. A `role="status"` or `aria-live="polite"` region wrapping the badge or a visually hidden announcer would close this gap.

**What would make it a 10.** Update `aria-label` on every per-row read interaction. Add `aria-busy="true/false"` toggle during mark-all-read. Add a visually hidden `aria-live="polite"` count-change announcer for socket-driven updates.

---

## Dimension 6 — Responsive (8 / 10)

**What works.** The dual-mode panel implementation is clean: below `md:` breakpoint the panel is `fixed bottom-0 left-0 right-0 top-[20vh]` with slide-up animation and a backdrop overlay; at `md:` and above it switches to an absolutely positioned popover with `md:w-[380px]`, `md:shadow-pop`, `md:rounded-[var(--radius-lg)]`, and `md:border`. The mobile close button is shown only below `md:` (`flex md:hidden`). Backdrop tap and Escape close the panel in both modes. Resize handling resets state gracefully.

**Concern 1 — Breakpoint mismatch with brief §5.** The brief specifies: "Desktop full (2xl) / compact (xl): popover; Tablet (lg): same popover; Mobile (degraded): bottom sheet." This maps the popover/sheet boundary at `lg:` (1024px). The mockup uses `md:` (768px) as the boundary. A 768–1023px viewport (small tablet, narrow browser) would render the desktop popover when the brief calls for it — and the DESIGN-SYSTEM §9 confirms 1024px is the minimum desktop threshold. The difference matters on portrait tablets.

**Concern 2 — Panel width 380px vs brief's ~360px.** Brief §5 states "~360px" for the desktop popover. The mockup renders `md:w-[380px]`. This is 20px wider than specified. Minor, but reviewers should confirm the wider width is intentional and won't clip at compact viewport widths.

**What would make it a 10.** Replace `md:` breakpoint prefixes with `lg:` on the popover mode classes, allowing `fixed` bottom-sheet behavior to persist through tablet widths as the brief requires. Confirm or adjust panel width to ~360px.

---

## REJECT condition audit

| Condition | Present? | Finding |
|-----------|----------|---------|
| Invented hex outside DESIGN-SYSTEM tokens | No | `#0a0a0b` is `--surface-950` token value (not invented); dot glow uses emerald channel, not a new hue |
| Spinner for content list loading | No | Panel loading state is skeleton-shimmer; only button action uses spinner (permitted by §8 Button primitive) |
| Missing panel states | No | All 4 states exist (3 in static dict, loaded in interactive prototype); bell states functionally present |

No REJECT condition fires.

---

## Fix list for REVISE resolution

Priority ordered, smallest to largest effort:

1. **Badge text token** — change `text-[#0a0a0b]` to `text-surface-950` on the badge `<span>`. One-line fix.
2. **Unread dot glow** — remove `shadow-[0_0_8px_rgba(16,185,129,0.5)]` from the dot `<div>` OR register `--glow-dot: 0 0 8px rgba(16,185,129,0.5)` in `DESIGN-SYSTEM.md` §5 and reference it as a token.
3. **Panel body padding** — change `p-2` to `p-4` on the scrollable body container in both the interactive prototype panel and any loaded-state illustration. Match the loading skeleton's correct `p-4`.
4. **Row gap** — replace `gap-0.5` with `gap-0` or `gap-1` (base-4 scale steps).
5. **aria-label on per-row reads** — update the bell's `aria-label` inside the row-click handler in JS when the badge count decrements.
6. **aria-busy on mark-all button** — set `aria-busy="true"` at start of simulated request, `false` on completion.
7. **9+ badge cap** — add capping logic (`count > 9 ? '9+' : count`) in the JS; add a labeled design tile illustrating the capped badge state.
8. **0-unread bell static illustration** — add a labeled bell-state tile (icon only, no badge) alongside the N-unread state in Section 2 or a dedicated bell-states row.
9. **Loaded state in state dictionary** — add a fourth tile to the Section 2 grid showing the loaded panel with a mix of unread and read rows.
10. **Responsive breakpoint** — replace `md:` prefixes on popover-mode classes with `lg:` to match brief §5 and DESIGN-SYSTEM §9 (1024px desktop threshold). Verify panel width against brief's ~360px spec.

Fixes 1–4 are token/spacing corrections. Fixes 5–6 are accessibility improvements. Fixes 7–9 fill state coverage gaps. Fix 10 aligns responsiveness with the brief specification. All are mechanical — the design direction, component anatomy, interaction model, and brand execution are sound and should not change.
