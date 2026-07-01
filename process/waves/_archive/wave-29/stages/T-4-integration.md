# Wave 29 — T-4 Integration

**Pattern:** A (Verified-via-CI). **Layer:** DB + service + API integration. **FIRE** (services touched: servers.service + presence.gateway).

## Action 1 — Determine pattern
CI (`test` job, run 28536835436) runs the api suite against a real `postgres:16` service container. The two touched service methods are unit-covered at T-2 with deterministic assertions; the wave added UNIT (not new integration) tests. Pattern A — confirm CI executed the relevant specs on the merge commit.

## Action 2/4 — CI evidence + boundary coverage audit
Boundaries the wave touched:
- `ServersService.listServerMembers` (servers.service.ts:249) — reads `server_members` innerJoin `users`, maps displayName. Spec `servers.service.spec.ts` EXECUTED nonzero in CI on fd03d27 (407 total pass; the 4 guard tests confirmed by exact name in the CI log).
- `PresenceGateway.handleConnection` displayName resolution (presence.gateway.ts:125) — reads `users` (display_name, email). Spec `presence.gateway.spec.ts` guard test EXECUTED nonzero on fd03d27.

No schema/migration this wave (B-0 confirms no migration file). The displayName logic is a pure read-path transform over already-fetched rows — it is deterministically unit-covered; a real-PG integration test would only re-verify the same string-fallback logic with a live row, adding no distinct boundary coverage.

## Live-probe value assessment
A live integration probe adds NO value this wave: the members endpoint WIRE is unchanged (bare `ServerMember[]`, AC5), so a live HTTP shape-probe would assert the same contract as prior waves (already ✅ Live in the journey map). The only behavior change (empty-string → userId fallback) is not observable at the HTTP contract level (both old and new return a string field); it is precisely observable at the unit boundary, where it is mutation-genuinely asserted. No live probe run — documented as no-added-value, not a skipped obligation.

```yaml
test_pattern: ci-verified
skipped: false
boundaries_audited: [ServersService.listServerMembers, PresenceGateway.handleConnection]
ci_evidence:
  - "test job run 28536835436 vs postgres:16 — servers.service.spec + presence.gateway.spec executed nonzero on fd03d27; api 407 passed"
active_run_output: ""
infrastructure_gap_recorded: false
findings: []
  live_probe_value: none (members wire unchanged; behavior-delta not HTTP-observable, unit-covered mutation-genuine)
```
