# Wave 84 — P-3 Plan

## Approach

### Architecture deltas
- **apps/api/src/auth/supertokens.config.ts (Session.init ~:108):** add `tokenTransferMethod: 'header'` (make the accepted cross-origin posture explicit, not the 'any' default) + `accessTokenValidity: 900` (15min short window — shrinks the XSS token-reuse window; SuperTokens default is 3600s). Refresh rotation is SuperTokens-default-on (sliding-window, rotates on use) — VERIFY + document, add no override that disables it. Trivial config, low risk.
- **apps/web/src/auth/supertokens.ts (Session.init ~:27):** add `tokenTransferMethod: 'header'`. Trivial.
- **Web-app CSP (the LOAD-BEARING/risky delta):** add an explicit cross-origin-safe CSP to the WEB app (the HTML document — CSP is an XSS control on the document, NOT on the api's JSON). The web app is served by `vite preview` (apps/web/Dockerfile). 
  - **Placement — alternative considered:** (a) `<meta http-equiv="Content-Security-Policy">` in apps/web/index.html — simplest, covers the XSS-relevant directives (default-src, script-src, style-src, connect-src, img-src, font-src); cannot set frame-ancestors/report-uri (not needed for the XSS-exfil goal). (b) a response header via a serving-layer tweak (vite preview headers / a small static server in the Dockerfile) — needed only if frame-ancestors/report-uri are wanted. **Choose (a) meta tag** unless B-block finds a directive it can't express; frame-ancestors is already covered by the api's X-Frame-Options (wave-83) + the app isn't framed.
  - **connect-src (critical):** MUST include the api origin over BOTH `https://api-production-b93e.up.railway.app` AND `wss://api-production-b93e.up.railway.app` (Socket.IO) — parameterized by VITE_API_ORIGIN so non-prod envs work, OR document prod-scope. Missing wss → the 4 WS namespaces break.
  - **script-src/style-src:** derive EMPIRICALLY against the built SPA — Vite prod builds emit hashed asset files (script-src 'self' usually suffices) but Tailwind/Vite may inject inline styles needing style-src 'unsafe-inline' (or hashes/nonces). B-block must build + test, not guess.
- **Failure domain:** the CSP is the only real risk — an over-strict policy blanks the SPA or blocks the cross-origin fetch/WS. Mitigated by empirical derivation + the T-8 live proof (0 CSP-violation console errors + fetch + 4 WS namespaces).

### Data model / API contracts
None. No endpoint/schema/type change. SuperTokens Session.init options only + a CSP meta/header.

### New deps
None (SuperTokens present; CSP is config/markup).

### SDK pre-build checklist (SuperTokens)
B-block verifies against installed supertokens-node/supertokens-auth-react: the exact `tokenTransferMethod` + `accessTokenValidity` option names/locations on Session.init; confirm accessTokenValidity is in SECONDS; confirm refresh rotation default + how to assert it. Do not code against assumed API.

## Plan

### File-level steps
**B-0:** branch `wave-84-token-xss-hardening`; no deps, no schema.
**B-2 Backend:**
- `apps/api/src/auth/supertokens.config.ts` — modify Session.init: tokenTransferMethod:'header' + accessTokenValidity:900. **Specialist: supertokens-integration.**
**B-3 Frontend:**
- `apps/web/src/auth/supertokens.ts` — modify Session.init: tokenTransferMethod:'header'. **supertokens-integration.**
- `apps/web/index.html` (+ possibly vite.config.ts / Dockerfile if header route chosen) — add the cross-origin-safe CSP; derive minimal policy empirically vs the built SPA; connect-src includes api https + wss. **supertokens-integration** (owns the cross-origin auth flow + knows the connect-src origins; consult react-specialist if the Vite/CSP inline-style interaction needs it).
- Tests: assert the CSP content (meta present + connect-src includes api https+wss) + the Session.init options set. **supertokens-integration.**
**B-5 Verify:** CI-identical (lint, typecheck, full test, build, boot-probe). The web build MUST succeed with the CSP (a broken meta tag won't fail the build — T-8 catches runtime CSP violations, but B-5 should at least serve the built app locally + check console if feasible).

### Specialist routing (validated vs AGENTS.md)
- **supertokens-integration** — Session.init both sides + the cross-origin CSP connect-src (owns the auth transport + cross-origin flow; used wave-82/83). Exists in AGENTS.md.
- react-specialist — consult only if Vite/CSP inline-style/nonce work is non-trivial. Exists in AGENTS.md.

### Parallelization map
- api Session.init (B-2) + web Session.init (B-3) are independent config edits. The CSP is the serial/careful piece (derive → test). One specialist does the coherent set; CSP tested last.

### Self-consistency sweep
1. All 6 ACs → steps: AC1 → both Session.init edits; AC2 → api accessTokenValidity; AC3 → verify rotation (documented); AC4 → web CSP; AC5 → T-8 live proof (CSP+fetch+WS); AC6 → the bundle. ✓
2. Every step has a specialist. ✓
3. No file in multiple parallel batches. ✓
4. design_gap_flag false referenced. ✓
5. Architecture deltas have alternatives (meta vs header CSP; TTL value). ✓
6. Contracts concrete, no TBD (connect-src origins named; TTL 900s). ✓
7. No new deps. ✓
8. SDK checklist present (verify Session.init option names + accessTokenValidity units + rotation default). ✓
Sweep clean.
