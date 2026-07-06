# Wave 65 — T-5 E2E: LIVE cold-offline WORKSPACE hydration probe

**Layer:** T-5 (e2e / active probe — Pattern B)
**Executed by:** head-tester (live, Playwright MCP `mcp__playwright-4`)
**Target:** https://web-production-bce1a8.up.railway.app (prod, merge 1ec98ef)
**API base observed:** https://api-production-b93e.up.railway.app
**Fixture:** studyhall-e2e-fixture (already-authenticated session; `/login` redirected to `/app`)
**Fixture Proof Server:** `ad62cd12-b78e-4a85-a214-042cf176b16c` → category "General" → channel `general` (`93982063-4b70-4394-beaf-37168aef7098`)

## Result: PASS — cold-offline hydration verified end-to-end (live, not fallback)

The KEY behavior this wave fixes — a COLD reload while offline hydrating the whole
workspace from Dexie cache — was reproduced live and proven cache-driven by a
falsification contrast. The unit-evidence fallback was NOT needed.

### Step 1 — ONLINE: populate cache (write-through)
- IndexedDB `studyhall` at **schema v5 (IDB version 50)** with all 8 prior stores PLUS the two
  new v5 stores present: `cachedServers`, `cachedServerDetails` (alongside `messages`, `channels`,
  `outbox`, `dmConversations`, `dmMessages`, `cachedAssignments`, `cachedScheduledSessions`,
  `cachedAttachmentBlobs`).
- On page load, **write-through (server list) fired**: `cachedServers` = **558 rows**, all with a fresh
  `cachedAt: 2026-07-06T14:47:30.709Z` (matches the online `GET /servers` 200). FP server present in cache.
- Selecting FP (rail button `aria-label="Fixture Proof Server"`) fired **write-through (server detail)**:
  `cachedServerDetails` row for `ad62cd12` written, `cachedAt: 2026-07-06T14:48:34.777Z`, shape `{id, detail, cachedAt}`,
  `detail.categories = [{name:"General", channels:[{id:93982063…, name:"general"}]}]` (full channel tree cached).
- Selecting `general` channel loaded messages online; `messages` store = **201 rows** all for the general channel;
  33 rendered on screen at that scroll position.
- API base confirmed via network log: `GET /servers`, `/servers/:id`, `/servers/:id/members`,
  `/channels/:id/messages` all 200 online.

### Step 2 — OFFLINE (transport-level, proven)
- `page.context().setOffline(true)` set.
- **Proof of transport-down:** socket.io polling requests #34/#35 → **`[FAILED] net::ERR_INTERNET_DISCONNECTED`**;
  an in-page `fetch('https://api-production-b93e.up.railway.app/servers', {cache:'no-store'})` threw
  **`TypeError: Failed to fetch`**. The API is genuinely unreachable (not an HTTP-cache hit).

### Step 3 — COLD RELOAD while offline (the critical step)
- `page.reload()` with the network down; app re-initialized offline, stayed on `/app` (shell served from SW/disk cache).
- **READ-THROUGH (server rail):** rail hydrated from cache — `fpPresent: true`, full cached server list rendered
  (E2E servers, "T-8 IDOR probe target", Fixture Proof Server). Pre-wave-65 this rail would be empty (`status='error'`, empty list).
- **READ-THROUGH (channel sidebar):** selecting FP offline hydrated the channel tree from cached detail —
  category "General" + channel "general" rendered (desktop sidebar + mobile drawer). Offline signal present
  ("Reconnecting…" — the reused ConnectionStateIndicator, no new offline UI component).
- **END-TO-END reachability:** selecting the `general` channel offline rendered **155 cached messages**
  (`A-sent-*` content) — the already-shipped useMessages.ts fallback is now reachable because the rail + sidebar
  hydrated. The live `GET /channels/93982063…/messages` failed with `net::ERR_INTERNET_DISCONNECTED` in the console
  yet messages still rendered → sourced from cache, not network.
- No application crash: all 27 console errors are `net::ERR_INTERNET_DISCONNECTED` for network resources
  (favicon, icon-192, `/profile`, `/me`, `/servers`, socket.io, members, permissions, study-timer, messages) —
  expected offline noise, zero JS/render exceptions. Stale-response handling did not throw.

### Step 4 — FALSIFICATION CONTRAST (strong; proves cache-driven)
- Cleared `cachedServers` + `cachedServerDetails` + `messages` in IDB, stayed offline (`fetch /servers` → `TypeError: Failed to fetch`), cold-reloaded.
- Result: **empty/error workspace** — `fpPresent: false`, `serverRailCount: 0`, body shows
  "Failed to load" rail + "Select a server from the rail to view its channels." + "Reconnecting…" + "Pick a channel"
  graceful empty-states. This is exactly the pre-wave-65 broken behavior.
- The ONLY difference between the hydrated run (Step 3) and this empty run is the presence of the wave-65 Dexie cache rows
  → hydration is genuinely cache-driven, not network- or HTTP-cache-driven. Also confirms the graceful empty-state AC
  (no crash, no infinite spinner beyond the reconnecting indicator).

### Step 5 — RECONCILE on reconnect
- `setOffline(false)` + cold reload: write-through re-populated `cachedServers` = 558 rows, FP back in rail, **0 console errors**.
  (cachedServerDetails = 0 until a server is re-opened this session — correct, detail write-through is per-server-open.)

## a11y-as-query-contract note (non-blocking)
Server rail items expose proper `aria-label` (e.g. `"Fixture Proof Server"`, `"general channel, 50 unread mentions"`) —
role/label queries worked throughout the probe. The channel row inside the selected-server sidebar renders its name as a
`<span class="truncate">` inside a clickable button (button had no aria-label at offline-detail render in one query path).
Minor; the primary channel-list control does carry an aria-label. Not a gate-blocker; noted for a future T-5 a11y sweep.

## Screenshot
`process/waves/wave-65/.playwright-mcp/` / `wave65-cold-offline-hydrated.png` (viewport of the hydrated offline general channel).

## Verdict (T-5)
PASS. Cold-offline workspace hydration (rail → channel tree → messages) verified LIVE against prod, with a
transport-level offline proof and a decisive cleared-cache falsification contrast. IDB confirmed at v5 with both
new stores populated by write-through.

```yaml
t5_result: PASS
mode: live
idb_schema_version: 5           # IDB internal version 50
new_stores_present: [cachedServers, cachedServerDetails]
write_through_server_list: true   # 558 rows, fresh cachedAt
write_through_server_detail: true # ad62cd12 detail row w/ full channel tree
read_through_rail_cold_offline: true
read_through_sidebar_cold_offline: true
end_to_end_messages_hydrated: 155
transport_offline_proven: true    # net::ERR_INTERNET_DISCONNECTED + TypeError: Failed to fetch
falsification_contrast: cleared-cache+offline-reload -> empty "Failed to load" workspace
reconcile_on_reconnect: true
console_crashes: 0                # 27 errors all net::ERR_INTERNET_DISCONNECTED (expected offline)
fallback_to_unit_evidence: false
```
