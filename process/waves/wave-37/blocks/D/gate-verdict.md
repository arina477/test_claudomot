# Wave 37 — D-3 Verdict

**Reviewer:** head-designer (fresh spawn)
**Reviewed against:** process/waves/wave-37/blocks/D/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
The notifications-center mockup (`design/staging/notifications-center.html`) clears the bar as an adoptable canonical artifact for the one D-block gap. I independently re-derived the token inventory against DESIGN-SYSTEM §1 rather than trusting the Phase-1 pair: every hex and rgba in the Tailwind config maps 1:1 to a named DS token, there are no arbitrary-value (`text-[#...]` / `bg-[#...]`) classes anywhere, and the only two raw Tailwind utilities — `bg-black/60` for the scrim and the inverted `shadow-[0_-8px_24px_rgba(0,0,0,0.5)]` for the bottom-sheet — resolve to values DS already documents (§8 scrim `rgba(0,0,0,0.6)`, §5 shadow-pop with a flipped Y axis) and introduce no new hue. The brief's state matrix is fully covered — all four panel states (loaded, skeleton-loading, empty, error) and all three bell states (0 / N / 9+ cap), with loading rendered as shimmer skeleton rows (not a spinner), empty as icon+headline+one-line+CTA, and error as danger-text icon+cause+retry. Dark-theme contrast passes AA with margin at every interactive pair I spot-checked (emerald badge on `text-surface-950` ~8.86:1; `text-danger-text` on danger/10 ~6.3:1; primary text ~14.5:1), and the accessibility scaffold — aria-label-with-count, aria-live announcer, `role="dialog"`+`aria-modal`, `aria-expanded`, designed emerald focus rings on rows/buttons/links, a working focus-trap, and Escape-returns-focus-to-bell — is designed rather than left to browser defaults. Mention vs reminder are distinguishable on two axes (icon glyph + accent color), responsive behaviour correctly splits popover↔bottom-sheet at lg:1024, and the surface is coherent with adjacent chrome (header-action bell, border+shadow-pop popover elevation, MessageRow/AssignmentCard row rhythm, app-home empty-headline pattern). I confirm the iter-3 deterministic sed correction did not compromise the design: it swapped only the two exact off-token values Reviewer B cited (3 badges to `bg-accent-emerald text-surface-950`, one hover to `hover:text-accent-emerald`) for their brief-mandated DS tokens, left Reviewer A's approved layout intact, and is more defensible than a fourth aidesigner round that would have risked reintroducing off-palette drift — and because the artifact is a static design mockup (not production code) the Iron Law's no-direct-fix rule does not attach. The one deviation from a literal DS reading — a secondary-styled empty-state CTA where §8's reference example uses a primary/emerald CTA — I explicitly endorse rather than flag: an emerald-filled button in a "you're all caught up" rest state would over-weight a positive quiet moment and read louder than the calm academic brand wants; secondary is the better taste call and stays within the sanctioned Button variants, so it does not fragment the system.

The five non-blocking notes carried to B-4 are correctly implementation-layer, not design REWORK: (1) notification rows are `<div tabindex="0">` needing `<button>`/`role=button` + activation handler — but the *designed* focus and keyboard-reachability states already exist, so this is a semantic/wiring concern, not a missing-focus-design failure; (2) `pb-safe` safe-area registration is a Tailwind-plugin/config task; (3) the `prefers-reduced-motion` guard is a production-stylesheet media query (DS §6 compliance must be honored at build, but its absence in a static mockup does not gate adoption); (4) the `text-primary`→`text-text-primary` alias reconciliation is a Tailwind-namespace wiring fix where the token *intent* is already DS-correct and no new color is introduced; (5) the `bg-scrim` alias is a config-traceability nicety over an already-DS-documented value. None of the five represents token fragmentation or an undefendable design decision.

## Escalation
n/a

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---

### Token-addition ruling (D-3 Action 8)
No DESIGN-SYSTEM token addition is blessed. The only candidate — a named `--scrim` token — is declined: its value `rgba(0,0,0,0.6)` is already documented in DS §8 (Modal/Dialog primitive), so promoting it would duplicate an existing value under a new name, which Action 8 explicitly prohibits. The correct resolution is the B-4 `bg-scrim` config-alias note, not a source-of-truth mutation. `design_system_tokens_added: []`.
