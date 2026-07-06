# Wave 59 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-wave59-p4-a1)
**Reviewed against:** process/waves/wave-59/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-59 is a contract-correct, ~2/10-value tail-drainage wave: a single table-driven unit test that locks `buildTypingLabel`'s 5-branch output contract (0→''; 1→'<name> is typing'; 2→'<a> and <b> are typing'; 3→'<a>, <b> and <c> are typing'; 4+→'Several people are typing') in `apps/web/src/shell/useTyping.ts`, closing the wave-45 V-2 F1 coverage gap. Every stage-exit checkbox ticks from a concrete artifact, not inference. The acceptance criteria are falsifiable and observable — each of the 5 buckets is a concrete literal string, and drift fails the assertion deterministically. I independently verified the two load-bearing claims against source: `buildTypingLabel` is genuinely module-private at line 65 (no `export`), and all 5 branches emit exactly the strings the ACs enumerate (lines 67/70/75/81/83). The one real plan decision — add the `export` keyword vs. test indirectly through the `useTyping` hook — is correctly resolved: exporting a pure function for a genuine unit test is the standard lowest-risk pattern, it is a visibility-only change with no logic edit (the spec's "no production change" governs LOGIC, and problem-framer's "do not change the function" holds because a keyword is not behavior), and the rejected hook-render alternative would not produce the transition-table-as-a-table shape the seed calls for. The floor exemption is correctly applied under the standing wave-16 test-coverage product-decision (re-affirmed waves 21/23/24), which genuinely covers pure test-debt seeds whose decomposer cannot author feature-siblings. design_gap_flag=false is correct — the wave asserts a pure function's output and touches no UI surface, so P-block hands off to B-0, not D-1. Low ambition is contract-correct here, not a defect: all three P-0 reviewers returned PROCEED, ceo-reviewer explicitly ruled HOLD-SCOPE and carried the M12 "offline-first moat" promotion flag forward to N-1; that is the right disposition of the strategic concern and not a P-block blocker. No happy-path-only, orphan-wave, spec-vs-bet-drift, architecture-blind, or gold-plating anti-pattern fires.

## Edge-case check (informational, not blocking)
The plan already names the two edge cases that matter for this contract and routes them into step 2 correctly:
- **3→4 boundary:** the 4+ bucket is the fall-through `return` (line 83); the table must include at least one 4-typer row to lock the 3→4 transition (the boundary the whole "transition table" framing exists to protect). P-3 step 2 explicitly requires all 5 buckets (0/1/2/3/4+), so a 4-typer row is mandated — boundary covered.
- **Verbatim name interpolation:** P-3 step 2 explicitly requires real display-name strings asserted to appear verbatim in the 1/2/3 buckets and a constant for 4+. This is the correct assertion shape — it catches ordering/separator regressions ("and" vs comma placement) that a length-only assertion would miss.
These are specified at the plan level, which is the correct altitude; they become B-block test-authoring obligations, not P-block gaps. No REWORK warranted.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

## Phase 2 — Karen + jenny + Gemini (merged)

**Verdict: GATE PASSED**

- **karen (agentId a22de9bafc2acb51a): APPROVE** — all 5 load-bearing claims VERIFIED against source: buildTypingLabel private at useTyping.ts:65; 5 branch strings match spec ACs verbatim (lines 67/70/75/81/83); react-specialist valid (AGENTS.md:82); wave-16 floor exemption real (product-decisions.md:233-236); export-only change (no branch/cast edit).
- **jenny (agentId ac2848701a29a4dc5): APPROVE** — no drift. Spec's 5 labels match the useTyping.ts JSDoc contract byte-for-byte; floor exemption consistent with wave-16/21/23/24/36/37; wave-58 BOARD explicitly named "typing-label" as legitimate deferred debt. Carry-forward (N-1, NOT this wave): F-4 (task 58633934 — co-members see empty typers, a server-side fan-out defect UPSTREAM of buildTypingLabel) is still OPEN — a green useTyping.test.ts must NOT be mistaken for F-4 being resolved. Plus the ceo-reviewer M12-pivot flag.
- **Gemini: UNAVAILABLE** (helper exit 3, HTTP 429) — degradable, non-blocking; gate proceeds on Karen + jenny.

**B-block carry-forward:** at B-3, the test must assert VERBATIM display-name strings (not placeholders/counts) so it guards name interpolation + separator grammar, per spec edge-case. Consider @task-completion-validator confirming all 5 buckets asserted.

design_gap_flag=false → next block is B-0 (not D).
