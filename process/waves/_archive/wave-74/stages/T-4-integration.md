# Wave 74 — T-4 Integration (Pattern A)
CI `test` job on 113e5cd ran against postgres:16: the **binding verify-gate-reads THROWS test** (restrictive cap maxServersPerOwner=0 → createServer throws ForbiddenException — proves the gate reads+enforces) + boundary + non-regressive + resolveForServer default/enum; AND `create-server-rollback.spec.ts` (the transaction rollback tests, fixed at C-1 with a permissive stub) passes → the gate does NOT break the existing createServer transaction/rollback behavior. boot-probe green = EntitlementsModule wiring boots (no DI cycle). Migration 0029 applied to prod.
```yaml
test_pattern: ci-verified
skipped: false
boundaries_audited: [subscriptions-migration, EntitlementsService, createServer-gate, servers-transaction-rollback, boot-probe-module-graph]
ci_evidence: ["test job green on 113e5cd with postgres; verify-gate-reads THROWS + create-server-rollback passed; boot-probe green"]
findings: []
