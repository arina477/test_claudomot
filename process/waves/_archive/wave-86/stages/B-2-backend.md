# Wave 86 — B-2 Backend (supertokens-integration)
```yaml
files: [apps/api/src/auth/supertokens.config.ts (antiCsrf:'NONE' + ~52-line doc), apps/api/src/common/ws-auth.ts (+3-line cross-ref), apps/api/test/integration/csrf-posture.spec.ts (new, DB-free)]
anticsrf_value: "'NONE' — VERIFIED correct against supertokens-node@24.0.2 source: in header mode getAccessTokenFromRequest reads ONLY the Authorization header, a cookie-only request yields accessToken=undefined -> UNAUTHORISED before any core call; doAntiCsrfCheck force-false for header transport; antiCsrf never consulted. NONE is non-weakening + legible."
via_custom_header_footgun: "VERIFIED: getSession THROWS if run with antiCsrf VIA_CUSTOM_HEADER + antiCsrfCheck!==false — dangerous on a future cookie migration. VIA_TOKEN (seed's ask) is cookie-mode/inert/misleading. NONE chosen."
doc: "why header transport is structurally CSRF-safe; why NONE not VIA_TOKEN/VIA_CUSTOM_HEADER (SDK-verified reasons); wave-84 header-transport + pre-GA cookie-migration-trigger cross-ref; 'do NOT fix back to VIA_TOKEN' note; WS residual-cookie note."
regression_test: "DB-free/core-free — inits the REAL Session recipe with prod config (getTokenTransferMethod header, antiCsrf NONE) + drives REAL Session.getSession() with hand-built requests: (1) cookie-only forged POST -> throws UNAUTHORISED [THE GUARD]; (2) cookie-only sessionRequired:false -> undefined; (3) legit bearer -> clears transport gate (distinct TRY_REFRESH_TOKEN, not transport rejection) proving header path unregressed."
results: "csrf-posture 3/3; api unit 821 (48 files); tsc clean; biome clean"
commit: 85b270de
deviations: "DB integration specs fail on ECONNREFUSED :5433 (pre-existing, unrelated; new spec DB-free). AC3 asserted at transport-parse layer (plan-permitted DB-free); T-8 verifies live forged-POST + explicit value on deployed api."
```
