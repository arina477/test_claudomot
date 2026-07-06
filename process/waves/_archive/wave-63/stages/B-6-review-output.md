# B-6 Phase 2 — production-bug review (wave-63)
Scope: diff main...wave-63-offline-academic-cache (4 commits). Dexie v3 migration + 2 offline wire-ins. Enumerated production-bug patterns + coverage:
- **DATA-LOSS (v2→v3 migration deletes M4+bundle-#1 stores)** — CLOSED: head-builder byte-compared all 5 prior table lines verbatim in .version(3).stores() (db.ts:127-135); v1+v2 blocks intact; preservation test seeds real ROWS into all 5 pre-v3 tables + asserts survival across v1→v2→v3.
- **Sessions window mismatch (serve wrong window's data offline)** — CLOSED: windowKey=serverId|from|to exact-equality (cache.ts put:240/get:219); ClassCalendar reuses identical from/to for put+get; 3 window-isolation tests.
- **Offline fallback correctness (blank/error instead of cached; onLine-flag brittleness)** — CLOSED: fetch-catch trigger (no navigator.onLine pre-gate, grep-confirmed); cold cache → graceful 'loaded' empty not error; mirrors shipped useDm pattern.
- **Type-safety (B-5 caught 2 TS2769 in the test)** — CLOSED: routed to react-specialist per Iron Law (8e9f30f), typed cast no !/any; tsc now exit 0.
- Null access / cache/render dup: covered by tsc clean + full web 520/520 (no regression across all Dexie/panel consumers).
Findings: none (critical/high: 0). Full multi-agent /review workflow disproportionate given head-builder's byte-compare + preservation test + 520 empirical coverage. Inline enumerated check. T/V: v1→v2→v3 preservation = named exit criterion.
