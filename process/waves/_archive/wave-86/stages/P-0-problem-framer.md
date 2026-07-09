verdict: REFRAME
verdict_source: problem-framer
matched_antipatterns: [1, 6]
reasoning: |
  The seed is a cargo-culted wave-49 finding whose premise partially evaporated and
  is partially mislocated. Two premise shifts invalidate the seed AS WRITTEN:
  (1) wave-84 pinned HEADER/bearer transport on BOTH ends (api getTokenTransferMethod:
  () => 'header' at supertokens.config.ts:123; web Session.init({ tokenTransferMethod:
  'header' }) at supertokens.ts:36). In header mode the browser does NOT auto-attach the
  token cross-site, so CSRF is structurally not a vector for the HTTP session path — the
  seed's cookie-oriented framing describes a surface the app no longer transports on.
  (2) The seed's cited coordinate (supertokens.config.ts:93) is now stale — line 93 is
  EmailVerification.init; the Session config moved to lines 108-221.
  (3) The requested value antiCsrf: VIA_TOKEN is a COOKIE-mode setting and is the WRONG
  value for a header-transport architecture (antipattern #1: symptom-layer fix that
  doesn't match the real cause/layer). SuperTokens documents antiCsrf as meaningful only
  for cookie-based sessions; for header transport the custom-header requirement already
  provides anti-CSRF, so VIA_TOKEN is at best moot and at worst misleading config drift
  (antipattern #6: adding a knob whose named consumer no longer exists in the form assumed).
  BUT the premise has NOT fully evaporated (unlike wave-83 ParseUUIDPipe): a REAL residual
  cookie surface remains on the WebSocket layer — ws-auth.ts:50-54 reads the sAccessToken
  COOKIE first (falling back to handshake.auth.accessToken), and all four socket clients
  (presenceSocket / messagingSocket / studyTimerSocket / useVoiceOccupancy) connect with
  withCredentials: true expecting cookie auth. That is where any residual anti-CSRF
  reasoning actually lives — and ws-auth.ts:72 already documents WHY it is CSRF-safe (the
  WS upgrade is a one-time authenticated handshake, not a form-submittable state-changing
  request; getSessionWithoutRequestResponse is called with antiCsrfToken=undefined). So the
  correct hardening is a LEGIBILITY/regression-lock task, not a config-value change.
proposed_reframe: |
  Reframe from "set antiCsrf: VIA_TOKEN (cookie-mode value) to harden CSRF" to:
  "Make the header-transport CSRF posture EXPLICIT and regression-locked, at the correct
  layer for the now-header-transported app."

  Correct framing the rest of P-block should carry:
  - antiCsrf: VIA_TOKEN is the WRONG value — do NOT set it. It is a cookie-mode setting that
    contradicts the wave-84 header-transport decision.
  - The correct EXPLICIT posture is one of (P-3/head-product to pick, but this is a real
    security-architecture decision — see ESCALATE note below):
      (a) Leave antiCsrf UNSET and instead ADD A DOCUMENTED, TESTED assertion that header
          transport is what makes CSRF structurally-safe — a regression test that a
          cookie-only forged state-changing POST is rejected (the seed's actual VALUE ask,
          which survives the reframe), PLUS a code comment at the Session.init block stating
          the CSRF posture is provided by header transport, not by antiCsrf.
      (b) IF a residual cookie surface is to be kept anti-CSRF-defended (the WS sAccessToken
          cookie read at ws-auth.ts:50-54), set antiCsrf: VIA_CUSTOM_HEADER — the
          header-APPROPRIATE value SuperTokens recommends when cookies ARE used cross-site —
          NOT VIA_TOKEN. But note the WS path already documents (ws-auth.ts:72) why the
          upgrade handshake is not CSRF-exploitable, so this may be redundant.
  - Keep the seed's SURVIVING deliverable: the regression test asserting a cookie-only forged
    cross-site state-changing POST is rejected (401). This is verifiable regardless of which
    explicit posture is chosen and is the legitimate "cannot silently regress" guard.
  - Add the residual-cookie-surface fact to the spec: the WS layer (ws-auth.ts + 4 socket
    clients) still uses cookie transport, so any anti-CSRF reasoning must name the WS upgrade
    path, not the (now header-only) HTTP path the seed assumed.
escalation_reason: |
  (Advisory, not a blocking ESCALATE.) Which explicit antiCsrf posture is correct — unset +
  documented header-safety (a) vs VIA_CUSTOM_HEADER for the residual WS cookie surface (b) —
  is a genuine security-architecture decision, the same class that sent wave-84's transport
  choice to the BOARD. This verdict is REFRAME (the framing IS recoverable and the wrong-value
  ask is unambiguous), but flagging for P-4's security-scope-tightened gate: the specific value
  choice between (a) and (b) should be resolved with the supertokens-integration specialist at
  P-3, and if it splits, routed per active mode. Do NOT let it default silently to VIA_TOKEN.
sibling_visible: false
