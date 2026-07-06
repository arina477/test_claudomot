# P-4 Gate — wave-56 (getDmCandidates defensive LIMIT)

```json
{
  "agent": "head-product",
  "stage": "P-4",
  "status": "gating",
  "block_state": { "design_gap_flag": false, "bet_id": "academic-tools-offline-first", "milestone_id": "84e17739-af5e-4396-beb9-b6f3d6836fc4", "reviewer_verdicts": { "problem-framer": "REFRAME", "ceo-reviewer": "SCOPE-REDUCTION", "mvp-thinner": "THIN" } }
}
```

## Verdict: APPROVED

Independent P-4 gate. The reframe is sound, its load-bearing factual claim verified at source, the scope is falsifiable, and the split is disposed correctly in the DB. One non-blocking watch handed to B-6 (test honesty). Floor override is legitimate.

---

## Judge findings

### 1. Reframe sound? — YES

**Load-bearing claim verified at source (not inferred).** Read `apps/api/src/dm/dm.service.ts` `getDmCandidates`: Step 2 is `db.selectDistinctOn([users.id], {...}).from(server_members).innerJoin(users).where(and(inArray(server_id, callerServerIds), ne(user_id, callerId), ne(who_can_dm,'nobody'))).orderBy(users.id, asc(display_name))` followed by an in-memory `.sort()`. There is **no `.limit()`, no cursor, no offset** anywhere in the method. The query is genuinely unbounded — the reframe's central premise is TRUE.

**Ship-the-cap vs stay-fully-deferred:** ship the cap is correct. An unbounded server-side query is a latent correctness/safety bug independent of scale — it is not the same YAGNI object as the pagination-UX. YAGNI applies to *user-facing pagination machinery built for a scale that does not exist* (that IS deferred). A `.limit(CAP)` clause is defensive hygiene: cheap (one clause), always-safe (at MVP scale `eligible < CAP` → identical output), reversible, and it protects every future wave from an accidental full-table fan-out. The seed's own prose ("do NOT pull the future slice into a small fix") targets (b) the pagination UX, not (a) the cap. All three reviewers converged and are reconciled, not overridden: problem-framer REFRAME (antipattern #4), ceo-reviewer SCOPE-REDUCTION explicitly walking back its own wave-55 "high-leverage" flag under stress-test, mvp-thinner THIN. The ceo-reviewer self-correction is the strongest signal that this is right-sized, not motivated. Falsifiable AC: "list can never return an unbounded set" has an observable signal (the LIMIT clause + a proving test).

### 2. Test honesty — ACCEPT the plan's flexibility; do NOT pin the mechanism now. Watch handed to B-6.

Proving ">CAP → ≤CAP" with a generous CAP (~500) needs 501 fixtures — impractical and not worth a bulk-insert harness for a pre-launch correctness cap. Pinning a specific mechanism at P-2/P-3 would be over-specifying an implementation detail that the B-block is better positioned to choose against the actual test harness. The spec correctly frames the AC by *what must be proven* ("the bound is applied, provably, by a non-vacuous test") and delegates *how* to B-block — this is correct spec discipline, not a gap.

The one real risk is a **vacuous test**: shipping a `.limit()` with an assertion that never exercises the bound (e.g. asserting on a set of size < CAP, which passes identically with or without the limit). That is a B-6 review obligation, not a P-block defect — the P-3 plan already flags it ("don't ship a vacuous limit test"). **Recommendation, non-blocking, handed to head-builder at B-6:** the proving test must either (a) exercise the bound directly with a small representative CAP override / injected constant so `>CAP` fixtures are cheap, or (b) assert the LIMIT is present in the emitted query shape — but NOT merely re-assert existing `(a)/(b)/(c)` MVP-scale cases, which are limit-agnostic. Prefer an exported/injectable `DM_CANDIDATES_LIMIT` so a test can set a low cap and prove the bound with a handful of rows. This is the honest, feasible mechanism; the plan's flexibility permits it. Not a REWORK trigger — B-6 owns the honesty check.

### 3. Split correctness — YES, correct.

Verified in DB: `999a14d1` has `parent_task_id = NULL`, `wave_id = NULL`, `milestone_id = M8`, `status = todo` — a **top-level deferred seed**, NOT parented to the consumed seed c5051444. This is right. Parenting the sibling to c5051444 (which is consumed and closed this wave) would strand it: a V-2/N-2 follow-up must have `wave_id = NULL` and no dependency on a consumed parent to remain N-block seedable. The mvp-thinner's sketch proposed `parent_task_id = c5051444`; that was correctly overridden at P-1/execution to a top-level seed. No task in the current bundle depends on an unbuilt out-of-bundle task. Split is clean.

### 4. Floor override — YES, legitimate.

P-1 correctly trips the sub-floor (~10–40 LOC) and override-ships under PRODUCT rule 5 / obs-B 7th: a genuine latent-bug correctness cap with no valid merge candidate (AC-B is split-deferred by design; the remaining M8 tail is cosmetic/cross-surface, not a coherent merge). `floor_merge_attempt: 0` is acceptable here because the merge candidates don't exist, not because merge was skipped. This is exactly the exception the floor-override rule is for — the floor prevents under-packed *feature* waves, not cheap correctness hygiene.

---

## Stage-exit checklist (P-4)

- [x] Every upstream stage-exit box ticked from a concrete artifact — P-0 frame + 3 reviewer verdicts read; P-1 decompose read; P-2 spec read from DB SoT; P-3 plan read; source verified; DB rows queried.
- [x] Reviewer pool returned and drift resolved — problem-framer + ceo-reviewer + mvp-thinner all present and reconciled (not silently overridden). Load-bearing "unbounded query" claim verified at source (karen-role check done inline). No spec-vs-bet drift: spec traces to live bet + M8, non-goals (no cursor/pagination/typeahead) named explicitly.
- [x] design_gap_flag correctly FALSE — LIMIT-only, no client/UX surface; handoff routes to B-block, not D-block.
- [x] Spec ACs enumerated + independently verifiable; edge cases (`<CAP`, `>CAP`, 0-servers) specified; non-goals named; spec embedded as fenced YAML at head of task description (SoT confirmed).
- [x] Plan reuses established architecture (in-query Drizzle `.limit()` on existing chain); introduces no new infra (no Redis/replica/pagination scaffolding); each step maps to a bundle task with an observable artifact.
- [x] No auth/session/cookie/rate-limit surface — security-tightened gate not triggered.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: P-4
  reviewers:
    problem-framer: REFRAME
    ceo-reviewer: SCOPE-REDUCTION
    mvp-thinner: THIN
    karen-role-inline: PASS  # unbounded-query claim verified at dm.service.ts source
  failed_checks: []
  watch_items:
    - "B-6: proving test must NOT be vacuous — require an injectable/exported DM_CANDIDATES_LIMIT so a low-cap override proves >CAP → ≤CAP with few fixtures, OR assert LIMIT present in query shape. Do not lean on limit-agnostic (a)/(b)/(c) cases as the proof."
  rationale: >
    Reframe is sound and its load-bearing claim (getDmCandidates genuinely
    unbounded — no .limit/cursor/offset, in-memory sort over full set) is
    verified at source, not inferred. Shipping only the defensive cap is the
    correct call: an unbounded query is a scale-independent latent bug worth a
    cheap always-safe cap, distinct from the pagination-UX which is correctly
    deferred to top-level seed 999a14d1 (verified parent_task_id NULL / wave_id
    NULL — will not strand). All three reviewers converged and are reconciled,
    including ceo-reviewer self-correcting its own wave-55 high-leverage flag.
    Scope is falsifiable, non-goals named, design_gap_flag correctly false,
    floor override legitimate (PRODUCT rule 5, no valid merge candidate). The
    one real risk — a vacuous limit test — is a B-6 honesty obligation the plan
    already flags; the spec's mechanism-flexibility is correct, not a gap.
  next_action: PROCEED_TO_B-block
```

---
# Wave 56 — P-4 Phase 2 merge
| Reviewer | Verdict | Notes |
|---|---|---|
| karen | APPROVE | 5/5: getDmCandidates genuinely unbounded (dm.service.ts:694-711, no .limit); .limit() placement valid post-orderBy; 999a14d1 top-level (parent+wave NULL, non-stranded); no schema/DTO/predicate change; node-specialist AGENTS.md:84. Note: prefer real >CAP test over shape-only. |
| jenny | APPROVE | 4/4 MATCHES: LIMIT respects wave-47 fence (fenced pagination-UX ≠ query bound); no journey-map change (no state expects unbounded/paginated list; MVP-scale identical); consistent with seed prose + realist premature flags; AC-B deferral correct + explicit no-auto-drain. |
| Gemini | UNAVAILABLE (429) | degrades |

**PASS.** karen+jenny APPROVE, Gemini UNAVAILABLE. design_gap_flag false → B-block. **B-6 WATCH: require an injectable/exported DM_CANDIDATES_LIMIT so a low-cap override proves >CAP→≤CAP — NOT a vacuous shape-only or (a)/(b)/(c)-reliant test.**
