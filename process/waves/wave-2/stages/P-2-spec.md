# Wave 2 — P-2 Spec (pointer)
**Source of truth:** `tasks` row `b9118041-06c0-4478-9d15-dfc715e3b97a` `.description` (YAML head + `---` + prose). single-spec.

## Acceptance criteria (copy for P-3/P-4 reference)
1. Signup (valid email+pw) → 200 + httpOnly SameSite=Lax session cookies + users row created.
2. Signup sends a Resend verification email (ST email-verification token link).
3. Verify link consumes token → email marked verified; used/expired token → handled failure, not 500.
4. Login correct creds → 200 + fresh cookies; wrong creds → WRONG_CREDENTIALS field response (no stack trace).
5. verifySession-guarded GET /me → 401 without session, 200 {userId,email,emailVerified} with.
6. Session refresh rotates access+refresh; revoked/expired refresh → 401 + clears session.
7. Password reset request → Resend email; valid token + new pw → login works; invalid/expired → handled failure.
8. `pnpm db:migrate` applies Drizzle migrations + `pnpm db:seed` runs idempotently, exit 0 vs reachable Postgres.
9. api boots only when Postgres + SuperTokens core reachable; /health stays 200.

Contracts/edge-cases/SDK deps: see task description YAML head. design_gap_flag=false. Security-scope tightened gate APPLIES → T-8 runs.
