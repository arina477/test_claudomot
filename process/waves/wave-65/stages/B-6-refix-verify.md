# B-6 Refix Re-verification — wave-65 (offline workspace cache)

**Scope:** Bounded correctness fix-up of two `/review` High findings (Phase-1 B-6 gate already APPROVED). Fix commit `7b2f6a6`. Branch `wave-65-offline-workspace-cache`.

**Files changed by the fix (all 4 confirmed, no scope creep):**
- `apps/web/src/shell/ServerContext.tsx`
- `apps/web/src/features/sync/cache.ts`
- `apps/web/src/shell/ServerContext.test.tsx`
- `apps/web/src/features/sync/server-cache.test.ts`

`db.ts` (v5 schema), `types.ts`, and `useMessages.ts` were NOT touched by `7b2f6a6` (`db.ts` last modified by the Phase-1 feature commit `06e2fe1`). Confirmed via `git show --name-only`.

---

## Finding-by-finding verdict

### FIX 1 — Stale-response race (was High) — CLOSED
`getServerDetail` effect (`ServerContext.tsx:162–200`) now declares a per-run `let cancelled = false` and returns `() => { cancelled = true }`. Every state write in BOTH branches is guarded:
- `.then`: `if (cancelled || !mounted.current) return` before `setSelectedDetail` (line 177).
- `.catch`: guarded at entry (line 184) AND again after the async cache read await (line 188) — correct, because a state change can land during the `await getCachedServerDetail`.

Effect deps are `[selectedId]`. On srv-1 → srv-2 switch, React runs the srv-1 closure's cleanup (`cancelled=true` for that closure) BEFORE the srv-2 body; the srv-2 run gets a fresh `cancelled=false`. A late srv-1 resolution therefore hits `cancelled===true` and cannot overwrite srv-2's detail. Canonical React cancellation pattern, correctly applied.

No legitimate-write suppression: `cancelled` flips true only in cleanup, which runs only on unmount or a `selectedId` change — an in-flight request for the still-current server writes normally.

Test present and load-bearing (`ServerContext.test.tsx`, "stale-response cancellation"): deferred srv-1 promise, immediate switch to fast-resolving srv-2, release stale srv-1, asserts `selected-detail === "srv-2"`. Exercises the exact fixed scenario.

### FIX 2 — Atomic put+prune (was High) — CLOSED
`putCachedServers` (`cache.ts:321–345`) wraps bulkPut + prune-compute + both bulkDeletes in ONE `store.transaction('rw', store.cachedServers, store.cachedServerDetails, ...)`. Genuinely atomic — all mutations inside the single transaction, so concurrent write-throughs cannot interleave a read-then-prune against a stale snapshot. Uses `toCollection().primaryKeys()` (ids only), not `toArray()`. Stays best-effort: the whole tx is inside `try/catch {}` with no re-throw.
Atomicity test present ("two concurrent puts do NOT drop a server present in both lists"), seeds `srv-shared` then races `Promise.all([putA, putB])`, asserts `srv-shared` survives.

### FIX 3 — Cross-table prune — CLOSED
For left-server ids, the tx prunes BOTH `cachedServers.bulkDelete(toDelete)` AND `cachedServerDetails.bulkDelete(toDelete)` (lines 338–339). `cachedServerDetails` primary key is `'id'` = server id (`db.ts:47,193`; `putCachedServerDetail` keys rows by serverId), so `bulkDelete(toDelete)` by server-id list correctly targets the orphaned detail rows. Cross-table consistency holds. Test present ("pruning a left server also removes its cachedServerDetails row"): asserts `getCachedServerDetail('srv-2')` is `undefined` after srv-2 leaves.

### FIX 4 — appendServer write-through — CONFIRMED
`appendServer` reconcile `.then` (`ServerContext.tsx:250–257`) now calls `if (db) void putCachedServers(db, list)`, mirroring `fetchServers`. Test present ("calls putCachedServers in appendServer reconcile") clears the mount-fetch call, clicks append, asserts `putCachedServers` re-called.

### FIX 6 / FIX 7 — getCachedServers returns ServerSummary[] + offline invite auto-select — CONFIRMED
`getCachedServers` (`cache.ts:301–304`) strips `cachedAt` via destructure-rest, returns `ServerSummary[]`. `ServerSummary` imported from `@studyhall/shared` (cache.ts:14). Offline `.catch` path (`ServerContext.tsx:137–153`) consumes the typed `ServerSummary[]` and calls `applyPendingSelect(cached)` — invite auto-select now works offline. No type breakage (typecheck clean).

---

## Regression / green-state gate
- **Typecheck:** `tsc --noEmit` on @studyhall/web — EXIT 0.
- **Web test:** 37 files, **563 passed / 0 failed** (was 558; +5 targeted tests for the exact fixed scenarios). Socket.io `ECONNREFUSED` lines are unrelated presence-socket reconnect noise in the test env, not failures.
- **rule-11 v5 restate intact:** `db.ts` v5 `.stores({})` re-declares every prior-version store including `cachedServers`/`cachedServerDetails`; unchanged by the fix.
- **No new correctness issue introduced by the fixes:**
  - Transaction spans exactly the two tables it touches (no unrelated table pulled in) → no deadlock/scope surprise; best-effort try/catch preserved.
  - Cancelled flag does not suppress legitimate writes (analysis above).
  - No new scale infra, no schema change, no auto-migrate.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: B-6-refix-verify
  reviewers: { self-verify: head-builder }
  failed_checks: []
  rationale: >
    Both High findings are genuinely closed at the source, not merely test-green.
    FIX 1 applies the canonical per-run cancellation pattern guarding every state
    write in both the online and offline detail branches, with the cleanup firing
    on selectedId change so a stale prior-server resolution cannot overwrite the
    current detail. FIX 2/3 wrap put+prune+cross-table-delete in one rw transaction
    over cachedServers+cachedServerDetails, atomic and best-effort, using
    primaryKeys() and pruning orphaned detail rows by their server-id primary key.
    FIX 4/6/7 confirmed (appendServer write-through, ServerSummary[] return with
    cachedAt stripped, offline invite auto-select) with no type breakage. Scope is
    exactly the 2 production files + their tests; db.ts v5 schema and rule-11 restate
    untouched. Typecheck 0, web test 563/0 (+5 targeted tests covering the fixed
    scenarios). No regression and no new correctness issue introduced by the fixes.
  next_action: PROCEED_TO_C-1
```
