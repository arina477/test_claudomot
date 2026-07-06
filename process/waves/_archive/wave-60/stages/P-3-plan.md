# P-3 Plan — wave-60

## Approach
- **Architecture deltas:** NONE. Cosmetic token-hygiene on 3 existing DM surfaces. No service/state/render-path change.
- **Data/API/deps:** none.
- **SURGICAL SCOPE (critical):** the off-token hex (#0a0a0b/#1c1c1f/#27272a) appears in ~10+ web files
  (problem-framer's 45-file architectural finding). This wave fixes ONLY the 3 surfaces wave-46 T-6 F10 named —
  NOT a broad sweep. The broad inline-hex→var() migration is the carry-forward future wave (do NOT do it here).
  Target exactly:
  1. **Server rail background** — `apps/web/src/shell/ServerRail.tsx` (the rail container bg currently #0a0a0b /
     surface-950) → canonical `--color-surface-900` (#121214, DESIGN-SYSTEM sidebar token).
  2. **DM start-picker modal card** — the StartDmPicker modal card background (currently #1c1c1f / surface-800) →
     `--color-surface-900`. (Locate the picker MODAL card specifically — not the DM list rows.)
  3. **Disabled send button** — the DM composer's send button in its disabled state (currently #27272a /
     surface-700) → canonical disabled-primary = `--color-accent-emerald` (#10b981) at 40% opacity.
- **Consumption, not re-hardcoding:** replace each inline hex with a `var(--color-*)` reference (or the theme
  token that maps to it) so the surface consumes the token system (P-0 cause-fix for these 3).

## Plan (file-level steps)
### B-3 Frontend (executor: react-specialist)
1. `apps/web/src/shell/ServerRail.tsx` — modify: rail bg #0a0a0b → var(--color-surface-900). Surgical: rail container only.
2. StartDmPicker modal card (react-specialist locates the exact file/component — likely `apps/web/src/shell/StartDmPicker*.tsx` or within DmConversationList's picker modal) — card bg #1c1c1f → var(--color-surface-900). Surgical: the picker MODAL card only.
3. DM composer disabled-send button — disabled-state bg #27272a → var(--color-accent-emerald) @ 40% opacity. Surgical: send button disabled state only.
All 3 serial-ish (independent surfaces, one specialist). react-specialist confirms the exact elements against wave-46 F10 (getComputedStyle surfaces) and does NOT touch other hex occurrences.

### Specialist routing (AGENTS.md validated)
- react-specialist — B-3 React executor (per AGENTS.md).

## Parallelization map
Single specialist, 3 surgical edits (independent surfaces). No parallel batch needed.

## Self-consistency sweep
1. Every AC → step: AC1→step1, AC2→step2, AC3→step3, AC4 (var consumption)→all steps, AC5 (a11y intact)→verify at B-5/T. ✓
2. Every step has specialist (react-specialist). ✓
3. No file in multiple batches. ✓  4. design_gap_flag false. ✓
5. Arch deltas none. ✓  6. No data/API TBD. ✓  7. No deps. ✓  8. SDK n/a. ✓
Sweep clean. SURGICAL-SCOPE guard emphasized (do not broad-sweep).
