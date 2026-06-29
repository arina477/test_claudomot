verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  The scope is exactly right — neither over- nor under-reaching — so the discipline
  here is rigor, not scope change. NOT scope-expansion: M1 is platform-foundation
  (T1); the leverage move is to ship the auth/persistence floor cleanly so M2–M7 can
  stand on it, not to pull feature work forward. NOT selective-expansion: there is no
  cheap-but-disproportionate addition — every adjacent capability (servers, messaging,
  offline-sync) is a downstream milestone that depends on this floor, so adding any of
  it here would be expansion, not a cherry-pick. NOT scope-reduction/drop: a lighter
  auth shim would unblock the founder-as-first-user marginally faster but is the classic
  inverted trap — ripping out and replacing the session model after servers/messaging/
  voice all depend on it is far more expensive than the small marginal cost of doing the
  full SuperTokens recipe set now.
bet_traced_to: Academic tools + offline-first win students from Discord
milestone_traced_to: 5a6efc9e-9de7-4594-a75d-d45e30d9a417 — M1 Foundation (app shell, auth & profiles)
proposed_scope_change: |
  None. Scope held as written.
strategic_value_assessment: |
  Auth+persistence is the right next investment, not a delay of the wedge. The offline-
  first spine (M4) and messaging core (M3) cannot be built without it: the v6b-resolved
  architecture keys the offline outbox's idempotent replay on the authed user + session,
  and the Socket.IO WS-upgrade + LiveKit token bridge both authenticate off the
  SuperTokens session cookie. So auth is the floor the differentiating wedge stands on,
  not a detour from it. The recorded roadmap sequence (M1 → M2 → M3 → M4) confirms this
  ordering as a deliberate decision, not drift.

ambition_calibration: |
  Full SuperTokens self-hosted (verify + reset + JWT refresh rotation, SameSite=Lax) is
  the correct DEPTH, not gold-plating, for three reasons: (1) auth is platform-foundation
  — the one layer you do not want to replace once everything depends on its session
  model; a lighter shim now is a guaranteed expensive migration later. (2) The full
  feature set is what supertokens-node's EmailPassword + EmailVerification + Session
  recipes provide mostly out of the box — marginal cost over a hand-rolled "lighter"
  auth is low. (3) WS-upgrade auth and the LiveKit token bridge (M3/M6) were already
  architected against SuperTokens sessions (product-decisions v6b); re-deriving them
  against a shim would be wasted motion. This is a correctly-calibrated 8/10 for a
  foundation layer, NOT a 9/10 masquerade or a 3/10 shortcut.

  Watch-item for P-1/P-2 (not a scope change, a guardrail): hold the line at the recipe
  defaults. No MFA, no social/OAuth providers, no account-linking, no admin/role system
  this wave — none are in M1 scope and all would be the genuine gold-plating risk. The
  acceptance criteria (signup → verify → login → refresh against local Postgres; migrate
  + seed via pnpm) are measurable and correctly bounded to the self-use-mvp success
  metric ("founder can sign up, verify email, set a profile, load the shell").

drop_rationale: |
  N/A
escalation_reason: |
  N/A
sibling_visible: false
