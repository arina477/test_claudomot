# Wave 1 — T-block review artifacts

**Block:** T (Test)
**Wave topic:** Bootstrap monorepo + dark app shell + CI (M1 foundation seed) — deployed live on Railway
**Block exit gate:** T-9
**Status:** gate-passed

## Stage deliverables
| Stage | Deliverable file | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | process/waves/wave-1/stages/T-1-static.md | ci-verified | done | lint+typecheck green (run 28240325274); 0 bypasses |
| T-2 | process/waves/wave-1/stages/T-2-unit.md | ci-verified | done | tests green: api 1/1 + web 10/10 |
| T-3 | process/waves/wave-1/stages/T-3-contract.md | ci-verified | pending | /health HealthResponse contract |
| T-4 | process/waves/wave-1/stages/T-4-integration.md | n/a | pending | skip (no DB this wave) |
| T-5 | process/waves/wave-1/stages/T-5-e2e.md | active | pending | live web shell |
| T-6 | process/waves/wave-1/stages/T-6-layout.md | active | pending | vs mockup |
| T-7 | process/waves/wave-1/stages/T-7-perf.md | active | pending | skip (not heavy) |
| T-8 | process/waves/wave-1/stages/T-8-security.md | active | pending | skip (no auth this wave) |
| T-9 | process/waves/wave-1/stages/T-9-journey.md | active | pending | gate |

## Block-specific context
- **Wave topic:** Bootstrap monorepo + dark app shell + CI (M1 foundation seed)
- **wave_type:** ui, infra
- **Live URLs:** web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app
- **Stages skipped (with reasons):** T-4 (no DB/service-integration this wave), T-7 (not heavy), T-8 (no auth/sessions — /health anon; carried to auth wave)
- **Cumulative findings count:** 0

## Findings aggregation
process/waves/wave-1/blocks/T/findings-aggregate.md (canonical V-2 input).

## Gate verdict log
<appended by fresh head-tester spawn at T-9>
