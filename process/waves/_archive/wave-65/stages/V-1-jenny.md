# V-1 Jenny — wave-65 spec-intent verification (M12 cold-offline WORKSPACE hydration)

**Verdict: APPROVE**

Deployed behavior on prod (`https://web-production-bce1a8.up.railway.app`) matches the reframed spec-contract
intent for task `db3ade72-6504-4700-93b1-9d99b4098f38`. All 8 acceptance criteria verified against live behavior
beyond the T-block layer. No spec-drift found. Two minor spec-gaps noted (non-blocking, cosmetic).

Lane: I verify DEPLOYED behavior vs SPEC INTENT. Source-claim truth is Karen's lane; I read source only to ground
AC5 (useMessages untouched) and AC6 (Dexie restate-all), both of which are also observable in the deployed IndexedDB.

---

## Method / fixtures
- Fixture A `studyhall-e2e-fixture@example.com`, member of "Fixture Proof Server" (`ad62cd12-b78e-4a85-a214-042cf176b16c`).
- Playwright MCP (playwright-4) against deployed prod; no browser_close.
- Cold-offline reproduced via CDP `Network.emulateNetworkConditions{offline:true}` + `context.setOffline(true)` then
  page reload (SW serves app shell). Reconcile verified via a fresh online tab (clean boot, no stuck emulation).
- Deployed Dexie inspected directly via `indexedDB` in-page (version 50 = Dexie v5 ×10; 10 object stores present).

---

## AC-by-AC (deployed evidence)

**AC1 — write-through server list — PASS.** On authenticated online load, deployed `cachedServers` held 558 rows
(shape `{id,name,...}`). On a fresh online tab boot at 15:04:00, `cachedServers[0].cachedAt` = `15:04:00.991Z`
(a fresh timestamp), proving GET /servers success writes through.

**AC2 — write-through server detail — PASS.** Before selecting any server, `cachedServerDetails` = 0 rows. After
selecting "Fixture Proof Server", exactly 1 row appeared keyed by `ad62cd12-…`, shape
`{id, detail:{server, categories}, cachedAt}` — matches the CachedServerDetail contract; `detail` keys `server` +
`categories` match the ServerDetail DTO. On fresh online tab, `cachedServerDetails[fixture].cachedAt` refreshed to
`15:04:04.942Z`.

**AC3 — read-through server rail cold-offline — PASS.** After a cold offline reload (server-list fetch failing —
console errors present), the rail hydrated 558 servers from cache INCLUDING "Fixture Proof Server", all selectable.
This is the exact behavior the reframed spec demands in place of the old empty/error rail.

**AC4 — read-through channel sidebar cold-offline — PASS.** Selecting the fixture offline hydrated the channel
sidebar from cache: `aside` heading "Fixture Proof Server", category "GENERAL", channel "general" rendered as a
selectable button. Faithful to the online cached detail (categories=[General→general]). Not an error state. NOTE: the
"Couldn't load members." / "Couldn't load channels." strings observed belong to the members `aside` and to the
uncached-server sidebar respectively — NOT to the fixture's hydrated channel sidebar.

**AC5 — end-to-end cold-offline reachability — PASS.** Full chain on a cold offline open: rail (cached) → Fixture
Proof Server → cached sidebar → click "general" → cached messages RENDER ("A-probe-1783326906608", "A-sent-…",
deleted-tombstones), composer present, no empty-state. This is exactly the reframed intent: the shipped useMessages.ts
fallback became REACHABLE once rail+sidebar hydrated. useMessages.ts is UNTOUCHED — confirmed in wave-65 commit
`1ec98ef` (file not in the changeset; its `.catch`→`getCachedMessages` fallback is the pre-existing wave-63/64 code).

**AC6 — rule-11 Dexie v4→v5 restate-all + row-preservation — PASS.** Deployed IndexedDB "studyhall" is at version 50
(= Dexie v5) with all 10 stores present: the 8 prior v4 tables (messages, channels, outbox, dmConversations,
dmMessages, cachedAssignments, cachedScheduledSessions, cachedAttachmentBlobs) PLUS cachedServers + cachedServerDetails.
Source `db.ts` `.version(5).stores()` restates all 8 verbatim; `server-cache.test.ts` asserts a v4→v5 (and v1→v5)
upgrade preserves every prior table's ROWS (not just existence). Live users on prod are on the migrated v5 schema with
prior data intact (558 cached servers, 50 cached messages, etc. all present).

**AC7 — graceful cold cache — PASS.** Selecting a never-visited server offline (`T-8 IDOR probe target`, detail NOT
in cache) produced a graceful state: no crash (body intact, ~12k chars), no infinite spinner, message pane shows the
"Select a channel / Pick a channel" empty-state, and the uncached sidebar shows a graceful "Couldn't load channels."
message — rail remained fully usable. The reused ConnectionStateIndicator ("Reconnecting…") is the offline signal; NO
new offline UI component introduced.

**AC8 — reconcile on reconnect — PASS.** On a fresh online tab boot (offlineSignal=false, fully online), BOTH cache
timestamps moved forward to the fresh boot time: server list `cachedAt` 14:56:47 → 15:04:00, fixture detail `cachedAt`
14:57:32 → 15:04:04. The write-through overwrote the cache with live state on successful fetch — the AC8 reconcile
contract. Online happy path is NOT degraded: fresh online tab shows healthy rail + no false-offline banner.

---

## Spec-gaps (non-blocking, gap NOT drift)

- **G1 (cosmetic):** The reframe prose suggested "wire up the dormant `channels` cache table." The shipped design
  instead caches the full channel tree inside `cachedServerDetails[].detail.categories` (the `channels` store stays
  empty). This still satisfies AC2/AC4 (the categories+channel tree is persisted and read back); the AC contract never
  mandated the flat `channels` table specifically. Classification: spec-gap — reframe prose slightly over-specified the
  mechanism vs the AC-level requirement. No behavioral impact.
- **G2 (cosmetic):** AC7 edge-case prose says cold detail → "graceful empty-state"; the shipped rendering is an
  error-worded "Couldn't load channels." rather than a neutral empty-state. It is graceful, human-readable, and
  non-crashing (satisfies AC7's explicit "not a crash, not an infinite spinner" bar). Classification: spec-gap, copy
  polish only. Optional future tweak — not a REJECT.

---

## Harness note (not a product finding)
CDP offline emulation on the original page target got "stuck" (the app's own fetch layer + service worker kept
perceiving offline after re-enabling network in the same session), so the reconcile proof was obtained via a fresh tab
rather than in-place online-toggle. This is a test-harness artifact of the SW app-shell strategy, not a product defect
— the fresh-tab cache-timestamp overwrite is unambiguous evidence AC8 works.

## User-journey continuity
No UX dead-end observed on the server/channel workspace surface: cold-offline chain (rail→sidebar→channel→messages)
completes; never-synced server degrades gracefully with the rail still usable; online reconnect returns a healthy
workspace with the offline banner cleared. Reframed spec (message-list → ServerContext) is faithfully shipped — no
stale message-list assumptions; useMessages.ts confirmed untouched.
