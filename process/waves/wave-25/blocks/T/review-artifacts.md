# Wave 25 — T-block review artifacts

**Block:** T (Test)
**Wave topic:** mention token-parser parity (shared slug, client↔server) + editMessage atomicity
**Block exit gate:** T-9
**Status:** in-progress

## Stage deliverables

| Stage | Deliverable file | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | stages/T-1-static.md | ci-verified | done | typecheck + lint green (C-1 run 28512345221); 0 prod bypasses |
| T-2 | stages/T-2-unit.md | ci-verified | done | api 395 + web 234 green; new mention + parity tests |
| T-3 | stages/T-3-contract.md | ci-verified | pending | shared slug grammar cross-package contract → parity test |
| T-4 | stages/T-4-integration.md | ci-verified | pending | editMessage rollback real-PG spec (executed in CI) |
| T-5 | stages/T-5-e2e.md | active | pending | live mention render (@handle→pill) on prod |
| T-6 | stages/T-6-layout.md | active | pending | pill component unchanged — assess |
| T-7 | stages/T-7-perf.md | active | pending | SKIP (not heavy) |
| T-8 | stages/T-8-security.md | active | pending | SKIP (non-auth; no new XSS surface — React-escaped) |
| T-9 | stages/T-9-journey.md | active | pending | gate |

## Block-specific context
- **Wave topic:** shared mention slug grammar + client/server parity + editMessage txn atomicity + real-PG rollback spec.
- **wave_type:** [backend, ui] (NOT auth / heavy / infra / docs).
- **Stages skipped (with reasons):** (populated as block runs) — T-7 (not heavy), T-8 (non-auth/sessions/payments; mention render adds no new XSS surface — trailing text is React-escaped text node), possibly T-6 (pill component unchanged).
- **Cumulative findings count:** 0 at start.

## Findings aggregation
`process/waves/wave-25/blocks/T/findings-aggregate.md` — canonical V-2 input.

## Open escalations carried into gate
none

## Gate verdict log
<appended by fresh head-tester spawn at T-9 Action 1>
