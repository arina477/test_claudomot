# T-4 — Integration (wave-49 study timer)

**Pattern:** A (verified-via-CI). CI provisions a Postgres v16 service and runs the real-PG integration suite.

## Action 1 — Pattern decision
`.github/workflows` CI `test` job attaches a Postgres v16 service; `study-timer.integration.spec.ts` runs `describe.skipIf(SKIP)` active when `DATABASE_URL_TEST` is set — which it is in CI. Pattern A confirmed (C-1 note line 29 explicitly records it ran against the PG16 service, not just units).

## Action 2 — CI evidence + boundary coverage
CI `test` job green on merge commit; real-PG integration ran (12 integration cases).
| Boundary (B-0 schema / B-2 service) | Integration coverage |
|---|---|
| `server_study_timer` table (migration 0022) — real query against new schema | ✓ integration spec inserts/reads real rows |
| service → DB anchors write + compute-on-read round-trip | ✓ start/pause/resume/reset persist anchors, read derives remaining |
| idempotent `doPhaseAdvance` UPDATE ... WHERE ends_at=$expected | ✓ integration exercises the guarded transition (also caught the C-1 pause `ends_at` prod bug — only the real-PG test surfaced it) |
| REST route → service → DB (membership-gated) end-to-end | ✓ controller integration incl. 403 non-member |
| **presence roster NON-persistence (P-4 jenny carry)** | ✓ roster is in-memory gateway Map — integration confirms NO `server_study_timer` (or any) rows written for join/leave; verified further live at T-5/T-8 |

**Real-DB discipline (test-writing-principles "don't mock the database"):** integration suite hits the real PG16 service, not a mock — followed.

## Action 4 — Coverage audit
Migration-0022 schema exercised by real queries; service boundary + membership gate + idempotent transition all covered. The C-1 pause-`ends_at` bug being caught here (not by units) validates the integration layer's value. No boundary gap.

```yaml
test_pattern: ci-verified
skipped: false
boundaries_audited: [server_study_timer-schema, service-compute-on-read, idempotent-phase-advance, rest-route-membership-gate, presence-non-persistence]
ci_evidence:
  - "C-1 test job PASS on b2f2bec — real PG16 service, study-timer.integration.spec.ts ran (12 cases)"
active_run_output: ""
infrastructure_gap_recorded: false
findings: []
```
