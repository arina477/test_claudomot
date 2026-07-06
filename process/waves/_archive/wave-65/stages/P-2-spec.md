# P-2 Spec (pointer) — wave-65
**Spec contract source of truth:** `tasks` row `db3ade72-6504-4700-93b1-9d99b4098f38` `description` (YAML head + `---` + prose). This file is a convenience copy.
wave_type: single-spec. claimed_task_ids: [db3ade72]. design_gap_flag: false.

## Acceptance criteria (copy)
1. WRITE-THROUGH server list: successful GET /servers persists ServerSummary[] to Dexie (best-effort, non-blocking).
2. WRITE-THROUGH server detail: successful GET /servers/:id persists ServerDetail (categories+channels) keyed by server id.
3. READ-THROUGH server rail cold-offline: getServers fail → hydrate `servers` from cache (rail renders + selectable) instead of empty/error.
4. READ-THROUGH channel sidebar cold-offline: getServerDetail fail → hydrate `selectedDetail` from cache (sidebar renders categories+channels, channel selectable) instead of null/error.
5. END-TO-END: cold offline open → select cached server → cached channel → already-shipped message+media offline fallback renders. useMessages.ts UNMODIFIED.
6. RULE 11: Dexie v4→v5 restates all 8 prior tables verbatim + new server-list/server-detail cache; test asserts v4→v5 (+ v1→v5) upgrade preserves all prior tables' ROWS.
7. GRACEFUL cold cache: never-synced read offline → undefined/empty, empty-state (no crash/spinner-forever); reuse ConnectionStateIndicator (no new offline UI).
8. RECONCILE: reconnect → successful fetch write-through overwrites cache to live (membership/rename drift reconciles).

## Contracts
- types: NEW CachedServer + CachedServerDetail (types.ts); StudyHallDB v5 (db.ts); get/putCachedServers + get/putCachedServerDetail (cache.ts). Reuse CachedChannel.
- api: REUSES GET /servers + GET /servers/:id — NO server change.
- data: Dexie v5 client delta only (2 new tables, rule-11 restate-all). NO server DB change.
- sdk: none.

## Edge cases: cold cache; partial offline; stale cache; membership drift; multi-server; write-through failure (swallowed). (full text in DB row)
