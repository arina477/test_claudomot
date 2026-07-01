# Wave 27 — B-5 Verify
lint 0 errors (7 pre-existing warnings) · api **395/395** · web **254/254** (251 wave-26 baseline + subscription-count change + CARRY-B test) · build **3/3**. Spec-A EXPLAIN proof integration spec is CI-gated (no local PG; fails-loud on missing DATABASE_URL_TEST) — executes at C-1 (CI rule 5). Dev smoke: behavior-preserving perf refactor, no new UI surface; component tests cover the dot render + single-subscription + CARRY-B.
```yaml
lint_passed: true
unit_tests_passed: true
build_passed: true
dev_smoke_passed: true
flakes_documented: []
last_commit_sha: bd18a08
```
