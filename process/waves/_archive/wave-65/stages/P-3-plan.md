# P-3 Plan — wave-65 (single-spec; cold-offline workspace hydration)

## Approach

### Architecture deltas
**1. ServerContext (client state machine) — apps/web/src/shell/ServerContext.tsx.**
- What changes: the two read paths gain cache behavior. `fetchServers()` — on success, write-through the ServerSummary[] to Dexie; on `.catch` (currently `setStatus('error')` with empty list), read-through from the cached list and, if non-empty, render it (status='loaded' from cache) instead of an empty error rail. `getServerDetail` effect — on success, write-through the ServerDetail; on `.catch` (currently `setDetailStatus('error')` with null), read-through the cached detail and render categories+channels.
- Why this approach vs alternatives: (a) inline in ServerContext vs a generic `useCachedFetch` wrapper hook — inline WINS: matches the thrice-shipped inline pattern (useDm.ts, AssignmentsPanel, ClassCalendar all inline write-through+catch-read-through); a generic wrapper is a speculative abstraction over 2 call sites. (b) Serve-cache-first (stale-while-revalidate) vs network-first-fallback-to-cache — network-first WINS: keeps the online path unchanged (live data preferred when reachable), cache only fills the offline gap; lower regression risk on the happy path.
- Failure-domain impact: client-only; crosses NO service boundary; NO permission change — read-through serves data the server already authorized into the cache on a prior online fetch; the live server fetch still enforces authz when reachable.

**2. Dexie sync module — apps/web/src/features/sync/{db.ts,types.ts,cache.ts}.**
- What changes: v4→v5 adds a server-list cache (`cachedServers`, per-row keyed by server id) + a server-detail cache (`cachedServerDetails`, keyed by server id, storing the full ServerDetail DTO). New helpers mirror the shipped get/put pattern.
- Why cache the full ServerDetail DTO vs wiring the dormant granular `channels` table: DTO-blob WINS — it matches the shipped "cache the DTO you fetched" pattern (cachedAssignments, CachedDmConversation), and the sidebar renders directly from a ServerDetail (categories+channels), so one blob per server is the minimal faithful cache. The dormant `channels` table is left in place (restated verbatim per rule 11) but NOT newly wired — caching the full detail supersedes the need; wiring the granular table too would duplicate the same data. (Documented so head-builder doesn't flag the untouched dormant table as a miss.)
- Failure-domain: client IndexedDB only.

### Data model (Dexie v5 CLIENT schema delta only — NO server DB change)
- Add table `cachedServers` — primary key `id` (server id); stores ServerSummary fields + `cachedAt`. `getCachedServers()` = `table.toArray()`; `putCachedServers(list)` = replace-semantics (bulkPut new rows + delete cached rows whose id is not in the new list, so membership drift reconciles).
- Add table `cachedServerDetails` — primary key `id` (server id); stores the ServerDetail DTO + `cachedAt`. `getCachedServerDetail(id)` / `putCachedServerDetail(detail)`.
- **RULE 11:** `this.version(5).stores({...})` RE-STATES all 8 v4 tables verbatim (messages, channels, outbox, dmConversations, dmMessages, cachedAssignments, cachedScheduledSessions, cachedAttachmentBlobs) + cachedServers + cachedServerDetails. Byte-compare the 8 restated lines against the v4 block.
- Migration: online, no backfill (new empty tables; populate on next online fetch).

### API contracts (concrete — REUSED, no change)
- `GET /servers` → `ServerSummary[]` (packages/shared/src/servers.ts ServerSummarySchema). Auth: authed (session cookie). Client method `api.getServers()`.
- `GET /servers/:id` → `ServerDetail` (ServerDetailSchema; categories + channels). Auth: authed. Client method `api.getServerDetail(id)`.
- No request/response shape change; no idempotency concern (GETs). Read-through serves the last cached authorized response offline.

### New deps: NONE.
### SDK pre-build checklist: N/A (no new SDK).

## Plan (file-level steps)

**B-1 Schema (Dexie):**
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| apps/web/src/features/sync/db.ts | modify | v5 `.version(5).stores()` restating all 8 v4 tables verbatim + cachedServers + cachedServerDetails; add EntityTable fields | react-specialist | 1st (foundation) |

**B-2 Contracts (types):**
| apps/web/src/features/sync/types.ts | modify | add `CachedServer` (ServerSummary + cachedAt) + `CachedServerDetail` (ServerDetail + cachedAt); DTO-intersection pattern | react-specialist | with B-1 (no interdep) |

**B-3 Backend:** SKIP — no server/API change.

**B-4 Frontend:**
| apps/web/src/features/sync/cache.ts | modify | add get/putCachedServers (list, replace-semantics) + get/putCachedServerDetail; cold→[]/undefined, no throw | react-specialist | after B-1+B-2 |
| apps/web/src/shell/ServerContext.tsx | modify | write-through on getServers/getServerDetail success; read-through on catch; graceful empty-state; reuse ConnectionStateIndicator (no new UI). LEAVE useMessages.ts untouched | react-specialist | after cache.ts |

**B-5 Verify (tests):**
| apps/web/src/features/sync/server-cache.test.ts | create | v4→v5 (+ v1→v5) upgrade PRESERVATION (all 8 prior tables' ROWS survive — rule 11) + cachedServers/Details put→get round-trip + replace-semantics prune | react-specialist | after B-4 |
| apps/web/src/shell/ServerContext.test.tsx (or equiv) | create/modify | offline hydration: getServers/getServerDetail reject → rail+sidebar hydrate from cache, channel selectable; cold cache → empty-state | react-specialist | after B-4 |

## Specialist routing (validated against AGENTS.md)
- **react-specialist** — owns apps/web sync module + shell context (used for wave-63/64 offline read-through). All steps route here (single coherent module, one specialist).

## Parallelization map
- Serial chain (tight coupling schema→types→cache→context→tests): db.ts + types.ts (parallel-OK, no interdep) → cache.ts → ServerContext.tsx → tests. Single specialist; B-block sequences.

## Self-consistency sweep
1. Every AC maps to a step: AC1/2 write-through→cache.ts+ServerContext; AC3/4 read-through→ServerContext; AC5 end-to-end→ServerContext (useMessages untouched); AC6 rule-11→db.ts+server-cache.test; AC7 graceful→ServerContext+cache.ts+test; AC8 reconcile→cache.ts replace-semantics. ✓
2. Every step has a specialist (react-specialist). ✓
3. No file in multiple parallel batches. ✓
4. design_gap_flag: false (referenced). ✓
5. Architecture deltas have explicit alternative trade-offs. ✓
6. Contracts concrete, no TBD. ✓
7. No new deps. ✓
8. No SDK. ✓
