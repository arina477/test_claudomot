# Wave 1 — P-0 Frame

## Discover section

- **wave_db_id:** 4616fa23-6e2b-423f-976f-e72341dcbf0a (wave_number 1)
- **Prior-work citation:** none — first wave of the project.
- **Roadmap milestone:** M1 — Foundation: app shell, auth & profiles (`in_progress`, `platform-foundation`, T1). Wave row milestone_id = M1 (set at INSERT).
- **Spec-contract short-circuit verdict:** `no-prior-spec` — the seed task carries prose (`## What` / `## Why` / `## Acceptance`), no fenced YAML head. Full P-1..P-3 run.
- **Product-decision resolutions:** none. This is foundation/infra. Auth is MVP-scope per `security.md` (SuperTokens recipes, not bespoke) — not a Tier-3 money/UX decision. **Note:** the wave touches auth / sessions / cookies / user creation → the **security-scope tightened gate** applies at P-4, and T-8 Security runs in the T-block.

## Reframe section

- **Original task framing:** Bootstrap the StudyHall foundation (M1) — monorepo + dark app shell + CI (seed) + Postgres/Drizzle + SuperTokens auth backend (sibling) + auth/profile frontend pages (sibling).

- **problem-framer verdict:** `RESCOPE-AUTO-SPLIT`. Symptom-vs-cause check clean (greenfield foundation, already at the cause layer; every later module depends on identity + the monorepo skeleton). Framing sound on every axis — auth-as-foundation is correct sequencing for self-use-mvp; no wrong-layer, demo-path tunnel-vision, premature abstraction, or spec contradiction. The single actionable issue is **SIZE**: the wave fuses three independently substantial deliverables (skeleton+CI; auth backend with 5 flows + Resend; 6 frontend pages) that together exceed what one wave can build and honestly verify. Per contract the cut is deferred to P-1's size rubric; natural seam = ship the CI-verifiable skeleton seed this wave, defer the two auth siblings to later waves.

- **ceo-reviewer verdict:** `PROCEED` (HOLD-SCOPE). M1 Foundation is the unavoidable substrate — no thin slice of the offline-first differentiator skips a monorepo, deployable shell, DB, and identity. Not under-ambitious (ambition belongs in M4, the wedge), not gold-plating (SuperTokens ships verify/reset as configured recipes; Resend is needed by M7 anyway; retrofitting auth at M2 when real students are invited is high-blast-radius). **One advisory:** do not *enforce* email verification as a hard gate for the founder-as-first-user — ship the flows (cheap) but don't block the sole founder behind deliverability/token-expiry; that's the only place M1 risks over-serving a single-user.

- **mvp-thinner verdict:** n/a — active milestone M1 is `platform-foundation` (mvp-thinner spawns only on `product-feature`).

- **Mediation outcome:** n/a (no ceo-reviewer/mvp-thinner conflict).

- **Sibling task IDs created:** none at P-0 (the bundle's 2 siblings already exist: b9118041, 9aae8255).

- **Disposition:** **PROCEED to P-1.** Both reviewers agree the framing/sequencing is correct; the only actionable item is the RESCOPE-AUTO-SPLIT size signal, which P-1 owns. The email-verification "don't hard-gate the founder" advisory is carried into P-2/P-3 as a B-block config note.

- **Final framing the rest of P-block will use:** Ship the M1 foundation in right-sized slices. P-1 applies the size rubric to the 3-task bundle (expected: cut to the monorepo + dark app shell + CI seed this wave; re-parent the two auth siblings to future-wave seeds). Auth depth stays SuperTokens-recipe-based; email verification is shipped but NOT a hard gate for the founder. This is a non-UI-net-new wave for the seed (the shell consumes the existing approved design system / mockups — D-block likely skips for the skeleton slice; revisit at P-1 design_gap_flag).
