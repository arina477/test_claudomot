# Wave 40 — T-4 Integration (Pattern A — CI-verified)
- No schema/service change; the existing avatar-render real-PG integration spec + the new unit specs ran green in CI on the merge commit. The DB-adjacent behavior (NUL-byte guard prevents the pg-driver 500) is unit-covered + proven live at C-2 (%00→400).
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 test job green: avatar-render integration + new specs"]
findings: []
```
