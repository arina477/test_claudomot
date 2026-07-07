# T-8 — Security (wave-71) [Pattern B — active, LIGHT: safety surface untouched]
This wave touches GET /blocks (read enrichment) but does NOT touch the block authz (createBlock/removeBlock/isBlockedBetween) or the 5 DM HIDE seams — ZERO diff in blocks.controller.ts + dm.service.ts (head-builder + /review verified). The wave-70 T-8 launch-gate safety proof (block + DM HIDE bidirectional, 13/13 live) REMAINS VALID.
Applicable probes (subset): 
- GET /blocks enrichment no-IDOR: listBlocks still WHERE blocker_id=session (own list only) — the LEFT JOIN adds display columns, does NOT widen scope (head-builder + karen verified; the wave-70 no-IDOR integration case + the enrichment integration cases cover it; T-5 confirmed A sees only A's list). PASS.
- Secret-grep (always): wave diff clean (block/blocked field names ≠ credentials). PASS.
```yaml
test_pattern: active
skipped: false
auto_promoted: false
applicable_probes: [csrf_authz (enrichment no-IDOR), secret_grep]
csrf_results: ["GET /blocks enrichment no-IDOR preserved (own-list only, JOIN doesn't widen scope); block/DM-HIDE UNTOUCHED (wave-70 T-8 proof valid)"]
secret_grep_findings: []
findings: []
```
