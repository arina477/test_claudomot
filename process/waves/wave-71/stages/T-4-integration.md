# T-4 — Integration (wave-71) [Pattern A — CI-verified]
CI test:ci integration tier (postgres:16 + DATABASE_URL_TEST) ran the 3 NEW blocks.integration cases for the enriched GET /blocks: (1) real display_name returned (asserts displayName === seeded name, NOT the UUID), (2) username fallback (no display_name → username), (3) 'Unknown user' (no display_name + no username → the LEFT-JOIN-missing/null path). no-IDOR (own list only) unchanged + still covered by the wave-70 cases. listBlocks LEFT JOIN verified against real PG. The block authz + 5 DM HIDE seams (wave-70) are UNTOUCHED this wave (zero diff) — their T-8 live proof from wave-70 remains valid.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["3 GET /blocks enrichment cases green vs postgres:16 in run 28842513359"]
findings: []
```
