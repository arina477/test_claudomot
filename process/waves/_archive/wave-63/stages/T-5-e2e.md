# T-5 — E2E (LIVE offline probe) — wave-63

**Layer:** T-5 e2e / Pattern B (active-execution against deployed prod)
**Executed by:** head-tester (T-block gate spawn)
**Target:** https://web-production-bce1a8.up.railway.app (web @ merge 699a619, deploy SUCCESS)
**Fixture:** fixture A (studyhallfixturea@…) — pre-authenticated session persisted on the shared Playwright MCP context (playwright-1). Server used: "Fixture Proof Server" (fixture A is a member; assignments + schedule both populated). Note: the named server ad62cd12 is not name-identifiable in the DOM among 552 accumulated E2E fixture servers; "Fixture Proof Server" exercises the identical Cached* read-through path and carried live academic data, so it is an equivalent-or-better probe target.

## Result: PASS — offline-academic read-cache verified on deployed prod

### Probe sequence (all four steps executed)

**1. Online write-through (cache populated).**
- Assignments panel loaded ONLINE with real data: 2 assignments ("T5 E2E Assignment 1783126244686", "V1 jenny probe 1783128119"). `data-testid="assignments-panel"` + 2× `assignment-card`.
- Schedule/ClassCalendar loaded ONLINE: 22 session cards across multiple weeks (`data-testid="class-calendar-panel"` + 22× `session-card`).
- IndexedDB inspection (Dexie `studyhall` DB): **IDB version 30 = Dexie schema v3** (Dexie multiplies its declared version ×10). Object stores present: `channels, messages, outbox, dmConversations, dmMessages` (all 5 pre-v3 tables restated verbatim) **+ `cachedAssignments`, `cachedScheduledSessions`** (the 2 new v3 academic tables). Counts after write-through: `cachedAssignments=2`, `cachedScheduledSessions=22`. This is the LIVE analogue of the v1→v2→v3 preservation test: all prior tables coexist intact with the new academic tables.

**2. Context taken OFFLINE (`context.setOffline(true)`) — transport-level offline PROVEN.**
- `navigator.onLine === false`.
- In-page `fetch('/api/health')` → `TypeError: Failed to fetch`.
- In-page external fetch → `TypeError: Failed to fetch`.
- The transport is genuinely down (not a soft/simulated offline).

**3. Offline re-navigation — cached render asserted (NOT blank / NOT error).**
- Re-opened Assignments while offline: `assignments-panel` present, **error state absent** (`assignments-error` not in DOM), **2 cached assignment cards render** with correct titles.
- Re-opened Schedule while offline: `class-calendar-panel` present, **`schedule-error` absent**, **22 cached session cards render**, `navigator.onLine === false` at assertion time.

**4. Falsification contrast (strong) — non-cached / live surfaces FAIL offline.**
- In-page fresh fetch `fetch('/api/servers?bust=…')` → `TypeError: Failed to fetch` while the panels rendered — same transport that fed the write-through is dead, yet the panels render → they render FROM THE DEXIE CACHE, not the network.
- DOM-level: the general channel while offline shows the app's genuine offline UI — "Offline — messages will send when you're back" banner, and the live realtime feature degrades: "Timer sync disconnected — Lost connection to the study server. Local session paused." + "Retry Connection". Live/realtime surfaces fail under the exact same offline state where the academic cache panels succeed. Decisive contrast.

**5. Cleanup.** Restored online (`context.setOffline(false)` → `navigator.onLine === true`). Browser context left OPEN — no `browser_close` (rule 5 / shared MCP for later agents).

## Cross-check against unit evidence
The live PASS corroborates the code-level evidence (not a substitute for it, but both agree):
- `apps/web/src/features/sync/academic-cache.test.ts` (16/16) — fake-indexeddb round-trips, window isolation, and the v1→v2→v3 preservation test asserting real row VALUES survive (not just table existence).
- `apps/web/src/shell/assignments.test.tsx` (25) + `apps/web/src/shell/calendar-offline.test.tsx` (4) — offline-fallback: on network reject, cached content renders and the error state is asserted ABSENT (user-observable outcomes, not mock-call trivia). Re-ran locally this stage: 45/45 pass.

```yaml
test_pattern: active
skipped: false
probe_target: https://web-production-bce1a8.up.railway.app
fixture: fixture-A (pre-authenticated on playwright-1 shared MCP)
dexie_version_observed: 30   # Dexie schema v3 (IDB integer = declared ×10)
cached_tables_populated: {cachedAssignments: 2, cachedScheduledSessions: 22}
offline_transport_proven: true    # navigator.onLine=false + fetch TypeError
assignments_offline_render: PASS  # 2 cards, no error state
schedule_offline_render: PASS     # 22 cards, no error state
falsification_contrast: PASS      # fresh /api fetch fails + timer-sync live feature degrades offline
browser_close_called: false
evidence:
  - live probe on deployed prod 699a619 (this stage)
  - apps/web academic-cache 16/16 + assignments 25 + calendar-offline 4 (45/45 local re-run)
findings: []
```
