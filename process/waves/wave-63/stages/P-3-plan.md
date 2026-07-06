# P-3 Plan — wave-63 (M12 offline-academic-read, multi-spec)

## Approach
- **Architecture deltas:** extend the shipped Dexie substrate (apps/web/src/features/sync) with 2 academic tables +
  read-through helpers; wire into the 2 academic read paths (AssignmentsPanel, ClassCalendar). NO server change
  (reuses GET /servers/:serverId/assignments + /scheduled-sessions); NO new DB/abstraction (add to StudyHallDB v3 +
  cache.ts). Mirrors bundle #1 (DM cache) verbatim in shape.
- **Data model:** Dexie IndexedDB v3 (client-only) — 2 new tables (cachedAssignments, cachedScheduledSessions).
  **HIGHEST-RISK (head-builder gate):** `.version(3).stores()` MUST re-state ALL 5 prior tables
  (channels/messages/outbox/dmConversations/dmMessages) VERBATIM — Dexie cumulative-declarative; omitting any DELETES it.
  **2nd risk:** sessions cache keyed by serverId+window (server expands weekly occurrences per from/to — not naive by-id).
- **API/deps:** none.

## Plan (file-level steps, per-spec commits)

### B-2 Backend — SKIP (no server change; reuses existing GET assignments + scheduled-sessions)

### B-3 Frontend — the whole feature (executor: react-specialist)
**Step 3a — SEED c5689dc5 (substrate), commit `feat(sync): ... task c5689dc5`:**
- `apps/web/src/features/sync/db.ts` — StudyHallDB v3: add cachedAssignments + cachedScheduledSessions; `.version(3).stores()` re-states ALL 5 v1+v2 tables VERBATIM (highest-risk). Keep v1+v2 blocks.
- `apps/web/src/features/sync/types.ts` — CachedAssignment/CachedScheduledSession (DTO-intersection from @studyhall/shared).
- `apps/web/src/features/sync/cache.ts` — helpers: get/putCachedAssignments(serverId), get/putCachedScheduledSessions(serverId, from, to) [window-keyed].
- tests (dm-cache.test.ts sibling or new) — fake-indexeddb: v1→v2→v3 preservation (all prior tables+rows survive); put→get both tables; sessions window scoping.

**Step 3b — SIBLINGS 35c57942 (assignments) + 42e0a265 (schedule), TWO commits (one per task):**
Disjoint files (AssignmentsPanel.tsx vs ClassCalendar.tsx) but ONE specialist pass (avoid git-index race), commit per spec block.
- 35c57942: AssignmentsPanel loadAssignments (~:115) — write-through putCachedAssignments on success; offline/catch fallback getCachedAssignments(serverId) → renders cached (not error/blank); reuse connection indicator; cache-only when disconnected. + tests. Commit `feat(assignments): ... task 35c57942`.
- 42e0a265: ClassCalendar listSessions (~:486) — write-through putCachedScheduledSessions(serverId,from,to); offline fallback getCachedScheduledSessions(serverId,from,to) → renders cached schedule for that window; window-correct (no mismatched window). + tests. Commit `feat(schedule): ... task 42e0a265`.

### Specialist routing (AGENTS.md validated)
- react-specialist — B-3 executor (React + Dexie). Substrate (3a) THEN wire-ins (3b) — hard dependency.

## Parallelization map
Serial: 3a substrate → 3b wire-ins. The 2 wire-ins are disjoint files (could parallelize) but run in ONE specialist pass (sequential edits, 2 commits) to avoid a git-index race on the shared branch.

## Self-consistency sweep
1. Every AC → step (seed→3a; 35c57942→3b assignments; 42e0a265→3b schedule). ✓  2. Specialist assigned. ✓
3. No file in 2 parallel batches (serial). ✓  4. design_gap_flag false. ✓
5. Arch delta named (v3 verbatim-restate + sessions-window risks). ✓  6. Data model concrete; no API change. ✓
7. No deps. ✓  8. SDK n/a. ✓  Sweep clean. Multi-spec commit hygiene: one commit per task_id.
