verdict: ESCALATE
verdict_source: problem-framer
matched_antipatterns: [1, 2]
reasoning: |
  This is a genuine Tier-3 security/architecture DECISION mis-dressed as a bug fix, and the
  seed's "design intent: httpOnly cookies" premise is itself questionable given the deliberate
  different-origin (web ≠ api, both cross-site on the Public Suffix List up.railway.app) topology.

  Symptom vs cause (antipattern #1): the MEDIUM finding is "tokens are JS-readable header
  bearer tokens" (a real XSS-exposure surface). Disposition (A) — set tokenTransferMethod:'cookie'
  — is a symptom-layer fix that trades a MEDIUM XSS surface for a HIGH auth-reliability risk:
  because web and api are cross-SITE (different registrable labels under a PSL suffix), cookie
  mode forces SameSite=None + Secure third-party cookies, which Safari ITP blocks outright and
  Chrome's third-party-cookie phase-out degrades. Header-based transport is SuperTokens' OWN
  recommended transport for exactly the cross-origin-SPA case; cookie mode is recommended only
  when frontend and backend share a domain/subdomain. So the ROOT question is not "how do we
  turn on cookies" but "is header mode the correct transport for this architecture?" — and the
  evidence says yes.

  Wrong-layer / cargo-cult "httpOnly is always safer" (antipattern #2): the seed frames header
  mode as a deviation from intent, but the code shows no tokenTransferMethod set on either
  Session.init() — header mode is the SDK's automatic, documented behavior for apiDomain ≠
  websiteDomain, not an accident. Verified live (wave-72 T-8, 2026-07-07, against the real
  Railway deploy): no Set-Cookie, tokens in st-access-token/st-refresh-token headers. The
  server-side cookieSameSite:'none'/cookieSecure:true config is present-but-dead, and even
  CROSS_ORIGIN_PROD is not confirmed set in prod — so (A) is not a config flip, it's an
  unproven cross-site-cookie migration whose success is browser-dependent.

  Why ESCALATE not REFRAME: both forks are defensible and the choice has real product/security/
  auth-reliability trade-offs (login breaking for Safari users vs. an accepted XSS surface).
  That is a Tier-3 decision, not a framing error I can resolve unilaterally. StudyHall is in
  automatic mode, so this routes to the BOARD (6+/7 for the Tier-3 security-strict threshold),
  not the founder. My framing recommendation to the BOARD is disposition (B): keep header mode,
  document it as a deliberate accepted cross-origin choice, and specify compensating XSS
  controls — because switching to cross-site cookies is the higher-risk, SDK-counter-recommended
  path, and note that CSP is currently explicitly disabled (security-headers.ts), which is the
  more impactful lever on the actual XSS surface than token transport.
proposed_reframe: |
  (Not a REFRAME — routing to BOARD. Recommended framing for the decision:)

  The real problem is NOT "session tokens aren't httpOnly cookies." It is: "for a cross-SITE
  SPA+api topology, which token transport correctly balances XSS-surface vs auth-reliability,
  and what is the documented, tested disposition?"

  Two dispositions the BOARD must choose between:
  - (B, RECOMMENDED) Keep header mode. Document in product-decisions.md + the SuperTokens SDK
    doc that header transport is the DELIBERATE, SuperTokens-recommended choice for the
    different-origin architecture; downgrade FINDING-1 to accepted-with-compensating-controls.
    Compensating XSS controls to pin in the P-block spec: (1) enable a Content-Security-Policy
    (currently contentSecurityPolicy:false in security-headers.ts — this is the highest-leverage
    fix for the actual XSS risk), (2) confirm short access-token TTL + rotating refresh already
    in place, (3) document that no dangerouslySetInnerHTML / unsanitized DOM sinks exist in web.
  - (A) Switch tokenTransferMethod:'cookie' on both Session.init() calls. If chosen, the P-block
    spec MUST make it a HARD acceptance requirement that T-8 proves end-to-end login works
    cross-site on Safari (ITP) AND under Chrome third-party-cookie restrictions, on the live
    Railway deploy — not just localhost — plus confirm CROSS_ORIGIN_PROD=true is actually set on
    the api service (currently unverified) and that WS-upgrade session validation still works.
    A cross-site httpOnly SPA-auth cookie is a known-fragile pattern; shipping it without an
    ITP/3p-cookie proof would trade a MEDIUM XSS surface for a HIGH login-availability regression.
escalation_reason: |
  Genuine Tier-3 security/architecture trade-off with no safe default: (A) cookie mode reduces
  an XSS surface but risks breaking login for Safari users and post-3p-cookie-deprecation
  browsers on this cross-SITE topology; (B) header mode keeps auth reliable and follows
  SuperTokens' own cross-origin guidance but accepts a JS-readable-token surface. The seed
  itself flagged this as needing "its own security wave" and a fork decision. Under automatic
  mode this routes to the BOARD at the Tier-3 security-strict threshold (6+/7), not to
  auto-build and not to the founder. Recommendation to BOARD: disposition (B) + enable CSP as
  the real XSS mitigation.
sibling_visible: false
