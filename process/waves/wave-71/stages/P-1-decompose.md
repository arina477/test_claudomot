# P-1 — Decompose (wave-71)
## Maximum rubric: none trip. ~2 files backend (listBlocks JOIN + DTO) + ~2 files web (BlockedUsersPanel render + MemberListPanel toggle); ~50-90 net LOC; ~4-6 primitives. Well under all caps.
## wave_type + floor
claimed_task_ids.length = 2 → **wave_type: multi-spec**. Floor: >2,500 net LOC OR ≥6 specs.
Seed [1193aebf] alone (~30-50 LOC) < floor → RESCOPE-AUTO-MERGE. The existing M14 polish sibling 1c633d2f (enrichment, wave_id NULL) re-parented under the seed (no new decomposition needed — the sibling already existed as a seed candidate). floor_merge_attempt=1.
Post-merge: 2 tasks, ~50-90 net LOC — STILL below the multi-spec floor (>2,500 OR ≥6 specs). Recursion guard: 1 expansion done, floor still unmet.
## Verdict: OVERRIDE-SHIP-BY-RULE (PROCEED-AFTER-MERGE, below-floor override)
Per PRODUCT-PRINCIPLES rule 5 + the legitimately-small high-value completion-wave precedent lineage (wave-21/23-27/50/53/65/66/67/69 override-ship-by-rule; precedent-application, NO BOARD): a small, high-value, reuse-heavy COMPLETION wave that finishes an already-decomposed milestone's residual polish ships below floor via precedent. This wave finishes M14's Block UI polish (2 V-2 follow-ons, the entire residual Block-UI surface — mvp-thinner confirmed no more scope exists to add). Both reframe reviewers (ceo HOLD-SCOPE, mvp OVER-CUT) + problem-framer PROCEED converge on exactly this bundle; adding scope would be drift before the founder launch GO. Override logged here.
claimed_task_ids = [1193aebf-0b83-4cb2-bec8-0caa98339241 (SEED: member-row Block↔Unblock toggle), 1c633d2f-4cb7-4cd1-b589-b735e23228a2 (GET /blocks name/avatar enrichment)]
## design_gap_flag: false
The Block UI surfaces already have a canonical mockup (design/block-ui.html, D-3 wave-70): the blocked-users list row (avatar + name + Unblock) + the block affordance. The enrichment just populates the ALREADY-DESIGNED name/avatar (no new surface); the member-row toggle reflects Block↔Unblock state on the EXISTING affordance (design already shows both states). No new UI surface → NO D-block. → B directly.
```yaml
wave_type: multi-spec
verdict: PROCEED-AFTER-MERGE (override-ship-by-rule, below-floor)
claimed_task_ids: [1193aebf-0b83-4cb2-bec8-0caa98339241, 1c633d2f-4cb7-4cd1-b589-b735e23228a2]
floor_merge_attempt: 1
override_ship_by_rule: true
override_precedent: "PRODUCT-PRINCIPLES rule 5 + completion-wave lineage (wave-50 etc); mvp-thinner confirmed no residual scope; reframe converged"
design_gap_flag: false
```
