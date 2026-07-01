# Wave 26 — P-block review artifacts

**Block:** P (Product)
**Wave topic:** Presence dots on message-row author avatars (+ DM/member affordances) — re-homed M3 presence debt under active M5
**Block exit gate:** P-4
**Status:** gate-passed

## Stage deliverables

| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | stages/P-0-frame.md | done | PROCEED + accepted REFRAME (PresenceDot extraction) + THIN split (sibling fdb444fc); authorId=userId resolved |
| P-1 | stages/P-1-decompose.md | done | single-spec; under-floor PRECEDENT-APPLICATION override-ship (5th); design_gap_flag=false → skip D |
| P-2 | stages/P-2-spec.md | done | single-spec, 5 ACs to 10b9d18e.desc |
| P-3 | stages/P-3-plan.md | done | extract PresenceDot + apply to author avatars + member-panel refactor; react-specialist; frontend-only (B-0/B-1/B-2 skip) |
| P-4 | blocks/P/gate-verdict.md | done | head-product APPROVED + karen+jenny APPROVE; Gemini CONCERN→NOT-MATERIAL (perf = B-memo + T-7 watch); gate-passed |

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

## Binding B-block carries (from P-4 Phase 2 — react-specialist MUST honor)
- **CARRY-1 (perf, Gemini-triaged):** each PresenceDot re-renders only when ITS author's status changes — read `getPresenceStatus(authorId)` + memoize on that author's status slice; keep the single `subscribePresence` fan-out (AC4). Do NOT call bare `usePresence()` at every row (would re-render all rows on any presence change). Large-channel/virtualized perf = **T-7 watch item**, not a B blocker.
- **CARRY-2 (jenny G2, authorId scope):** sibling author-avatar sites MessageList.tsx :1236/:1322 key on `authorDisplay` (a string), NOT `authorId`. Confirm `authorId` (userId) is in scope at EVERY author-avatar attach site before wiring `getPresenceStatus(authorId)`; if only `authorDisplay` exists there, resolve the stable authorId (presence keys on userId) or flag back to P. Otherwise the dot silently no-dots where it should render.
- **CARRY-3 (karen path/line):** the emerald token is at `apps/web/src/styles/globals.css:18` (NOT `src/globals.css`); the member-panel inline dot block is `MemberListPanel.tsx:92-101` (:91 is a comment).
- **CARRY-4 (BUILD rule 7):** local verify uses `biome check` (format + organizeImports + lint), not `biome format` alone.
