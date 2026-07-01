# Wave 24 — T-2 Unit
**Pattern A (CI-verified).** api unit 395 + web 216 green (C-1 test job). This wave adds INTEGRATION-tier specs (T-4), NOT unit tests — the unit tier is unchanged (no production code touched), so no new unit coverage is expected and none regressed. The wave's coverage is integration-tier, audited at T-4.
```yaml
test_pattern: ci-verified
skipped: false
evidence: ["C-1 test job run 28498812550 success (api 395 + web 216 unit)"]
modules_audited: []
new_flakes: ["1 web test flaked once at B-5, passed on re-run; wave touches no web code"]
findings: []
```
