# T-4 (wave-56) Pattern A — KEY. CI run 28763433748 executed the cap-bites case:
`✓ test/integration/dm-candidates.spec.ts > ... > (d) injected cap of 2 truncates 3 eligible co-members; default cap leaves all 3 intact (69ms)`
Proves the LIMIT fires at DB level (>CAP→≤CAP) AND MVP-scale unchanged (default cap → all). Full integration suite green (cases a/b/c/d — privacy fence + cap coexist). No findings.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["CI 28763433748: case (d) cap-bites 69ms on postgres:16"]
findings: []
```
