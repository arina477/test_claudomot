# B-3 Frontend — wave-63 (multi-spec, 4 commits incl B-5 fix)
Executor: react-specialist (3a substrate ae026375ac2c3b8e8; 3b wire-ins a0379fff43d609629; tsc-fix a15ad0b7fcd362ad8).
- **3a substrate (task c5689dc5, commit 58b6b22):** db.ts Dexie v3 — .version(3).stores() re-states 5 v1+v2 tables VERBATIM + cachedAssignments 'id, serverId' + cachedScheduledSessions 'id, serverId, windowKey'; v1+v2 blocks preserved. types.ts CachedAssignment/CachedScheduledSession (DTO-intersection; session carries windowKey composite serverId|from|to). cache.ts helpers (assignments serverId-scoped; sessions window-keyed exact-equality). academic-cache.test.ts: 16 tests incl v1→v2→v3 PRESERVATION (all 5 prior tables' ROWS survive) + 3 window-isolation.
- **3b assignments (task 35c57942, commit 5d7d652):** AssignmentsPanel.loadAssignments write-through putCachedAssignments on success; catch fallback getCachedAssignments(serverId) → renders cached (cold→graceful empty, not error); fetch-catch trigger (no navigator.onLine gate). Tests.
- **3b schedule (task 42e0a265, commit a08f37c):** ClassCalendar.loadSessions write-through putCachedScheduledSessions(serverId,from,to) using exact ISO from/to; catch fallback getCachedScheduledSessions(same from/to) → renders cached window; windowKey matches; cold→empty. Tests.
- **B-5 tsc fix (commit 8e9f30f):** academic-cache.test.ts lines 102/174 — new Date(result[0]?.cachedAt) string|undefined → typed cast after toBeDefined (no !/any). B-3a's tsc missed the test file; B-5 caught it, routed to react-specialist per Iron Law.
Results: web tsc clean; full web vitest 520/520; academic-cache 16/16; biome clean. Deviation: none (B-5 tsc fix routed).
```yaml
specialists: [react-specialist x3]
files: [db.ts, types.ts, cache.ts, academic-cache.test.ts, AssignmentsPanel.tsx, assignments.test.tsx, ClassCalendar.tsx, calendar-offline.test.tsx]
commits: [58b6b22, 5d7d652, a08f37c, 8e9f30f]
deviations: []
```
