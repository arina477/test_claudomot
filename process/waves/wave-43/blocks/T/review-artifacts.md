# Wave 43 — T-block review artifacts

**Block:** T (Test)
**Wave topic:** Class scheduling — scheduled_sessions + educator authoring + member calendar + session detail (no reminders/RSVP/ICS)
**Block exit gate:** T-9
**Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | stages/T-1-static.md | ci-verified | done | 0 bypasses; lint+typecheck green |
| T-2 | stages/T-2-unit.md | ci-verified | done | unit green (551+354); 1 LOW coverage gap |
| T-3 | stages/T-3-contract.md | ci-verified | done | Zod CI-validated; 1 LOW (refine neg-case→T-4) |
| T-4 | stages/T-4-integration.md | active | done | 22 real-PG cases PASS in CI (run 28693093402); caught+fixed createSession guard |
| T-5 | stages/T-5-e2e.md | active | pending | live E2E (direct-playwright) |
| T-6 | stages/T-6-layout.md | active | pending | calendar layout |
| T-7 | stages/T-7-perf.md | — | pending | SKIP (not heavy) |
| T-8 | stages/T-8-security.md | active | pending | authz/IDOR live probes |
| T-9 | stages/T-9-journey.md | active | pending | gate + journey regen |

## Block-specific context
- **Wave topic:** class scheduling lifecycle.
- **wave_type:** backend + ui + auth (organizer/member gates + IDOR).
- **Stages skipped (with reasons):** T-7 perf — not heavy (moderate diff; recurrence expansion is bounded, no perf budget at risk).
- **Cumulative findings count:** 0 at start.

## Findings aggregation
Incremental → process/waves/wave-43/blocks/T/findings-aggregate.md (V-2 canonical input).

## Open escalations carried into gate
none

## Gate verdict log
<appended by fresh head-tester spawn at T-9>
