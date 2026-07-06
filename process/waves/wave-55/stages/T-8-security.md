# T-8 — Security (wave-55) — Pattern A (integration-evidence) + secret-grep
Privacy/auth-adjacent wave. This wave is TEST-ONLY (no production change) — the who_can_dm='server-members' boundary is UNCHANGED in production and was already enforced (wave-46/47 unit + wave-47 T-8 pentest). The strongest T-8 evidence IS this wave's deliverable: the 2-cell truth-table integration test (case c) EXECUTED + PASSED on CI real-Postgres (postgres:16, 78ms) — proving live-DB that a 'server-members' co-member IS reachable AND a disjoint 'server-members' user is EXCLUDED (the shared-server privacy fence). No production surface changed → no new live pen-probe warranted (nothing new to probe; a probe would re-confirm unchanged, already-pentested behavior).
## Secret grep
Diff is one test file; grep for api-key/secret/token/password → 0 real matches (fixture ids/emails only). Clean.
```yaml
test_pattern: ci-verified
applicable_probes: [privacy_boundary_integration, secret_grep]
secret_grep_findings: []
findings: []
note: "who_can_dm='server-members' boundary now integration-verified on CI (case c); zero production change; no new live probe needed"
```
