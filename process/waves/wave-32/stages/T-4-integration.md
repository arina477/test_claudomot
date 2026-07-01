# Wave 32 — T-4 Integration (Pattern A — CI-verified)
- **Schema:** none this wave (B-0 schema-skip; inline DTO). No migration to integration-test.
- **Service integration:** voice-participants.service.spec exercises the full gate→load→creds→RoomServiceClient(mock)→batch-user-lookup path with a mocked RoomServiceClient + real RBAC/db-mock. Ran under test:ci with Postgres v16 service containers (integration tier).
- **C-1 evidence:** test:ci (Postgres v16) green on 45b08c3.
- **Live-integration note:** the RoomServiceClient→LiveKit leg is NOT integration-tested live (LiveKit creds unset → 503). Deferred to founder-supplies-keys; the gate/load/creds legs ARE covered.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 test:ci (Postgres v16) green", "service spec exercises gate→load→creds→RoomServiceClient(mock)→batch-lookup"]
findings: [{severity: info, location: "voice-participants.service.ts:152-159", description: "live RoomServiceClient→LiveKit leg not integration-tested (creds unset); gate/load/creds legs covered; deferred"}]
```
