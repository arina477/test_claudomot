# Wave 3 — B-2 Backend (supertokens-integration). Commit 6296252.
- **SessionNoVerifyGuard** (new, auth/session-no-verify.guard.ts): verifySession({overrideGlobalClaimValidators:()=>[]}) — strips ONLY the EmailVerification claim; session validity still fully checked. Applied to GET /me + GET/PATCH /profile ONLY.
- Shared AuthGuard UNCHANGED (full global claims); EmailVerification.init mode:'REQUIRED' UNCHANGED (global fail-closed for all future routes). Security invariant held (Karen+jenny advisory satisfied).
- ProfileModule: GET /profile + PATCH /profile (display_name, UpdateProfileSchema-validated) via UsersService.updateDisplayName (Drizzle update); userId from session only. Route prefix matches live /me (no /api/v1).
- MeController: now uses SessionNoVerifyGuard → /me returns 200 {userId,email,emailVerified:false} for unverified (resolves a3328023; emailVerified field now meaningful).
- Fixed pnpm-workspace.yaml browser-tabs-lock placeholder (was blocking install).
- build/typecheck/lint clean.
```yaml
files: [packages/shared/src/profile.ts, apps/api/src/auth/session-no-verify.guard.ts, apps/api/src/profile/*, apps/api/src/users/users.service.ts(updateDisplayName), apps/api/src/me/me.controller.ts, app.module.ts]
security_invariant: "shared AuthGuard untouched; global EmailVerification REQUIRED kept; no-verify guard only on /me+/profile"
resolves: [a3328023]
```
