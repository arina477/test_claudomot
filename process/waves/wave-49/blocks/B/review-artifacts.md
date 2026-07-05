# Wave 49 — B-block review artifacts
**Block:** B (Build) · **Wave topic:** M8 study-group tools slice 1 — shared study timer (schema + compute-on-read backend + Socket.IO fan-out + presence + widget + phase auto-advance) · **Gate:** B-6 · **Status:** in-progress · **Branch:** wave-49-study-timer · **claimed:** [1387d845, cb81bf03, c3daf6d3, 832b83b7] · **Design:** design/study-timer.html
## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch + server_study_timer schema/migration 0022 (anchors-only; local apply deferred to C-2) |
| B-1 | stages/B-1-contracts.md | done | packages/shared/src/study-timer.ts Zod + 2 socket event consts |
| B-2 | stages/B-2-backend.md | done | timer module (compute-on-read, one-shot armAutoAdvance, no loop) + gateway update+ephemeral presence; 26 unit + 12 integration |
| B-3 | stages/B-3-frontend.md | done | StudyTimerWidget + studyTimerSocket + api; countdown derives from server endsAt; 17 tests; D-3 carries applied |
| B-4 | stages/B-4-wiring.md | done | repo typecheck clean (4/4); routes via app.module |
| B-5 | stages/B-5-verify.md | done | biome 0, tsc clean, full suite green (637 api + 394 web) |
| B-6 | stages/B-6-review.md | in-progress | head-builder gate + /review |
## Block-specific context
- Spec: tasks row 1387d845. Branch: wave-49-study-timer. claimed [1387d845, cb81bf03, c3daf6d3, 832b83b7]. design_gap_flag=true (canonicalized design/study-timer.html).
- **BINDING MODEL (P-0/P-2):** persist ANCHORS ONLY; compute-on-read remaining/phase; auto-advance=broadcast-on-transition (one-shot idempotent, self-healing); **FORBID per-server setInterval/@nestjs/schedule tick loop**. IDOR-safe assertMember.
- **Carry (P-4 karen)**: B-2 model the server-room join on presence.gateway.ts (presence:server:<id>, can()-gated) + reuse messaging.gateway io.use() WS-session validation; ADD the server room (not pre-existing).
- **Carry (D-3)**: B-3 fix .btn transition CSS typo, slim-bar phase indicator, paused aria-atomic, decorative chrome icons→buttons.
- **Carry (P-4 jenny)**: B-6/T verify roster NON-persisted + transition NOT a disguised loop.
- Schema: server_study_timer (1 table + migration). New deps: none.
## Gate verdict log
<head-builder at B-6>
