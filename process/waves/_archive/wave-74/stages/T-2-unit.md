# Wave 74 — T-2 Unit (Pattern A)
CI test job green on 113e5cd: api 771 (41 files; 7 new entitlements + gate tests incl. the binding restrictive-cap-THROWS). web unchanged (B-3 skipped). New surfaces covered: EntitlementsService (resolveForServer default/enum, resolveCreateGateForOwner), createServer gate.
```yaml
test_pattern: ci-verified
skipped: false
evidence: ["C-1 test job green on 113e5cd: api 771"]
modules_audited: [entitlements.service, servers.service-gate, shared/entitlements]
new_flakes: []
findings: []
