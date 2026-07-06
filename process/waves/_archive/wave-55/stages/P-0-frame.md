# P-0 — Frame (wave-55)

## Discover section
- **wave_db_id:** `5cbb1b2d-d6ec-4262-a1b1-ef98c7720060` (wave 55).
- **Prior-work:** the DM-candidates integration suite is wave-48 (task 03ccf636), covering who_can_dm='nobody' (excluded) + 'everyone' (control) + a disjoint non-co-member isolation case (default-tier user). 344eabde flagged HIGH by wave-54 P-0 ceo-reviewer + L-block.
- **Roadmap milestone:** M8 `84e17739` (in_progress); wave-55 backfilled. Draining the tail.
- **Short-circuit:** no-prior-spec → full P-1..P-3.
- **Product-decision:** none Tier-3 (test-only, no money/UX/schema).

## Reframe section

**Original framing (seed):** add ONE positive-control integration assertion — a who_can_dm='server-members' co-member sharing a server with the caller IS returned by getDmCandidates. Closes the "last enum-value coverage corner."

**problem-framer — REFRAME (antipattern #3 demo-path tunnel vision).** Verified in code: `getDmCandidates` predicate (`dm.service.ts:704-711`) is `and(inArray(server_id, callerServerIds), ne(user_id, callerId), ne(who_can_dm,'nobody'))` — it admits 'everyone' and 'server-members' IDENTICALLY (same code path). So a positive-only 'server-members' assertion is REDUNDANT with the existing 'everyone' control. The 'server-members' tier's DISTINGUISHING contract is "DMable ONLY by shared-server members"; its load-bearing UNTESTED cell is the **NEGATIVE** — a 'server-members' user sharing NO server must be EXCLUDED. Existing case (b) exercises non-co-member exclusion with a DEFAULT-tier user, not a 'server-members' user. Right scope: the **2-cell 'server-members' truth-table** (positive co-member INCLUDED + negative non-co-member EXCLUDED). Not RESCOPE-AUTO-SPLIT (2 assertions in one block = one bundle).

**ceo-reviewer — SELECTIVE-EXPANSION.** Ship positive + one NEGATIVE-control sibling (a 'server-members' user sharing no server → EXCLUDED). A privacy control's worth is in what it BLOCKS — the positive alone stays green through a future leak widening the shared-server predicate (dm.service.ts:706); the negative is the regression fence that catches it. Near-zero cost (same pg-harness). Did NOT recommend a full truth-table sweep of other enum values (over-scope). **Milestone-disposition flag (for N-1):** M8 tail (7 open) has ZERO unshipped feature scope (2 test-debt + 4 DM-polish + this); the success metric is substantively met. Drain only high-leverage (this privacy fence + c5051444 pagination scale-correctness); treat cosmetics as fold-in debt; **let N-1 weigh promoting M9 (Monetization) soon.**

**mvp-thinner — OK (floor-constrained).** One AC, nothing to thin; splitting a single test is the floor's anti-goal. Notes the negative case is partly structurally covered by case (b)'s disjoint fence (enum-independent), so an explicit 'server-members' negative is EXPANSION not thinning — flagged for merge visibility, no verdict impact (does NOT oppose it).

**Mediation + disposition (orchestrator merge):** problem-framer REFRAME + ceo-reviewer SELECTIVE-EXPANSION converge on the 2-cell truth-table; mvp-thinner does not oppose (defers to ceo's lane). **Accepted the reframe: PROCEED with the 2-cell 'server-members' privacy truth-table** — (1) positive: a 'server-members' co-member sharing a server with caller IS returned; (2) negative: a 'server-members' user sharing NO server is EXCLUDED (the load-bearing privacy-boundary regression lock). Rationale for including the negative despite mvp-thinner's "partly covered": an EXPLICIT tier-specific negative pins the boundary against a future predicate-widening refactor (which a default-tier case (b) + positive-only test would both miss); it's ~one fixture + one assertion (cheap); and 2 of 3 reviewers (incl. the primary reframe reviewer) want it.

**Disposition:** PROCEED (reframed to the 2-cell 'server-members' truth-table; test-only, no production/schema change).

**Final framing:** wave-55 adds TWO real-Postgres integration assertions to `apps/api/test/integration/dm-candidates.spec.ts` — (1) a `who_can_dm='server-members'` co-member (shares a server with caller) IS returned by `getDmCandidates`; (2) a `who_can_dm='server-members'` user sharing NO server with caller is EXCLUDED. Reuses the pg-harness + `insertFixtureUser`. `claimed_task_ids = [344eabde]`. design_gap_flag: false. Test-only, no production/schema change. Sub-floor → P-1 override-ship by rule (PRODUCT rule 5, obs-B 6th).

**N-1 CARRY (wave-56+):** ceo-reviewer milestone-disposition flag — M8 tail has zero unshipped feature scope; success metric substantively met. N-1 should weigh promoting **M9 (Monetization)** soon rather than grinding the low-tier DM-polish tail (c5051444 pagination is the remaining high-leverage item; the rest is fold-in debt). Record at N-1.
