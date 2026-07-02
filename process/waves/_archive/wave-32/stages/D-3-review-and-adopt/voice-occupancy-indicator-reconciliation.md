# D-3 Phase 1 reconciliation — voice-occupancy-indicator

| Reviewer A (/plan-design-review) | Reviewer B (/ui-ux-pro-max) | Matrix action |
|---|---|---|
| REVISE | REVISE | Aggregate both → D-2 refine |

## Aggregated concerns (both reviewers, deduped)
1. **Count chip not identical to prior-art** (A + B; brief §9 item 3, §8). Mockup uses `rounded-full` / `text-[11px]` / `font-semibold` / `py-0.5`; prior-art voice-study-room.html:278-281 uses `rounded` (radius-md) / `text-xs` / `font-medium` / `py-1`. A comment falsely claims "perfect match". → make the chip markup byte-match the prior-art chip; remove the false comment.
2. **Keep-OUT leakage — emerald presence dot on pre-join avatars** (B; brief §10). The presence/voice dot is an in-room concern the brief forbids for the pre-join glance. → remove the emerald presence dot from the pre-join avatar cluster (keep plain initials avatars).
3. **A11y — avatar alt/aria-label** (A + B; brief §9 a11y item, §6). Initials avatars ("JD") lack alt/aria-label = display name. → add aria-label/alt = member display name to every avatar.
4. **A11y — names mouse-only + vanish below 1024** (A + B; brief §5, §6). Member names are hover-tooltip-only and disappear from the a11y tree at the collapsed breakpoint. → member names must be in the role="status" live-region TEXT (e.g. "3 studying now: Alice, Bob, Carol"), not hover-only; the count-only degrade must still announce names in text.
5. **A11y — error uses assertive role="alert"** (B; brief §6). Fail-soft error should be polite. → change the error region to role="status" aria-live="polite" (calm, non-interrupting).

## Iteration cap
counter 0 → refine → 1 (cap 3, within budget). → D-2 Action 5 refine, then re-run Phase 1.

---
## Phase 1 re-run after iteration 2 (final)
| Reviewer A (/plan-design-review) | Reviewer B (/ui-ux-pro-max) | Matrix action |
|---|---|---|
| APPROVE (brand 10, a11y 10, responsive 10) | APPROVE (§9 9/9, tokens+icons clean) | → Action 4 (Phase 2 head-designer spawn) |

All 5 iteration-1 concerns + the iteration-2 malformed-attr defect resolved and re-verified. Residual = low-severity B-block polish only (off-scale py-[9px]/-space-x-[10px] arbitrary spacing, optional desktop "studying now" visual cue, skeleton-count parity) — NON-gating; carry to B-3 as build-polish notes.
