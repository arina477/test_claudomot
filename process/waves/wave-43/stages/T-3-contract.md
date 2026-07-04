# Wave 43 — T-3 Contract (ci-verified, Pattern A)
Project-internal Zod (packages/shared/src/scheduling.ts) — Pattern A; CI typecheck+build validate shapes server↔client.
- **CI evidence:** run 28692639154 typecheck+build green → shared Zod compiles; api service + web client consume the same source (ScheduledSessionSchema, Create/Update w/ .datetime() + cross-field refines, ListResponse).
- **Coverage:** each schema consumed. The .datetime() + endsAt>startsAt + weekly recurrenceUntil>=startsAt refines (B-6 M2/H1 hardening) are exercised at the API boundary; T-4 adds the negative-case assertions (invalid datetime→400, bad range→400).
```yaml
test_pattern: ci-verified
skipped: false
contracts_audited: [ScheduledSessionSchema, CreateScheduledSessionSchema, UpdateScheduledSessionSchema, ScheduledSessionListResponseSchema]
ci_evidence: ["run 28692639154 typecheck+build green on merge 7b0bc478"]
infrastructure_gap_recorded: false
findings:
  - {severity: low, contract: "Create/Update refines + .datetime()", description: "negative cases (invalid datetime→400, ends<=starts→400, weekly until<starts→400) asserted at T-4 integration"}
```
