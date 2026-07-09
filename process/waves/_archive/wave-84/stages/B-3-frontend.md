# Wave 84 — B-3 Frontend (supertokens-integration)
```yaml
files: [apps/web/src/auth/supertokens.ts, apps/web/src/csp.ts (new), apps/web/vite.config.ts, apps/web/src/csp.test.ts (new), apps/web/src/auth/supertokens.test.ts (new)]
web_session_init: "tokenTransferMethod:'header' (valid on supertokens-auth-react@0.51.2; the frontend selects transport)."
csp: "build-time Vite transformIndexHtml plugin (apps/web/src/csp.ts) injects <meta http-equiv=CSP>; connect-src derived from VITE_API_ORIGIN (all envs, not prod-only)."
csp_policy_prod: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: <api>; connect-src 'self' https://api-production-b93e.up.railway.app wss://api-production-b93e.up.railway.app; worker-src 'self'; manifest-src 'self'; base-uri 'self'; object-src 'none'"
csp_rationale: "connect-src https+wss (REST/auth/Socket.IO 4 namespaces); Google Fonts allowlisted (jenny P-4, only external resource); style-src 'unsafe-inline' for React inline styles+Tailwind (no script exec risk); script-src 'self' NO unsafe-inline (injection-proof — the point); img-src data:/blob: for attachment previews + api avatars."
empirical_verify: "Playwright vs built app (serve -s dist): 0 CSP-violation console errors; #root hydrated; Geist font applied; self CSS + Google Fonts stylesheet loaded. (2 CORS errors were localhost-origin, proving connect-src PERMITTED the api, not CSP-blocked.)"
tests: "csp.test.ts (9) + supertokens.test.ts (2)"
```
