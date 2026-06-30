# Wave 21 — V-2 Triage
## Fast-fix queue (1) — the L2 resume-test gap (the one genuine gap on the wedge's no-data-loss invariant)
| id | severity | summary | disposition |
|---|---|---|---|
| L2-resume-test | Low (test-completeness on a LOAD-BEARING invariant) | multiPageCatchup Test 5's name over-claims "mid-loop disconnect" but resolves both pages — the page-2-rejects → resume-from-page-1-cursor (no gap/no dup) path is proven by code+server-contract reasoning, NOT an executing test. The shipped no-data-loss IS executing-test-proven (MAX_ITERS partial-page preservation + cursor-outside-setState verified B-6) — but the resume invariant deserves a test. | **V-3 FAST-FIX** (frontend, <20 LOC): add a multiPageCatchup test where page-2 getMessagesAfter REJECTS → assert (a) page-1 rows persisted, (b) a 2nd reconnect resumes from page-1's last server cursor with NO gap + NO dup. Hardens the wedge metric. |
## Non-blocking (accepted / → future)
- M1 (Med, perf): catch-up while-loop re-entrancy → doubled reconnect round-trips (dedup-safe, correctness preserved). Fix = in-flight guard (wave-20 drain pattern). → accepted; opportunistic in a future M4 wave or with M3.
- M2 (Med): per-page write-through fire-and-forget (eventually-consistent; reload re-seeds). → accepted (downgrade the over-claiming comment or await — future).
- M3 (Med): window-online catch-up while socket reconnecting (dedup-safe; subsumed by M1's guard). → accepted.
- L1 (SSR default-online inert), L3 (socket.io manager-event listeners no-leak) → accepted.
- 9 biome warnings (4e994e96); 6 re-homed M3 tech-debt (M4 backlog); Playwright chrome-absent (67881a58).
```yaml
findings_blocking: []
fast_fix_queue: [L2-resume-test]
b_block_re_entry_required: []
```
