# Wave 35 — B-4 Wiring

## Action 1 — Repo-wide typecheck
`turbo run typecheck` (shared + api + web) → **4/4 successful, zero errors**. No B-2↔B-3 contract drift. router.tsx→SettingsPrivacyPage import resolves.

## Action 2 — Route registration
- **Backend:** `PrivacyModule` registered in `apps/api/src/app.module.ts` imports (was deferred from B-2 — completed here by node-specialist; import alphabetical, appended after VoiceModule). GET/PUT /profile/privacy + GET /profile/data + /profile/data/export now served. Committed.
- **Frontend:** router.tsx registers /settings/privacy (AuthGuard) + /privacy + /terms; LandingPage footer links to /privacy + /terms (B-3). Verified present.

## Action 3 — Env wiring
- `SENTRY_DSN` (api instrument.ts), `VITE_SENTRY_DSN` (web instrument.ts) — consumed where planned. `.env.example` placeholders present (both, B-0). No unguarded access: both no-op when unset (credential-independent build verified).

## Action 4 — Import sanity
- Covered by repo typecheck (Action 1) — clean.

```yaml
typecheck_passed: true
routes_registered: [GET/PUT /profile/privacy, GET /profile/data, GET /profile/data/export, /settings/privacy, /privacy, /terms]
env_vars_wired: [SENTRY_DSN, VITE_SENTRY_DSN]
drift_defects: []
