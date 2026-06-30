# Wave 17 — V-1 Summary
- **Karen APPROVE** — 5/5 VERIFIED. The test is genuinely real: the fault is injected on the SAME Pool singleton (db/index.ts:37 exports pool; getDb builds drizzle over getPool) that createServer's real db.transaction uses → wrapPoolConnect patches that pool's connect → query throws on the 5th/1st INSERT inside the real open txn → real Postgres ROLLBACK; zero-orphan asserted via a SEPARATE harnessPool (cross-connection commit-visibility). Sidesteps both prior /review defects (db Proxy unspyable, generateCode intra-module no-op) — pool.connect is writable + module-boundary-agnostic. CF-2 redirect correct. Ran 3/3 in CI (turbo.json env DATABASE_URL_TEST passthrough after the false-green fix b0d8d22). No gold-plating.
- **jenny APPROVE** — 5/5 ACs MATCH, no drift. Real txn (not stub); mid-txn failure on insert #5 → 0 orphans across all 5 tables (cross-connection); positive commits all 5; real migrations applied fail-loud; isolated/serial/anti-flake/skip-visible. Single create-server rollback (no balloon into owner-lockout / 02fa8011 tier); pure test-infra, no M3 feature. Pool-query fault = the spec's "acceptable alternative", intent preserved. (Non-blocking: SUT docstring servers.service.ts:64-66 omits the roles insert — cosmetic comment drift, out of scope.)
```yaml
karen_verdict: APPROVE
jenny_verdict: APPROVE
findings: []   # 0 blocking
```
