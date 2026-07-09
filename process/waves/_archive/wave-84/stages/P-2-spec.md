# Wave 84 — P-2 Spec (pointer)
**Source of truth:** task 9535895f description (YAML head + prose). spec-id wave-84-spec · single-spec · design_gap_flag false · BOARD Option B.
## ACs (copy)
1. tokenTransferMethod:'header' explicit on BOTH Session.init (api supertokens.config.ts:108 + web supertokens.ts:27).
2. api accessTokenValidity SHORT (<=900s; pick+document); signin/refresh still works.
3. Refresh rotation confirmed enforced (assert, not assume).
4. Explicit cross-origin-safe CSP on the WEB app; connect-src allows api origin over https AND wss.
5. LOAD-BEARING: web app loads with 0 CSP-violation console errors + cross-origin fetch works + all 4 Socket.IO WS namespaces connect (T-8 proves live).
6. XSS surface shrunk (not eliminated) by CSP + short TTL + rotation.
CSP is the risky centerpiece — B-block derives the MINIMAL working policy empirically vs the real built SPA.
