# Wave 44 — T-1-static (ci-verified)
- CI run 28695990855 (merge 4522101) green: lint/typecheck/build + test (1091 specs: 582 api incl. NEW 16 submission + 15 scheduling/recurrence unit tests, 118 integration, 354 web) + e2e (5 incl. delete-any).
- Polish wave: 0 prod ts-bypasses; DTO createdAt/updatedAt additive (non-breaking); no new service boundary (polish only) — the DTO addition + recurrence logic are unit-covered (0308cdf1), submission methods now unit-covered (8d971bc2), scheduling/assignment integration already real-PG (wave-42/43 T-4). No new contract negatives needed.
```yaml
test_pattern: ci-verified
findings: []
```
