# Wave 42 — D-3 Verdict

**Reviewer:** head-designer (fresh spawn, agentId head-designer-wave42-D3-phase2)
**Reviewed against:** process/waves/wave-42/blocks/D/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)

## Verdict
APPROVED

## Rationale
The single coherent gap — the assignment submission lifecycle UI (student submit + own submission card with returned badge + educator submissions roster + return-with-comment dialog + empty/403 states) — clears every head-designer heuristic, and I verified the load-bearing claims directly against the staging HTML rather than trusting the reviewer summaries.

(1) **Brief fidelity — PASS.** All §3 states are rendered including the non-happy ones: not-submitted form, submitting spinner, submitted card, returned card with educator comment, roster loaded, roster empty ("No submissions yet"), return popover open, loading skeleton, submit-failure inline error (`role="alert"`), attachment over-size error, return-failure inline error, and the 403 over-permission state. All §9 success criteria are met. The §10 non-goals hold — most importantly the milestone-critical **zero-grading** constraint: a full-file grep for grade/grading/rubric/gradebook/score/points/marks/percent surfaces only "Mark Done" (the orthogonal private todo toggle, explicitly out-of-scope per §10.4 and left untouched) and "Mark Returned" (an acknowledgement verb on the confirm button, not a grade). No numeric score, rubric, or gradebook field exists anywhere.

(2) **Token discipline — PASS.** Every hex in the staging file (`#0a0a0b #121214 #1c1c1f #27272a #3f3f46 #52525b #10b981 #f59e0b #ef4444 #f87171`) maps exactly to DESIGN-SYSTEM §1 — surfaces 950→500, emerald, amber, danger, and danger-text. Every `rgba(...)` traces to a DS text/border/glow token. `--danger-text` (#f87171) is correctly used for error text on danger/10 tints (the AA-passing 6.30:1 path per DS §1). Notably the staging file is cleaner than the prior-art `assignments-panel.html`, which still carries a stray sky `#0ea5e9`; the new design did not inherit it. Zero fragmentation, zero invented hex.

(3) **Brand — PASS.** Emerald returned badge (`ph-fill ph-check-circle` + "Returned"), amber "Awaiting" dot, the timeline-stack submitted/returned cards, the left-edge emerald accent bar, and the glass-panel dialog read as a calm, academic acknowledgement loop — unmistakably not a loud LMS gradebook. Returned/awaiting states carry glyph + label + color (never color alone), so the acknowledgement reads as completion, not a mark.

(4) **Prior-art coherence — PASS.** The Return popover reuses the shipped dialog language (surface `#27272a` glass-panel, `--shadow-pop`, radius) and — correctly — `role="dialog" aria-modal="true"` with an accessible name, which matches the `notifications-center.html` interactive-panel precedent exactly. Brief §4's loose "role=menu" reference was correctly re-diagnosed at reconciliation: the popover contains a form (comment textarea + confirm), not menu items, so dialog is the right ARIA per WCAG 4.1.2. No new popover system was invented; the roster rows extend the assignments-panel row language. The mock shell (72px server rail, 260px sidebar, sticky header) is consistent with adjacent screens.

(5) **Accessibility — PASS (audited by the independent accessibility-tester reviewer at iter-3).** Full focus-trap round-trip, Esc close, focus restore to trigger, `aria-live="polite"` announcer wired on every async transition, real `<input type="checkbox">` for Mark-Done, reachable labelled file input, AA/AAA contrast verified. All six iter-1 WCAG blockers and the iter-2 resubmit-affordance gap are resolved (unconditional "Edit submission" button on the returned card).

Both Phase-1 reviewers returned APPROVE/APPROVE after a legitimate three-cycle refine (grading copy → dialog role/focus/breakpoint/error-states → a11y focus-trap/aria-live/real-toggle/return-failure → calm easing/body-token/edit-affordance), all within the 3-cap. The residual reviewer notes (imperative popover pixel-positioning, peer-CSS toggle-thumb scope, skeleton row count) are React-build wiring items where the *design intent* is correct and present in the mockup — they belong to B-block implementation, not a D-block design REWORK. I concur with that disposition.

**DESIGN-SYSTEM.md token addition: NONE blessed.** The design introduces no token absent from DESIGN-SYSTEM.md. Every color, spacing value, radius, shadow (`--shadow-sm`, `--shadow-pop`, `--glow-focus`, `--glow-subtle`), and motion curve consumes an existing DS primitive. There is no new shadow class, clip-path, or color role that is both novel and reusable beyond this feature. Per D-3 Action 8, do NOT extend DESIGN-SYSTEM.md for this wave; `design_system_tokens_added` remains empty.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
