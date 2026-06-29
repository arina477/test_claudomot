# Wave 3 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-wave3-p4)
**Reviewed against:** process/waves/wave-3/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
REWORK

## Rationale
The frame, decomposition, and scope discipline are sound: the wave ladders to milestone M1 (the live auth front door), the founder-approved split to sibling 2a655960 is clean (username/avatar/accent render as disabled 'coming soon' — no half-built surface), and there is no avatar/storage/billing gold-plating. The 9 acceptance criteria are falsifiable and observable, and the non-happy paths are genuinely covered (wrong credentials, duplicate-email signup, expired/used verify and reset tokens, session expiry with silent refresh, unverified-in-shell, and logged-out guarded-route redirect with destination preservation). The verify-banner UX decision is the right low-friction default for first-run activation and is logged and reversible. The gate fails on a single load-bearing security-surface ambiguity that the tightened gate exists to catch: the spec (AC8 / contracts) and the P-3 plan describe the /me verification relax as removing the **global** EmailVerification claim ("relax EmailVerification global claim", "remove the global EmailVerification claim requirement"). Verified against the live backend — `apps/api/src/auth/supertokens.config.ts` runs `EmailVerification.init({ mode: 'REQUIRED' })`, which adds the claim to the **global** validators, so the default `verifySession()` in `AuthGuard` currently 403s unverified users app-wide (the exception filter maps `INVALID_CLAIMS` → 403 `EMAIL_NOT_VERIFIED`). A builder reading "remove the global claim requirement" literally would flip `mode` to `'OPTIONAL'`, which is **fail-open for every future protected route** (M2 servers, M3 messaging, etc.), silently dropping verification gating contrary to security.md Convention 2 and the spec's own "sensitive actions may gate later." The decision (unverified users reach the shell) is approved; only the **mechanism** must be pinned to a per-route override so the global default stays fail-closed. This is a precise, isolated fix — not an escalation.

## Rework instructions

### Stages requiring rework
- P-2 spec: pin the /me verification relax to a per-route claim override, not a global mode change.
- P-3 plan: align the B-2 step + API-contracts section to the per-route mechanism.

### Per stage

#### P-2 spec
- **What's wrong:** AC8 and the `contracts.api` / `contracts.sdk` entries describe the relax as exempting routes from "the global EmailVerification REQUIRED claim" / "relax EmailVerification mode/claim". This phrasing admits a global `mode: 'REQUIRED' → 'OPTIONAL'` reading, which fails open for all future protected routes. On the security-scope tightened gate, this is a load-bearing ambiguity a reasonable builder could implement unsafely.
- **Heuristic fired:** Vague acceptance criteria / Happy-path-blind security default — spec leaves the safe-by-default mechanism unspecified on an auth/session surface where the default determines the blast radius for every downstream route.
- **What "good" looks like:** The spec states the relax is implemented **per-route** on `/me` and `/profile` via `verifySession({ overrideGlobalClaimValidators: () => [] })` (or equivalent route-scoped validator override), and that `EmailVerification.init({ mode: 'REQUIRED' })` stays unchanged globally so every other protected route (current and future) continues to enforce the verified-email claim by default. AC8 should add an explicit non-goal/guard line: "no other protected route loses email-verification gating; the global REQUIRED default is preserved." Verification emails still send (unchanged).
- **Re-do instructions:**
  1. Edit the primary task row (`tasks.id = 9aae8255-...`) `description` YAML head: in AC8, replace "exempted from the global EmailVerification REQUIRED claim" with "exempted **per-route** (via a route-scoped claim-validator override on /me + the profile route) while the global EmailVerification REQUIRED default stays in force for all other protected routes."
  2. In `contracts.sdk`, change "relax EmailVerification mode/claim on /me + app routes" to "keep `EmailVerification.init({ mode: 'REQUIRED' })` global; apply a per-route `overrideGlobalClaimValidators: () => []` on /me and /profile only."
  3. Add to `edge-cases` (or a `non-goals` note): "Global verification default is NOT loosened — any route added without the explicit per-route override remains verified-gated."
  4. Mirror the one-line change in the convenience copy `process/waves/wave-3/stages/P-2-spec.md` (pointer; DB row is source of truth).

#### P-3 plan
- **What's wrong:** B-2 step reads "relax EmailVerification global claim (so /me + /profile don't 403 unverified)" and the API-contracts line says "/me (verifySession, claim relaxed)". Both must name the per-route override mechanism so the supertokens-integration builder implements fail-closed-by-default.
- **Heuristic fired:** Architecture-blind plan on a security surface — the plan's mechanism diverges from the locked security architecture's fail-closed default (security.md Convention 2 + the `requireVerifiedEmail` composed-claim reusability principle).
- **What "good" looks like:** B-2 explicitly instructs: leave `supertokens.config.ts` `EmailVerification.init({ mode: 'REQUIRED' })` untouched; implement the relax as a route-scoped `verifySession({ overrideGlobalClaimValidators: () => [] })` applied to the `/me` route and the new `/profile` GET/PATCH routes (e.g. a variant guard or a `@VerifySession`-style decorator that passes the override), so unverified users get 200 there while every other guarded route keeps the global claim. API contracts annotate /me and /profile as "claim-validator override applied (route-scoped)".
- **Re-do instructions:**
  1. Edit `process/waves/wave-3/stages/P-3-plan.md` B-2: change the supertokens-integration sub-step to "apply a route-scoped claim-validator override (`overrideGlobalClaimValidators: () => []`) on the /me + /profile guard; do NOT change the global `mode: 'REQUIRED'`."
  2. Update the API contracts block: "/me and /profile (verifySession with route-scoped empty claim-validators) → 200 for verified AND unverified; all other protected routes keep the global REQUIRED claim."
  3. Confirm AuthGuard handling: the current `AuthGuard` calls bare `verifySession()`; the plan must note that /me + /profile need a guard variant that passes the override options (the existing single-arg `AuthGuard` will still 403 unverified). Name this as a B-2 implementation detail for supertokens-integration.
  4. Keep the self-consistency map; AC8 still maps to B-2 (claim override, now route-scoped) + B-3 (banner).

### Cascade

P-block cascade rules (trigger = P-2 spec):

| Trigger stage | Stages that must re-run downstream |
|---|---|
| P-2 spec | P-3 (approach + plan derive from spec) |

- **Stages that must re-run after the above:** P-3 plan (per the per-route alignment above). The change is mechanism-only; the AC set, claimed_task_ids, decomposition, and design_gap_flag are unchanged, so P-0 and P-1 stay untouched.
- **Stages that stay untouched:** P-0 frame, P-1 decompose.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

# Wave 3 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-wave3-p4-attempt2)
**Reviewed against:** process/waves/wave-3/blocks/P/review-artifacts.md + updated spec (task 9aae8255 description) + P-3-plan.md
**Attempt:** 2  (post-rework re-verification of the single attempt-1 security finding)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
The single attempt-1 REWORK finding is fully resolved and consistent across all four load-bearing surfaces. The /me + /profile verification relax is now pinned to a **per-route** mechanism, and the global default explicitly stays fail-closed:

- **Spec AC8** (task 9aae8255 description): "EmailVerification recipe stays mode:'REQUIRED' = global fail-closed default for ALL future protected routes; ONLY /me + /profile are exempted PER-ROUTE via verifySession with overrideGlobalClaimValidators:()=>[] ... future sensitive routes inherit the REQUIRED default automatically."
- **contracts.api**: "/me + /profile exempted from email-verification PER-ROUTE (overrideGlobalClaimValidators:()=>[]); global EmailVerification stays REQUIRED (fail-closed) so future protected routes gate by default."
- **contracts.sdk**: "KEEP EmailVerification mode:'REQUIRED' (global); add per-route overrideGlobalClaimValidators:()=>[] on the /me + /profile verifySession guards only — do NOT switch to OPTIONAL (fail-open)."
- **P-3 plan** (architecture-deltas line 6 + B-2 line 29): "KEEP EmailVerification mode:'REQUIRED' (global fail-closed default for future routes); add per-route overrideGlobalClaimValidators:()=>[] on the /me + /profile verifySession guards ONLY (do NOT flip to OPTIONAL)."

This satisfies the fail-closed default for future M2/M3 routes — any new protected route added without the explicit per-route override inherits the global REQUIRED claim and 403s unverified users (security.md Convention 2) — while still delivering the unverified-shell UX: /me + /profile return 200 for unverified users so the app shell loads with the verify-email banner. The decision (unverified users reach the shell) was already approved at attempt 1; only the mechanism needed pinning, and it now is, with an explicit OPTIONAL-prohibition guard that closes the reasonable-builder fail-open reading the tightened gate exists to catch. B-2 also correctly notes the AuthGuard needs a guard variant that passes the override options (bare verifySession still 403s unverified), so the per-route scope is implementable as specified.

The change is mechanism-only: the AC set, claimed_task_ids, decomposition, design_gap_flag=false, and the verify-banner product decision are all unchanged, so the attempt-1 PASSES stand without re-litigation — 9 falsifiable/independently-verifiable ACs, all four non-happy states covered in edge-cases (wrong creds, duplicate-email, expired/used verify+reset tokens, session expiry with silent refresh, unverified-in-shell, logged-out guarded-route redirect with destination preservation), clean founder-approved scope split to sibling 2a655960 (username/avatar/accent render disabled 'coming soon', no half-built surface, no avatar/storage/billing gold-plating), specialist routing confirmed, deps justified, and the wave ladders to live milestone M1. design_gap_flag=false correctly routes the handoff to B-block (all 6 mockups exist → D-block skips).

## Non-blocking note for the builder (not a gate failure)
P-3 frontend architecture-delta line 5 carries a stale parenthetical on the client-side recipe init (`EmailVerification.init({mode:'REQUIRED'}? no → see decision)`). This is the **frontend** supertokens-auth-react recipe list (governs UI flow presence), a separate concern from the backend global claim default that determines route gating. It does NOT admit the backend fail-open reading — the security-determining mechanism (line 6 + B-2) is unambiguous. Builder should tidy the client-init phrasing at B-0/B-3 SDK-shape confirmation; it is not load-bearing for the security default.

## Handoff
- design_gap_flag: false → B-block (D-block skipped; mockups exist)
- Security-scope tightened gate: satisfied at Phase 1. T-8 (session/cookie/auth-UI) remains mandatory in the T-block per the wave's security scope.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 1

---
## Phase 2 — Karen + jenny + Gemini (merged) — PASS
- **Karen: APPROVE** — all source claims VERIFIED (6 mockups exist; 5 specialists in AGENTS.md; display_name column exists [endpoint only, no migration]; /me uses bare verifySession [per-route override is a real change]; EmailVerification mode:'REQUIRED' confirmed; supertokens-auth-react + react-router-dom genuinely absent; overrideGlobalClaimValidators is a real option; scope-split clean, no half-built backend). No antipatterns.
- **jenny: APPROVE** — no spec-drift; 6/6 items MATCH (auth approach, /me verify-banner UX matches the logged decision + fail-closed convention, scope-split is sequencing-not-cut [2a655960 exists], 6 pages + first-run journey, no M2+ creep, profile API extends single-users-table #5).
- **Gemini: CONCERN (triaged NON-MATERIAL)** — "per-route exceptions complicate the auth model." Triage: the per-route overrideGlobalClaimValidators on exactly /me+/profile against a fail-closed global REQUIRED default IS the standard SuperTokens pattern + the SECURE mechanism head-product mandated over the fail-open OPTIONAL alternative; 2 documented endpoints; auditability preserved. Not material; logged, proceed.
- **B-2 advisory (Karen+jenny, captured for build):** implement the /me+/profile exemption via a DEDICATED/parameterized guard (not by mutating the shared AuthGuard) so the exemption can't leak to future protected routes. jenny N1: use the live route prefix consistent with wave-2 /me. N2: font substitution already accepted (DESIGN-SYSTEM canonical).
GATE: PASS → B-block (D skipped — design_gap_flag=false). T-8 mandatory (security gate).
