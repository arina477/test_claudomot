# Wave 2 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, B-6 gate reviewer)
**Reviewed against:** process/waves/wave-2/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale
The auth backend implements the locked contract faithfully and holds the security
surface at every door I inspected. The single protected route (`GET /me`) is guarded
by `verifySession()` via `AuthGuard` (server-side, reads `userId` from the session —
never from body/query); `supertokens.init()` is called exactly once at `onModuleInit`;
SuperTokens middleware is mounted `forRoutes('*')` at module level (runs before route
handlers) and CORS is configured in `main.ts` before `listen()` with `credentials: true`
and a parsed `WEB_ORIGIN` allowlist (no wildcard). Session cookies use
`cookieSameSite: 'lax'` + `cookieSecure` gated on `NODE_ENV === 'production'`, with the
SDK's httpOnly defaults intact and no token ever exposed to JS storage. The `MeResponse`
Zod schema in `@studyhall/shared` is the single contract and the controller returns its
exact shape; the Drizzle `users` table matches the spec (text PK = SuperTokens userId,
`email` UNIQUE), with a generated+committed migration (`0000_breezy_bedlam.sql`) and no
startup auto-migrate. Resend failures are logged-not-thrown so they cannot roll back
signup, and an absent `RESEND_API_KEY_AUTH` degrades gracefully (`resend = null`, no
crash at construction). Secret scan of the diff is clean — every credential
(`RESEND_API_KEY_AUTH`, `SUPERTOKENS_API_KEY`, `SUPERTOKENS_CONNECTION_URI`) is read
from `process.env` only. G-1 atomicity is implemented on the sanctioned override path:
the `users` insert runs inside the EmailPassword `signUp` override, so a DB failure
propagates and fails the signup request before a session is issued; `createUserIfNotExists`
uses `onConflictDoNothing()` for re-delivery idempotency. B-5 reports lint/typecheck/
build/test all green; the dev-server smoke deferral is legitimate (the self-hosted Core
sits on Railway's private network, unreachable from the sandbox) and real boot verifies
at C-2. Scope is held to SuperTokens recipe defaults — no MFA/OAuth/roles gold-plating.
Two non-blocking observations are recorded below as accepted-debt for the V/T blocks to
confirm; neither is a load-bearing defect that breaks the contract or opens a door.

## Accepted-debt (non-blocking — route to V-block / T-8 for confirmation, NOT rework)

- **G-1 residual orphan-auth-user window (severity: low, spec-sanctioned path chosen).**
  `original.signUp()` commits the auth user in SuperTokens Core *before* the override's
  DB insert runs. If the `users` insert throws, the signup request fails (no session
  issued — so no authenticated orphan), but the Core-side auth user persists; a later
  successful signin would reach `/me` and hit a 404 (`findById` returns undefined →
  `NotFoundException`). The spec explicitly accepts the override path ("insert inside the
  signUp override so a DB failure fails the signup") — which is implemented — OR a lazy
  self-heal at `/me`. The cleaner belt-and-suspenders close is to make `/me` self-heal
  (`createUserIfNotExists` on a missing row) so the residual window cannot surface as a
  404. Recommend the V-block flag this to UsersModule for a one-line self-heal; not gating
  here because the chosen leg is contract-compliant and no orphan *session* is ever issued.

- **`/me` is email-verification-gated by the global REQUIRED claim validator
  (severity: informational).** `EmailVerification.init({ mode: 'REQUIRED' })` registers a
  global validator, so `verifySession()` (and thus `/me`) returns 403
  `EMAIL_NOT_VERIFIED` for unverified users. This is correct and intended, and login
  itself is unaffected (login is an SDK route, not behind `verifySession`), consistent
  with the spec's "login before email verified: permitted." Noting it so the frontend
  wave and T-8 expect a 403 (not 200) on `/me` for an authenticated-but-unverified user.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
