# Wave 26 — P-block review artifacts

**Block:** P (Product)
**Wave topic:** Presence dots on message-row author avatars (+ DM/member affordances) — re-homed M3 presence debt under active M5
**Block exit gate:** P-4
**Status:** in-progress

## Stage deliverables

| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | stages/P-0-frame.md | done | PROCEED + accepted REFRAME (PresenceDot extraction) + THIN split (sibling fdb444fc); authorId=userId resolved |
| P-1 | stages/P-1-decompose.md | done | single-spec; under-floor PRECEDENT-APPLICATION override-ship (5th); design_gap_flag=false → skip D |
| P-2 | stages/P-2-spec.md | pending | full run (no-prior-spec) |
| P-3 | stages/P-3-plan.md | pending | |
| P-4 | stages/P-4-gemini-review.md | pending | |

## Block-specific context
- **Wave topic:** presence dots on message-row author avatars in server-channel-view, driven by the existing live /presence store (single subscription); shared presence-dot primitive/token; graceful degrade on unknown presence.
- **Spec-contract short-circuit verdict:** no-prior-spec (task 10b9d18e has ## What/## Why/## Acceptance prose but no fenced YAML spec head → full P-1..P-3).
- **Roadmap milestone:** M5 (a5232e16) in_progress. Class=product-feature, Tier=T3. Task is re-homed M3 presence debt riding under M5 as the active milestone (M5's own ## Scope is assignments — NOT this task; same rehome pattern as wave-25). wave row milestone backfilled = M5.
- **wave_db_id:** 14908bd1-92fc-411c-aa13-6b4b2ea6d2ca (wave_number 26).
- **design_gap_flag:** FALSE (message-row avatar surface exists; PresenceDot = componentization of existing rendered dot; design ref present) → skip D.
- **claimed_task_ids:** [10b9d18e] (solo; sibling fdb444fc deferred, NOT claimed this wave).
- **Tier-3 product decisions resolved this wave:** none (UI presence surface; no money/security/major-UX tradeoff).
- **Autonomous mode active during P-block:** automatic.
- **Carry:** T-5 rule 1 (bundled-chromium on MCP launch fail) — promoted wave-25 — unblocks this task's UI verification (was the chrome-absent blocker 67881a58 rationale for prior deferral). Resend-key M5 blocker is record-only (reminders arc, not this task).

## Open escalations carried into gate
none

## Gate verdict log
<appended by fresh head-product spawn at P-4 Action 1>
