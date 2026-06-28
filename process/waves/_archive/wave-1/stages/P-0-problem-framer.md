verdict: RESCOPE-AUTO-SPLIT
verdict_source: problem-framer
matched_antipatterns: [5]
symptom_vs_cause: |
  Mandatory check (run even when not a bug wave). This is a greenfield foundation
  wave, not a symptom-fix — so there is no surface symptom masking a deeper cause.
  The framing IS the cause layer: every later module (servers, channels, messages,
  RBAC, offline-sync) depends on user identity + the monorepo skeleton, so building
  identity + skeleton first is the correct root, not a band-aid. No symptom-vs-cause
  confusion. No wrong-layer (#2) — work sits at exactly the layers it claims (build
  tooling, DB/auth backend, auth frontend). No demo-path tunnel vision (#3): the auth
  backend enumerates reset + verify + refresh (non-happy paths), and the frontend
  bundle includes forgot-password + email-verify pages. No premature abstraction (#4):
  architecture explicitly defers packages/ui until a 2nd consumer exists. No backwards-
  compat shims (#8) on greenfield. No spec contradiction (#10) with the live founder
  bet — auth foundation is prerequisite to the offline-first wedge, not in tension
  with it. ESCALATE not warranted.
reasoning: |
  The framing is sound on every axis I own: right cause, right layer, right sequencing.
  Auth-as-foundation is correct for a self-use-mvp — you cannot build the offline-first
  messaging wedge (M3/M4) without user identity + RBAC anchoring, and the architecture
  locks SuperTokens as the single identity provider verified at every door. The ONE
  actionable problem is bundle SIZE, not bad framing: this wave fuses three independently
  substantial deliverables — (1) full monorepo tooling + dark app shell + green CI,
  (2) Postgres + Drizzle (schema/migrations/seed) + self-hosted SuperTokens with five
  flows (signup/verify/login/reset/session JWT+refresh) + Resend email, (3) six auth/
  profile frontend pages wired to that backend. Each is plausibly its own wave; together
  they exceed what one wave can build AND honestly verify at quality. Per my contract,
  RESCOPE-AUTO-SPLIT defers the actual slicing to the P-1 sizing rubric — I flag the
  trigger, P-1 owns the cut. Antipattern #5 cited as the coupled-bundle trigger, with
  the caveat that the three tasks are coherently related (a real foundation), not the
  "while we're in there" unrelated coupling — the binding signal here is size, not
  topical drift.
proposed_reframe: |
  (Not a framing rewrite — framing is correct. This is the size-disposition note P-1
  should act on.) Ship the SEED alone this wave: "Bootstrap monorepo + dark app shell
  + CI" is independently shippable and independently verifiable (CI green + app shell
  renders against DESIGN-SYSTEM.md) with zero dependency on auth. Let P-1 defer the two
  auth siblings to their own waves — auth backend (DB + Drizzle + SuperTokens + Resend)
  as wave 2, auth frontend pages as wave 3 — so each gets a real test/verify pass
  instead of a rushed triple. The seed/sibling structure already present in the bundle
  is the natural seam.
non_binding_note_to_head_product: |
  Adjacent observation, NOT my verdict basis and arguably ceo-reviewer's lane: the auth
  DEPTH proposed (email verification + password reset + Resend transactional email)
  carries founder-dependencies — Resend domain verification with SPF/DKIM (R-SDK-2) and
  SuperTokens Core email-provider config (R-SDK-3), plus an account-issued Resend key —
  for near-zero value at the current one-user self-use stage where the founder is the
  only account. If the auth-backend sibling is scoped, consider whether verify+reset
  email flows can be thinned to a later wave (session auth alone unblocks dogfooding).
  Flagging for the P-1/ceo-reviewer cut; not a framing defect.
escalation_reason: |
  (n/a)
sibling_visible: false
