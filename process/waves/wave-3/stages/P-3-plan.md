# Wave 3 — P-3 Plan

## Approach
### Architecture deltas
- **apps/web (frontend):** add `supertokens-auth-react` — `SuperTokens.init({ appInfo:{apiDomain:VITE_API_ORIGIN, websiteDomain, apiBasePath:'/auth'}, recipeList:[EmailPassword.init(), EmailVerification.init({mode:'REQUIRED'}? no → see decision), Session.init()] })` + `<SuperTokensWrapper>`. Add React Router (the wave-1 shell was a single view → add `react-router-dom`) with routes for the 6 pages + the app shell, guarded by `<SessionAuth requireAuth>`. Alt: SuperTokens pre-built UI (faster, but mockups are custom-designed) → use CUSTOM forms wired to the recipe functions (signIn/signUp/verifyEmail/sendPasswordResetEmail/submitNewPassword) so they match design/*.html exactly. Failure domain: client-only; the live backend is unchanged except the two additions below.
- **apps/api (backend, small):** ProfileController `GET /profile` + `PATCH /profile` (verifySession; display_name via UsersService.updateDisplayName — new method). **/me + app-shell EmailVerification claim relax (a3328023):** remove the global EmailVerification claim requirement so verifySession-guarded /me + /profile return 200 for unverified users (emailVerified:false); EmailVerification recipe stays (verify emails still send); per the verify-banner UX decision.
- **packages/shared:** ProfileResponse {displayName} + UpdateProfileRequest {displayName} Zod.

### Data model
No schema change (display_name column exists; username/avatar_url/accent_color deferred to 2a655960). UsersService gains updateDisplayName(id, displayName).

### API contracts
- GET /profile (verifySession) → 200 {displayName} | 401.
- PATCH /profile {displayName:string (1..50)} (verifySession) → 200 {displayName} | 400 (zod) | 401.
- /me (verifySession, claim relaxed) → 200 {userId,email,emailVerified} for verified AND unverified.
- SuperTokens /auth/* — already live.

### Deps
- `supertokens-auth-react` (^latest, matches supertokens-node 24 backend) — frontend auth SDK. MIT.
- `react-router-dom` (^6/7) — routing for the 6 pages + guards (shell had none). MIT.
SDK pre-build: supertokens-auth-react pairs with the live supertokens-node; verify init/recipe API + apiBasePath '/auth' match the backend. (SDK-Docs/SuperTokens covers the backend; confirm the react SDK init shape at B-0.)

## Plan (file-level, by B-stage)
### B-0 (branch+deps) — devops/orchestrator
branch wave-3-auth-frontend; `pnpm --filter @studyhall/web add supertokens-auth-react react-router-dom`; web env VITE_API_ORIGIN (the live api URL) in .env.example. No schema.
### B-1 contracts — typescript-pro
packages/shared/src/profile.ts: ProfileResponse + UpdateProfileRequest Zod + exports.
### B-2 backend — supertokens-integration (claim relax) ∥ backend-developer (profile)
- apps/api/src/auth/supertokens.config.ts: relax EmailVerification global claim (so /me + /profile don't 403 unverified) — supertokens-integration.
- apps/api/src/profile/{profile.controller.ts (GET/PATCH, verifySession),profile.module.ts} + UsersService.updateDisplayName — backend-developer.
### B-3 frontend — react-specialist (pages/routing) + supertokens-integration (auth SDK wiring)
- apps/web: supertokens config + SuperTokensWrapper + recipe init; router (routes + SessionAuth guards); 6 pages from mockups (landing, signup, login, forgot-password, email-verify, settings-profile[display_name + disabled username/avatar/accent 'coming soon']); verify-email banner component; profile form → /profile.
### B-4 wiring — frontend-developer
router mount in main/App; env wiring (VITE_API_ORIGIN); CORS already allows web origin (wave-2). Confirm cookie-based session across origins.
### B-5 verify / B-6 review — gates.

## Specialist routing (validate vs AGENTS.md)
react-specialist, frontend-developer, supertokens-integration, backend-developer, typescript-pro — confirm present.

## Parallelization
B-1 standalone. B-2 (backend: profile + claim-relax) BEFORE B-3 (frontend consumes /profile + relaxed /me). Within B-2: claim-relax ∥ profile-endpoint. B-3 pages can parallelize across independent pages once the SDK config + router skeleton exist (serial: config/router → pages).

## Self-consistency
All 9 ACs → steps (pages→B-3; /profile→B-2; verify-gating→B-2 claim-relax+B-3 banner; routing→B-3/B-4; end-to-end→all). design_gap_flag=false referenced. Contracts concrete. Deps justified. No avatar/username/accent (split 2a655960).
