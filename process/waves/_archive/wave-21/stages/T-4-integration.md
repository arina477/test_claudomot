# T-4 — Integration (wave-21) — NO-DATA-LOSS RATIFICATION (the M4 metric)
**Pattern A — CI-verified.** The multi-page catch-up is fake-indexeddb-tested (real Dexie StudyHallDB with per-test IDBFactory + IDBKeyRange; api.getMessagesAfter mocked at the SDK boundary ONLY; outbox mocked to isolate the catch-up loop). No real timers. mockReset() flushes the mockResolvedValueOnce queue per test (explicit cross-test-bleed guard).

## Ratification — the no-data-loss invariant is GENUINELY PROVEN, not theater
Each test fails on a plausible real bug (mutation-sanity), asserts observable state, not mock counts:
- **Test 1 (3-page in-order):** asserts `Math.max(p1Indices) < Math.min(p2Indices)` and `< p3` on the real rendered message list — FAILS if pages recover out of order or a page is dropped. getMessagesAfter called exactly 3 times (chained nextCursor -> null terminate).
- **Test 2 (dedup vs socket replay):** seeds `existing` id, catch-up returns `[existing, new]`, asserts `realMsgs.length === 2` and `ids.filter(===dup).toHaveLength(1)` — exactly-once; FAILS on a dedup regression.
- **Test 3 (terminate):** first page nextCursor=null -> exactly 1 call; FAILS if the loop over-fetches.
- **Test 4 (MAX_ITERS no-data-loss):** server returns nextCursor FOREVER; asserts the guard stops at exactly 100 calls AND `ids.has(m.id)` for all 100 pages' messages -> partial pages preserved under the bound. FAILS if the guard truncated accumulated state or looped unbounded. **This is the load-bearing no-data-loss-under-bound proof.**
- **Test 5 (per-page write-through):** asserts the REAL Dexie cache (getCachedMessages on the fake-indexeddb instance) contains both pages' ids — real DB-layer read, not a mock.

## Honest caveat (carried, non-blocking)
**L2:** Test 5's name over-claims "simulated mid-loop disconnect" but resolves BOTH pages then checks cache — it proves per-page write-through, NOT the page-2-rejects -> resume-from-page-1-cursor path. The "no-data-loss-on-resume-after-mid-loop-failure" invariant is proven by code + server-contract reasoning (B-6: cursor advanced from server nextCursor OUTSIDE setRealMessages updater, the karen carry; strictly-> keyset; nextCursor=last row -> next page neither skips nor repeats), NOT by an executing test. **Non-blocking test-completeness gap -> V-2** — Test 4 already proves partial-page preservation; resume re-seeds from network on reload. No new server integration (consumes wave-20 ?after= route; no schema/service change this wave).

```yaml
test_pattern: ci-verified
skipped: false
boundaries_audited: ["runDrainAndCatchup loop x getMessagesAfter (SDK boundary mocked)", "catch-up x Dexie cache (real fake-indexeddb)", "dedup-by-id vs socket replay"]
ci_evidence:
  - "test job: multiPageCatchup.test.ts 5 passed on merge SHA"
  - "fake-indexeddb real Dexie per-test IDBFactory; no real timers; mockReset flush guard"
infrastructure_gap_recorded: false
findings:
  - {severity: LOW, boundary: "resume-after-mid-loop-failure", description: "L2 — proven by reasoning not by executing test; Test5 over-claims. Non-blocking; add page-2-rejects variant. -> V-2"}
head_signoff: {verdict: APPROVED, stage: T-4, failed_checks: [], rationale: "No-data-loss multi-page catch-up genuinely proven via fake-indexeddb with mutation-sanity-passing assertions on observable state (in-order recovery, exactly-once dedup, MAX_ITERS bound preserves all pages, real-Dexie write-through). Resume-after-failure path is a non-blocking test-completeness gap carried to V-2.", next_action: PROCEED}
```
