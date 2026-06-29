# D-2 Iteration log — create-server

iteration_counter: 1

## Iteration 0 (first pass)
- Refine prompt: (none — first pass)
- Staging path: `design/staging/create-server.html`
- Checkpoint outcome: `skipped-mode-automatic` (D-2 Action 3: human checkpoint skips under automatic mode)

## Iteration 1 (refine — back-edge from D-3 Phase 1: REVISE)
- Trigger: accessibility-tester REVISE (1 BLOCKING) + ui-designer APPROVE → matrix = REVISE → refine.
- Consolidated deltas applied to `design/staging/create-server.html`:
  1. BLOCKING (a11y, WCAG 2.4.7): state-3 validation-error input was missing a visible focus state → added `focus-ring` class (emerald focus-visible ring).
  2. (a11y MAJOR) added `aria-hidden="true"` to all decorative `ph-x` close icons (icon-only buttons already carry `aria-label`).
  3. (design, DESIGN-SYSTEM §5) applied the danger focus ring `box-shadow: 0 0 0 2px rgba(239,68,68,0.4)` to error-state inputs (resting), formalized as `--glow-danger`.
  4. (brief §9) added a dedicated "too long (>100 chars)" validation-error variant (state 3b) — counter `101/100` in danger + over-limit message.
  5. (DESIGN-SYSTEM §3 spacing rhythm) replaced off-scale 20px modal paddings (`px-5`/`py-5`) with on-scale 16px (`px-4`/`py-4`); button px-5→px-4.
  6. (token discipline) converted the server-error alert's inline danger rgba literals to Tailwind alpha classes (`border-danger/40 bg-danger/10`).
- Staging path: `design/staging/create-server.html` (overwritten in place)
- Checkpoint outcome: `skipped-mode-automatic`
- Post-refine re-confirmation: blocking item resolved (verified `id="n3"` + `id="n3b"` carry `focus-ring`); hex audit clean (every literal maps to a DESIGN-SYSTEM token).
