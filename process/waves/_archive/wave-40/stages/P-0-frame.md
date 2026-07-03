# Wave 40 — P-0 Frame

## Discover section
- **wave_db_id:** 569dd328 (wave_number 40)
- **Prior-work citation:** wave-38 T-8 surfaced these 2 LOW 500s (F-T8-1/F-T8-2). wave-33 fixed the non-UUID-route-param 500 class PROJECT-WIDE via a global exception filter (22P02→400), explicitly NOT a per-route ParseUUIDPipe sweep (journey-map last_updated_wave33; filter at `apps/api/src/auth/auth.exception.filter.ts`, registered main.ts:121).
- **Roadmap milestone:** M7 (6e2f68d8), in_progress, class=`product-polish`. LAST buildable M7 task (only other open = a1299e88 Resend, founder-blocked).
- **Spec-contract short-circuit verdict:** `no-prior-spec`. Full P-1..P-3.
- **Product-decision resolutions:** none (Tier-3 none). LOW robustness polish.

## Reframe section
- **Original task framing:** two 500s → 4xx. (1) GET /users/:userId/avatar NUL-byte → add ParseUUIDPipe → 400. (2) POST /profile/avatar/confirm NoSuchKey → catch → 404/400.
- **problem-framer verdict:** REFRAME (verdict file P-0-problem-framer.md; matched antipatterns #10 spec-contradiction, #2 wrong-layer). Fix #2 sound. **Fix #1 ParseUUIDPipe is WRONG:** (a) contradicts wave-33's live global-filter decision (22P02→400 project-wide, NOT ParseUUIDPipe; zero ParseUUIDPipe usage in apps/api); (b) `users.id` is `text('id')` populated by SuperTokens `getUserId()` — an opaque provider string NOT contractually a UUID, so ParseUUIDPipe would 400 on LEGITIMATE avatar fetches for non-UUID-shaped ids (a plain non-UUID string correctly 404s today precisely because the column is text, no uuid cast); (c) the NUL-byte 500 is NOT a 22P02 (no uuid cast on a text column) — it fails deeper (untranslatable-character SQLSTATE ~22021 / pg driver rejects NUL in a string), which the global filter's current coverage doesn't include. Proposed: keep fix #2; replace fix #1 with a boundary reject of the NUL/control byte that does NOT impose UUID shape — either (A) a lightweight guard on the text-keyed :userId rejecting control/NUL bytes, or (B) extend the global SupertokensExceptionFilter to map the NUL-byte SQLSTATE/driver-error → 400 (mirrors the 22P02 branch, once-in-one-place). Add a test asserting a valid NON-UUID-shaped SuperTokens id still 302s/404s (never 400s).
- **ceo-reviewer verdict:** PROCEED / HOLD-SCOPE. Worth doing (real defects, last buildable M7 item, on M7's deploy-readiness metric); scope right (2 endpoints only). Guardrail: NO broad input-validation / ParseUUIDPipe-everywhere sweep (speculative hardening at 0 users); reject any endpoint fold-in lacking T-8 evidence.
- **mvp-thinner verdict:** not spawned (M7 class=product-polish).
- **Mediation outcome (head-product):** ADOPT the corrected framing. problem-framer REFRAME is corrective (the WHAT — fix the 2 endpoints' 500s — is right; only fix #1's mechanism changes from ParseUUIDPipe to a NUL-byte boundary-reject that preserves non-UUID ids). ceo already PROCEED'd on this exact scope. No full reviewer re-spawn (the correction is additive; P-4's fresh Karen/jenny/head-product re-validate). ceo HOLD-SCOPE guardrail carried: 2 endpoints only.
- **Sibling task IDs created:** none.
- **Disposition:** REFRAMED (fix #1 mechanism corrected; scope held).

### Final framing (rest of P-block uses this)
**Wave-40 = harden the 2 avatar endpoints' malformed-input 500s → clean 4xx, wave-33-consistent, without breaking legit non-UUID ids.**
1. **GET /users/:userId/avatar NUL/control-byte 500 → 400/404, NO ParseUUIDPipe.** Reject the NUL/control byte at the boundary WITHOUT imposing UUID shape — P-3 picks (A) a lightweight :userId guard (reject control/NUL chars) or (B) extend the global `SupertokensExceptionFilter` (auth.exception.filter.ts) to map the untranslatable-character/NUL SQLSTATE or pg-driver-NUL error → 400, mirroring the existing 22P02 branch. MUST add a regression test: a valid non-UUID-shaped SuperTokens user id still returns 302 (has avatar) / 404 (no avatar), NEVER 400.
2. **POST /profile/avatar/confirm NoSuchKey 500 → 4xx.** Catch the HeadObject NoSuchKey (never-uploaded own-scoped key) in `checkAvatarSize`/confirm → return 404 (or 400) instead of 500.
3. Scope: these 2 endpoints ONLY (HOLD-SCOPE — no validation sweep, no evidence-free fold-ins).
