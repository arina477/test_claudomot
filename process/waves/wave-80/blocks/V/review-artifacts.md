# Wave 80 — V-block review artifacts

**Block:** V (Verify)
**Wave topic:** presence (online-status) privacy toggle — show_presence honored server-side (3 emit paths + proactive toggle emit), partial-PUT. LIVE on 4795638.
**Block exit gate:** V-3
**Status:** in-progress

## Stage deliverables
| Stage | Deliverable file(s) | Status | Notes |
|---|---|---|---|
| V-1 | stages/V-1-karen.md + V-1-jenny.md + V-1-summary.md | done | Karen APPROVE, jenny APPROVE |
| V-2 | stages/V-2-triage.md | done | |
| V-3 | stages/V-3-fast-fix.md | pending | |

## Block-specific context
- **Wave topic:** presence privacy toggle (LIVE 4795638)
- **T-block findings handed off:** 2 (0 blocking) — F-T3-1 (LOW, unknown-key→200/.strict() mismatch), F-T5-1 (LOW, idempotent duplicate emit) — per blocks/T/findings-aggregate.md
- **Karen verdict:** APPROVE (6/6, 0 findings)
- **jenny verdict:** APPROVE (0 drift, 0 gap)
- **Fast-fix cycles run:** 0

## Open escalations carried into gate
- B-6 accepted debt: .strict() comment/code mismatch (T-8 F-T3-1 confirms live: unknown key stripped→200, mass-assignment safe). V-2 to task.
- T-5 F-T5-1: duplicate presence emit to co-member (idempotent, client dedupes).

## Gate verdict log
<appended by fresh head-verifier spawn at V-3 Action 1>
