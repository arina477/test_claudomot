# Wave 2 — P-3 Plan

## Approach

### Architecture deltas
- **DbModule (new):** Drizzle ORM over node-postgres pool from `DATABASE_URL`. Exposes a typed `db` provider. Alt considered: Prisma (rejected — stack locked on Drizzle for lighter runtime + SQL-first migrations); TypeORM (rejected — heavier, decorator-coupled). Failure domain: new external dependency (Postgres); api must fail-fast if unreachable at boot.
- **AuthModule (new):** `supertokens.init()` (self-hosted core via `SUPERTOKENS_CONNECTION_URI` + `SUPERTOKENS_API_KEY`), recipeList = EmailPassword + EmailVerification + Session. NestJS: SuperTokens middleware (before routes) + `verifySession` guard. UsersModule (new, owns users table): a post-signup hook (EmailPassword `signUpPOST`/`functions` override OR an init `override`) inserts the `users` row (id = SuperTokens userId) via UsersModule. Alt: hand-rolled JWT auth (rejected — recipe defaults give verify/reset/refresh-rotation battle-tested at near-zero marginal cost; the layer you least want to rip out — P-0 ceo-reviewer); managed SuperTokens SaaS (rejected — architecture locked self-hosted: data stays in our Postgres, no per-MAU cost). Failure domain: crosses to the SuperTokens core service; session cookie model is the contract the later Socket.IO WS-upgrade + LiveKit token bridge depend on.
- **SuperTokens core (new infra):** self-hosted `registry.supertokens.io/supertokens/supertokens-postgresql` as a Railway service in project ae55c191, pointed at a Postgres (the same Railway Postgres, separate schema/db, or a dedicated one). Owns its own auth tables.
- **EmailModule (new):** Resend client; wired into SuperTokens via `emailDelivery.override` so EmailVerification + password-reset emails send through Resend (sender = onboarding@resend.dev fallback until domain verified, R-SDK-2).
- **/health:** unchanged (stays anon 200); optionally extend later to reflect DB readiness (not required this wave).

### Data model
- Drizzle `users` (apps/api/src/db/schema/users.ts, UsersModule-owned per architecture decision #5): `id text PK` (= SuperTokens userId), `email text UNIQUE NOT NULL`, `display_name text NULL`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`.
- Migrations: `drizzle-kit generate` → apps/api/drizzle/migrations/*; offline (greenfield, no backfill). Index: unique(email) (constraint).
- SuperTokens core auth tables: managed by the core itself (its own migration on boot) — NOT Drizzle-owned.

### API contracts
- SuperTokens auto-mounted under `/auth/*` (signup, signin, signout, session/refresh, user/email/verify[+token], user/password/reset[+token]) — exact paths per supertokens-node + frontend-SDK contract (SDK-Docs/SuperTokens). Auth model: anon for signup/signin/reset-request; session-cookie for signout/refresh.
- `GET /me` — verifySession-guarded → 200 `{userId,email,emailVerified}` | 401. (MeResponse Zod in packages/shared.)
- Cookies: httpOnly, SameSite=Lax, Secure in prod; anti-CSRF per SuperTokens Lax default.

### New deps (versions verified at build-ahead — SDK-Docs)
- `supertokens-node` ^24.0.2 — self-hosted auth recipes. MIT.
- `resend` ^6.15.0 — transactional email. MIT.
- `drizzle-orm` (latest) + `drizzle-kit` (dev) + `pg` + `@types/pg` (dev) — ORM + migrations + driver. Apache-2.0/MIT.
SDK pre-build checklist: COMPLETE (SDK-Docs/SuperTokens/supertokens.md + Resend/resend.md authored + versions verified at wave-1 build-ahead).

## Plan (file-level, by B-stage)

### B-0 Branch & infra (devops-engineer + orchestrator/railway)
- branch `wave-2-auth-backend`.
- Provision on Railway (project ae55c191, project token): Postgres service; SuperTokens core service (supertokens-postgresql image, DB-backed). Self-provisioned (infra).
- Env (Railway + .env.example): `DATABASE_URL`, `SUPERTOKENS_CONNECTION_URI`, `SUPERTOKENS_API_KEY` (self-gen openssl), `RESEND_API_KEY` (**FOUNDER-supplied — rule 6, requested at B-3 email step**), `WEB_ORIGIN`, `API_DOMAIN`. Secrets self-generated except RESEND_API_KEY.

### B-1 Schema (postgres-pro / backend-developer)
- create apps/api/src/db/{schema/users.ts, index.ts (pool+db), migrations/, seed.ts}; drizzle.config.ts; package.json scripts db:migrate (drizzle-kit migrate / runner) + db:seed (tsx apps/api/src/db/seed.ts — add tsx devDep). Generate initial migration.

### B-2 Contracts (typescript-pro)
- packages/shared/src/auth.ts: MeResponse Zod + type; export from index.

### B-3 Backend (supertokens-integration [auth] ∥ backend-developer [db+email])
- apps/api/src/db/db.module.ts (DbModule) + apps/api/src/users/users.module.ts + users.service.ts (UsersModule, owns users table, creates users row on signup) — backend-developer.
- apps/api/src/email/{email.module.ts, resend.service.ts} — backend-developer.
- apps/api/src/auth/{auth.module.ts, supertokens.config.ts, session.guard.ts, profile-on-signup hook} + emailDelivery→Resend override — supertokens-integration (owns; consumes EmailModule + DbModule).
- apps/api/src/me/me.controller.ts (GET /me, verifySession) — supertokens-integration.

### B-4 Wiring (backend-developer)
- AppModule: import Db/Email/Auth/Me modules. main.ts: SuperTokens middleware before routes; CORS allow credentials + WEB_ORIGIN + ST headers; error filter. Confirm db:migrate/db:seed scripts.

### B-5 Verify / B-6 Review — gates (head-builder).

## Specialist routing (validated vs command-center/AGENTS.md)
supertokens-integration ✓, backend-developer ✓, postgres-pro ✓, typescript-pro ✓, devops-engineer ✓ — all present.

## Parallelization map
- B-1 ∥ B-2 (schema and shared contracts independent).
- B-3: DbModule ∥ EmailModule (independent); AuthModule serializes AFTER both (needs db for users row + email for delivery override); MeController after AuthModule.
- B-4 serial (wiring depends on all B-3 modules).

## Self-consistency sweep
1. All 9 ACs map to steps (signup/verify/login/me/refresh/reset → B-3 auth; migrate/seed → B-1; boot-readiness → B-4). ✓
2. Every step has a specialist. ✓
3. No file in two parallel batches. ✓
4. design_gap_flag=false referenced. ✓
5. Architecture deltas have alt trade-offs. ✓
6. Data+API contracts concrete (no TBD). ✓
7. Deps justified + versioned. ✓
8. SDK pre-build complete. ✓
