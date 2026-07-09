# C-1 — PR → CI → Merge (wave-82)

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  pr_checks_final: |
    boot-probe   pass  1m11s
    build        pass  43s
    e2e          pass  1m8s
    lint         pass  37s
    secret-scan  pass  17s
    test         pass  2m4s
    typecheck    pass  43s
  merge_state_status: CLEAN
  mergeable: MERGEABLE
  pr_state_after_merge: MERGED
  merged_at: "2026-07-09T11:12:42Z"

pr_number: 101
pr_url: https://github.com/arina477/test_claudomot/pull/101

required_checks:
  - name: lint
    result: pass
    run: 29013089878
    attempt: 2
  - name: typecheck
    result: pass
    run: 29013089878
    attempt: 2
  - name: test
    result: pass
    run: 29013089878
    attempt: 2
  - name: build
    result: pass
    run: 29013089878
    attempt: 2
  - name: secret-scan
    result: pass
    run: 29013089878
    attempt: 2
  - name: boot-probe
    result: pass
    run: 29013089878
    attempt: 2

optional_checks:
  - name: e2e
    result: pass
    run: 29013089878
    attempt: 2

fix_up_cycles: 0

infra_reruns:
  - run: 29013089878
    attempt_failed: 1
    attempt_passed: 2
    classification: ci-infrastructure (whole-run cancellation, NOT a code defect, NOT the study-timer flake)
    evidence: |
      Attempt 1 (headSha 90d3d790): overall conclusion=failure, but ALL 7 jobs
      concluded `cancelled` at the identical instant (2026-07-09T11:08:58Z), each
      having run the full uniform 15m1s, with ZERO steps recorded and no
      logs/annotations retained (API returned BlobNotFound for job logs).
      No newer commit and no superseding run existed for the SHA. That signature
      (all jobs killed together at a fixed 15-min wall, no step data) is a
      run-level / runner-infrastructure cancellation, not a test assertion
      failure and not fail-fast sibling cancellation.
    action: single fresh `gh run rerun 29013089878` (one-shot, analogous to the
      flake-check rerun policy for a lost/cancelled run).
    outcome: attempt 2 green — all 7 jobs success with normal durations
      (17s–2m4s), confirming attempt 1's uniform 15m1s was infra timeout, not code.

merge_strategy: squash
merge_commit_sha: 30bad9149985f67651fcd06f3023df0bc86e2bd8
local_main_synced: true
local_main_head: 30bad9149985f67651fcd06f3023df0bc86e2bd8

note: >
  Single-spec fix of the transient-401 auth bounce (primary task 0e58af8e).
  PR #101 opened against main; 6 required checks (lint, typecheck, test, build,
  secret-scan, boot-probe) + non-required e2e all green on attempt 2. Attempt 1
  was a whole-run CI-infrastructure cancellation (all jobs killed at a uniform
  15m1s with no logs) — NOT the study-timer flake and NOT a code defect; cleared
  by one fresh re-run per the lost/cancelled-run rerun policy; fix_up_cycles=0
  (no code touched, Iron Law respected). Merge was CLEAN/MERGEABLE, done directly
  with `gh pr merge --squash --delete-branch` (no --auto needed; branch deleted).
  Merge commit 30bad914 on main; local main rebased and synced to the same SHA.
  Reminder for C-2: Railway deploy is CLI-push (`railway up` per changed service),
  not a merge-to-main git trigger — this web-only change needs the web service
  redeployed at C-2.
```
