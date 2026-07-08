# D-3 Reconciliation — e2e-indicator (Attempt 2)

## Reviewer verdicts (Phase 1 re-review on refined iteration-1 staging, independent, fresh context)

| Reviewer | Skill/agent | Verdict | Fail-closed |
|---|---|---|---|
| Reviewer A | `ui-designer` (sub for `/plan-design-review`) | **REVISE** (51/60) | PASS |
| Reviewer B | `ui-ux-tester` (sub for `/ui-ux-pro-max`) | **REVISE** | PASS |

## Matrix outcome

REVISE / REVISE → aggregate → **D-2 refine (iteration 2)**. Cap 3; this consumes refine iteration 2 of 3 (one remaining). Both reviewers confirm: the load-bearing fail-closed ship-blocker PASSES in both static markup and the `simulateKeygen()` JS (shield resolves ONLY behind proof; no lock over any non-encrypted state); token fidelity exact (no invented hex); all Phosphor names real; all seven iteration-1 deltas resolved. The remaining items are minor polish + two spec-arbitration items + B-3 handoff notes — NOT a re-architecture.

## Concern triage

### Group 1 — targeted mockup deltas → `/aidesigner refine_design` iteration 2
- **R1 (A CR-1): invalid CSS** — `antialiased;` (line 58) is not valid CSS. Replace with `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`.
- **R2 (A CR-3 + B #1): live-region scope + accessible name** — `role="status" aria-live="polite"` sits on the outer `.tooltip-trigger` wrapper that also contains `.tooltip-content`, so hovering announces the tooltip text redundantly; and the context header badge (line 333) has no accessible name when its label is hidden at the md–lg band. Fix: move `role="status" aria-live="polite"` onto the INNER pill container (exclude the tooltip from the live region) AND add an `aria-label` carrying the state name to the badge so a screen reader has a name when the visible label is collapsed.
- **R3 (A CR-5 + B #5-context): breakpoint 768→1024** — the CONTEXT-PANEL header badge uses `md:` (768px) for the full-pill/icon-only switch; brief §5 + DESIGN-SYSTEM §9 specify the collapse at **1024px**. Change `hidden md:block`→`hidden lg:block` (line 333) and `md:hidden`→`lg:hidden` (line 344). (The label-within-pill `hidden lg:inline` is already correct.)
- **R4 (A CR-6): missing tooltip on context-panel icon-only badge is already present** (lines 348–350 DO carry a tooltip-content) — VERIFY it renders for the collapsed state; no change if present. (Reviewer A flagged from an earlier line map; treat as verify-only.)
- **R5 (B #4): transition variable naming** — `--transition-standard: 200ms ease` (line 51) collides in name with DESIGN-SYSTEM §6's 150ms "Default" standard. The 200ms VALUE is correct for state changes (§6: "Presence/connection-state changes: 200ms"). Rename the var to `--transition-state-change` to avoid misleading B-3.
- **R6 (B #5 polish): per-message label wording** — change the plaintext-fallback per-message micro-affordance label from "Sent as standard message" to "Not encrypted" for cross-state label consistency.

### Group 2 — spec arbitration (orchestrator/gate decision; NOT an aidesigner change; the mockup is already correct)
- **S1 (B #2): tooltip body size — brief §4 says 14px (`text-sm`), DESIGN-SYSTEM §8 Tooltip says 12px.** DESIGN-SYSTEM is the canonical token source that all mockups + frontend consume; the mockup correctly follows DS §8 (12px). RESOLUTION: **DS §8 (12px) wins**; brief §4's 14px tooltip-body line was an over-specification. Corrected in the D-1 brief (§4 typography line) so B-3 receives one consistent spec. No mockup change.
- **S2 (A CR-2 + B #3): brief §4 assigns `--text-muted` to States 4/5 labels, which computes below WCAG AA.** The mockup correctly overrides to `--text-secondary`. RESOLUTION: the mockup is right; correct the brief §4 token line to `--text-secondary` for the cannot-decrypt + loading STATUS LABELS (keep `--text-muted` only for the de-emphasized undecryptable-payload shell) so B-3 does not re-introduce the failure by following the brief literally. Brief corrected.

### Group 3 — B-3 handoff notes (carried into the adopt deliverable + gate verdict; no mockup change)
- Verified contrast ratios must be recorded for B-3: encrypted emerald icon on emerald/10 tint sits on `--surface-900` (header + legend); Reviewer A computed ~4.55:1 there (PASS) and noted it drops on `--surface-800`. HANDOFF: the encrypted badge must render on a `--surface-900` header/pill context (not bare `--surface-800`); if a placement forces surface-800, bump the tint to 15%. B-3 records the measured ratio.

Next: apply S1 + S2 to the D-1 brief now; run `/aidesigner refine_design` iteration 2 for R1/R2/R3/R5/R6 (R4 verify-only); re-enter D-3 Phase 1.
