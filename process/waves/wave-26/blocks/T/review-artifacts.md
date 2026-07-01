# Wave 26 — T-block review artifacts

**Block:** T (Test) | **Wave topic:** presence dots on message-row author avatars (shared PresenceDot) | **Block exit gate:** T-9 | **Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | stages/T-1-static.md | ci-verified | done | typecheck+lint green (PR#38 run 28519830784); 0 prod bypasses |
| T-2 | stages/T-2-unit.md | ci-verified | done | web 251 + api 395 green; 17 presence-dot tests |
| T-3 | stages/T-3-contract.md | — | skipped | no contract surface (PresenceDot web-local, hasPresence web accessor; B-1 skipped) |
| T-4 | stages/T-4-integration.md | — | skipped | no schema/service change (frontend-only; B-2 skipped) |
| T-5 | stages/T-5-*.md | done | CRITICAL FAIL (author dots absent) -> fix-up cycle 1 (self-presence seed PR#39) -> RE-VERIFIED PASS live; all 5 ACs live |
| T-6 | stages/T-6-*.md | done | PresenceDot on-token, no layout regression (live) |
| T-7 | stages/T-7-*.md | skipped | not heavy; per-row subscription = future perf watch (B-6 P2) |
| T-8 | stages/T-8-*.md | skipped | non-auth; secret-grep clean |
| T-9 | stages/T-9-journey.md | active | pending | gate |

## Block-specific context
- **wave_type:** [ui] (frontend-only). **Merge:** 1543a4e. **Live:** web 036c9612 (index-DBlhKjLW.js), api unchanged b0251962.
- **Stages skipped:** T-3 (no contract), T-4 (no schema/service), T-7 (not heavy), T-8 (non-auth).
- **Carry (B-6 → V-2):** P2 per-row presence subscription (future perf lift) = T-7 watch item.
- **Cumulative findings:** 0 at start.

## Findings aggregation
`process/waves/wave-26/blocks/T/findings-aggregate.md`.

## Open escalations carried into gate: none
## Gate verdict log: <appended by head-tester at T-9>
