# Wave 35 — B-2 Backend

3 specialists, parallel (non-overlapping file scopes). All typecheck + Biome clean.

## node-specialist — privacy module (56a50862 + a4169fac)
Files: `apps/api/src/privacy/{privacy.service,account-data.service,privacy.controller,privacy.module}.ts`. All routes `@Controller('profile')` + `SessionNoVerifyGuard` + `req.session.getUserId()` (NO userId param → IDOR-safe). GET/PUT /profile/privacy; GET /profile/data; GET /profile/data/export (`@Header` Content-Disposition attachment — `@types/express` absent, `@Header` is the idiomatic type-safe choice). activitySummary minimal (serversJoined + accountCreatedAt). PrivacyModule NOT registered in app.module (→ B-4). Commit `22ba39d`.

## node-specialist — roster enforcement (56a50862)
`apps/api/src/servers/servers.service.ts` listServerMembers: added `profileVisibility` to internal SELECT; post-query filter `r.profileVisibility !== 'nobody' || r.userId === userId` (caller always sees self; everyone/server-members visible as co-member-scoped). Response shape UNCHANGED (ServerMemberSchema; email still fallback-only, not emitted). Member-gate (403) intact. Commit `7e94ea9`.

## devops-engineer — Sentry api (d40ece71)
`apps/api/src/instrument.ts` (NEW): Sentry.init, dsn auto-read (no-op when SENTRY_DSN unset — credential-independent), sendDefaultPii:false, no tracesSampleRate, no dataCollection key, beforeSend PII scrub (delete user.email/username/ip_address + request.data/cookies), `if NODE_ENV!=='test'` guard. `main.ts`: `import './instrument'` as line 1 (before all). `auth.exception.filter.ts`: `@SentryExceptionCaptured()` on SupertokensExceptionFilter.catch() (no competing SentryGlobalFilter). SentryModule.forRoot omitted (tracing off). Commit `90047e6`.

## Deviations (all ACCEPT — minor, within scope)
- privacy: `@Header` for export (no @types/express) — idiomatic. shared dist rebuilt (compile artifact, not committed).
- roster: post-query filter vs WHERE (caller-sees-self is a JS var; cleaner, no extra Drizzle imports).
- Sentry: `delete` + `biome-ignore` (exactOptionalPropertyTypes forbids `=undefined`; delete is semantically correct per SDK doc).

## Commit discipline note (for B-6)
Privacy module commit `22ba39d` cites both 56a50862 + a4169fac: the controller genuinely serves both the settings-privacy surface (seed) and its data-rights extension (sibling) on the same surface — one cohesive module, not sloppy cross-spec mixing. head-builder to ratify.

```yaml
skipped: false
specialists_spawned: [node-specialist x2, devops-engineer]
files_implemented: [apps/api/src/privacy/*, apps/api/src/servers/servers.service.ts, apps/api/src/instrument.ts, apps/api/src/main.ts, apps/api/src/auth/auth.exception.filter.ts]
deviations: [{privacy: "@Header export + dist rebuild", accept}, {roster: "post-query filter", accept}, {sentry: "delete+biome-ignore", accept}]
simplify_applied: true   # specialists kept files minimal + Biome-clean
commits: [22ba39d, 7e94ea9, 90047e6]
```
