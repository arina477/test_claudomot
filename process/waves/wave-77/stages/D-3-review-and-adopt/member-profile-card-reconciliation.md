# Wave 77 — D-3 Reconciliation (Member Profile Card) — iteration 0→1
| Reviewer | Verdict |
|---|---|
| /plan-design-review | REVISE (6.8/10) |
| /ui-ux-pro-max | REVISE |
**Matrix: REVISE+REVISE → aggregate → D-2 refine (iteration 1; cap 3).** All brief §6 FENCES HELD (no verification badge, plain-text role, read-only, no email) — issues are surface-level DS/a11y violations both reviewers converged on.

## Aggregated refine concerns
1. REMOVE invented purple (bg-purple-900/20, partial banner) → emerald-derived or neutral surface tint (--surface-700 / emerald @ /10).
2. Replace raw emerald-950 ad-hoc ramp → a defined DS token (--surface-900 or emerald/10 tint).
3. Amber on Academic Year is token-misuse (amber = warnings only, DS §1) → value --text-primary, icon --text-muted; trim "Year 3 Tracker" → "Year 3".
4. Remove overshoot spring easing cubic-bezier(0.175,0.885,0.32,1.275) → standard ease ≤300ms, NO bounce (DS §6).
5. Add prefers-reduced-motion guard on shimmer/waterfall/popover.
6. Add Esc-key dismissal + focus management to the popover (DS §8; keyboard-dismissable; port to body BUILD-14 for the real component).
7. Bump text-[10px] labels to ≥12px (DS §2 floor).
8. Strip the demo harness (fake roster / "System Architecture Demo" / gallery dividers / demo script) — keep ONLY the card frame + the 4 state bodies.
Keep: 4 states (loaded/loading/hidden/partial), the CALM hidden state (eye-slash "Profile Unavailable", no danger), NO verification badge (plain-text role), read-only, no email, shadow-pop, DS surface/text tokens.
Next: D-2 refine (aidesigner) iteration 1 → re-run D-3.
