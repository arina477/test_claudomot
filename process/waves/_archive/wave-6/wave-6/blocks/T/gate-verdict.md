# Wave 6 — T-block (Test) gate-verdict

**Block:** T · **Gate:** T-9 Journey · **Wave topic:** CI boot-probe (CI-only) · **Head:** head-tester
**Verdict source:** stage-artifact review + gh CLI spot-check (main CI run 28378682349)

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-9-journey
  reviewers:
    head-tester: APPROVED
  failed_checks: []
  layer_verdicts:
    T-1-static:      APPROVED   # CI lint+typecheck green on PR#16 (+ post-merge main run)
    T-2-unit:        SKIP        # no app code changed (CI-config only) — justified
    T-3-contract:    SKIP        # no shared schema / contract change — justified
    T-4-integration: APPROVED   # boot-probe = integration-grade; green + proven real (see below)
    T-5-e2e:         APPROVED   # e2e Playwright job green on PR#16 and main; web unchanged
    T-6-layout:      SKIP        # no UI surface — justified
    T-7-perf:        SKIP        # not a perf-sensitive change — justified
    T-8-security:    APPROVED   # no auth surface; gitleaks secret-scan clean (only throwaway test PG pw)
    T-9-journey:     APPROVED   # gate
  journey_regen_skipped: true
  journey_regen_skip_reason: >-
    Pure CI infrastructure change (.github/workflows/ci.yml + process docs only).
    No new screen, route, endpoint, or user flow. The boot-probe adds no user-facing
    surface, so user-journey-map.md has nothing to regenerate against. F1-F9 flows
    are unchanged from wave-5; their existing smoke coverage still applies.
  next_action: PROCEED_TO_V
```

## Rationale

Wave-6 is a small, CI-only change that adds a `boot-probe` job to the CI workflow: it boots the
COMPILED api artifact (`node apps/api/dist/src/main.js`) against a throwaway postgres:16 + dummy env
and polls `/health` for `status:ok`, dumping logs and failing on crash. Judged proportionately, every
applicable layer passes and every skip is justified by the absence of the surface that layer proves
(no app code → no T-2 unit; no contract → no T-3; no UI → no T-5 layout/T-6 perf; no auth → T-8 is
secret-grep only, which is clean). T-1 static and T-5 e2e ran green on PR#16 and again on the
post-merge main run.

The honesty crux of this wave is T-4. The boot-probe is exactly the kind of check head-tester demands:
it can be made to fail by a real bug (a non-booting compiled artifact, a missing lazy-init, a bad
DATABASE_URL) and it is NOT a tautology. The CI log proves it exercised a genuine cold boot rather
than false-passing — attempt 1 returned `curl: (7) Couldn't connect to server` (artifact not yet
listening), attempt 2 returned `/health returned ok` after the ~1s boot. A test that observes a real
not-yet-serving state and then a real 200 is the opposite of theater; it cannot go green unless the
dist actually serves. This directly closes the compiled-dist boot blind spot flagged in wave-5's L-2,
so the wave is itself a net improvement to suite honesty.

I independently verified the deliverable is live on the default branch: `gh run view 28378682349`
(push to main, post-merge) lists `boot-probe: success` alongside lint/typecheck/test/build/secret-scan/e2e
all green, and PR#16 merged as 75e7d9d. Journey-map regeneration is correctly skipped with a recorded
reason (no user-facing surface). No test-honesty gaps, no flake (0 reruns), no coverage theater, no
mock-the-system-under-test, no scope creep into untestable surfaces. APPROVED → proceed to V-block.
