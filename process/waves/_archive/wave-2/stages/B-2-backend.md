# Wave 2 — B-2 Backend (supertokens-integration)
Full NestJS auth backend. Commit f89f1b6.
- UsersModule (users.service createUserIfNotExists idempotent upsert + findById; owns users table).
- EmailModule (ResendService over RESEND_API_KEY_AUTH; EMAIL_FROM/onboarding@resend.dev fallback; graceful no-op + warn if key absent).
- AuthModule (supertokens.config init: framework express, connectionURI+apiKey from env, appInfo /auth base, recipeList EmailPassword[signUp functions override → UsersService.createUserIfNotExists for G-1] + EmailVerification(REQUIRED) + Session(cookieSameSite lax, cookieSecure prod); emailDelivery override → EmailModule/Resend for verify+reset; NestJS middleware (supertokens-node/framework/express `middleware`), verifySession guard (recipe/session/framework/express), SupertokensExceptionFilter). init once in onModuleInit.
- MeController GET /me (verifySession) → MeResponse {userId,email,emailVerified} | 401.
- main.ts: CORS allow-credentials + WEB_ORIGIN allowlist + getAllCORSHeaders; global ST exception filter. AppModule imports Auth+Me.
- **G-1 atomicity:** signUp override calls original.signUp then createUserIfNotExists; DB failure propagates → signup fails (no orphan auth user, no cookie set); upsert idempotent on re-delivery.
- typecheck + lint clean on new files.
```yaml
files: [packages/shared/src/auth.ts, apps/api/src/{users,email,auth,me}/*, app.module.ts, main.ts]
g1_atomicity: "signUp functions override → createUserIfNotExists; DB-fail aborts signup"
deviations: ["EmailVerificationClaim getClaimValue is boolean (claimValue??false)", "middleware from supertokens-node/framework/express", "no @types/express → minimal local req interfaces", "biome unsafeParameterDecoratorsEnabled:true for NestJS decorators", "biome-ignore useImportType on DI services"]
carry_to_b5: "4 pre-existing B-0 lint issues to fix: drizzle.config.ts computed-key, schema/users.ts import order, seed.ts unused import + console.log"
```
