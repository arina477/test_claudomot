# Wave 26 — B-block review artifacts

**Block:** B (Build) | **Wave topic:** Presence dots on message-row author avatars (extract shared PresenceDot) | **Block exit gate:** B-6 | **Status:** in-progress | **wave_type:** single-spec | **branch:** wave-26-presence-author-dots

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch created; schema/deps/env SKIP (frontend-only) |
| B-1 | (skipped) | skipped | no contract surface — PresenceDot is a web-local component, no shared type/Zod change |
| B-2 | (skipped) | skipped | pure-frontend wave — presence infra (/presence, store) already exists |
| B-3 | stages/B-3-*.md | done | react-specialist: PresenceDot + author dots + member-panel refactor + 15 tests (9056900); CARRY-2 pending/failed no-dot |
| B-4 | stages/B-4-*.md | done | typecheck 4/4; caught+repaired 2 pre-existing main-CI-red (biome process/** ignore + assignments clock-mock fa6c9e6) |
| B-5 | stages/B-5-*.md | done | lint 0 err, web 249 + api 395, build 3/3 |
| B-6 | stages/B-6-review.md | pending | head-builder + /review |

## Block-specific context
- **Spec contract:** tasks row 10b9d18e (DB); spec at stages/P-2-spec.md (5 ACs).
- **Branch name:** wave-26-presence-author-dots (from 57119e8).
- **claimed_task_ids:** [10b9d18e] (sibling fdb444fc deferred, NOT claimed).
- **New deps added this wave:** none.
- **New env vars added this wave:** none.
- **Schema changes this wave:** none (schema_skipped).
- **B-1 fast-path:** expected skip (no contract surface).

## Binding B-block carries (from P-4 Phase 2 — react-specialist MUST honor)
- **CARRY-1 (perf, Gemini-triaged NOT-MATERIAL):** each PresenceDot re-renders only when ITS author's status changes — read `getPresenceStatus(authorId)` + memoize on that author's status slice; keep the single `subscribePresence` fan-out (AC4). Do NOT call bare `usePresence()` at every row. Large-channel perf = T-7 watch item.
- **CARRY-2 (jenny G2, authorId scope):** sibling author-avatar sites MessageList.tsx :1236/:1322 key on `authorDisplay` (string) NOT `authorId`. Confirm `authorId` (userId) is in scope at EVERY author-avatar attach site before wiring `getPresenceStatus(authorId)`; if only `authorDisplay` exists, resolve the stable authorId or flag back to P.
- **CARRY-3 (karen path/line):** emerald token is `apps/web/src/styles/globals.css:18` (NOT `src/globals.css`); member-panel inline dot block is `MemberListPanel.tsx:92-101` (:91 is a comment).
- **CARRY-4 (BUILD rule 7):** local verify uses `biome check` (format + organizeImports + lint), not `biome format` alone.

## Open escalations carried into gate: none
## Gate verdict log: <appended by head-builder at B-6>
