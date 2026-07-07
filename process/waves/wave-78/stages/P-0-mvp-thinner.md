# P-0 mvp-thinner — wave-78

**Agent:** mvp-thinner
**Spawn trigger:** active milestone M13 `## Class` = `product-feature`
**Milestone:** M13 — Institution partnerships & portable identity (`in_progress`, H3/T6, bet = Differentiation/long-term moat)
**Wave under review:** 2-task member-profile-card polish bundle (M13 leg-2 follow-up)

- Seed `4be3b084` — Allow clearing academicRole back to unset (nullable in shared contract + editor empty→null + service persists null). ~10-20 LOC.
- Sibling `3b3530d8` — Distinguish genuinely-hidden profile from transient network error on the member card (branch fetch error handler on error kind; preserve uniform-404 anti-oracle). ~10-30 LOC.

---

## VERDICT: OK

**One-line:** Metric-anchored thinness is blocked (M13 success metric is founder-reserved `_TBD`), the two ACs are genuinely independent but *both* sit on the same shipped portable-identity surface (the member profile card) and are each cheap, low-risk correctness fixes with no bloat — so I abstain to OK rather than force a THIN split that would only add pipeline overhead. No AC re-classification. No new sibling seeds.

---

## Reasoning

### 1. Metric-absence check (honest abstention gate)
M13's `## Success metric` is `_TBD by founder_` — explicitly **fenced / founder-reserved**, outside the pricing-only standing delegation. Authoritative thinness ("which ACs are mvp-critical to the *metric*?") requires a metric to measure criticality against. There is none. Per the spawn instruction, when the metric is absent the correct move is **abstain to OK, not force a THIN**. I will not manufacture a criticality ranking from a metric that does not exist.

### 2. Are the two tasks genuinely independent? — Yes, but that is not sufficient to split
- `4be3b084` touches the **write path**: `UpdateProfileSchema` (shared Zod contract) + profile service + editor `<select>`. It fixes a dead affordance (empty option → silent 400 no-op).
- `3b3530d8` touches the **read path**: `MemberProfileCard` fetch error-handler branching (404 → hidden state unchanged; network/5xx → retryable). It fixes an error-state ambiguity.

No shared file, no shared type change, no ordering dependency, no shared migration. They are technically de-couplable — head-next could have seeded either alone. So independence is real.

### 3. Why independence does NOT justify a split here
The mvp-thinner mandate is to split ACs that inflate a wave **beyond** mvp-critical. Splitting is a *cut* tool, not a *reorganize* tool. It is only worth firing when it removes cost or risk from the current wave. Here neither is present:

- **No bloat to cut.** Both tasks are already sub-30-LOC, single-concern correctness fixes carried from wave-77 V-2 (a T-8 LOW + two jenny findings). Neither adds a feature, a surface, or a schema. There is no gold-plated AC hiding inside either that a sibling could absorb.
- **Cohesive surface, correct N-2 bundling.** Both defects live on the **member profile card** — the exact UI that *is* leg-2's "portable academic identity" value made visible to a viewer. head-next's N-2 call to bundle them (same surface, no coupling, both V-2 carry-overs) is sound: they will be built, tested, and V-block-reviewed against one surface in one pass. Splitting the sibling to a later wave would re-pay the P→B→C→T→V→L→N overhead a second time for the same file neighborhood — pure pipeline tax, zero thinness gain.
- **Splitting would strand, not thin.** With only these two rows in the entire M13 open queue and leg-3 (privacy/E2E) unauthored, deferring `3b3530d8` to a "later sibling wave" means it has no wave to land in until the milestone is decomposed again. That is a stall risk, not a leaner MVP.

### 4. Privacy-contract note (not a thinness objection, a build guardrail to carry forward)
`3b3530d8` explicitly must **preserve the uniform-404 anti-oracle** (hidden profile and non-existent profile return identical 404 so a viewer cannot probe membership). The fix branches on transport-error *kind*, NOT on server-distinguished 404 sub-reasons — the 404 hidden state copy must stay byte-identical. This is a correctness invariant the B/T/V blocks must enforce; it is not a reason to split or defer, but flagging it here so the spec (P-2) and T-8 security stage inherit it as a hard AC. If anything this *reinforces* keeping the two together, since the write-path task also touches profile visibility semantics and both should be reviewed under one privacy lens.

### 5. AC-level re-classification proposals
**None.** Neither task decomposes into separable mvp-critical vs. deferrable ACs — each is already a single atomic AC:
- `4be3b084`: "empty role selection persists as null and round-trips" — one AC, indivisible (contract + wire + persist are one behavior).
- `3b3530d8`: "transport failure shows retry; 404 hidden state unchanged" — one AC with a mandatory paired non-regression (the anti-oracle), which must NOT be split off (splitting the anti-oracle guard from the retry behavior would ship a privacy leak).

### 6. Sibling seeds proposed
**None.**

---

## Downstream notes for head-product (P-4)
- Not an OVER-CUT: the wave is not too thin — two independent-but-cohesive correctness fixes is a legitimate minimum, not a starved one.
- Not a THIN: no AC can be honestly demoted without a metric; forcing one would be metric-hallucination.
- Carry the uniform-404 anti-oracle into P-2 as a hard, non-negotiable AC on `3b3530d8`, tagged for T-8.
- Both tasks are wave-77 V-2 carry-overs — treat as bug-closure follow-ups, not new scope.
