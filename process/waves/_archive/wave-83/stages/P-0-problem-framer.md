verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  NOTE: this file previously held the verdict for wave-83's ORIGINAL seed (app-wide
  ParseUUIDPipe), which was DROPPED at P-0 because its premise had evaporated (already
  fixed by wave-33's global exception filter + wave-40's text-id guard + a regression
  test). This verdict is for the RE-SEEDED task 875b97f4 (API security hardening:
  HSTS + throttler-exception body + x-powered-by).

  Symptom-vs-cause (mandatory): PASS. All three remedies attack the cause at the correct
  layer. (1) No HSTS header and (2) x-powered-by:Express are both live-verified — I
  independently re-probed https://api-production-b93e.up.railway.app: HTTP/2 404,
  `server: railway-hikari`, `x-powered-by: Express` present, NO `Strict-Transport-Security`;
  grep confirms no helmet dependency and no HSTS / x-powered-by wiring in apps/api/src/main.ts.
  Both fixes belong in the app bootstrap (helmet or a direct header set + `app.disable('x-powered-by')`
  in main.ts). Wrong-layer check on HSTS specifically: the Railway edge terminates TLS but does
  NOT inject HSTS by default, so the app is the reliable, version-controlled control point — this
  is not a wrong-layer fix. (3) The 429-body leak: the custom Express `authRateLimiter` in main.ts
  ALREADY emits a generic body, so the true remaining target is the NestJS `ThrottlerGuard`
  (registered as APP_GUARD in app.module.ts) whose default `ThrottlerException` response can
  surface the framework class name; the root fix is a custom exception/message override on that
  guard — again the correct layer.

  Antipatterns: none fire. The three items are one coherent "response-hardening at the app
  boundary" bundle (all wired in main.ts / app bootstrap, all defense-in-depth fingerprint
  reduction), so #5 scope-creep-through-coupling does NOT fire — this is cohesion, not "while
  we're in there." No demo-path tunnel vision (#3): the fix is global, not endpoint-specific.
  No premature abstraction, config drift, or validation theater.

  Honest scoping: the seed's "LOW hardening, no exploit, cosmetic/defense-in-depth" is accurate —
  not overselling. Right size for one bug-fix wave; single-threaded, low blast radius.

  Verify-the-target (PRODUCT principles #1 + #2): PASS. The three named targets ARE the real
  output boundary (API response headers + the 429 envelope), live-verified present/absent — not
  a wrong-target entity. PROCEED with one bounding constraint the P-block MUST carry (below).
proposed_reframe: |
  Not a REFRAME (PROCEED). This is a bounding CONSTRAINT the P-2 spec MUST carry, not a re-frame:

  BOUND HELMET TO HSTS-ONLY. helmet()'s defaults enable a full header suite (Content-Security-Policy,
  X-Frame-Options, Cross-Origin-Embedder/Opener/Resource-Policy, X-Content-Type-Options, ...). This
  wave's premise covers ONLY HSTS + x-powered-by + the 429 body. Enabling helmet's defaults unscoped
  risks breaking the live SPA and the SuperTokens cross-origin cookie/CORS flow already wired in
  main.ts (enableCors with credentials:true + supertokens.getAllCORSHeaders()). Spec the fix as:
  enable Strict-Transport-Security ONLY (helmet with all other middleware disabled, or a direct HSTS
  header) + `app.disable('x-powered-by')`. Do NOT ship CSP / X-Frame / COEP / CORP this wave — those
  are a separate scoped decision if ever wanted.

  Two further spec bounds:
  - HSTS max-age / includeSubDomains / preload must be chosen deliberately, not left to a copied
    default: `preload` is effectively irreversible and includeSubDomains affects every *.up.railway.app
    (and any future custom domain) subdomain. Pick conservative values consciously.
  - The 429 AC targets the NestJS ThrottlerGuard path specifically (the Express authRateLimiter is
    already generic). The AC must assert the ThrottlerGuard 429 body no longer contains
    "ThrottlerException" while preserving 429 status + Retry-After semantics; add a check that
    x-powered-by is absent and Strict-Transport-Security is present on a normal API response.
escalation_reason: |
  N/A
sibling_visible: false
