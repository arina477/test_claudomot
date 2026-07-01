# Wave 25 — L-2 Distill

## Action 1/2 — Claimed tasks marked done + verified
`UPDATE tasks SET status='done' WHERE id='c18b8089-...'` → 1 row. Verified: c18b8089 status=`done`. (single-spec wave; claimed_task_ids = [c18b8089].)

## Action 3 — knowledge-synthesizer observations
5 observations → `process/waves/wave-25/blocks/L/observations.md`:
- obs-1 (warning, BUILD) — `biome check` vs `biome format` (organizeImports not covered by format-only). → PROMOTED.
- obs-2 (warning, T-4, HOLD 1st instance) — fault-injection pg-pool convention mismatch (Promise vs callback `connect()`).
- obs-3 (warning, CI, HOLD 1st instance) — Railway `railway up` CLI-push, not git-trigger.
- obs-4 (warning, BUILD, HOLD 1st instance) — CJS-only shared pkg runtime values unresolvable by vite/web.
- obs-5 (informational, T-5, 4th-wave-recurring) — Playwright MCP chrome-absent → bundled-chromium substitute. → PROMOTED.
(Candidate "CI-first-real-execution hang" absorbed into obs-2 — same root cause, not double-counted; CI rule 5 not gapped since it was a genuine red, not a false-green.)

## Action 4/5/6 — Promotion candidates → karen vet → linter → promote
2 candidates (obs-1 → BUILD, obs-5 → T-5), distinct files (≤1/file OK).
- **BUILD rule 7** — karen APPROVE; linter PASS (rule 108, why 94). Promoted.
  `7. Run the lint/import-organizer check command, not the formatter alone, before reporting a build task done. / Why: A formatter can pass while the CI check gate rejects import ordering it never touches.`
- **T-5 rule 1** — karen APPROVE; linter FAIL 1st draft (rule 125>120, why 102>100 — the `1. ` prefix); cap-1 karen rewrite → linter PASS (rule 111, why 92). Promoted.
  `1. On Playwright MCP launch failure, drive the bundled chromium directly rather than marking the layer blocked. / Why: Bundled chromium shares the render path, so a launch failure loses no real coverage.`

obs-2/3/4 HELD (first instance — promote on 2nd occurrence per L-2 discipline). Note: obs-3 (Railway CLI-push) is ALSO captured as a project memory (`railway-deploy-is-cli-push-not-git-trigger`) for immediate cross-session recall while it awaits a 2nd-instance promotion.

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: c18b8089 done (verified)"
  - "observations: process/waves/wave-25/blocks/L/observations.md (5 observations)"
  - "principles promotions: 2 (BUILD-PRINCIPLES rule 7, test-layer-principles/T-5 rule 1)"
tasks_marked_done: [c18b8089-a7bb-442f-890f-66649d7f746a]
tasks_skipped_with_reason: []
observations_emitted: 5
promotion_candidates: 2
karen_verdicts:
  - {candidate_id: obs-1, target_file: BUILD-PRINCIPLES.md, verdict: APPROVE}
  - {candidate_id: obs-5, target_file: test-layer-principles/T-5.md, verdict: APPROVE}
linter_runs:
  - {candidate_id: obs-1, target_file: BUILD-PRINCIPLES.md, attempt: 1, verdict: PASS}
  - {candidate_id: obs-5, target_file: T-5.md, attempt: 1, verdict: FAIL, rejection_code: "rule>120,why>100"}
  - {candidate_id: obs-5, target_file: T-5.md, attempt: 2, verdict: PASS}
candidates_dropped_by_linter: []
promotions_applied:
  - {file: BUILD-PRINCIPLES.md, line: 7, rule: "Run the lint/import-organizer check command, not the formatter alone..."}
  - {file: test-layer-principles/T-5.md, line: 1, rule: "On Playwright MCP launch failure, drive the bundled chromium directly..."}
note: "obs-2/3/4 held (1st instance). BUILD gets 1 promotion, T-5 gets 1 (per-file cap respected)."
```

## Exit
c18b8089 done, 5 observations recorded, 2 rules promoted (karen-vetted + linter-passed). → N block.
