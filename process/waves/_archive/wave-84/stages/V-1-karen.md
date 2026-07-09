# V-1 Karen — Source-claim verification (wave-84)

**Reviewer:** karen (Project Reality Manager)
**Scope:** Truth-of-claims for wave-84 LOAD-BEARING claims in merged `main` + deployed state. Spec-conformance is jenny's lane, not this report.
**Merged state:** `main` @ `30b3c6dd` (contains PR #103 `d1f99f9d` header transport + CSP, PR #104 `5cb5e789` Docker VITE threading + api build scoping).
**Deployed state:** web `web-production-bce1a8`, api `api-production-b93e`, core `supertokens-core` — verified live via curl this session.

## VERDICT: APPROVE

All 7 load-bearing claims VERIFIED against merged main + live deploy. No claimed-but-fake artifacts. No skipped/only'd tests. The one nominal discrepancy (test fixture LiveKit host vs prod env host) is correct-by-design, explained under Claim 4/6.

---

## Per-claim evidence

### Claim 1 — Explicit header transport on both sides — VERIFIED
- **api** `apps/api/src/auth/supertokens.config.ts:123` — `getTokenTransferMethod: () => 'header',` inside `Session.init({...})` (opens L108). Correct SDK shape: comment at L127-133 documents that supertokens-node@24.0.2 has NO `tokenTransferMethod` init option; the callback is the correct mechanism. TRUE.
- **web** `apps/web/src/auth/supertokens.ts:36` — `Session.init({ tokenTransferMethod: 'header' })`. This is the frontend side that actually selects the transport. TRUE.

### Claim 2 — Web CSP plugin — VERIFIED
- `apps/web/src/csp.ts` exists. `buildCsp()` (L105) constructs connect-src from `['self', api, wsOrigin, storageOrigin, livekitUrl, sentryOrigin]` (L130) and img-src from `['self','data:','blob:', api, storageOrigin]` (L138). wss origin derived from https api (L117-122).
- Fails prod build on empty VITE_API_ORIGIN: `cspMetaPlugin` L212-220 — `if (isProdBuild && !normaliseOrigin(apiOrigin)) throw new Error('CSP build error: VITE_API_ORIGIN is empty...')`. TRUE.

### Claim 3 — Dockerfiles thread VITE vars (PR #104 hotfix) — VERIFIED
- `apps/web/Dockerfile`: `ARG VITE_API_ORIGIN` / `ENV` (L22-23), `ARG VITE_STORAGE_ORIGIN` / `ENV` (L33-34), `ARG VITE_LIVEKIT_URL` / `ENV` (L35-36). All three threaded. Serve layer `serve -s apps/web/dist` (L47). TRUE.
- `apps/api/Dockerfile:23` — `RUN pnpm build --filter=@studyhall/api...` (trailing `...` selects api + workspace deps, NOT web). Comment L16-22 documents that this deliberately avoids invoking the web Vite build (which would hard-fail without VITE_API_ORIGIN). TRUE — this is exactly the PR #104 fix that unblocked the api image.

### Claim 4 — Deploy serves correct CSP LIVE — VERIFIED
`curl -fsS https://web-production-bce1a8.up.railway.app/` returns a `<meta http-equiv="Content-Security-Policy">` containing, verbatim:
```
connect-src 'self' https://api-production-b93e.up.railway.app wss://api-production-b93e.up.railway.app https://t3.storageapi.dev wss://claudomat-test-sgf9259q.livekit.cloud
img-src 'self' data: blob: https://api-production-b93e.up.railway.app https://t3.storageapi.dev
style-src ... https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
```
All required origins present: api https + api wss, `https://t3.storageapi.dev`, `wss://claudomat-test-sgf9259q.livekit.cloud`, fonts.googleapis.com + fonts.gstatic.com. The served build carries the real Railway env value for the LiveKit host — proving the ARG/ENV threading (Claim 3) actually took effect. TRUE.

### Claim 5 — api off stale code — VERIFIED
- `curl https://api-production-b93e.up.railway.app/health` → HTTP **200**.
- The served web CSP references the api origin over https+wss and the app is functional; C-2 records deployment at `5cb5e789` with core env confirmed. The stale-wave-83 issue is resolved per `process/waves/wave-84/stages/C-2-deploy-and-verify.md` (api+web+core @5cb5e789). Health-live + wave-84 web CSP served + C-block deploy record together substantiate the api is on wave-84 code. TRUE (as strongly as curl allows — commit id isn't curl-observable, per the claim's own caveat).

### Claim 6 — Tests real — VERIFIED
- `apps/web/src/csp.test.ts` — **21** `it()` blocks (exact). Imports the REAL builder: `import { buildCsp, cspMetaPlugin, sentryOriginFromDsn } from './csp';` (L22). Asserts api https+wss (L46-49), LiveKit wss (L57), Google Fonts style-src+font-src (L82-83), and the throw-on-empty guard (L169-176 `.toThrow(/VITE_API_ORIGIN is empty/)`). No `.skip`/`.only`/`xit`/`xdescribe`.
- `apps/api/src/auth/supertokens.config.spec.ts:57` — `it('sets getTokenTransferMethod returning "header"')` captures the config passed to `Session.init` and asserts `.toBe('header')` (L59-66). No `.skip`/`.only`.
- Fixture note: csp.test.ts uses `wss://studyhall.livekit.cloud` as its input fixture — this is CORRECT-by-design. The test proves the builder threads whatever LiveKit origin it's given; the LIVE deploy (Claim 4) supplies the real `claudomat-test-sgf9259q` host from Railway env. Test fixture and prod env are intentionally decoupled. TRUE.

### Claim 7 — Antipatterns / accessTokenValidity=900 is a CORE env, not SDK — VERIFIED
- `grep 'accessTokenValidity\s*:'` in supertokens.config.ts → **no key** (only the L127 documenting comment). The SDK config correctly does NOT (and per supertokens-node@24 cannot) set access-token validity. TRUE.
- The 900s TTL is documented as a deploy action and was actually applied: `C-2-deploy-and-verify.md:33` — `{service: supertokens-core (73ca977a), name: ACCESS_TOKEN_VALIDITY, value: "900", confirmed_via: variables-query}`; `blocks/ci-cd/review-artifacts.md:7` confirms it on the core service. B-2 carry-forward (`B-2-backend.md:5`) correctly flagged it as not-SDK-settable and routed it to C-block. No claimed-but-fake artifact found: every asserted control (header transport, CSP origins, throw-guard, TTL) has a real, matching implementation or a real deploy-side env record.

---

## Notes for V-2 triage
No REJECT-worthy findings. The wave's compensating-controls chain (header transport is the primary path → CSP is the XSS token-exfil compensating control → 900s core TTL shrinks the reuse window → refresh rotation on by default) is coherent and load-bearing-verified in both code and live deploy. Nothing to fix.
