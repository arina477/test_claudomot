# Wave 84 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn)
**Reviewed against:** process/waves/wave-84/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale

Fresh independent review — SDK claims verified against installed types, CSP verified against the real built `index.html`, full suite re-run locally. The wave delivers exactly what BOARD Option B mandated (keep header transport + compensating controls) and nothing more; "config-only" is accurate (diff is `supertokens.config.ts`, `supertokens.ts`, `csp.ts` (new), `vite.config.ts` + their three test files + wave docs — no schema, no deps, no runtime logic surface). Every load-bearing claim B-2/B-3 made holds up under verification:

**1. SDK-reality handling — CORRECT, not a cop-out.** Verified against `supertokens-node@24.0.2` `lib/build/recipe/session/types.d.ts`:
- `getTokenTransferMethod?: (input) => TokenTransferMethod | "any"` IS the v24 backend API for pinning transport. `() => 'header'` is a valid, correctly-typed use — it forces header transport on the server regardless of what the client sends. B-2's claim that v24 has NO `tokenTransferMethod` *init option* is TRUE — the `TypeInput` block (lines 40–64) has no such key; the callback is the mechanism.
- `accessTokenValidity` is genuinely ABSENT from `TypeInput` — confirmed by full grep of the session types. It is a SuperTokens CORE setting (`ACCESS_TOKEN_VALIDITY` env var on the core service), so deferring TTL=900 to a C-block core-env action is the CORRECT place, not a dodge. The code comment (`supertokens.config.ts:125-134`) documents the coupling so the two don't drift.
- Web-side `tokenTransferMethod: 'header'` is VALID on `supertokens-auth-react@0.51.2` — the option flows `supertokens-website@20.1.6` `types.d.ts:42` (`tokenTransferMethod?: "cookie" | "header"`) → web-js `UserInput` → auth-react `InputType`. The frontend is the side that *selects* transport; server + client are now both explicitly pinned to header. Coherent.

**2. Refresh rotation — fair, honestly scoped.** B-2 asserts rotation is core-default-on (single-use + reuse detection) and DOCUMENTED, not coded. This is accurate SuperTokens behavior and appropriately scoped: the repo adds no override that disables it (verified — the `override.functions` block only wraps `getSession`/`refreshSession` for the deleted-account check, carried from a prior wave; it does not touch rotation). It's an SDK-behavior assertion that can't be self-proven from repo code, and the pipeline (P-4 karen, AC3) already flagged it as assert-and-document — B-block did exactly that. No fabrication.

**3. CSP — verified against the real built artifact.** Built the app and inspected the emitted `<meta http-equiv="Content-Security-Policy">` in `dist/index.html`; it matches `buildCsp()` exactly. All required guarantees hold and are asserted by `csp.test.ts` (9 tests, all real assertions on `buildCsp` output):
- `connect-src` includes the api origin over BOTH `https://` AND `wss://` (derived from `VITE_API_ORIGIN`, http→ws / https→wss) — the 4 Socket.IO namespaces will connect. Asserted.
- Google Fonts allowlisted: `style-src ... https://fonts.googleapis.com` + `font-src ... https://fonts.gstatic.com`. Asserted.
- `script-src 'self'` with NO `'unsafe-inline'` — the anti-injection core. Asserted (both positive `'self'` and negative `not.toContain('unsafe-inline')`). **Verified safe against the real build:** `dist/index.html` contains only TWO external same-origin scripts (`/assets/index-*.js`, `/registerSW.js`) and ZERO inline script bodies — so strict script-src does NOT break the SPA or the PWA SW registration.
- `style-src 'unsafe-inline'` justified (React inline `style={{}}` + Tailwind runtime `<style>`; no script-execution risk). Correct trade-off.
- `connect-src` derived from `VITE_API_ORIGIN` (not prod-hardcoded) — dev/prod/self-only fallbacks all covered and tested.

**4. SPA / cross-origin / WS break risk — LOW; T-8 live proof likely to pass.** Directive completeness checked directly: `worker-src 'self'` present + SW is same-origin (`/registerSW.js`→`/sw.js`, no inline/blob worker anywhere in `apps/web/src`), `manifest-src 'self'` present for the PWA manifest, `img-src` includes `data:` + `blob:` (attachment previews via `URL.createObjectURL`) + api origin (avatars), `object-src 'none'` / `base-uri 'self'` locked. No obvious directive gap. The one residual is inherent to meta-tag CSP (no `frame-ancestors`/`report-uri`) — correctly out of scope (helmet on the api handles framing; app isn't framed). B-3's empirical-verification claim (0 CSP-violation console errors on `serve -s dist`) is credible and consistent with what I independently observe in the built artifact.

**5. Tests honest.** No `.skip`/`.only` in the wave-84 test files. All three files assert real config: api spec captures the actual `Session.init` arg and invokes `getTokenTransferMethod` to prove it returns `'header'`; web test asserts `tokenTransferMethod:'header'` on the real `initSuperTokens`; csp tests assert `buildCsp` output. Mocks are of the SDK boundary (correct for unit layer), not of the system-under-test.

**Suite (run locally, this review):** api `pnpm --filter @studyhall/api test` → 821 passed. web `pnpm --filter @studyhall/web test` → 773 passed on a clean run (one full-suite run flaked on `src/shell/assignments.test.tsx > reverts optimistic update if PUT fails` — a pre-existing socket-timing flake NOT in the wave-84 diff; passes 25/25 in isolation and 773/773 on re-run). web build → OK (PWA generated). `tsc --noEmit` web + api → clean. `pnpm biome ci apps packages` → 408 files, no fixes. All green.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
