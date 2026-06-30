# Wave 18 — B-5 Verify
```yaml
lint_passed: true          # biome 0-errors
unit_tests_passed: true     # api 305 + web 142
build_passed: true          # turbo 3/3
typecheck_passed: true      # turbo 4/4
dev_smoke: deferred-to-CI   # boot-probe + e2e run in CI (C-1)
flakes_documented: []
```
- API 305 (+13 thread tests: one-level reject, idempotent no-double-count, count++/last_reply_at, tail-only recompute, list ordering+tombstone). Web 142. typecheck/build/lint all green.
