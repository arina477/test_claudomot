# D-3 Phase 1 reconciliation — invite-share (wave-9 delta)

**Reviewer A (/plan-design-review subst: ui-designer):** APPROVE — all 6 dimensions 9–10; 8b permanent-default and revoke flow both clean; token discipline strict. 4 non-blocking polish notes.

**Reviewer B (/ui-ux-pro-max subst: accessibility-tester):** REVISE — one CRITICAL dark-theme contrast violation. The revoked-row label text uses `text-danger` (#ef4444) on surface-800 (#1c1c1f) ≈ 3.5:1, below WCAG AA 4.5:1 for body text. (Meaning is NOT color-alone — redundant `ph-prohibit` icon + strikethrough + dimming remain — but the text itself fails the ratio.) All other audits PASS: success-criteria, UX flow, token audit (no invented values).

## Matrix outcome

| Reviewer A | Reviewer B | Action |
|---|---|---|
| APPROVE | REVISE | Aggregate B's concerns → D-2 refine (iteration 1) |

**Destination:** D-2 refine, then re-run Phase 1. This is a single, surgical, well-specified fix; iteration_counter 0 → 1 (cap 3).

## Consolidated refine deltas (B's blocking concern only; A had no blocking changes)

- **Change:** Revoked-row label "Revoked — this link no longer works." — swap text color from `text-danger` to `t-primary` (white, ~12:1 on surface-800). Keep the `ph-prohibit` danger-colored icon, the strikethrough on the mono code, and the row dimming as the danger/revoked signals (color is then not the sole carrier, and the text passes WCAG AA). Cite: brief §9 ("WCAG AA contrast in dark theme") + DESIGN-SYSTEM.md §1 text tokens (`--text-primary`).
- **Preserve (both reviewers approved):** the permanent-default labeling + Permanent pill (8b), the secondary "Generate a limited invite" demotion, the limited-invites list + per-row trash + inline danger confirm two-step, the honest revoked row structure (icon + strikethrough + dimming), all token usage, all focus rings (emerald + danger), all aria-labels / roles.

A's 4 non-blocking polish notes are acknowledged but NOT required for adoption (they do not block the brief's job); not looped.
