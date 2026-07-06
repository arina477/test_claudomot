# T-2 — Unit (wave-54) — Pattern A (CI-verified)
CI test job green; 729 api unit (40 files) incl. the wave-54 regression-lock cases (study-timer 7, messaging +3, presence +3): malformed non-UUID id → generic WS_GENERIC_ERROR, leak-tokens absent, denied; valid-UUID non-member → specific Forbidden preserved (not genericized). Honest (head-builder + code-reviewer verified real assertions, not vacuous).
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 test job (unit) run 28760353037; 729 api unit"]
findings: []
```
