# Wave 74 — T-block review artifacts
**Block:** T (Test) · **Wave topic:** M9 entitlements substrate (subscriptions + EntitlementsService + createServer gate) · **Block exit gate:** T-9 · **Status:** in-progress
## Stage deliverables
| Stage | Deliverable | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | stages/T-1-static.md | ci-verified | done | 0 prod bypasses |
| T-2 | stages/T-2-unit.md | ci-verified | done | api 771 on 113e5cd |
| T-3 | stages/T-3-contract.md | ci-verified | done | Tier/Entitlements DTO |
| T-4 | stages/T-4-integration.md | ci-verified | done | verify-gate-reads THROWS + create-server-rollback (postgres) |
| T-5 | stages/T-5-e2e.md | active | pending | createServer still works live (non-regressive gate) |
| T-6 | stages/T-6-layout.md | active | skipped | no new UI (B-3 skipped) |
| T-7 | stages/T-7-perf.md | active | skipped | not heavy |
| T-8 | stages/T-8-security.md | active | pending | createServer authz gate (server-scoped) |
| T-9 | stages/T-9-journey.md | active | pending | gate |
## Block-specific context
- **wave_type:** backend (+ monetization; security_scope_flag=false — no auth/payment surface this slice; the createServer gate is server-creation authz)
- **Stages skipped:** T-6 layout (no new UI — B-3 deferred), T-7 perf (small additive)
- **Cumulative findings:** carries the B-6 boundary-TOCTOU note (V-2, unreachable at cap=100)
## Gate verdict log
<appended by head-tester at T-9>

## Block-exit handoff
```yaml
test_block_status: complete
stages_run: [T-1, T-2, T-3, T-4, T-5, T-8, T-9]
stages_skipped: [T-6 layout (no new UI), T-7 perf (not heavy)]
findings_total: 2
findings_critical: 0
note: "free-cap regression caught+fixed+re-verified WITHIN the block (d79dd18)"
ready_for_verify: true
```
