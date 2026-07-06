# Wave 63 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, T-block gate)
**Reviewed against:** process/waves/wave-63/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

The user-visible offline-academic behavior is proven at BOTH the honest-suite level and live on deployed prod, and the load-bearing safety criterion is real. **NAMED exit criterion (v1→v2→v3 upgrade preservation) — CONFIRMED PRESENT + GREEN:** `apps/web/src/features/sync/academic-cache.test.ts` seeds v1/v2-shaped rows in all five pre-v3 tables (channels/messages/outbox/dmConversations/dmMessages), re-opens at v3 with a fresh StudyHallDB instance, and asserts the actual row VALUES survive intact (`channel.name`, `message.content`, `outbox.state`+`content`+idempotencyKey, `dmConversation.isGroup`, `dmMessage.content`) — not mere table existence — plus that the new v3 academic tables exist cold and accept writes without corrupting the restated tables. This is a mutation-honest test: deleting any table from the v3 restate would fail a value assertion. Re-ran the 3 wave-63 suites locally this stage: 45/45 pass (academic-cache 16, assignments 25, calendar-offline 4). The offline-fallback panel tests assert user-observable outcomes — cached content renders AND the error state is asserted ABSENT — not mock-call trivia. **T-5 LIVE probe = PASS:** on deployed prod (699a619), signed in as fixture A, loaded Assignments (2 items) + Schedule (22 sessions) online (write-through), verified Dexie at schema v3 (IDB version 30 = declared ×10) with all 5 prior tables + cachedAssignments(2) + cachedScheduledSessions(22) coexisting, took the context transport-level offline (navigator.onLine=false + `/api/*` fetch → TypeError: Failed to fetch), re-navigated and asserted both panels render cached content with NO error state, and ran a strong falsification contrast — a fresh `/api/servers` fetch fails offline while the panels render (so they render from Dexie, not the network), and the general channel's live timer-sync feature visibly degrades ("Timer sync disconnected… Local session paused") under the exact same offline state. **T-1/T-2 CI-green:** CI 7/7 on re-run, web 520/520 + api 731/731. **Skips defensible:** T-3 (no API/shared-DTO shape change — reuses existing GET assignments + scheduled-sessions; only client-side Cached* types added), T-4 (no server/DB change — Dexie v3 is client-side, integration-tested via fake-indexeddb), T-6 (no new UI/layout — reuses AssignmentsPanel + ClassCalendar + shipped connection indicator, confirmed by the +29-line diffs touching only the fetch/fallback path), T-7 (not heavy), T-8 (no auth/session/rate-limit surface). The wave diff (8 files, +1088/−5) touches only the sync layer + two existing panels — no new route, no new screen, no router change — so journey regen is annotation-only (Action 2). **Pre-existing flake honestly recorded:** study-timer.test.tsx "400 renders inline error" async race is captured in C-1, findings-aggregate, and the T-block manifest as NOT caused by wave-63, feeding the existing unassigned flaky-test-stabilize queue item — it flaked once on CI, passed on re-run + 2× local; it is correctly not silenced with a blind retry and does not block this wave.

## Stage-exit checklist (applicable layers)

- [x] T-1 static: CI lint+typecheck SUCCESS incl B-5 tsc fix.
- [x] T-2 unit: mutation-sane — v3 preservation test fails on any dropped table (real-bug detectable). Pure round-trip + window-isolation as transition tables. 520/520 + 731/731.
- [x] Offline-sync determinism: fake-indexeddb per-test IDBFactory injection (hard isolation), no real timers/clock.
- [x] Offline-fallback tests assert user-observable render + error-state-absent (not mock counts).
- [x] T-5 e2e: LIVE two-surface offline probe on deployed prod; transport-offline proven; strong falsification contrast. No `browser_close` (rule 5 honored — context left open for later agents).
- [x] T-5 realtime note: single-client is acceptable here — this is a client-cache read path, not a realtime fan-out path (two-client rule N/A; the live realtime feature that DOES exist, timer-sync, is boundary-observed degrading offline, not falsely asserted).
- [x] NAMED exit criterion (v1→v2→v3 preservation) exists AND passed — green is NOT achieved without it.
- [x] Skips (T-3/T-4/T-6/T-7/T-8) each carry a concrete, diff-consistent justification.
- [x] Flaky test root-cause-tagged + ticketed (flaky-test-stabilize item), not blind-retried.
- [x] Journey regen scope correct: annotation-only (no new route/screen).

## Journey-regen skip evaluation (Action 2)
- `wave_type` includes `ui` and B-3 Frontend fired → regen is REQUIRED (not skipped).
- BUT the diff adds NO new route/screen/router change (data-source swap on existing AssignmentsPanel + ClassCalendar). → regen is **annotation-only**: update the offline-behavior notes on the existing assignments (page 14, F6/F9) + schedule surfaces to record they now render from the Dexie v3 academic cache when offline. Same pattern as wave-62 (DM offline cache) and wave-23. `routes_added: []`, `routes_removed: []`, `coverage_gaps: []`. No cross-wave regression: existing journeys (assignments online CRUD, schedule online CRUD, messaging) all still render — verified live during the online write-through phase.

## Escalation
N/A.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
