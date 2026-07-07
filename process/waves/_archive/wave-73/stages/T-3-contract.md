# Wave 73 — T-3 Contract (Pattern A)
- Zod privacy-event DTO (PrivacyEventType/PrivacyEvent/PrivacyEventListResponse). Server listForActor maps DB→exact DTO (createdAt ISO string, context null not {}, targetId nullable) — /review verified the shape matches the web client safeParse. CI typecheck+build green on 29a140d prove cross-package agreement. Negative: invalid event_type rejected by the in-service Zod parse.
```yaml
test_pattern: ci-verified
skipped: false
contracts_audited: [PrivacyEventTypeSchema, PrivacyEventSchema, PrivacyEventListResponseSchema]
ci_evidence: ["typecheck+build green on 29a140d", "/review verified listForActor→DTO shape match"]
findings: []
