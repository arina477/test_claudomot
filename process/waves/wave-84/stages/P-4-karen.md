# P-4 Phase-2 — Karen Claim Verification (wave-84)

**Wave:** Session-token XSS-hardening (BOARD Option B — keep header transport + compensating controls)
**Spec:** task `9535895f` description | **Plan:** `process/waves/wave-84/stages/P-3-plan.md`
**Method:** Read/Grep the actual codebase; each load-bearing SPEC/PLAN claim marked VERIFIED / UNVERIFIED / WRONG with file:line.

---

## VERDICT: APPROVE — with one WRONG-but-non-blocking documentation defect (serving layer)

All load-bearing *technical* claims that the wave's correctness depends on are VERIFIED. The single WRONG claim ("served via `vite preview`") is a stale mislabel of the serving mechanism; it does **not** invalidate the approach (CSP placement is meta-tag OR serving-layer per spec, and the spec explicitly leaves placement to B-block). It MUST be corrected before B-block acts on it, because the plan's placement-alternative (b) names the wrong serving layer. Flagged High, not blocking the gate.

---

## Per-claim findings

### Claim 1 — api Session.init does NOT set tokenTransferMethod or accessTokenValidity
**VERIFIED.** `apps/api/src/auth/supertokens.config.ts:108` `Session.init({...})` sets only `cookieSameSite` (`:119`), `cookieSecure` (`:123`), and an `override` block for `getSession`/`refreshSession` (`:144-186`). No `tokenTransferMethod` key, no `accessTokenValidity` key anywhere in the file (grep-confirmed absent). The gap the wave fills is real.

### Claim 2 — web Session.init is bare (no tokenTransferMethod)
**VERIFIED.** `apps/web/src/auth/supertokens.ts:27` reads exactly `Session.init(),` — zero arguments. No `tokenTransferMethod`. Gap real.

### Claim 3 — web/api are different SITES; in-code comment confirms header-mode-because-different-origin
**VERIFIED.** Deployed origins confirmed in-repo:
- api = `https://api-production-b93e.up.railway.app` — `apps/web/.env.example:3,5` (`VITE_API_ORIGIN=https://api-production-b93e.up.railway.app`), Dockerfile:20.
- web = `web-production-bce1a8` — named in the SPEC context + wave-83 docstring `apps/api/src/common/security-headers.ts:18` ("web (web-production-*) and api (api-production-*) are DIFFERENT Railway origins").
The different-origin premise is documented in code twice: `supertokens.config.ts:109-118` (SameSite=None rationale — "web frontend and api are on different Railway subdomains") and `security-headers.ts:16-30` (every cross-origin helmet default fenced off). Premise solid.
*Nuance:* the in-code comments justify **cookie SameSite=None** and **helmet CORS-fencing**, not `tokenTransferMethod:'header'` specifically — but the underlying different-origin fact they attest is exactly the plan's premise. VERIFIED.

### Claim 4 — the 4 Socket.IO namespaces exist (/messaging /presence /study-timer /study-room)
**VERIFIED.** All four `@WebSocketGateway` decorators with explicit `namespace`:
- `apps/api/src/messaging/messaging.gateway.ts:63` → `namespace: '/messaging'`
- `apps/api/src/presence/presence.gateway.ts:79` → `namespace: '/presence'`
- `apps/api/src/study-timer/study-timer.gateway.ts:74` → `namespace: '/study-timer'`
- `apps/api/src/study-room/study-room.gateway.ts:75` → `namespace: '/study-room'`
Client side confirms each connects via `VITE_API_ORIGIN` base: `apps/web/src/shell/messagingSocket.ts:87` + `presenceSocket.ts:82` + `studyTimerSocket.ts:42` + `studyRoomSocket.ts:64` (all `io(\`${BASE}/<ns>\`, { withCredentials: true })`). The `connect-src wss://` requirement is genuine — WS handshakes go to the api origin.

### Claim 5 — web served by `vite preview` + Dockerfile exists + index.html exists
**PARTIALLY WRONG (High).**
- `apps/web/Dockerfile` exists — **VERIFIED**.
- `apps/web/index.html` exists (meta-tag target) — **VERIFIED** (`<!doctype html>`, `<head>` present, no CSP meta yet — clean insertion target).
- `apps/web/package.json:14` has a `"preview": "vite preview"` script — but it is **NOT** what serves the deployed app.
- **WRONG:** the deployed web app is **NOT served by `vite preview`.** `apps/web/Dockerfile` CMD is `serve -s apps/web/dist -l tcp://0.0.0.0:${PORT}` — it `npm install -g serve` (the standalone `serve` package) and serves the static `dist/` build. `vite preview` never runs in the image.
  - **Impact:** the spec's and plan's serving-layer CSP alternative (b) ("via vite preview headers") points at the wrong layer. If B-block chooses the header route, it must configure `serve` (a `serve.json` with `headers`), not `vite preview`. The meta-tag route (plan's chosen option (a), `apps/web/index.html`) is UNAFFECTED and remains correct.
  - **Required correction:** before B-block, fix the spec/plan wording from "vite preview" to "static `serve` of `dist/` (apps/web/Dockerfile)". Non-blocking for the gate because the chosen path is meta-tag, but a real defect that would misdirect the header fallback.

### Claim 6 — wave-83 helmet on api has CSP DISABLED (confirming web-app CSP is separate, not a contradiction)
**VERIFIED.** `apps/api/src/common/security-headers.ts:55` `contentSecurityPolicy: false` (plus CORP/COEP/COOP/originAgentCluster all `false`, `:56-59`). Docstring `:15-30` states the api CSP default is deliberately off because it "blocks cross-origin." The web-app CSP (an XSS control on the HTML document) is a genuinely separate surface from the api's JSON-response headers — no contradiction. VERIFIED.

### Claim 7 — how the web addresses the api (so connect-src can name it)
**VERIFIED.** The web reaches the api exclusively through `import.meta.env.VITE_API_ORIGIN`:
- auth SDK domain: `apps/web/src/auth/supertokens.ts:15`
- REST fetch base: `apps/web/src/auth/api.ts:80` (`const BASE = import.meta.env.VITE_API_ORIGIN ?? ''`)
- all 4 socket bases: `messagingSocket.ts:87` / `presenceSocket.ts:82` / `studyTimerSocket.ts:42` / `studyRoomSocket.ts:64`
Prod value = `https://api-production-b93e.up.railway.app` (`apps/web/.env.example:5`), baked at build time (Dockerfile:15-23 — Vite statically replaces `import.meta.env.VITE_API_ORIGIN`, cannot be runtime-injected). So `connect-src` can and must name `https://api-production-b93e.up.railway.app` + `wss://api-production-b93e.up.railway.app`. The spec's caution about parameterizing per-env (dev uses a different VITE_API_ORIGIN / Vite proxy) is well-founded — a hardcoded prod-only meta CSP would break local dev's cross-origin fetch. VERIFIED.

### Claim 8 — antipatterns / correctness of framing
- **"config-only, no schema/UI" — ACCURATE.** Verified: changes touch only `Session.init` options (2 files) + a CSP meta tag in `index.html`. No DB schema (no Drizzle/Dexie migration), no endpoint path/method/DTO change, no React component/route. The api change is options on an existing `Session.init`; the web change is 1 option + 1 markup line. Matches spec `contracts: types:[] data:[]` and `design_gap_flag: false`.
- **CSP on web HTML (not api JSON) — CORRECT layer.** CSP is a directive the *document* enforces on itself; the api returns JSON (not a browsed document), so a CSP header there would be inert for the XSS-exfil goal and would (per wave-83) risk the cross-origin flow. Placing it on the web document is the right layer. No wrong-layer antipattern.
- **No claimed-but-fake claims** beyond the `vite preview` mislabel (Claim 5). Every file:line the spec/plan cites resolves to real code at (or within ~1 line of) the cited location: `supertokens.config.ts:108` = the `Session.init(` line; `supertokens.ts:27` = `Session.init()`. Line refs accurate.
- **One residual to watch (not a gate blocker):** the spec/plan assert refresh rotation is "SuperTokens-default-on" — this is an SDK-behavior claim that this repo does NOT currently prove (no override enables/disables it; AC3 correctly demands it be *asserted/documented, not assumed*). Karen cannot verify SDK internals from repo code alone; the spec already scopes this as a B-block SDK-verify + document item (SDK checklist present in plan `:20-21`). Acceptable — flagged so B-block actually asserts it rather than restating the assumption.

---

## Summary for the gate
- **6 of 8 claim-groups fully VERIFIED** (1,2,3,4,6,7).
- **Claim 5: WRONG on serving mechanism** — deployed via `serve -s dist` (Dockerfile CMD), NOT `vite preview`. High severity. Non-blocking because the chosen CSP path is the meta tag (`index.html`, unaffected); blocks only the header-fallback if that route is later taken. **Correct the spec/plan wording before B-block.**
- **Claim 8: antipatterns clean** — config-only accurate, CSP-on-web-HTML is the correct layer, line refs accurate; refresh-rotation is an SDK claim the repo can't self-prove but is correctly scoped as a B-block assert-and-document item.

**Recommendation: APPROVE.** The wave targets real gaps in real files with the right layering. Attach one mandatory fix-forward note: replace every "vite preview" reference (spec context paragraph + plan `:8` and `:9` placement-alternative-(b)) with "static `serve` of `apps/web/dist` per apps/web/Dockerfile CMD" so B-block's header-fallback, if chosen, configures `serve` (e.g. serve.json headers) and not a non-existent `vite preview` runtime.
