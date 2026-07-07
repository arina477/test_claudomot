# Wave 72 — B-4 Wiring

## Repo-wide typecheck
- `pnpm typecheck` (turbo, all 3 packages) → **4/4 successful, 0 errors**. No B-2↔B-3 contract drift.

## Route registration
- **Backend:** `POST /profile/delete` via `PrivacyController` → `PrivacyModule` (imported in `app.module.ts:55` since wave-35). Route mounts.
- **Client:** `api.deleteAccount()` in `apps/web/src/auth/api.ts`; `DangerZonePanel` calls it.
- No new frontend routes — Danger Zone lives within existing `/settings/privacy`.

## Env wiring
- No new env vars this wave.

## Import sanity
- Covered by repo typecheck. Clean. (Note: a rollup CJS-interop pitfall on a second value-import from @studyhall/shared surfaced at B-5 build, not typecheck — fixed by consolidating to one import.)

```yaml
typecheck_passed: true
routes_registered: [POST /profile/delete]
env_vars_wired: []
drift_defects: []
```
