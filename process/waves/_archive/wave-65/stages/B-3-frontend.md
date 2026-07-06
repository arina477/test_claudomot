# B-3 Frontend — wave-65
Specialist: react-specialist (agentId a246ab0a...). Single coherent module, one specialist (serial: db.ts+types.ts → cache.ts → ServerContext.tsx → tests).
Files implemented:
- types.ts — CachedServer (ServerSummary + cachedAt); CachedServerDetail wrapper {id, detail: ServerDetail, cachedAt} (ServerDetail is {server, categories} with no top-level id → wrap for a stable pk, per spec's wrap branch).
- db.ts — Dexie v5: cachedServers/cachedServerDetails EntityTable fields + .version(5).stores() restating all 8 v4 tables VERBATIM (byte-compared) + cachedServers:'id' + cachedServerDetails:'id'. Rule 11 satisfied.
- cache.ts — getCachedServers (toArray, []-on-cold) / putCachedServers (replace-semantics: bulkPut + prune ids absent from new list) / getCachedServerDetail (undefined-on-cold) / putCachedServerDetail. Best-effort, no-throw.
- ServerContext.tsx — added Dexie db import; fetchServers write-through on success + read-through in .catch (cached non-empty → setServers + status 'loaded', else 'error'); getServerDetail effect write-through + read-through in .catch; mounted-guard preserved; reuses ConnectionStateIndicator (no new UI). useMessages.ts UNTOUCHED.
- server-cache.test.ts (new) — v4→v5 + full v1→v5 upgrade PRESERVATION (all prior tables' ROWS survive, shared IDBFactory close/reopen; rule-11 named exit criterion) + put→get round-trip + replace-semantics prune.
- ServerContext.test.tsx (new) — offline hydration (getServers/getServerDetail reject → rail+sidebar hydrate from cache, channel selectable) + cold-cache graceful error + online write-through.
Local verify (by specialist, re-confirmed at B-4/B-5): typecheck clean; biome clean; web test 558 passed / 0 failed / 37 files.
Deviations (all adjudicated ACCEPT — minor, sound, no silent contradiction):
1. CachedServerDetail wrapper {id, detail, cachedAt} — ServerDetail has no top-level id; wrap gives stable pk. Matches spec's explicit "wrap" branch.
2. fetchServers .catch sync→async (to await getCachedServers) — functionally equivalent; mounted.current re-checked post-await.
3. appendServer background reconciliation left w/o write-through — it calls getServers whose success flows through fetchServers's write-through; correct, not a gap.
```yaml
skipped: false
fast_path_active: false
specialists_spawned: [react-specialist]
files_implemented: [types.ts, db.ts, cache.ts, ServerContext.tsx, server-cache.test.ts, ServerContext.test.tsx]
designs_consumed: []
deviations: [{specialist: react-specialist, change: "CachedServerDetail wrapper", plan_said: "intersect-or-wrap", why: "no top-level id on ServerDetail", adjudication: accept}, {specialist: react-specialist, change: "catch sync->async", plan_said: "read-through in catch", why: "await getCachedServers", adjudication: accept}, {specialist: react-specialist, change: "appendServer no direct write-through", plan_said: "write-through on getServers success", why: "flows through fetchServers", adjudication: accept}]
simplify_applied: true
```
