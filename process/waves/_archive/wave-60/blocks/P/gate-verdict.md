# Wave 60 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-wave60-P4-a1)
**Reviewed against:** process/waves/wave-60/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
REWORK

## Rationale
The wave is correctly framed (cause-fix: convert 3 off-token DM surfaces to consume canonical tokens, not re-hardcode hex), correctly scoped (SURGICAL-SCOPE guard confirmed sound — the 3 target hex appear in 39 web files, and the plan explicitly fences to only the 3 wave-46 F10 surfaces and defers the broad inline-hex→var() sweep to a carry-forward wave, so no scope-creep), and the floor-waiver is legitimately applied (wave-50/16 sub-floor debt-fix-on-shipped-surfaces precedent verified in product-decisions.md). Two of three acceptance criteria are falsifiable and correct: the server-rail (#0a0a0b/surface-950 → var(--color-surface-900)/#121214) and DM start-picker card (#1c1c1f/surface-800 → var(--color-surface-900)/#121214) substitutions match globals.css token values and are assertable via getComputedStyle. The blocker is a single wrong-canonical-token defect: the disabled-send AC. The plan correctly identifies that send is a primary/emerald action so its disabled state must be emerald-dimmed (not the current gray #27272a/surface-700) — that reasoning is right and is a genuine cause-fix. But the spec and plan lock the opacity at emerald @ 50%, whereas the canonical Button disabled state in DESIGN-SYSTEM.md (line 97: "disabled (40% opacity, no pointer)") is emerald @ 40%. Shipping 50% would produce a non-canonical disabled state on an already-shipped surface — exactly the load-bearing spec detail this gate must not launder into the build block. This is not a scope-size complaint (the 1/10-value tail-drainage is contract-correct and endorsed by all three P-0 reviewers); it is a precise wrong-value fix in the spec's own token contract.

## Rework instructions  (only if REWORK)

### Stages requiring rework
- P-2: correct the disabled-send canonical opacity from emerald@50% to emerald@40% and tighten the a11y assertion.

### Per stage

#### P-2
- **What's wrong:** AC3 (disabled-send) and the plan lock `--color-accent-emerald` at **50% opacity**. The canonical Button disabled state in `design/DESIGN-SYSTEM.md` line 97 is **"40% opacity, no pointer"**. The send button is a primary/emerald button, so its canonical disabled state is emerald @ 40%, not 50%. Secondary: AC5 asserts "AA intact" globally without distinguishing that the disabled send control is intentionally low-contrast (WCAG exempts disabled controls from contrast minimums), while the rail/picker text sitting on the NEW surface-900 fill must remain AA — the spec should state the latter as the real a11y obligation.
- **Heuristic fired:** H-P — wrong canonical token: spec's disabled-state value diverges from the design-system's own component contract (a clean-reading spec that is wrong on the load-bearing 20%).
- **What "good" looks like:** AC3 reads "disabled send button consumes `var(--color-accent-emerald)` at **40% opacity** (canonical Button disabled state per DESIGN-SYSTEM.md §Button), replacing the current gray `#27272a`/surface-700 fill." AC5 reads "rail and picker-card text/icons on the new `--color-surface-900` fill remain ≥4.5:1 (AA); the disabled send control is a disabled control (contrast-exempt) and needs only to read visually as disabled." The disabled opacity value in the plan matches the spec.
- **Re-do instructions:**
  1. In the primary task (5bcbd27f) `tasks.description` spec-contract YAML head, change the disabled-send AC value from `emerald@50%` (or `50% opacity`) to `emerald@40%` and add the DESIGN-SYSTEM.md §Button citation.
  2. Reword the a11y AC per "what good looks like" above so AA applies to rail/picker text on surface-900 and the disabled control is called out as contrast-exempt.
  3. Update the P-2 pointer file (`process/waves/wave-60/stages/P-2-spec.md`) to say "disabled-send → emerald@40%" to stay consistent with the DB row.
  4. Do NOT change AC1, AC2, AC4, the SURGICAL-SCOPE fence, or the floor-waiver — all approved as-is.

### Cascade

P-block cascade rules (apply where the rework stage is the trigger):

| Trigger stage | Stages that must re-run downstream |
|---|---|
| P-2 spec | P-3 (approach + plan derive from spec) |

- **Stages that must re-run after the above:** P-3 (correct the 3 hardcoded "50% opacity" occurrences at P-3 lines 15 and 23 to "40% opacity"; no other plan change — approach, file targets, surgical fence, and specialist routing all stand).
- **Stages that stay untouched:** P-0 frame, P-1 decompose.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

# Wave 60 — P-4 Verdict (Attempt 2)

**Reviewer:** head-product (fresh spawn, post-rework gate)
**Reviewed against:** process/waves/wave-60/stages/P-2-spec.md (pointer) + P-3-plan.md + tasks.description of 5bcbd27f (DB row, corrected content confirmed by orchestrator) + design/DESIGN-SYSTEM.md line 97
**Attempt:** 2  (post-rework)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
The single Attempt-1 defect is fixed and nothing regressed. The disabled-send canonical opacity now reads 40% in every location: the P-2 pointer (`disabled-send → emerald@40%`), P-3 plan step 3 (line 23: `var(--color-accent-emerald) @ 40% opacity`), and the plan's approach block (line 15: `#10b981 at 40% opacity`) — all matching DESIGN-SYSTEM.md line 97's Button contract ("disabled: 40% opacity, no pointer"); no residual `50%` survives in either P-block artifact, and the DESIGN-SYSTEM §Button citation is now embedded in AC3. The a11y AC (AC5) is correctly split: AA (≥4.5:1) is asserted only for rail + picker-card text/icons sitting on the NEW surface-900 fill (the real, falsifiable a11y obligation, consistent with line 97's own "≥4.5:1 text contrast"), while the disabled send control is correctly called out as WCAG contrast-exempt (disabled controls carry no minimum) yet required to remain visibly distinct — exactly the "what good looks like" from Attempt 1. Everything Attempt 1 approved holds unchanged: AC1 (server rail #0a0a0b/surface-950 → var(--color-surface-900)) and AC2 (picker card #1c1c1f/surface-800 → var(--color-surface-900)) are getComputedStyle-assertable token substitutions matching globals.css; AC4's var()-consumption cause-fix (not re-hardcoding) stands; the SURGICAL-SCOPE fence still limits work to exactly the 3 wave-46 T-6 F10 surfaces and explicitly defers the broad inline-hex→var() sweep across the other ~39 web files to a carry-forward wave (no scope creep); and the floor-waiver (wave-50/16/21 sub-floor debt-fix-on-shipped-surfaces precedent) is untouched and legitimately applied. design_gap_flag is false (token-hygiene on existing surfaces, no new UI) → handoff routes to B-block, not D-block, which is correct.

## Rework instructions  (only if REWORK)
N/A — APPROVED.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2
- design_gap_flag: false
- next_block: B (Build)

---
## Phase 2 — Karen + jenny + Gemini (merged) — GATE PASSED
- **karen (a7aee1392626f4c59): APPROVE** — all 6 claims verified. B-3 exact targets: ServerRail.tsx:111 (rail bg #0a0a0b→surface-900); StartDmPicker.tsx:176 (modal card #1c1c1f→surface-900); StartDmPicker.tsx:432 (disabled confirm/send button #27272a→emerald@40%, also color:433 + cursor:434 for "no pointer"). NOTE: "disabled send" = the StartDmPicker CONFIRM button (Open DM/Create Group) — NOT a MessageComposer send (composer stays enabled offline). 3 hex appear in 39 files → surgical fence load-bearing (do NOT touch the other 36). Floor precedents real.
- **jenny (a8618dccb70548fd7): APPROVE** — no drift. All 3 tokens MATCH DESIGN-SYSTEM (rail→surface-900 line 16/119; picker modal card→surface-900 lines 101+103 [modal card is canonically surface-900; current surface-800 is the message-canvas token misapplied]; disabled→emerald@40% line 97). Surgical deferral consistent (monotonic off→on-token improvement, no half-migration conflict). No journey-map delta.
- **B-3 impl notes (both):** implement emerald@40% as a var(--color-accent-emerald)-derived value (opacity/alpha), NOT re-hardcoded #10b981 (AC4 consumption). Target picker MODAL card container, not DM list rows.
- **Gemini:** see P-4-gemini-review.md (UNAVAILABLE=degradable non-block).
GATE PASSED → design_gap_flag=false → B-0.
