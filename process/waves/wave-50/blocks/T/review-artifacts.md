# Wave 50 — T-block review artifacts

**Block:** T (Test) · **Wave topic:** M8 study-group slice 2 — per-server custom study-timer durations + F-1 slim-bar fix (LIVE, merge 699477, migration 0023) · **Block exit gate:** T-9 · **Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | stages/T-1-static.md | ci-verified | done | lint+typecheck green on merge; 0 prod bypasses |
| T-2 | stages/T-2-unit.md | ci-verified | done | 647 api + 417 web (incl. duration-config + karen-2 walk) |
| T-3 | stages/T-3-contract.md | ci-verified | done | StudyTimerSchema +2 fields + StudyTimerConfigSchema |
| T-4 | stages/T-4-integration.md | ci-verified | done | real-PG study-timer.integration 8 config cases (incl karen-2 self-heal) |
| T-5 | stages/T-5-e2e.md | active | pending | 2-client durations sync + config-while-running 409 + F-1 border live |
| T-6 | stages/T-6-layout.md | active | pending | affordance per design/timer-duration-config.html + F-1 slim-bar |
| T-7 | stages/T-7-perf.md | active | skipped | not heavy — small delta on shipped substrate |
| T-8 | stages/T-8-security.md | active | pending | new PATCH /config endpoint — IDOR + idle-guard + auth |
| T-9 | stages/T-9-journey.md | active | pending | journey annotate + head-tester gate |

## Block-specific context
- **wave_type:** ui + backend + sessions (multi-spec, 2 tasks). LIVE at api-production-b93e / web-production-bce1a8.
- **Stages skipped:** T-7 (not heavy — reuses wave-49 substrate; +2 columns, 1 endpoint, 1 affordance).
- **Carries into T:** custom-durations 2-client sync (T-5); config-while-running→409 live (T-5/T-8); F-1 slim-bar 2px phase border at <1024 (T-5/T-6); config endpoint IDOR/idle-guard (T-8); karen-2 self-heal (unit+integration covered; optional live).

## Findings aggregation
`process/waves/wave-50/blocks/T/findings-aggregate.md` — canonical V-2 input.

## Open escalations carried into gate
none

## Gate verdict log
<appended by fresh head-tester spawn at T-9 Action 1>
