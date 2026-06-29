# P-4 Phase 2 — Spec-Drift Verification (jenny)

**Wave:** wave-3 — Auth + profile frontend (M1)
**Spec task:** `9aae8255-34b3-4f63-bdd4-97f39cf1d842`
**Scope of this check:** spec/plan vs prior LOCKED decisions (drift detection), not built-code verification.
**Date:** 2026-06-29

## Verdict: APPROVE

No spec-drift found. Every checked item is either a MATCH against a prior locked decision, an
intentional/founder-approved deferral that is correctly sequenced (not cut), or a consistent
extension of the locked architecture. Two informational notes (non-blocking) below.

---

## Per-item findings

### 1. Auth-frontend approach (supertokens-auth-react custom forms, live backend) — MATCHES
- Spec `sdk` contract: "supertokens-auth-react (frontend): EmailPassword + EmailVerification + Session recipes; ... custom forms matching the mockups; SuperTokensWrapper + SessionAuth route guards." P-3 plan line 5 chooses CUSTOM forms over pre-built UI explicitly because "mockups are custom-designed."
- Locked stack (`_library.md` § Stack L33, § Security L309): "Auth: SuperTokens Core ... Client SDK (`supertokens-auth-react`) ... Recipes: EmailPassword + EmailVerification + Session." Frontend is "Vite 5 + React 19 SPA" (L27).
- Product-decision [2026-Q2 Tech stack selected]: Vite+React SPA frontend confirmed.
- **No drift.** SDK, recipe set, and SPA target all match the locked stack. Custom-forms-over-prebuilt is the correct call given the design system mandates pixel-reference mockups.

### 2. /me verify-banner UX (unverified reach shell; per-route override; global stays REQUIRED) — MATCHES
- Spec AC 8 + `sdk`/`api` contracts: keep global EmailVerification `mode:'REQUIRED'` (fail-closed default for ALL future protected routes); exempt ONLY `/me` + `/profile` PER-ROUTE via `overrideGlobalClaimValidators:()=>[]`; do NOT switch to OPTIONAL (fail-open). Verification emails still send.
- Product-decision [2026-06-29 /me email-verification gating]: "Authenticated-but-unverified users CAN reach the app shell, shown a persistent 'verify your email' banner; backend exempts /me + app-shell routes from the global SuperTokens EmailVerification REQUIRED claim." Logged exactly as the spec implements it.
- Security convention (`security.md` L90-93): "verifySession() guard on every protected REST route ... Email-verification-gated actions (joining a server, posting) additionally check the EmailVerification claim." The spec's design — global REQUIRED default + narrow per-route exemption — is the correct fail-closed reading: future sensitive routes inherit gating automatically; only the two read/profile endpoints needed for first-run activation are opened.
- **No drift.** This is the rare case where the prior architecture left the gating model as a convention and the new product-decision resolved it; the spec matches the decision verbatim and does NOT weaken the fail-closed posture (it keeps REQUIRED global, narrows the exemption to two named routes, and forbids the OPTIONAL/fail-open shortcut). The plan (P-3 L29) and spec both explicitly forbid flipping to OPTIONAL — this is the load-bearing guard against drift toward fail-open.

### 3. Scope split (display_name this wave; username/avatar/accent → 2a655960) — MATCHES (intentional deferral, correctly sequenced)
- Spec scope prose + AC 6: "auth pages + display_name profile editing only ... Username/avatar/accent ... split to sibling task 2a655960 ... those controls render as 'coming soon' here."
- Task `2a655960-a429-432d-8633-e8f149368ca3` ("Profile customization backend + avatar upload") confirmed to EXIST in `tasks` with `status='todo'`, `parent_task_id IS NULL`. The split target is real, not a phantom reference.
- M1 milestone `## Scope` prose lists "user/profile module (display name, username, avatar, accent color)" as full M1 scope, and names exactly the 6 pages this wave builds. Username/avatar/accent therefore remain INSIDE M1 — deferring them to a later M1 wave is sequencing, not a milestone cut.
- Product-decision [2026-06-29] § Wave-3 scope split: "auth pages + display_name profile this wave; username/avatar-upload/accent-color split to task 2a655960 (next wave)" — labelled founder-approved. Spec matches.
- **No drift.** This is an intentional, founder-approved, correctly-tracked deferral. The full M1 capability is preserved across `9aae8255` + `2a655960`.

### 4. 6 pages + first-run journey (signup→verify→profile→app-home) — MATCHES
- Spec ACs 1-6 + AC 9 cover landing, signup, login, forgot-password (+reset-token), email-verify, settings-profile, ending "signup → (verify) → profile (set display name) → lands in the empty app home."
- Journey map F1 (Sign up & create profile): "`/signup` → `/verify` → `/settings/profile` (first-run) → `/app`" — identical ordering. Pages 1,4,5,6,7,15 in the page inventory map 1:1 to the 6 spec pages.
- M1 `## Scope` / `## Success metric`: "Founder can sign up, verify email, set a profile, and load the dark app shell" — the spec's end-to-end AC is the milestone's success metric.
- All 6 mockups confirmed present in `design/` (landing, signup, login, forgot-password, email-verify, settings-profile .html).
- **No drift.** First-run journey, page set, and milestone intent are aligned.

### 5. No M2+ scope pulled forward; no avatar/storage creep — MATCHES
- Spec `data` contract: "no schema change this wave"; explicitly defers `username/avatar_url/accent_color` to 2a655960. No servers/channels/messaging/voice endpoints or pages in scope. The app-home landing is the "empty app shell" only.
- No FilesModule / Railway Buckets / `AWS_*` storage wiring appears in spec or plan (avatar upload is what 2a655960 owns). P-3 plan § Self-consistency L44: "No avatar/username/accent (split 2a655960)."
- **No drift / no creep.** Servers (M2), messaging (M3), voice (M6) all stay out. Storage stays with the deferred task.

### 6. Profile API (GET/PATCH /profile display_name) consistent with single-users-table (decision #5) — MATCHES (extends, doesn't fork)
- Spec `api`: "GET /profile (verifySession) → {displayName}; PATCH /profile {displayName} → 200." P-3 plan L10: "UsersService gains updateDisplayName(id, displayName)." Reads/writes `display_name` on the existing `users` table.
- `_library.md` Resolved decision #5 (L572): "single `users` table — ... owned by UsersModule. No separate profiles/privacy_settings tables." UsersModule (L56) "Owns `users` table." The profile endpoints route through UsersService against the one `users` table.
- Spec `data` confirms "display_name column exists" — no new table, no schema change.
- **No drift.** The profile API extends UsersModule/`users` per decision #5; it does not introduce a separate profiles table or fork ownership.

---

## Informational notes (non-blocking, not drift)

- **N1 — endpoint path prefix.** `_library.md` § Services L98 states "All REST routes prefixed `/api/v1`." The spec writes `/profile` and `/me` without the `/api/v1` prefix in shorthand. Wave-2 `/me` already shipped, so the effective prefix is established at B-block; this is shorthand notation in the spec, not a routing decision that conflicts with the prior convention. Flagging only so B-block applies the project's actual established prefix consistently with the live `/me`. **Not spec-drift.**
- **N2 — mockup font substitution.** `settings-profile.html` uses Outfit/DM Mono rather than Geist (noted in product-decision [2026-Q2 Per-page designs complete]: aidesigner font substitution, resolved by Geist override at build; "mockups are reference, not pixel-copy" and `DESIGN-SYSTEM.md` is canonical). The settings-profile mockup correctly contains username/avatar/accent controls, which the spec renders as disabled/'coming soon' — consistent with the split. **Not spec-drift** (already a logged, accepted design-decision).

---

## Classification summary

| Item | Result | Type |
|------|--------|------|
| 1. Auth-frontend approach | MATCHES | — |
| 2. /me verify-banner UX | MATCHES | — |
| 3. Scope split (display_name) | MATCHES | intentional-deferral (correctly sequenced) |
| 4. 6 pages + first-run journey | MATCHES | — |
| 5. No M2+ / no storage creep | MATCHES | — |
| 6. Profile API vs decision #5 | MATCHES | spec-extends-architecture |

No DRIFTS. No spec-gaps. Two intentional deferrals (display_name split; no schema change), both tracked to task 2a655960 and preserved within M1 scope.
