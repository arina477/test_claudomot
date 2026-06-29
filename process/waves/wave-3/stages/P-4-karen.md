# P-4 Karen — Source-Claim Verification (wave-3 auth-frontend, PRE-build)

**Verdict: APPROVE**

Spec task `9aae8255-34b3-4f63-bdd4-97f39cf1d842` + `process/waves/wave-3/stages/P-3-plan.md`
verified against the live codebase. Every load-bearing source-claim is grounded in
real files; no claimed-but-fake artifacts, no architecture-blind assumptions, no
gold-plating. This is a PRE-build verification — it confirms the spec/plan rest on
true premises, not that the wave is built.

---

## Per-claim findings

### Claim 1 — The 6 named mockups exist in design/ — **VERIFIED**
All six present and titled for the intended page:
- `design/landing.html` — `StudyHall — Replace Notion + Discord.`
- `design/signup.html` — `StudyHall - Create your account`
- `design/login.html` — `StudyHall — Log in`
- `design/forgot-password.html` — `StudyHall — Password Recovery`
- `design/email-verify.html` — `Verify Email | StudyHall`
- `design/settings-profile.html` — `Settings — Profile — StudyHall`

`design_gap_flag: false` and "all 6 mockups exist → D-block skips" are both correct.

### Claim 2 — All 5 specialists exist in AGENTS.md — **VERIFIED**
`command-center/AGENTS.md`: `backend-developer` (L70), `frontend-developer` (L71, L86),
`supertokens-integration` (L79), `react-specialist` (L82), `typescript-pro` (L83).
All present; routing in P-3 §"Specialist routing" is honest.

### Claim 3 — Backend truth (3 sub-claims) — **VERIFIED**
- **`display_name` column exists** → `apps/api/src/db/schema/users.ts:7` —
  `display_name: text('display_name')`. Profile editing needs only a new endpoint +
  `UsersService.updateDisplayName`, NOT a migration. "No schema change this wave" is true.
- **Current /me uses bare verifySession** → `apps/api/src/me/me.controller.ts:25`
  uses `@UseGuards(AuthGuard)`; `apps/api/src/auth/auth.guard.ts:15` calls
  `verifySession()` with NO options object. Because global `EmailVerification`
  is `REQUIRED`, this guard currently rejects unverified users with 403. So adding
  per-route `overrideGlobalClaimValidators:()=>[]` is a REAL behavioral change
  (unverified would otherwise be blocked), not a duplicative no-op. The plan is accurate.
- **EmailVerification mode is `REQUIRED`** → `apps/api/src/auth/supertokens.config.ts:67`.
  Confirmed. Keeping it global-REQUIRED + per-route exemption (fail-closed-by-default,
  exempt-by-exception) is exactly what the spec/plan describe.

### Claim 4 — SDK plausibility (4 sub-claims) — **VERIFIED**
- **supertokens-auth-react pairs with supertokens-node 24** → `apps/api/package.json`
  pins `supertokens-node: ^24.0.2`; SDK doc `command-center/dev/SDK-Docs/SuperTokens/supertokens.md:9,477,480`
  names `supertokens-auth-react` as the companion frontend SDK. Correct pairing.
- **apiBasePath '/auth' matches backend** → backend `supertokens.config.ts:23` sets
  `apiBasePath: '/auth'`; SDK doc L274/L493 confirms `/auth` as the value. Match.
- **react-router-dom is not yet a web dep** → `apps/web/package.json` has react/react-dom
  only; no `react-router-dom`, no `supertokens-auth-react`. Adding both at B-0 is real work.
- **overrideGlobalClaimValidators is a real verifySession option** → SDK doc
  L138, L568 documents `verifySession({ overrideGlobalClaimValidators: () => [] })`
  as the supported way to strip the email-verification validator per-route. Real API.

### Claim 5 — Scope split is clean (no half-built backend) — **VERIFIED**
`users.ts` has ONLY `id, email, display_name, created_at, updated_at` — no
`username`, `avatar_url`, or `accent_color` columns exist. The split to sibling
`2a655960` is genuine: there is no half-built backend for those fields claimed this
wave, and no object-storage/avatar work appears in the P-3 plan. The
settings-profile mockup DOES render username/avatar/accent controls (grep: 32×
username, 24× avatar, 28× accent), which is why the spec correctly says they
"render but are disabled/'coming soon'" — UI present, backend deferred. Consistent.

### Claim 6 — Antipatterns — **NONE FOUND**
- *Claimed-but-fake*: none — every referenced file/column/option was located.
- *Architecture-blind*: none — the plan correctly identifies the wave-1 shell had no
  router (justifies adding react-router-dom) and that the AuthGuard is the shared
  guard the per-route override must target.
- *Gold-plating*: none — backend additions are minimal (one controller, one service
  method, two Zod types); no avatar/storage/username scope leaked in.

---

## Legit deferrals (confirmed, not flagged)
- Rate-limit `839af17f`, Resend domain `a1299e88`, profile-customization `2a655960` —
  all tracked as follow-ups in spec/plan; correctly out of this wave.

## Note for the build (not a blocker, advisory for B-2)
The per-route exemption must be wired so it applies to the `/me` + `/profile`
controllers WITHOUT weakening the shared `AuthGuard` for future protected routes.
The current `AuthGuard` (`auth.guard.ts`) calls a bare `verifySession()` and is
reused via `@UseGuards`. B-2 should either parameterize the guard (e.g. a
`@PublicVerification()` decorator / guard variant passing `overrideGlobalClaimValidators:()=>[]`)
or add a dedicated guard for the two exempt routes — NOT mutate the global guard.
The spec/plan intent ("/me + /profile ONLY") is correct; this is an implementation
caution so the exemption doesn't silently leak to every guarded route.

**Verdict: APPROVE** — spec + plan rest on verified-true source claims; safe to build.
