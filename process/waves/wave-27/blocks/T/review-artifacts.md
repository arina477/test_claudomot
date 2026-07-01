# Wave 27 — T-block review artifacts

**Block:** T (Test) | **Wave topic:** Presence performance pair (server_members index + client subscription lift) | **Block exit gate:** T-9 | **Status:** in-progress

## Stage deliverables
| Stage | Deliverable | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | stages/T-1-static.md | ci-verified | done | typecheck+lint green (PR#40 run 28526765627); 0 prod bypasses |
| T-2 | stages/T-2-unit.md | ci-verified | done | api 395 + web 254 green |
| T-3 | stages/T-3-contract.md | — | skipped | no contract surface (index + client refactor; B-1 skipped) |
| T-4 | stages/T-4-integration.md | ci-verified | done | EXPLAIN proof presence-index-scan.spec.ts EXECUTED + PASSED (Index Scan, enable_seqscan=off); migration 0012 applied |
| T-5 | stages/T-5-e2e.md | active | done | live regression PASS ×3 — dots UNREGRESSED after subscription lift |
| T-6 | stages/T-6-layout.md | active | done | no visual change (behavior-preserving; PresenceDot unchanged) |
| T-7 | stages/T-7-perf.md | active | done | THE perf wave — proof = EXPLAIN Index Scan (T-4) + subscription-count 1 (T-2); not heavy load-test |
| T-8 | stages/T-8-security.md | — | skipped | non-auth; secret-grep clean |
| T-9 | stages/T-9-journey.md | active | pending | gate |

## Block-specific context
- **wave_type:** [backend, ui-perf] (behavior-preserving). **Merge:** 87b6ef7. **Live:** api 855f1ea1 (+index) + web 328b1ae9 (index-Dr2UkTXH.js).
- **Stages skipped:** T-3 (no contract), T-8 (non-auth).
- **Cumulative findings:** 0.

## Findings aggregation: process/waves/wave-27/blocks/T/findings-aggregate.md
## Open escalations carried into gate: M5 park-or-key fork (founder digest, not a blocker)
## Gate verdict log: <appended by head-tester at T-9>
