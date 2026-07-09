# V-1 Jenny — semantic-spec verification (wave-86, anticsrf-explicit)

**Verdict: APPROVE** — deployed behavior conforms to the REFRAMED spec-contract intent. No drift, no gap.

Spec source: task `f8fb8023-544a-431f-a359-7392e9c75f5b` (YAML head). Deployed @a9556248; T-8 live-verified on `https://api-production-b93e.up.railway.app` (deployed api 0f38d1fe). Cross-checked T-8 deliverable + read the shipped config, regression test, product-decisions, ws-auth.ts, and journey map independently.

---

## AC1 — explicit header-correct antiCsrf, NOT VIA_TOKEN → CONFORM

- `apps/api/src/auth/supertokens.config.ts:215` sets `antiCsrf: CSRF_POSTURE.antiCsrf`, and `CSRF_POSTURE.antiCsrf = 'NONE'` (`:27-30`, `as const`). Value is EXPLICIT (not omitted/defaulted) and is NOT `VIA_TOKEN`.
- The chosen value + rationale is documented in a code comment (`:150-206`): WHY 'NONE' is correct under the pinned `getTokenTransferMethod: () => 'header'` (`:148`), WHY NOT `VIA_TOKEN` (cookie-mode value, config theatre in header mode — explicit "a future reviewer must NOT fix this back to VIA_TOKEN"), and WHY NOT `VIA_CUSTOM_HEADER` (SDK footgun on cookie/'any' transport). SDK-verified against supertokens-node@24.0.2.
- **Deployed behavior conforms:** T-8 `anticsrf_posture_live: CORRECT` + `login_unregressed: PASS` shows tokens returned as RESPONSE HEADERS (st-access/refresh-token via ACEH), NO set-cookie — header transport intact on the live api. The transport gate (not antiCsrf) is what rejects cookie-only requests, exactly as the config documents. NOT VIA_TOKEN confirmed.

## AC2 — cookie-only forged POST rejected (the regression guard) → CONFORM

- T-8 `forged_cookie_only_post: PASS`: live forged cross-site POST /servers carrying ONLY `Cookie:sAccessToken=<valid>`, `Origin:evil`, no Authorization/anti-CSRF header → **401**. Airtight same-route control: Bearer→201, cookie-only→401, no-auth→401. Cookie-only cross-site forgery CANNOT authenticate — this is precisely the AC's intent.
- The permanent guard exists: `apps/api/test/integration/csrf-posture.spec.ts` (DB-free, no reachable core — pure transport-layer test on the REAL supertokens-node@24.0.2 request path). It sources transport+antiCsrf from the shared prod `CSRF_POSTURE` const (auto-fails on prod drift), uses a STRUCTURALLY-VALID access-token JWT as the forged cookie, and includes an `'any'`-transport CONTROL block proving the header pin is load-bearing (same cookie → read → TRY_REFRESH_TOKEN under 'any' vs ignored → UNAUTHORISED under 'header'). This is a real tripwire, not green-by-construction. Survives a future cookie-transport migration, as the AC requires.

## AC3 — legitimate request unregressed → CONFORM

- T-8 `legit_bearer: PASS`: GET /me, GET /servers → 200; POST /servers (Bearer) → 201 on the deployed api. Login path unregressed. The regression test's third case also confirms a bearer request clears the transport gate to verification (distinct TRY_REFRESH_TOKEN outcome, not the cookie-only UNAUTHORISED), proving `antiCsrf: 'NONE'` did not break bearer transport. WS auth behavior unchanged (ws-auth.ts untouched functionally).

## AC4 — CSRF-safety docs + wave-84 cross-ref → CONFORM

- Docs present in the merged config (`:150-214`): explains WHY header transport is structurally CSRF-safe (browser does not auto-attach the bearer token cross-site; SuperTokens reads the token from the Authorization header, so a cookie-only request has no token). Cross-references wave-84's header-transport decision AND its pre-GA cookie-migration trigger (`:200-206`: "if StudyHall migrates back to cookie transport before GA, antiCsrf becomes LOAD-BEARING and must be raised…"). Cross-refs the ws-auth.ts CSRF-safe-handshake comment (`:208-211`), and ws-auth.ts:72-73 reciprocally cross-refs this config's `antiCsrf:'NONE'`. Consistent both directions.

## Drift check — product-decisions + journey map → NO DRIFT

- **product-decisions.md:907-911** (wave-84 BOARD, 7/7 unanimous): keeps HEADER token transport for the cross-SITE SPA; line 910 records the exact pre-GA cookie-migration trigger the config cross-references. `antiCsrf: 'NONE'` under header transport is fully consistent with this recorded decision — it makes the wave-84 posture explicit/legible, does NOT change transport, and correctly stages the migration trigger. No new decision entry required (posture-legibility, not a strategic change); no drift.
- **journey map:** no route/method/screen change (spec `api: No endpoint path/method/schema change`). The two "csrf" hits are (a) the wave-49 F-2 known finding — "anti-csrf implicit-not-explicit (PRE-EXISTING, non-exploitable)" — which THIS wave resolves, and (b) an incidental study-timer note. No CSRF route/screen was ever added; nothing to change. Confirmed unchanged.

## Drift vs gap

Neither. Deployed behavior matches the REFRAMED intent on all 4 ACs; the `antiCsrf: 'NONE'` posture is consistent with the recorded wave-84 header-transport decision + its migration trigger; no route/screen surface changed. The seed's literal `VIA_TOKEN` ask was correctly REFRAMED at P-0 (predates wave-84 header pin) — building `NONE` here is conformance to the reframed spec, not a gap against the superseded seed.

**APPROVE.**
