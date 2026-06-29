# V-1 Source-Claim Verification (Karen) — Wave 3: Auth + Profile Frontend

**Task:** 9aae8255-34b3-4f63-bdd4-97f39cf1d842 (folds in a3328023 verify-gating)
**Verdict:** **APPROVE**
**Method:** Independent — code read on `main @ 3af9873` (HEAD; eed4c3c is its parent), all live endpoints curled against the deployed Railway web + api. No claim accepted on assertion alone.

> Note: prompt referenced "main @ eed4c3c", but local `main` HEAD is `3af9873` (the T-block commit, parent = eed4c3c). Both carry the same fixes; verification done against the actual deployed HEAD.

---

## Findings (claim → evidence)

### F1 — Files exist on main. CONFIRMED.
All claimed source present:
- `apps/web/src/auth/{supertokens.ts, AuthGuard.tsx, GuestGuard.tsx, api.ts}`
- `apps/web/src/pages/{Landing, Signup, Login, ForgotPassword, ResetPassword, EmailVerify, Profile, AppHome}*.tsx` + `auth-pages.test.tsx`
- `apps/web/src/router.tsx`, `apps/web/src/components/VerifyEmailBanner.tsx`
- `apps/api/src/profile/profile.controller.ts`, `apps/api/src/auth/session-no-verify.guard.ts`
- `packages/shared/src/profile.ts`

### F2 — Deploy serves. CONFIRMED.
- web `/` → 200 (SPA shell, `<html class="dark">`, StudyHall title)
- web `/login` → 200, web `/signup` → 200 (client routes serve index)
- api `/health` → 200 `{"status":"ok","service":"studyhall-api","version":"0.1.0"}`

### F3 — Live auth behavior. CONFIRMED end-to-end against live backend.
Real signup `varina-v1-1782727508@example.com` (st-auth-mode:cookie, rid:emailpassword):
- signup → **200**, `status:OK`, user row created (id `324e56c8-...`, `verified:false`)
- `GET /me` with session → **200** `{userId, email, emailVerified:false}` — the a3328023 per-route claim relax works (unverified user reaches the route)
- `GET /profile` with session → **200** `{displayName:null}`
- **PATCH /profile valid** `{"displayName":"Varina Test"}` → **200**; `GET /profile` after → `{"displayName":"Varina Test"}` — **persists**
- **PATCH /profile empty** `{"displayName":""}` → **400** `{fieldErrors:{displayName:["String must contain at least 1 character(s)"]}}` — **the T-8 fix is live** (400, not 502/500)
- `GET /me`, `GET /profile`, `PATCH /profile` **without session → 401** `{"message":"unauthorised"}` (all three)

Anti-csrf: cookie-mode jar had no `sAntiCsrf` token and PATCH succeeded without the header — backend is not enforcing anti-csrf as a hard gate for cookie-mode in this config. Behavior matches SuperTokens cookie-mode defaults; not a regression and not in scope to reject. Noted for the security follow-up tracking.

### F4 — The four fixes are real (code-verified). CONFIRMED.
1. `packages/shared/package.json` — `main`, `types`, and `exports["."]` all point to `./dist/...` (NOT `src`). Matches PR #6.
2. `profile.controller.ts` — `BadRequestException` is a **static top-of-file import** (`@nestjs/common`), used synchronously in `updateProfile`. No dynamic `await import`. Matches PR #7/#8.
3. `auth.exception.filter.ts` — handles `err instanceof HttpException` directly (`res.status(err.getStatus()).json(err.getResponse())`), with documented rationale that `BaseExceptionFilter` can't be used under `useGlobalFilters(new ...)`. Not a rethrow. Matches eed4c3c.
4. `EmailVerification.init({ mode: 'REQUIRED' })` unchanged (supertokens.config.ts:67). `SessionNoVerifyGuard` (overrideGlobalClaimValidators:()=>[]) applied **only** on `/profile` (both GET+PATCH) and /me — global default stays fail-closed REQUIRED for future routes.
   - `UpdateProfileSchema = z.object({ displayName: z.string().min(1).max(50) })` — drives the 400.

### F5 — Antipatterns / claimed-but-fake. NONE FOUND.
- PRs #5–#8 are **real MERGED PRs** (gh: merged 09:27 / 09:40 / 09:51 / 09:56 on 2026-06-29).
- VerifyEmailBanner is **actually wired**, not a phantom component: `AppHome.tsx:26` computes `showBanner = !bannerDismissed && me !== null && !me.emailVerified` and `:30` renders `{showBanner && <VerifyEmailBanner .../>}`. Driven by live `GET /me`. UX claim holds.
- EmailVerifyPage has real error handling (`catch → setVerifyState('error')`, invalid-token → ErrorBanner + resend button, no crash). LoginPage handles `WRONG_CREDENTIALS_ERROR` + `FIELD_ERROR` inline.

---

## Process finding (flag, NOT a reject)

- **PROCESS-1 (Medium):** Commit `eed4c3c` (the F3 exception-filter fix) was **direct-pushed to main, bypassing PR** — `gh pr list --search eed4c3c` returns `[]`; it exists only on `refs/remotes/origin/main`. The other four wave fixes went through PRs #5–#8. This bypasses CI-gated review on a security-surface (auth exception handling) file. The code itself is correct and verified live, so it does not block the wave, but the merge-discipline deviation should be logged. Recommend the L-block note it and C-block confirm branch protection going forward.

## Legit deferrals (confirmed in-scope, not flagged)
rate-limit 839af17f, Resend sandbox domain a1299e88, browser-E2E c51589cd, username/avatar/accent → 2a655960. All match the spec's documented split/deferral language. Correct.

---

## Bottom line
Every acceptance-relevant claim verified against live deployed state, not assertions. Signup → session → /me (unverified-allowed) → /profile read → display-name PATCH (persists) → empty-name rejected with 400 → unauth 401 all behave per spec. The four fixes are genuinely present in shipped code and confirmed in live behavior. The verify-banner UX is real and wired. No fake completions. One process deviation (direct-push of eed4c3c) flagged for L/C blocks but non-blocking.

**APPROVE.**
