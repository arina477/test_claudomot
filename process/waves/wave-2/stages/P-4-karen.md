# P-4 Phase 2 — Karen source-claim verification (wave-2 auth-backend spec + plan)

**Stage:** P-4 gate, phase 2 reviewer pool
**Mode:** PRE-build. Verifies the spec + plan reference REAL files/SDKs/agents/architecture — NOT that code exists yet.
**Inputs:** task `b9118041` description (authoritative spec) · `process/waves/wave-2/stages/P-3-plan.md` · `command-center/dev/architecture/_library.md` · `SDK-Docs/SuperTokens/supertokens.md` · `SDK-Docs/Resend/resend.md` · `command-center/AGENTS.md` · live monorepo state (`apps/`, `packages/`, `package.json`).

## VERDICT: APPROVE

All five load-bearing claim families verified. Specialists exist, SDK signatures/versions are real per the SDK docs, the single-`users`-table architecture is consistent with decision #5 (no residual `profiles` substrate), file paths align with the wave-1 layout, and no antipattern catalog hit. Two NON-BLOCKING observations recorded (Low severity) — neither falsifies a plan claim; both are B-block reminders.

---

## Per-claim findings

### Claim 1 — Specialist routing (P-3:53) — VERIFIED
P-3:52-53 asserts `supertokens-integration ✓, backend-developer ✓, postgres-pro ✓, typescript-pro ✓, devops-engineer ✓ — all present.`

Cross-checked against `command-center/AGENTS.md`:
- `supertokens-integration` — AGENTS.md:79 (project-specific executor). VERIFIED.
- `backend-developer` — AGENTS.md:70 (universal executor, pre-built). VERIFIED.
- `postgres-pro` — AGENTS.md:81 (project-specific, pre-built VoltAgent). VERIFIED.
- `typescript-pro` — AGENTS.md:83. VERIFIED.
- `devops-engineer` — AGENTS.md:85. VERIFIED.

All five are also live in the Agent-tool subagent_type roster. **VERIFIED.**

### Claim 2 — SDK method/signatures + pinned versions — VERIFIED

**supertokens-node:**
- `supertokens.init({ supertokens:{connectionURI,apiKey?}, recipeList:[...] })` — matches supertokens.md:77-97 exactly, including the gotcha that `connectionURI`/`apiKey` live under the `supertokens` sub-object (supertokens.md:99). VERIFIED.
- `EmailPassword.init()` — supertokens.md:52. VERIFIED.
- `EmailVerification.init({ mode: 'REQUIRED'|'OPTIONAL' })` — supertokens.md:63 (mode is required). Spec sdk-block + P-3:7 both name it correctly. VERIFIED.
- `Session.init({ cookieSameSite:'lax', cookieSecure: prod })` — both options real per supertokens.md:106-113 constructor table; `cookieSameSite` accepts `'lax'`, `cookieSecure` is boolean. VERIFIED.
- `emailDelivery` override → Resend (P-3:9,44). The `override` mechanism is real (Session.init exposes `override` at supertokens.md:122-125; the recipe-level `emailDelivery` override is the documented Core+Resend wiring per supertokens.md:599 doc link + Resend.md:234). The spec correctly tags this as partly a Core-side config (spec edge "R-SDK-3"). VERIFIED.
- `verifySession` guard — supertokens.md:44-46, import path `supertokens-node/recipe/session/framework/express` (gotcha #5, supertokens.md:551). P-3:7 references `verifySession` guard correctly. VERIFIED.

**resend:**
- `new Resend(key)` — Resend.md:29 (`new Resend(key?, options?)`). VERIFIED.
- `resend.emails.send({from,to,subject,html})` — Resend.md:44-69; `from`/`to`/`subject` required, `html` is a valid body field. VERIFIED.

**drizzle / pg:**
- `drizzle-orm` + `drizzle-kit migrate` + `pg` pool from `DATABASE_URL` — consistent with `_library.md` Databases §128-164 + Drizzle Kit §277-281 (`db:migrate` = `drizzle-kit migrate`). VERIFIED (architecture-level; drizzle has no dedicated SDK-doc, which is acceptable — it is the locked ORM, not a third-party API surface).

**Pinned versions:**
- `supertokens-node ^24.0.2` (P-3:23) — SDK doc installed version is `24.0.2` (supertokens.md:6, 354). `^24.0.2` matches. VERIFIED.
- `resend ^6.15.0` (P-3:24) — SDK doc installed version `6.15.0` (Resend.md:4). VERIFIED.

**VERIFIED.**

### Claim 3 — Single `users` table, no `profiles` substrate — VERIFIED
- `_library.md` decision #5 (line 572): "single `users` table … No separate `profiles`/`privacy_settings` tables. … owned by UsersModule." Also Databases table line 136: `users` | UsersModule.
- Spec data-contract: "single `users` table (UsersModule-owned, per architecture decision #5 — NO separate profiles table)". Matches.
- P-3:13 data model: "Drizzle `users` … UsersModule-owned per architecture decision #5". Matches.
- Grep of spec + P-3 for `profiles`/`privacy_settings` as a wave-2 table: NONE. The only `profile` token in P-3 is "profile-on-signup hook" (P-3:44) — a hook NAME that inserts into the single `users` table, not a separate table. No residual substrate.

**VERIFIED.** (Note: spec uses `display_name` only; `_library.md` decision #5 also folds `profile_visibility`/`who_can_dm` onto `users` later — those are correctly out of scope this wave, no conflict.)

### Claim 4 — File paths plausible vs wave-1 monorepo layout — VERIFIED
Live filesystem confirms the wave-1 layout the plan builds on:
- `apps/api/` and `apps/web/` exist; `packages/shared/` exists (`packages/ui` deferred per `_library.md`:237 — consistent).
- `apps/api/src/` currently holds `app.module.ts`, `main.ts`, `health/` — so the plan's NEW paths (`apps/api/src/db/`, `/users/`, `/email/`, `/auth/`, `/me/`) are net-new additions under an existing, correct root. Plausible.
- `packages/shared/src/` holds `index.ts` + `health.ts`; P-3:39 adds `packages/shared/src/auth.ts` exported from index — consistent with the established pattern.
- `apps/api/src/db/{schema/users.ts,index.ts,migrations/,seed.ts}` + `drizzle.config.ts` (P-3:36) — net-new, root path correct.

**VERIFIED.** Minor naming note (Low, non-blocking) below.

### Claim 5 — Antipattern catalog (PRODUCT-PRINCIPLES.md) — VERIFIED (clean)
`command-center/principles/PRODUCT-PRINCIPLES.md` § Rules currently reads "_(no rules yet — promoted from L-2 distill across waves)_" (line 70). No project-specific antipattern rules to violate yet. Applying the standard catalog manually:
- **Claimed-but-fake:** N/A (pre-build; nothing claimed-done).
- **Architecture-blind:** No — every delta (DbModule, AuthModule, recipes, single users table, cookie model) is anchored to `_library.md` decisions and SDK docs.
- **Gold-plated:** No — P-3 explicitly HOLDS scope to recipe defaults (no MFA/OAuth/account-linking/roles), defers `/health` DB-readiness extension, and the P-0 ceo-reviewer HOLD-SCOPE guardrail is carried into the spec. This is the opposite of gold-plating.

**VERIFIED (no antipattern hits).**

---

## Non-blocking observations (Low severity — B-block reminders, do NOT block P-4)

1. **Resend key count drift (spec/plan vs SDK doc) — Low.**
   The SDK doc + `_library.md` decisions #9/#19 prescribe a TWO-key Resend pattern (`RESEND_API_KEY_AUTH` for SuperTokens Core email + `RESEND_API_KEY_NOTIFY` for NotificationsModule). The spec + P-3:33 use a SINGLE `RESEND_API_KEY`.
   **Assessment: CONSISTENT, not a defect.** NotificationsModule (invites/reminders) is explicitly OUT of scope this wave — only the auth-email consumer (verify + reset) exists. Decision #19 itself states "one key works." A single key for the sole consumer this wave is correct scoping. **Reminder:** when NotificationsModule lands (later wave), revisit to the two-key split, or document the one-key choice in `product-decisions.md`.

2. **Drizzle migrations directory path drift — Low.**
   Spec + P-3:14,36 place migrations at `apps/api/src/db/migrations/`. `_library.md`:164,279 specifies `apps/api/drizzle/migrations/`. Two different locations named across docs.
   **Assessment: non-load-bearing for P-4** (both are plausible, drizzle-kit honors whatever `drizzle.config.ts` declares). **Reminder:** B-1 must pick ONE and ensure `drizzle.config.ts` `out` matches; prefer the `_library.md` canonical `apps/api/drizzle/migrations/` to avoid a future doc/code split, or update `_library.md` if the in-src path is chosen.

3. **`db:seed` uses `tsx`, but `tsx` not yet a dep — Low.**
   P-3:36 runs seed via `tsx seed.ts`; current `package.json` has placeholder `db:seed` scripts ("no DB yet (deferred)"). The AC requires `pnpm db:seed` to exit 0 against a reachable Postgres. **Reminder:** B-1 must add `tsx` (or an equivalent TS runner) to devDeps and replace the placeholder scripts. This is expected wave-2 work, not a plan defect.

---

## Summary table

| # | Claim | Result | Key evidence |
|---|-------|--------|--------------|
| 1 | 5 specialists exist in AGENTS.md | VERIFIED | AGENTS.md:70,79,81,83,85 + live roster |
| 2 | SDK methods/signatures + pinned versions real | VERIFIED | supertokens.md:6,52,63,77-113,354 · Resend.md:4,29,44-69 |
| 3 | Single `users` table, no profiles substrate | VERIFIED | _library.md:572 + spec/P-3 data contracts; grep clean |
| 4 | File paths plausible vs wave-1 layout | VERIFIED | live `apps/api/src`, `packages/shared/src` |
| 5 | No antipattern (fake/arch-blind/gold-plated) | VERIFIED | PRODUCT-PRINCIPLES.md:70 empty; HOLD-SCOPE in P-3 |

**Gate input from Karen: APPROVE.** No claim is WRONG; no UNVERIFIED claim remains. Three Low-severity B-block reminders logged above — none block the P-4 gate.
