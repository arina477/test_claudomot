# Wave 39 — P-1 Decompose

## Maximum size rubric
| Measure | Estimate | Threshold | Trips? |
|---|---|---|---|
| Files touched | ~4–7 (ChannelSidebar.tsx wire onClick + new small UserMenu popover component; a signOut util; router/nav; test files) | > 60 | no |
| New primitives | 1 (UserMenu popover component, reusing the existing MessageList role="menu" pattern) | > 60 | no |
| Estimated net LOC | ~150–300 (popover component + 3 menu items nav/signOut + a11y + E2E/unit) | > 5,000 | no |
| Stage-4 working set | small | > 350K | no |

**Max verdict:** not tripped.

## Wave type
`claimed_task_ids = [c208e91e]` → **single-spec**. wave_type set includes **ui** (frontend, user-visible) for T-block (T-5 E2E + T-6 layout apply).

## Minimum floor
- single-spec floor: net LOC > 1,500. Estimate ~150–300 → **FLOOR TRIPS** → RESCOPE-AUTO-MERGE.
- **floor_merge_attempt: 0.** Decomposition-expansion known-futile: M7's other open tasks are a1299e88 (Resend, founder-blocked — not buildable) + 7525b759 (LOW backend hardening — a different concern; bundling cross-concern into a frontend UX-completion wave is bloat + contradicts the P-0 anti-gold-plating guardrail). No unblocked adjacent frontend scope to floor-fill.
- **PRECEDENT-APPLICATION override-ship** (P-1 §2b resolution (a)): this is a UX-completion wave making already-shipped surfaces (avatar uploader, privacy page, account exit) reachable at runtime — the founding wave-21 exemption ("the floor does not apply when the wave's job is to make shipped infra actually function at runtime") applies verbatim; the wave-24 standing "do NOT re-litigate a Nth per-wave" ruling stands (applied w25/w26/w38). Launch-relevant (fixes wave-38 F1). NOT a fresh BOARD.

**Verdict:** PROCEED-AFTER-MERGE (override-ship, precedent-application).

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
Rationale: the user menu is a small popover reusing the app's EXISTING menu/popover pattern (`apps/web/src/shell/MessageList.tsx:641` — `role="menu"` + `aria-haspopup`, keyboard-accessible dropdown) + existing design-system tokens. A 3-item dropdown (Profile / Privacy / Log out) matching a shipped pattern is a **trivial extension**, not a novel design surface → no D-block brief/variants cycle. (If B-block finds it genuinely needs new visual treatment, the build-dispatcher design-gap fallback re-enters D-1 for just that gap.) → **P-block hands off to B** (D skips).

Note (carried to P-3): logout appears to have NO existing UI (grep found only a ProfileContext comment) → the menu's "Log out" item is a genuinely-missing account-exit affordance (SuperTokens `signOut` + redirect to /login), reinforcing the SELECTIVE-EXPANSION value. Confirm at P-3.

```yaml
floor_merge_attempt: 0
wave_type: single-spec
verdict: PROCEED-AFTER-MERGE
design_gap_flag: false
```
