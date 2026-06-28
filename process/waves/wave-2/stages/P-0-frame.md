# Wave 2 — P-0 Frame

## Discover
- wave_db_id: cb76d7b9-a90e-4213-9fe5-9e2f9e28be6d (wave_number 2)
- Prior-work: none on auth/DB (wave-1 was scaffold only; no DB, no auth). Foundation shell + /health live.
- Roadmap milestone: M1 (5a6efc9e, in_progress, platform-foundation, T1; required by M2–M7). wave.milestone_id backfilled to M1.
- Spec-contract short-circuit: **no-prior-spec** (prose ## What/## Why/## Acceptance, no fenced YAML) → full P-1..P-3.
- Product-decision resolutions: none (auth = MVP-scope per security.md; not Tier-3). Architecture (SuperTokens self-hosted / Resend / SameSite=Lax / auth-email routing) locked at onboarding v5/v6b — this wave executes, not relitigates.

## Reframe
- **Original framing:** Wire Postgres+Drizzle + SuperTokens self-hosted auth (signup/verify/login/reset/session JWT+refresh, SameSite=Lax cookie) + Resend emails; AC = user can sign up→verify→login→refresh against local Postgres; migrations+seed via pnpm db:migrate && db:seed.
- **problem-framer: PROCEED** — cause-layer framing (M1 substrate; nothing deeper skipped). No antipatterns; NOT a RESCOPE-AUTO-SPLIT (irreducible vertical slice — SuperTokens Core needs Postgres; verify/reset inoperable without Resend; AC undemonstrable if any of the 4 removed). Flags to P-1/P-3: sequence DB layer before auth; pin SuperTokens Core email-provider config + verify-link route contract (R-SDK-2 Resend domain verification open, onboarding@resend.dev fallback).
- **ceo-reviewer: PROCEED (HOLD-SCOPE)** — right next investment (foundation floor the offline-first wedge stands on: outbox replay keys on authed user; Socket.IO WS-upgrade + LiveKit token bridge authenticate off SuperTokens session). Ambition calibrated 8/10 (auth is the layer you least want to rip out later; full verify/reset/refresh is mostly recipe defaults, low marginal cost). Guardrail to P-1/P-2: hold at recipe defaults — NO MFA / OAuth / account-linking / roles this wave (the real gold-plating risk).
- **mvp-thinner:** SKIPPED (M1 ## Class = platform-foundation).
- **Disposition: PROCEED.** Final framing = original, backend-only, held to SuperTokens recipe defaults. Carry to P-2/P-3: DB-before-auth sequencing; SuperTokens Core email config + verify-link route; Resend domain-verification fallback. Carry to B-block: Resend API key is an account-issued founder-ask (rule 6); Postgres + SuperTokens Core self-provisioned on Railway (infra).
- **Security-scope tightened gate:** APPLIES at P-4 (auth/sessions/cookies/user-creation). T-8 Security MUST run this wave.
