# Wave 74 — T-5 E2E (active, live prod)
## The regression + fix (T-block's core catch)
Live verification found the free placeholder cap=100 BLOCKED a live owner (Fixture A, 646 servers) from createServer — the CI "authed create-server" e2e failed on prod (cap=100). Root cause: the free placeholder violated the non-regression requirement (max owner 646 > 100). Fixed forward: PR #92 (d79dd18) raised free 100→100_000; both services redeployed; **the e2e authed-create-server RE-RAN GREEN** on the fixed prod. createServer non-regressive for all owners (646 < 100_000).
## Scenarios
1. **createServer works live (non-regressive) — PASS** (e2e authed-create-server green on d79dd18 post-fix).
2. **Gate enforces (verify-gate-reads) — PASS** (CI: restrictive cap=0 → THROWS ForbiddenException).
```yaml
test_pattern: active
skipped: false
testers_spawned: 0
scenarios:
  - {id: createServer-non-regressive, verdict: PASS, evidence: "e2e authed-create-server green on d79dd18"}
  - {id: gate-enforces-throws, verdict: PASS, evidence: "CI verify-gate-reads restrictive-cap-THROWS"}
flakes_observed: []
fix_up_cycles: 1
findings:
  - {severity: high-fixed, scenario: free-cap-regression, description: "free cap 100 blocked a 646-server owner; fixed to 100_000, re-verified"}
```
