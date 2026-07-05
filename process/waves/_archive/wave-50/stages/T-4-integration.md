# T-4 — Integration (wave-50)

**Pattern:** A (CI-verified). CI `test` job provisions PG16 + runs the real-PG integration suite.

- **CI evidence:** `test` job (PG16, 1m28s) PASS on merge — `study-timer.integration.spec.ts` ran the 8 new wave-50 config cases against real Postgres:
  - config while idle → persists + DTO carries durations + emits update event
  - GET after config reflects new work/break duration fields
  - subsequent startTimer uses configured work_duration_ms (ends_at reflects custom length)
  - config while running → ConflictException (409); durations unchanged
  - config while paused → 409; durations unchanged
  - non-member → ForbiddenException (403)
  - **karen-2: custom-duration timer self-heals with configured lengths, not 25/5** (the restart-corruption vector, verified against real PG)
  - backward-compat: default row (no prior config) behaves as 25/5
- **Boundary coverage:** migration-0023 schema (2 new columns) exercised by real queries; configureDurations service→DB round-trip; idempotent phase-advance + self-heal walk with custom durations; membership gate 403. Real-DB discipline followed (PG16, not mocked).
- **Migration applied prod-first at C-2** (ledger idx 23; both columns present; 2 rows backfilled 25/5).

```yaml
test_pattern: ci-verified
skipped: false
boundaries_audited: [0023-schema, configureDurations-round-trip, self-heal-custom-durations(karen-2), membership-gate, idle-guard-409]
ci_evidence: ["C-1 test job PASS (PG16) — study-timer.integration.spec.ts 8 new config cases"]
infrastructure_gap_recorded: false
findings: []
```
