# Wave 7 — T-block findings (→ V-2/L)
1. (T-4, significant) txn rollback-on-failure asserted via mocked db.transaction — needs a real-Postgres mid-txn-failure test.
2. (T-5, significant) new authed create-server flow has NO browser E2E (Playwright covers / + /login only) — covered by component tests + live C-2 probe.
3. (T-6, info) no visual-regression baseline for rail/sidebar/modal.
4. (T-8/L, info) no persistent VERIFIED prod test fixture (C-2 used SuperTokens core admin API).
5. (T-8, info) no per-user server-creation rate-limit (session+verify gated).
