# Wave 21 — B-3 Frontend
```yaml
files: [shell/useConnectionState.ts (new), pages/AppHome.tsx (live wiring, replaced L39 hardcode), shell/useMessages.ts (runDrainAndCatchup loop), shell/useConnectionState.test.tsx, features/sync/multiPageCatchup.test.ts]
source_priority: "offline IF (!navigator.onLine OR socket offline); else reconnecting IF socket reconnecting; else online (both required). window 'online' = re-eval trigger only, never overrides to online while socket not connected. 150ms debounce (flap no-thrash). D1 (window=online+socket=reconnecting→reconnecting) + D2 (window=offline+socket=connected→offline) tests pass."
catch_up_loop: "loop getMessagesAfter until result.nextCursor null; cursor advanced from SERVER nextCursor OUTSIDE setRealMessages (no stale closure); per-page putCachedMessages write-through (mid-loop-disconnect cache-consistent); dedup-by-id; MAX_ITERS=100 guard logs+stops, partial pages preserved (no silent data loss); order-preserving; opaque cursor (wave-20 V-3)"
no_rebuild: "reused getSocketState + ConnectionStateIndicator + putCachedMessages + StudyHallDB + fake-indexeddb (rule 1)"
verify: "web typecheck+build clean; biome 0; 193/193 tests (+17: 9 connection-state incl D1/D2, 5 multi-page catch-up, +3)"
```
