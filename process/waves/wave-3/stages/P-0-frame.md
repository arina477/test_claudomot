# Wave 3 — P-0 Frame (recreated post worker-reset)
- wave_db_id: 2fba4559 (wave 3); milestone M1. Spec short-circuit: no-prior-spec. design: 6 mockups exist (landing/signup/login/forgot-password/email-verify/settings-profile).
- **problem-framer: REFRAME** — profile-customization (username/avatar/accent) has NO backend (no columns, no profile API, no FilesModule) → full-stack, not UI-only. Avatar/storage = split candidate.
- **ceo-reviewer: PROCEED (HOLD-SCOPE)** — right next thing (unlocks wedge, makes live auth usable); full profile is milestone scope; budget avatar/storage.
- **Disposition: REFRAMED→full-stack.** Founder (automatic split-routing) chose SPLIT: ship login front-door first. → P-1 RESCOPE-AUTO-SPLIT. Carries verify-gating UX (a3328023)→P-2; security gate→P-4+T-8.
