# BOARD vote — risk-manager — P-1-floor-merge-wave-87

## Vote
APPROVE A

## Rationale (<=150 words)
Process-risk lens weighs two failure modes. Option B's forced 6-bug grab-bag (auth + servers + privacy-schema + web-error) is the larger risk: it concentrates blast radius, inflates review load, and lets a regression hide among five unrelated changes — defeating the floor's own goal (ship-worthy, reviewable waves). Option A's precedent is already well-bounded, not a novel loophole: PRODUCT-PRINCIPLES #5 codifies it, and waves 16/21/23/24/25/50/83 walked the identical path — wave-83 (sub-floor, roadmap-complete, no merge candidate, bug-fix phase) is structurally the same and resolved by rule. The floor is a thin-greenfield-feature guard; this ~140-LOC behavior-preserving fix that removes a standing backfill dependency has no valid split. Merge is structurally impossible (0 milestones), so the gate isn't being evaded — it doesn't apply. Ship A with the guardrails below to keep the precedent from drifting into a general waiver.

## Hard-stop?
none

## Dissent note (only if APPROVE with concerns)
APPROVE A with guardrails to keep the precedent bounded and auditable:
1. **Four conjunctive conditions** — the waiver applies ONLY when ALL hold: (a) bug-fix / debt-fix phase, (b) seed `milestone_id IS NULL` AND zero `in_progress`/`todo` milestones (merge structurally impossible), (c) single coherent fix under the max rubric, (d) behavior-preserving or live-verified defect. Miss any one → floor applies normally. NOT a general floor waiver.
2. **Log per PRODUCT-5 to product-decisions.md**; once logged, future structurally-identical waves resolve BY RULE (like wave-83/25) — do NOT re-convene BOARD each time. This stops floor-override escalation fatigue.
3. **Standing-signal guardrail:** each such override must carry a one-line note that the roadmap is terminal and a strategic re-plan remains parked for the founder — so a long bug-fix run of sub-floor waives never silently masks the un-answered wave-80 direction question. This is the real accumulating risk, not the floor.
