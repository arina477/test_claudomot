# Wave 25 — T-block review artifacts

**Block:** T (Test)
**Wave topic:** mention token-parser parity (shared slug, client↔server) + editMessage atomicity
**Block exit gate:** T-9
**Status:** gate-passed

## Stage deliverables

| Stage | Deliverable file | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | stages/T-1-static.md | ci-verified | done | typecheck + lint green (C-1 run 28512345221); 0 prod bypasses |
| T-2 | stages/T-2-unit.md | ci-verified | done | api 395 + web 234 green; new mention + parity tests |
| T-3 | stages/T-3-*.md | active | done | shared slug contract → parity test |
| T-4 | stages/T-4-*.md | active | done | editMessage rollback real-PG spec executed in CI |
| T-5 | stages/T-5-*.md | active | done | live prod E2E: AC2/AC3 PASS ×4, 0 flakes; 1 LOW infra finding |
| T-6 | stages/T-6-*.md | active | done | no visual delta — MentionPill unchanged, on-token |
| T-7 | stages/T-7-*.md | active | skipped | not heavy; algorithmically-equiv tokenizer, no new dep |
| T-8 | stages/T-8-*.md | active | skipped | non-auth; secret-grep clean; no new XSS surface |
| T-9 | stages/T-9-journey.md | active | done | head-tester APPROVED; annotation-only journey regen |

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
