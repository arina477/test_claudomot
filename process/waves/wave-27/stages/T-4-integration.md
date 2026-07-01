# Wave 27 — T-4-integration

CI-verified: presence-index-scan.spec.ts EXECUTED + PASSED in PR#40 (integration tier 6 files/17 tests). Asserts EXPLAIN Index Scan on server_members_user_id_idx (enable_seqscan=off forcing eligibility, deterministic regardless of row count) + behavior-preserving getServerIdsForUser co-member set. Proves migration 0012 applied against real PG. CI rule 5 satisfied (non-zero executed).

```yaml
test_pattern: ci-verified-or-active
skipped: false
findings: []
```
