# T-9 Gate Verdict — Wave 56 (getDmCandidates defensive LIMIT)

**Gate:** T-9 (block-exit) · **Head:** head-tester · **Mode:** automatic · **Live commit:** efc1a47 · **wave_type:** backend

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-9-journey
  reviewers:
    head-tester: APPROVED
  failed_checks: []
  rationale: >
    Cap coverage is genuine and skips are honest. Case (d) proves BOTH directions
    at DB level against real Postgres (CI 28763433748, postgres:16, 69ms, observed
    passing): >CAP→≤CAP (inject cap=2 vs 3 eligible co-members → length ≤ 2, AND
    > 0 so non-vacuous) AND default→all (default cap 500 → toHaveLength(3), MVP-scale
    unchanged). Non-vacuity is structural: .limit() sits after .orderBy, so absent
    the LIMIT, PG returns 3 and the ≤2 assertion fails — a plausible-real-bug-detectable
    test (mutation sanity satisfied), not a mock-count. T-8-skip is sound: the diff is
    exactly one exported const + one optional param + `.limit(limit)` appended after
    `.orderBy`; the who_can_dm privacy predicate is byte-for-byte untouched and executes
    BEFORE the cap, so a row-count cap can only drop rows the fence already admitted —
    it is structurally incapable of weakening the fence, hence no new authz/IDOR surface
    and no probe warranted. Cases (a/b/c) independently re-prove the fence intact under
    the new query shape (nobody excluded, disjoint isolated, server-members truth-table).
    Skips T-3 (no contract/Zod change), T-5/T-6/T-7 (no UI/rendered surface/bundle delta)
    are legitimate for a backend-only wave. Findings: 0 open (aggregate empty; every
    deliverable YAML findings:[]). Phase-2 journey regen skip sound — no route/screen/
    endpoint/flow added or changed (F1–F9 inventory unaffected by an internal query bound).
  next_action: PROCEED_TO_V-block

evidence:
  cap_coverage_genuine: true
  cap_gt_to_le:   "dm-candidates.spec.ts:266-269 — getDmCandidates(CALLER_D,2) → length ≤ 2 AND > 0 (3 eligible co-members)"
  cap_default_all: "dm-candidates.spec.ts:273-274 — getDmCandidates(CALLER_D) → toHaveLength(3)"
  non_vacuity: "structural — .limit() after .orderBy; absent LIMIT, PG returns 3 → ≤2 fails (mutation-sanity)"
  real_postgres_ci: "run 28763433748, postgres:16, case (d) 69ms, observed passing"
  t8_skip_justified: true
  t8_rationale: "diff = const + optional param + .limit() after .orderBy; who_can_dm predicate untouched; cap runs after fence → cannot weaken it; cases a/b/c re-prove fence"
  fence_reproven: "dm-candidates.spec.ts:132 (nobody excl), :166/:169 (disjoint isolation), :227/:231 (server-members truth-table)"
  skips_legit: [T-3-no-contract-change, T-5/T-6/T-7-no-UI-surface]
  findings_open: 0
  phase2_journey_regen: skipped-justified-no-flow-change
```
