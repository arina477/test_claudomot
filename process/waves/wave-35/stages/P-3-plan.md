# Wave 35 — P-3 Plan

Multi-spec: settings-privacy (56a50862) + data-view/download (a4169fac) + Sentry (d40ece71) + stubs/states (13b7ebfd). `design_gap_flag=false` → B after gate. Security-scope: user-data-authz + data-export → T-8 + P-4 tightened gate.

## APPROACH

### Architecture deltas
- **Privacy settings storage (seed).** Add two additive, defaulted columns to the existing `users` table (`apps/api/src/db/schema/users.ts`): `profile_visibility` and `who_can_dm`, both `text NOT NULL DEFAULT 'everyone'`. **Why columns-on-users over a new `privacy_settings` table:** codebase convention is flags-as-columns (permissions live as booleans on `users`/`server_members`; no separate settings table, no pg enums). 1:1 with user, tiny, no join. Expand-contract safe (additive + defaulted → every existing row backfills to `everyone`, online migration, reversible). Enum values validated at the Zod/app layer (matching the codebase's text+validation convention, not pg enums). Enum contract **locked** to the future DM guard (feature #21): `everyone | server-members | nobody` (risk-officer requirement).
  - *Alternative considered:* separate `privacy_settings` table — rejected: adds a join + a table for two scalar prefs, against convention, no growth benefit at self-use-mvp scale.
- **profile-visibility enforcement (seed).** The only current surface exposing one student's profile to another is the **server member-roster** (`GET /servers/:id/members`). `GET /profile` is self-only (session-derived userId — no leak). So enforcement lands in `servers.service.ts listServerMembers()` (lines 223–253): the roster is already co-member-scoped, so within a shared server `everyone` + `server-members` both appear and `nobody` is hidden (except self). Filter = exclude rows where `profile_visibility='nobody' AND user_id != caller`. The `everyone` vs `server-members` distinction only bites on a hypothetical public/non-member profile read (not built) — the enum is forward-proof; today the roster enforces nobody-hiding. **Failure-domain:** one method, one module (servers). Negative-path B-6 test: existing member-list consumers still receive `{userId, displayName, avatarUrl, username}` (per `ServerMemberSchema`) — no field regression (risk-officer).
  - *Security note (in-scope tighten):* the roster query currently `select`s `email` (`servers.service.ts:240`) though `ServerMemberSchema` omits it — confirm the response is DTO-validated so `email` never reaches the client; drop `email` from the select if it is not needed downstream (cheap PII reduction on a privacy wave). Flag to T-8.
- **who-can-DM (seed).** Persist the `who_can_dm` column only; **no interactive control shipped** (BOARD Path A). No DM feature exists → no enforcement path today. Enforcement is an AC on feature #21 (already filed in `feature-list.md`).
- **account data view + export (a4169fac).** Read-only aggregation over `users` (profile) + `server_members` (memberships) + activity counts; no schema change. Self-scoped (session userId, no param).
- **Sentry (d40ece71).** New observability layer, api + web. Env-gated DSN, no-op when unset (credential-independent build, PRODUCT rule 3). `beforeSend` PII scrub + `sendDefaultPii:false`.
- **stubs + states (13b7ebfd).** New `/privacy` `/terms` routes; apply the DESIGN-SYSTEM §113 empty/error/loading pattern to the main list/panel surfaces.

### Data model
- `users` + `profile_visibility text NOT NULL DEFAULT 'everyone'`, `who_can_dm text NOT NULL DEFAULT 'everyone'`. One drizzle-kit-generated migration in `apps/api/drizzle/migrations/`. Online, backfill via default, no index change, no FK change.

### API contracts (concrete)
- `GET /profile/privacy` — authed (SessionNoVerifyGuard, session userId). → 200 `PrivacySettingsResponse {profileVisibility, whoCanDm}` | 401.
- `PUT /profile/privacy` — authed. Body `UpdatePrivacyInput {profileVisibility, whoCanDm}` (Zod-validated). → 200 `PrivacySettingsResponse` | 400 invalid-enum | 401.
- `GET /profile/data` — authed. → 200 `AccountDataResponse {profile, memberships[], activitySummary}` | 401.
- `GET /profile/data/export` — authed. → 200 `application/json`, `Content-Disposition: attachment; filename="studyhall-account-data.json"` | 401.
- Enforcement: modify `GET /servers/:id/members` response set (no contract change to `ServerMemberSchema`).

### New dependencies (+ SDK pre-build checklist — Sentry is new)
- **`@sentry/nestjs`** (api) + **`@sentry/react`** (web). Justification: M7 metric requires production error tracking; Sentry is the direction recorded in product-decisions v6b + devops.md; free tier ample for one cohort (no spend → rule-17 silent default). Bundle: `@sentry/react` ~30KB gz (lazy-init acceptable); api runtime negligible. License MIT.
- **Pre-build checklist (per external-sdk-integration-rules):** pin to current major (`@sentry/nestjs@^9` / `@sentry/react@^9`; B-1/B-3 verifies the exact installed version before coding against it — do NOT assume signatures). Init contract to verify at build: `Sentry.init({ dsn, beforeSend, sendDefaultPii:false, tracesSampleRate:0 })`; NestJS: import `@sentry/nestjs/setup` instrumentation **before** the app module + `SentryModule.forRoot()`; React: `Sentry.init` before `createRoot` + optional `Sentry.ErrorBoundary`. Env: `SENTRY_DSN` (api), `VITE_SENTRY_DSN` (web), set at Railway deploy (C-2), never committed. B-block author confirms method signatures against the installed version and writes the SDK-doc at `command-center/dev/SDK-Docs/Sentry/sentry.md`.

## PLAN (file-level, grouped by B-stage)

### B-1 Schema — `postgres-pro`
- `apps/api/src/db/schema/users.ts` — MODIFY: add `profile_visibility`, `who_can_dm` text columns (NOT NULL default 'everyone').
- `apps/api/drizzle/migrations/<generated>` — CREATE via `drizzle-kit generate` (additive, defaulted; commit the SQL).

### B-2 Contracts — `typescript-pro`
- `packages/shared/src/privacy.ts` — CREATE: `PROFILE_VISIBILITY`/`WHO_CAN_DM` const tuples, `PrivacySettingsResponseSchema`, `UpdatePrivacySchema` (z.enum locked everyone|server-members|nobody), types.
- `packages/shared/src/account-data.ts` — CREATE: `AccountDataResponseSchema {profile, memberships[], activitySummary}`.
- `packages/shared/src/index.ts` — MODIFY: export both.

### B-3 Backend — `node-specialist` (+ `postgres-pro` for the roster filter, `devops-engineer` for Sentry api)
- `apps/api/src/privacy/privacy.service.ts` — CREATE: `getPrivacy(userId)`, `updatePrivacy(userId, dto)`.
- `apps/api/src/privacy/account-data.service.ts` — CREATE: `getAccountData(userId)`, `exportAccountData(userId)` (aggregate users + server_members + activity).
- `apps/api/src/privacy/privacy.controller.ts` — CREATE: `GET/PUT /profile/privacy`, `GET /profile/data`, `GET /profile/data/export` (all session-scoped guards).
- `apps/api/src/privacy/privacy.module.ts` — CREATE; register in `app.module.ts` (B-4/B-5 wiring).
- `apps/api/src/servers/servers.service.ts` — MODIFY `listServerMembers` (~line 245): exclude `profile_visibility='nobody'` for `user_id != caller`; confirm/strip `email` from the response path (T-8 note). `postgres-pro` owns the query change.
- `apps/api/src/observability/sentry.ts` + `apps/api/src/main.ts` — CREATE init + `beforeSend` scrub, wire before `initSuperTokens()` (~main.ts:12/83). `devops-engineer`.

### B-4 Frontend — `react-specialist`
- `apps/web/src/pages/SettingsPrivacyPage.tsx` — CREATE: profile-visibility selector (persist via api) + account-data read-only section + "download my data" button + who-can-DM as a disabled "takes effect when direct messages arrive" affordance (BOARD binding: not an active toggle). HONEST profile-visibility control (karen P-4): do not render `everyone` and `server-members` as two live options that behave identically today — present behaviorally-honest choices (e.g. Visible/Hidden) or explicit equivalence copy; the stored enum stays 3-valued (locked for feature #21).
- `apps/web/src/pages/PrivacyPage.tsx`, `apps/web/src/pages/TermsPage.tsx` — CREATE stub pages (render per `per-page-pd/{privacy,terms}.md`, DESIGN-SYSTEM typography).
- `apps/web/src/auth/api.ts` — MODIFY: add `getPrivacy`, `putPrivacy`, `getAccountData`, `exportAccountData` (typed).
- `apps/web/src/router.tsx` — MODIFY: add `/settings/privacy` (AuthGuard), `/privacy`, `/terms` routes.
- `apps/web/src/pages/LandingPage.tsx` — MODIFY footer (lines ~204–243): add `/privacy` `/terms` links.
- Empty/error/loading states — MODIFY the main list/panel components to ensure all three per DESIGN-SYSTEM §113: server-channel feed, notifications panel, study-rooms list, profile, assignments panel. (Skeletons not spinners; error→retry; empty→icon+headline+CTA.)
- `apps/web/src/observability/sentry.ts` + `apps/web/src/main.tsx` — CREATE init + `beforeSend`, wire before `createRoot` (~main.tsx:11). (`devops-engineer` pairs on env contract.)

### B-5 Wiring — `devops-engineer` (+ `node-specialist`, `typescript-pro`)
- Register `PrivacyModule` in `app.module.ts`.
- `.env.example` (api + web) — add `SENTRY_DSN` / `VITE_SENTRY_DSN` (values set on Railway at C-2, never committed).
- Type-check / build fixers across shared→api→web project refs.

## Parallelization map
- **B-1** serial (schema→migration) — one agent.
- **B-2** parallel: `privacy.ts` ∥ `account-data.ts` (independent), then `index.ts` (serial after both).
- **B-3** parallel batch after B-2: {privacy.service+controller+module} ∥ {account-data.service} ∥ {servers.service filter} ∥ {api Sentry}. Serial: controller depends on services.
- **B-4** parallel batch: {SettingsPrivacyPage} ∥ {Privacy/Terms stubs} ∥ {router+footer} ∥ {empty/error/loading states} ∥ {web Sentry}; `api.ts` before SettingsPrivacyPage (serial).
- **B-5** serial (module registration → env → typecheck).

## Self-consistency sweep
1. Every AC maps to ≥1 step: seed ACs → users columns + privacy service/controller + roster filter + SettingsPrivacyPage ✓; a4169fac → account-data service + endpoints + UI ✓; d40ece71 → sentry.ts ×2 + main wiring + env ✓; 13b7ebfd → stub pages + states across 5 surfaces ✓.
2. Every step has a validated specialist (postgres-pro / typescript-pro / node-specialist / react-specialist / devops-engineer — all in AGENTS.md) ✓.
3. No file in two parallel batches ✓.
4. `design_gap_flag=false` referenced ✓.
5. Architecture deltas name alternatives (columns-vs-table; enum-at-app-vs-pg-enum) ✓.
6. Contracts concrete, no TBD ✓.
7. New deps justified + SDK pre-build checklist present ✓ (B-block verifies installed Sentry version before coding).
8. Security tighten (roster email + data-authz + export self-scoping) flagged to T-8 ✓.


## Rework re-confirm (P-4 attempt-1 REWORK cascade)
P-2 spec `data:` contract aligned to columns-on-`users` (was a stale `privacy_settings` table line). P-3 plan already prescribes columns-on-`users` — **no substantive change**; data-model now consistent spec↔plan. Re-confirmed for attempt-2 gate.
