# V-1 — Source-Claim Verification (Karen) — wave-35 privacy controls (M7)

Stage: V-1 (Review) · Block: V (Verify) · Reviewer: karen
Scope: verify wave-35 load-bearing claims are TRUE **in the LIVE DEPLOYED state** (merge `0c71585`). NOT a diff re-review (that was B-6).
Deployed under test: web `https://web-production-bce1a8.up.railway.app` · api `https://api-production-b93e.up.railway.app`

## VERDICT: APPROVE

Every load-bearing claim the wave rests on is TRUE against the deployed state. Files exist at merge `0c71585`, the named exports are present, the api routes are registered and live (401 not 404), the migration is committed + verified-in-prod per C-2, the served web bundle carries wave-35 change-unique markers, and both BINDING anti-privacy-theater ACs (honest visibility selector + who-can-DM non-active affordance) are satisfied in the shipped source. Two items are unverifiable-by-me but non-gating and honestly no-op-safe (Sentry env vars; direct prod-DB probe) — documented below, not fakery. No claimed-but-fake, decorative, or silently-deferred work found.

---

## FINDINGS (each cites claim + contradicting/confirming evidence)

### F1 — Files exist at merge 0c71585 — CONFIRMED (with one benign path deviation)
All claimed source files present at `0c71585` via `git cat-file -e`:
- `packages/shared/src/privacy.ts`, `packages/shared/src/account-data.ts` — OK
- `apps/api/src/privacy/{privacy.service,account-data.service,privacy.controller,privacy.module}.ts` — OK
- `apps/web/src/pages/{SettingsPrivacyPage,PrivacyPage,TermsPage}.tsx` — OK
- Migration `apps/api/drizzle/migrations/0014_sparkling_gorgon.sql` (+ `meta/0014_snapshot.json`) — OK

**Deviation (LOW, documented — NOT fake):** P-3 plan named the Sentry init files `apps/api/src/observability/sentry.ts` + `apps/web/src/observability/sentry.ts`. Actual shipped paths are `apps/api/src/instrument.ts` + `apps/web/src/instrument.ts` (src-root, `instrument.ts` name). This is the correct Sentry-convention path — `import './instrument'` MUST be the first import so the SDK instruments before other modules load; confirmed as line 1 of both `apps/api/src/main.ts` and `apps/web/src/main.tsx`. Files exist, are wired first, SDK-doc present at `command-center/dev/SDK-Docs/Sentry/sentry.md`. The claim (Sentry init api+web) is TRUE; only the plan's path string was stale.

### F2 — Named exports present — CONFIRMED
- `packages/shared/src/privacy.ts:3-21`: `PROFILE_VISIBILITY` + `WHO_CAN_DM` const tuples `['everyone','server-members','nobody']`, `PrivacySettingsResponseSchema`, `UpdatePrivacySchema`, types — all exported.
- `packages/shared/src/account-data.ts:3-25`: `AccountDataResponseSchema` + `AccountDataResponse`.
- `packages/shared/src/index.ts:131-142`: re-exports both modules (schemas + types).
- `apps/api/src/privacy/privacy.service.ts:14,38`: `getPrivacy(userId)`, `updatePrivacy(userId,dto)`.
- `apps/api/src/privacy/account-data.service.ts:9,52`: `getAccountData(userId)`, `exportAccountData(userId)`.

### F3 — Routes registered + LIVE on deployed api — CONFIRMED
- `apps/api/src/privacy/privacy.controller.ts:27,35,43,59,67,70`: `@Controller('profile')` with `@Get('privacy')`, `@Put('privacy')`, `@Get('data')`, `@Get('data/export')` + `@Header('Content-Disposition','attachment; filename="studyhall-account-data.json"')`.
- `apps/api/src/app.module.ts:14,47`: `PrivacyModule` imported + registered.
- **LIVE probes (deployed api):**
  - `GET /profile/privacy` → **401** `{"message":"unauthorised"}` (registered, auth-gated — 404 would mean not deployed)
  - `GET /profile/data` → **401**
  - Both 401-not-500 → the guard runs before any query; module is deployed and mounted.

### F4 — Migration applied in prod — CONFIRMED (via C-2 authoritative record; direct probe not available to me)
- `0014_sparkling_gorgon.sql` content: `ALTER TABLE "users" ADD COLUMN "profile_visibility" text DEFAULT 'everyone' NOT NULL;` + `who_can_dm` (identical). Additive + defaulted → online, backfills every existing row.
- C-2 (`process/waves/wave-35/stages/C-2-deploy-and-verify.md:24-37,107-108`) documents pre-migration snapshot (`users` rowcount = 47; columns absent), post-migration column verification (both `text NOT NULL DEFAULT 'everyone'`), and backfill `47/47 users -> 'everyone'` for both columns — executed against the prod DB over `DATABASE_PUBLIC_URL` (TCP proxy `yamanote.proxy.rlwy.net:40008`, C-2:30).
- **Independent confirmation not possible from here** (no railway CLI in this env, no app-DB credentials). Convergent inference is strong: migration committed + live endpoints return 401-not-500 + deployed bundle is wave-35 (F6). **LOW residual** — the only claim I relied on C-2's own record for rather than re-probing. Recommend a T-block authed smoke that reads `GET /profile/privacy` → `{everyone,everyone}` default to close it end-to-end (see F8/gaps).

### F5 — Sentry env vars set at C-2 — UNVERIFIABLE, non-gating (documented, NOT a false claim on any AC)
- No railway CLI in this environment; cannot read Railway var names.
- C-2 does **not** actually document `SENTRY_DSN` / `VITE_SENTRY_DSN` being set (grep of C-2 for `sentry|dsn|env` returns only the title/DB-URL lines). So the prompt's "claimed set at C-2" is itself not evidenced in C-2.
- **This does not fail any AC.** The d40ece71 AC requires no-op-when-unset (credential-independent build, PRODUCT rule 3). Code satisfies this: `apps/web/src/main.tsx:1` imports `./instrument` (env-gated init) and the app boots regardless. Whether the DSN is actually populated only affects whether errors reach Sentry — it cannot break the boot. **LOW** — flag for C-2 to record the var-set state explicitly; not a blocker.

### F6 — Deployed bundle serves merge 0c71585 — CONFIRMED
- Fetched live web root → served bundle `/assets/index-B_iPgjvp.js`.
- grep of that live JS: **FOUND** `Takes effect when direct messages arrive`, **FOUND** `studyhall-account-data`, **FOUND** route `/settings/privacy`.
- ≥2 wave-35 change-unique markers present in the actually-served bundle → not a stale re-serve. Web routes `/settings/privacy`, `/privacy`, `/terms` all return 200.

### F7 — profile-visibility ENFORCED server-side (the load-bearing security AC) — CONFIRMED in source
- `apps/api/src/servers/servers.service.ts:253`: `.filter((r) => r.profileVisibility !== 'nobody' || r.userId === userId)` — excludes `nobody` members for every other viewer; caller always sees self. Enforcement is in the response row set, not client-side. Matches the spec's ONLY-live-cross-user-surface AC.
- **Email non-leak (T-8 tighten) — CONFIRMED not a regression.** `email` is still `select`ed at `:239`, but only used server-side as the display-name fallback (`:256` `r.displayName || r.email.split('@')[0]`). The returned DTO (`:253-260`) maps to `{userId, displayName, avatarUrl, username}` only — email never reaches the client, consistent with `ServerMemberSchema`. The plan's "drop email from select" note was not applied, but the PII-leak concern it guarded against does not exist (email stays server-side). Existing consumers still get the fields they rely on. LOW/informational.

### F8 — BINDING anti-privacy-theater ACs — CONFIRMED in shipped source (+ live bundle)
- **Honest visibility selector:** `SettingsPrivacyPage.tsx:36-43` renders only `Visible to classmates` (→`everyone`) and `Hidden` (→`nobody`). `server-members` is preserved server-side on round-trips but collapsed in the UI (`:57-60` `toUiVisibility` maps non-`nobody`→`everyone`). No two live options that behave identically. Stored enum stays 3-valued (locked for feature #21). Satisfies the karen-P-4 honest-selector AC.
- **who-can-DM non-active:** `:399-440` renders a DISABLED affordance (`aria-disabled="true"`, no pointer events) with copy `Takes effect when direct messages arrive.` — persisted, not an active no-op control. Satisfies the BOARD Path-A binding AC. (`Takes effect when direct messages arrive` also confirmed live in the served bundle, F6.)

---

## HONESTLY-DOCUMENTED GAPS (verified as documented, NOT fakery)
- No dedicated privacy-endpoint tests — tracked MEDIUM in findings-aggregate (acknowledged, not hidden). Reinforced by F4: recommend one authed T-block smoke (`GET /profile/privacy` default `{everyone,everyone}` + roster `nobody`-exclusion) to convert the F4 prod-DB inference into a live end-to-end assertion.
- Notifications-panel empty/error/loading surface absent — states AC N/A (documented).
- who-can-DM persist-only-no-active-control — intentional BOARD Path A (documented + shipped correctly, F8).

## Antipattern sweep result
- Claimed-but-fake: **none found.**
- Decorative/tautological tests: n/a (no privacy tests claimed — the absence is documented, not disguised).
- Deferred-but-undocumented: **none** — all deferrals (who-can-DM enforcement → feature #21; notifications panel N/A; endpoint tests → MEDIUM) are explicitly recorded.

## Cross-agent follow-ups
- @task-completion-validator: end-to-end authed probe of `GET/PUT /profile/privacy` + roster `nobody`-exclusion against prod (closes F4 residual).
- @code-quality-pragmatist: optional — reconcile the F1 plan-vs-actual Sentry path string and the F7 unapplied "drop email from select" note so P-3/plan text matches shipped reality (both benign).
