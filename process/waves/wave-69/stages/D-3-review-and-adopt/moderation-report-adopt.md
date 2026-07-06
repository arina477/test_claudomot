# D-3 Adopt — moderation-report (wave-69, M14)

**Canonical path:** `design/moderation-report.html` (git mv from `design/staging/`).

## Reviewer verdicts (Phase 1, final cycle)
- `/plan-design-review` (ui-designer): **APPROVE** — dims VH9/Space8/Brand10/State10/A11y10/Resp10; toast ARIA fix verified line-by-line, no regression.
- `/ui-ux-pro-max` (accessibility-tester): **APPROVE** — brief §9 all MET; toast role=alert/status + aria-live confirmed in code (lines 807-808); WCAG 2.1 AA, no regression.

## Gate verdict (Phase 2, head-designer)
- Attempt 1: **REWORK** — WCAG 4.1.3: toast had no role/aria-live (only feedback for inbox-action error state; reviewer B had hallucinated its presence). Independent gate caught it.
- Attempt 2: **APPROVED** — ARIA-only rework verified (setAttribute role+aria-live before append, text inside role-bearing element, both error call-sites type='error'); no regression across danger buttons #b91c1c 6.47:1 / emerald primary 7.80:1 / nav badge --danger-btn / --text-secondary informational / focus-trap / skeleton / mobile sheet / no maximum-scale / 3 affordance types / Phosphor-only / brief §9.

## Cycle history
- Cycle 1 (D-2 generate → D-3): REVISE + REJECT — danger buttons white-on-#ef4444 ~2.3-4:1 FAIL AA.
- Cycle 2 (D-2 refine → D-3): REVISE + APPROVE — 5 single-attr a11y fixes (nav badge, close focus-ring, --text-muted informational, inbox error branch, viewport zoom).
- Cycle 3 (D-2 refine → D-3): APPROVE + APPROVE (Phase-1 3-cap reached).
- Phase-2 gate rework (independent cap): attempt-1 REWORK toast ARIA → attempt-2 APPROVED.

## DESIGN-SYSTEM delta (Action 8 — blessed by head-designer verdict)
- Added `--danger-btn: #b91c1c` to §1 Accent+semantic (reusable "danger button fill" role, white text ≈6.5:1 AA; hover #991b1b) + §8 Button `destructive` variant cross-note. `--danger` #ef4444 clarified as fill/border/non-text only.

## Journey-map delta (Action 7)
- Added "Moderation — Report dialog + Owner report inbox (wave-69, M14) [PENDING BUILD]" section to command-center/artifacts/user-journey-map.md.

```yaml
adoption_complete: true
canonical_path: design/moderation-report.html
design_system_tokens_added: [--danger-btn]
journey_map_updated: true
```
