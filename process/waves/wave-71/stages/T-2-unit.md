# T-2 — Unit (wave-71) [Pattern A — CI-verified]
CI test job (run 28842513359, study-timer flake reran→passed): web 645 (incl 14 block-toggle.test.tsx + the REAL block-dialog-store.test.tsx [drives the actual dialog, proving the block→Unblock flip + rollback — the P0-fix regression test] + updated block-ui.test) + api unit. Behavior asserted through real parent callers (rule 12); the P0-fix test is NOT mock-masked.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 test job run 28842513359 green (web 645, block-dialog-store real-store test)"]
findings: []
```
