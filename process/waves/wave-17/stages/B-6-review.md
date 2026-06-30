# Wave 17 — B-6 Review
```yaml
phase1_head_builder_verdict: APPROVED   # NOTE: code-read APPROVE; Phase-2 empirical /review caught real defects it missed
phase2_review_invocations: 2
findings_critical: []   # C1 (db Proxy unspyable → mid-txn case errored at setup, proved nothing) FIXED (03542b2) + re-confirmed
findings_high: []       # H1 (base vitest also globbed integration, no singleFork) + H2 (generateCode intra-module spy no-op → first-insert never failed) FIXED + re-confirmed
findings_medium_accepted:
  - "M1 CF-2 DATABASE_URL override no NODE_ENV/VITEST guard (safe — nest build excludes test/)"
  - "M2 integration config omits reflect-metadata (safe — spec bypasses Nest DI)"
findings_low_accepted: [L1 dup 0004 migration prefix (journal preserves order), L2 harnessDb only used for migrate, L3 countRows table interpolation (literals only)]
fix_up_commits:
  - "03542b2 wrapPoolConnect pool-query fault injection (real Pool, settable) replacing the broken db.transaction + generateCode spies; exclude integration from base vitest"
final_verdict: APPROVE
```
- Phase 1 head-builder APPROVED by CODE-READING — but the test was non-functional as written (C1: db is a get-only Proxy so vi.spyOn threw at setup; H2: generateCode is a bare intra-module call so the spy was a no-op). The local skip (no DATABASE_URL_TEST) HID this; only Phase-2 /review's EMPIRICAL reproduction + a REAL Postgres run caught it. **LESSON (L-2 candidate): a test's honesty can't be gated by reading it — it must be RUN; integration tests that skip locally need a real DB run before a gate APPROVE.**
- Fix: pool-query fault injection (wrapPoolConnect wraps the REAL pg.Pool — settable, the same pool drizzle uses — so the fault throws inside the real open transaction → real Postgres ROLLBACK; no-orphan asserted via a separate harness pool = true cross-connection check). Verified with a REAL Postgres 15.17 run: 3/3 integration green + 295 full test:ci.
- Re-ran B-4/B-5: typecheck 4/4, lint 0-errors, 292 unit + integration (CI). Re-review: 0 Critical/High.
