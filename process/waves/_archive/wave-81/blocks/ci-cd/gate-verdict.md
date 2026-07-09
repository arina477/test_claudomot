# C-1 Merge Gate Verdict — wave-81

**Gate owner:** head-ci-cd (spawn-pattern C-block)
**Stage:** C-1 (PR, CI & merge)
**Verdict:** REJECT-MERGE — hard-stop
**Date:** 2026-07-09

## PR
- #100 — https://github.com/arina477/test_claudomot/pull/100
- Branch `wave-81-fullpage-scroll` @ ad6242b, base main, squash.
- Wave = frontend-only FullPageScroll wrapper on 5 standalone routes. NO schema/migration.
- PR diff touches ONLY the 5 page components + FullPageScroll.tsx + their tests + wave docs. Does NOT touch study-timer.

## CI result — run 29002723503 (6 required + e2e non-required)
| Check | Required | Result |
|---|---|---|
| lint | yes | PASS (39s) |
| typecheck | yes | PASS (1m2s) |
| build | yes | PASS (44s) |
| secret-scan | yes | PASS (11s) |
| boot-probe | yes | PASS (1m6s) |
| **test** | **yes** | **FAIL** |
| e2e | no | PASS (1m0s) |

### `test` failure detail
- **Run 1** (1m52s): 1 assertion failed in `src/shell/study-timer.test.tsx` — "work input rejects out-of-range value (>120) — shows validation error" → `Unable to find an element by: [data-testid=/work-error$/]` (~1053ms timeout). Sibling "break input rejects out-of-range (>60)" PASSED in 48ms. All ~40 other study-timer + dm + messaging tests passed.
- **Flake re-run** (C-1 Action 8 Step A): re-ran the failed `test` job once. NOTE: B-5 recorded `flakes_documented: []` — the flake was named only in the wave dispatch briefing, never logged in B-5 (no ledger standing).
- **Run 2** (re-run of failed job): `test` job ran **15m00s** then **CANCELLED** (hit GitHub job/step timeout — killed, no failed-test log flushed). `conclusion: cancelled`.

## Classification (Iron Law — classify-then-route)
- Triage table: "Test failure — unit assertion fails" → tag `testing` → **head-tester** (executor **react-specialist**).
- Second fail → flake reclassified to real defect per C-1 Action 8 Step A → Step B routing.
- Defect shape: `study-timer.test.tsx` "work input rejects out-of-range (>120)" — `data-testid=/work-error$/` never renders (asymmetric vs. the passing break-path sibling) PLUS a 15m async hang. Points at the work-error validation path or its test's timer handling.
- The failing test is OUTSIDE wave-81 scope (wave touches zero timer code) — pre-existing/unrelated defect surfaced as a merge blocker.

## Verdict rationale
PR #100 is clean in its own diff, but the required `test` check is red on a reclassified real defect. The single re-run allowance under C-1 Action 8 Step A is exhausted (run 2 hung to the 15m timeout and CANCELLED); B-5 `flakes_documented: []` grants no re-run standing. `mergeable=MERGEABLE` reflects only conflict state — the required-check gate is unmet (`mergeStateStatus=BLOCKED`). Bypassing a red required check would be CI-theater and is forbidden (Iron Law + branch protection; no admin override, no direct fix). Scope governs WHO fixes the defect, not WHETHER a red required check blocks merge.

## Routing
- study-timer `work-error` defect + 15m test-hang → **head-tester → react-specialist** as a standalone B-stage remediation task. Root-cause first; do NOT debug-by-deploy; do NOT silence the test without root cause.
- Wave-81 stays BLOCKED on the required `test` check until it goes green.

## head_signoff
```yaml
head_signoff:
  verdict: REJECTED
  stage: C-1
  failed_checks:
    - "required check `test` red (run 29002723503): deterministic work-error assertion fail + 15m re-run hang → CANCELLED"
    - "flake reclassified to real defect per C-1 Action 8 Step A (second failure); B-5 flakes_documented:[] grants no re-run standing"
    - "cannot merge past red required check — Iron Law + branch protection (no admin override, no direct fix)"
  next_action: ESCALATE
  block_state:
    pr_url: "https://github.com/arina477/test_claudomot/pull/100"
    ci_run_id: "29002723503"
    rollback_ready: false
```

## Process note (for C-block exit → CI-PRINCIPLES candidate at L-2)
B-5 shipped `flakes_documented: []` while a known flake was live in the briefing — that ledger gap is what made the re-run allowance ambiguous. Candidate rule: a flake asserted in a briefing but not recorded in the B-5 flakes ledger carries no re-run entitlement.
