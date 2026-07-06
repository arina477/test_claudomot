# V-1 Karen — wave-65 reality check

**Reviewer:** Karen (fresh spawn, V-1)
**Wave:** 65 — offline cache for server list + channel tree (cold-offline workspace hydration)
**Merge commit:** `1ec98ef` on main (PR #80 squash-merge; 6/6 required checks green)
**Deployed web:** https://web-production-bce1a8.up.railway.app — HTTP 200 at `/` and `/health` (probed this run)
**Scope of review:** load-bearing CLAIM truth in the merged/deployed state. Spec conformance is jenny's lane (not evaluated here).
**Note:** this wave was P-0 REFRAMED (the message-list premise was false-absent; the fix relocated to `ServerContext`). The reframe was verified at P-4; I verified the SHIPPED implementation against the merge commit.

## Verdict: APPROVE

All 7 load-bearing claims hold against the files read at merge commit `1ec98ef`. No claimed-but-fake, no decorative tests, no wrong-line-number findings. One notable divergence from the B-6 gate-verdict's accepted-debt is in the SHIPPED code's FAVOR (see finding 4 note).

---

## Findings (per claim)

### 1. Dexie v5 substrate — CONFIRMED (highest-value claim)
`apps/web/src/features/sync/db.ts:183` — `this.version(5).stores({...})` restates all 8 prior v4 tables VERBATIM (`db.ts:184-191`: messages, channels, outbox, dmConversations, dmMessages, cachedAssignments, cachedScheduledSessions, cachedAttachmentBlobs) and appends `cachedServers: 'id'` (`db.ts:192`) + `cachedServerDetails: 'id'` (`db.ts:193`).
Rule-11 check (omitted table = silent drop): the v4 block at `db.ts:158-167` is unaltered; each of the first 8 store lines in v5 (`db.ts:184-191`) is character-identical to the v4 lines (`db.ts:159-166`). Entity-table decls added at `db.ts:46-47`. No prior table dropped. **Evidence: read of `db.ts` at 1ec98ef + independent byte comparison of the v4/v5 store blocks.**

### 2. Types — CONFIRMED
`apps/web/src/features/sync/types.ts:106` — `CachedServer = ServerSummary & { cachedAt: string }` (ServerSummary + cachedAt).
`types.ts:119-126` — `CachedServerDetail = { id: string; detail: ServerDetail; cachedAt: string }` — the wrapper form, because `ServerDetail` (`{server, categories}`) carries no top-level `id`; the comment at `types.ts:111-118` states `id` matches `detail.server.id`. Matches the claim exactly.

### 3. Cache helpers — CONFIRMED (atomicity + cross-table prune verified)
`apps/web/src/features/sync/cache.ts:301` — `getCachedServers` returns `ServerSummary[]`, strips `cachedAt`, and returns `[]` on a cold cache (`cache.ts:302-303`, no throw).
`cache.ts:321` — `putCachedServers` runs an atomic `store.transaction('rw', store.cachedServers, store.cachedServerDetails, ...)` (`cache.ts:330`) containing `bulkPut(rows)` (`cache.ts:331`) + a `primaryKeys()`-based prune (`cache.ts:334`) that deletes stale ids from BOTH tables (`cache.ts:344` cachedServers, `cache.ts:345` cachedServerDetails). Transaction is genuinely atomic (put + prune-compute + delete all inside the one `rw` boundary) and prunes both tables — as claimed.
`cache.ts:353` `getCachedServerDetail` (`.get(serverId)`, undefined on cold) + `cache.ts:366` `putCachedServerDetail` (wraps detail in `{id, detail, cachedAt}`) present. Both helpers are best-effort (try/catch, never throw into caller).

### 4. ServerContext read-through — CONFIRMED
`apps/web/src/shell/ServerContext.tsx`:
- fetchServers write-through on success: `ServerContext.tsx:133` (`void putCachedServers(db, list)`).
- fetchServers read-through in `.catch`: `ServerContext.tsx:137-153` — hydrates from `getCachedServers`, `setServers(cached)` + `setStatus('loaded')` only when `cached.length > 0` (`ServerContext.tsx:144-150`); falls to `setStatus('error')` when empty (`ServerContext.tsx:152`).
- getServerDetail effect write-through: `ServerContext.tsx:181`; read-through in `.catch`: `ServerContext.tsx:183-196` (hydrates `setSelectedDetail(cached.detail)` + `setDetailStatus('loaded')` when present).
- per-run `cancelled` flag: declared `ServerContext.tsx:172`, checked in `.then` (`:177`) and `.catch` (`:184`, `:188`), set true in the effect cleanup (`ServerContext.tsx:197-199`) — the stale-response guard, present in BOTH branches as claimed.
- appendServer reconcile calls putCachedServers: `ServerContext.tsx:256`.

**Note (in the shipped code's favor):** the B-6 gate-verdict lists "`appendServer` background reconciliation lacks write-through" as accepted-debt. That debt is CLOSED in the merged commit — `ServerContext.tsx:256` calls `putCachedServers(db, list)` inside appendServer's reconcile `.then`. The claim is satisfied by the shipped code; the gate-verdict prose is stale relative to the B-6 fix commit that landed it.

### 5. useMessages.ts UNTOUCHED — CONFIRMED
`git show --name-only 1ec98ef` does not list `apps/web/src/shell/useMessages.ts`. `git log -1 -- apps/web/src/shell/useMessages.ts` → `65b92fb` (PR #73), a prior wave — not wave-65. File still exists at 1ec98ef. Untouched by this wave, as claimed.

### 6. Tests real, not decorative — CONFIRMED
`apps/web/src/features/sync/server-cache.test.ts`:
- v4→v5 ROW preservation: `server-cache.test.ts:324` seeds one row into each of the 8 prior tables on a v4-shaped DB, closes db1 (`:425`), reopens db2 on the SAME injected IDBFactory (`:428`), and asserts field-level ROW content survives — not table existence: `channel.name` (`:434`), `message.content` (`:439`), `outbox.state`+`content` (`:449-450`), `dmConv.isGroup` (`:454`), `dmMsg.content` (`:460`), `asgn.title` (`:465`), `sess.title`+`windowKey` (`:470-471`), `blob.filename` (`:476`). New v5 tables asserted present + empty (`:479-482`).
- full v1→v5 upgrade: `server-cache.test.ts:488` seeds v1/v2/v3 rows, reopens at v5, writes to the new tables, asserts prior rows unchanged + v5 rows readable.
- atomicity (concurrent puts don't drop a shared server): `server-cache.test.ts:188` fires `Promise.all([putCachedServers(A), putCachedServers(B)])` and asserts `srv-shared` is never pruned (`:210`, `:213`).
- cross-table prune: `server-cache.test.ts:230` asserts a left server's `cachedServerDetails` row is removed (`:252` `toBeUndefined`).

`apps/web/src/shell/ServerContext.test.tsx`:
- offline hydration (list): `ServerContext.test.tsx:135` — getServers rejects, cache seeded → status `loaded` + server-count 2.
- offline hydration (detail): `ServerContext.test.tsx:178` — detail rejects → detailStatus `loaded`, selected-detail `"srv-1"`.
- stale-response cancellation: `ServerContext.test.tsx:374` — deferred srv-1 promise, select srv-1, switch to srv-2 (resolves fast), THEN release stale srv-1, assert `selected-detail` still `"srv-2"` (`:431`). This is a genuine race test that fails without the `cancelled` guard — not decorative.

**Independent execution this run:** `npx vitest run` on both files → **24/24 pass** (15 server-cache + 9 ServerContext). The `act(...)` stderr lines are environment warnings, not failures.

### 7. Deploy hash + no api change — CONFIRMED
`git show --name-only 1ec98ef` contains NO `apps/api/**` files (grep returns empty) — consistent with the claim that only the web service was redeployed and api was NOT. Deployed web probed this run: HTTP 200 at both `/` and `/health`. Trusting C-2's SUCCESS@1ec98ef per brief allowance, corroborated by the live 200s. Only apps/web source changed (6 files: cache.ts, db.ts, types.ts, ServerContext.tsx + 2 test files) plus docs/process.

---

## Antipattern sweep
- **Claimed-but-fake:** none. Every claimed function/table exists with the claimed behavior at the claimed lines.
- **Decorative tests:** none. The upgrade test asserts row-level field content (not table existence); the stale-response and atomicity tests exercise real races that would fail without the guards under review.
- **Wrong line numbers:** none material. All claim line references land on the described code.
- **Silent-drop (rule 11):** clean — v4 block byte-preserved in v5.

## Footer
- verdict: APPROVE
- claims_verified: 7 / 7
- tests_run_independently: 24/24 pass
- deploy_probe: HTTP 200 (`/`, `/health`)
