# P-4 Phase 2 — Spec-Drift Verification (jenny)

**Wave:** wave-2 — Auth backend (Postgres + Drizzle + SuperTokens + Resend)
**Task:** b9118041-06c0-4478-9d15-dfc715e3b97a
**Reviewer:** jenny (spec-compliance auditor, fresh context)
**Date:** 2026-06-28
**Question answered:** Does the spec + plan DRIFT from prior locked decisions (v5/v6b product-decisions, `_library.md`, journey map)? This is a drift audit — NOT a "is it built" audit (nothing is built yet; this is P-4 pre-build).

---

## Verdict: **APPROVE**

The spec and P-3 plan are faithful to the locked architecture and product decisions. Every load-bearing item below MATCHES its prior decision. No spec-drift found. Two spec-GAPS (not drift) are noted as follow-ups for the B-block / T-8, neither blocking at P-4. One naming-shade observation (non-load-bearing).

---

## Per-item findings

### 1. Auth approach — SuperTokens self-hosted, EmailPassword + EmailVerification + Session
**MATCHES.**
- Locked decision: `_library.md:33` (Auth: SuperTokens Core self-hosted on Railway, session-based, httpOnly cookies for browser + short-lived JWT for WS/LiveKit); `_library.md:309` (recipes EmailPassword + EmailVerification + Session); product-decisions stack entry (`product-decisions.md:27`, SuperTokens in baseline).
- Spec: YAML `sdk` block names `EmailPassword.init(), EmailVerification.init(...), Session.init(...)` with `connectionURI` + self-hosted core. P-3 `P-3-plan.md:7-8` re-states self-hosted core as new Railway infra in project ae55c191, and explicitly rejects managed SuperTokens SaaS "architecture locked self-hosted."
- Not relitigated: the plan records the SaaS-vs-self-host trade-off as already-decided, not re-opened. Consistent with R-SDK-3 (`_library.md:597`) — core-side email config is a known open implementation detail, not a decision change.

### 2. Single `users` table / UsersModule ownership (architecture decision #5)
**MATCHES.**
- Locked decision #5: `_library.md:572` and product-decisions `product-decisions.md:36` — single `users` table holds profile + privacy fields, owned by UsersModule, NO separate `profiles`/`privacy_settings` tables.
- Spec `data` contract: "single `users` table (UsersModule-owned, per architecture decision #5 — NO separate profiles table)"; columns `id (PK, text, = SuperTokens userId), email (unique), display_name, created_at, updated_at`. P-3 `P-3-plan.md:13` matches exactly, citing decision #5.
- No profiles-table drift. The spec deliberately omits privacy columns this wave (backend foundation slice) — that is scope-narrowing within the same table, not a schema split, so it does NOT drift from #5. The single-table contract is preserved; privacy columns land in a later wave on the same table.
- `id` as `text` PK (= SuperTokens userId) is the correct join key for SuperTokens; note the `_library.md:136` core-table index list shows `UNIQUE (username)` as the hot-path for `users`, while this wave uses `UNIQUE (email)` + no username column yet. This is consistent (no username field exists at MVP foundation; email is the identity) — a gap-forward, not a drift.

### 3. Cookie / session model — httpOnly, SameSite=Lax, JWT + rotating refresh
**MATCHES — this is the most load-bearing item and it is correct.**
- Locked decisions: SameSite=Lax (#17 `_library.md:584`, #10 in product-decisions `product-decisions.md:36`); httpOnly+Secure cookies (`_library.md:309`, `:531`); rotating refresh + short-lived (15 min) access (`_library.md:309`); WS-upgrade auth keys off the SuperTokens session cookie with short-lived JWT fallback (#8 `_library.md:575`, `_library.md:115`, `_library.md:534-540`).
- Spec AC #1/#6 + `edge-cases` cookie line: `sAccessToken + sRefreshToken; SameSite=Lax; Secure in prod`, refresh rotates both tokens, revoked/expired refresh → 401 + Set-Cookie clears tokens, anti-CSRF per SuperTokens Lax default. `Session.init({cookieSameSite:'lax', cookieSecure: prod})` in the sdk block. P-3 `P-3-plan.md:7,20` re-states the cookie model AND explicitly names it "the contract the later Socket.IO WS-upgrade + LiveKit token bridge depend on."
- The downstream dependency (WS-upgrade + LiveKit token bridge per #8) is satisfied: the session this wave establishes is exactly the cookie/JWT model those bridges authenticate against. No drift that would break decision #8.

### 4. Resend email for verify/reset (R-SDK-2 / R-SDK-3 / decision #9)
**MATCHES.**
- Locked decisions: SuperTokens Core owns verify + password-reset emails, NotificationsModule owns ONLY invite + reminder emails (#9 `_library.md:576`, product-decisions `product-decisions.md:36`); SDK-integration principle 4 (`_library.md:215`) — auth-critical email delegated to Core/SuperTokens config; Resend as the transactional provider (`_library.md:35`, `:207`); `onboarding@resend.dev` fallback until domain verified (R-SDK-2 `_library.md:596`); Core email is a config wiring, not a code recipe change (R-SDK-3 `_library.md:597`).
- Spec sdk block + AC #2/#7: Resend invoked from the SuperTokens `emailDelivery override` for verify + reset, `onboarding@resend.dev` fallback cited as R-SDK-2. P-3 `P-3-plan.md:9` wires Resend through `emailDelivery.override`.
- Scope-correct: this wave only touches auth-critical emails (verify/reset) — the exact set #9 assigns to SuperTokens/Core, NOT NotificationsModule invite/reminder emails (those belong to later waves). No ownership drift across the #9 boundary.
- Implementation note (not drift): the spec wires Resend via the `supertokens-node` `emailDelivery` override in the api process. R-SDK-3 (`_library.md:597`) frames Core email as "a Core service-side config, not a supertokens-node code change." Both approaches are SuperTokens-sanctioned (node-SDK override vs core SMTP config); the override path keeps the Resend key in the api and is consistent with #9's "delegated to Core config" intent. Flag for B-block to confirm the override path is the chosen one and document it in SDK-Docs (already named as the plan's approach) — a documentation alignment item, not a contract conflict.

### 5. Scope — no MFA / OAuth / roles (M1 foundation scope)
**MATCHES — no scope drift in either direction.**
- Locked scope: M1 Foundation = shell/auth/profiles (`product-decisions.md:102,114`); P-0 ceo-reviewer HOLD-SCOPE guardrail cited in spec body + `P-3-plan.md` scope note. RBAC/roles are M2+ (RbacModule, `_library.md:58`); OAuth/social/account-linking are nowhere in the MVP module set.
- Spec body: "NO MFA, OAuth/social, account-linking, or roles/admin this wave. Scope held to SuperTokens recipe defaults." Edge-case: "Login before email verified: permitted (recipe default) ... hold to defaults, no custom block this wave."
- No under-scope drift either: all 6 auth surfaces M1 needs (signup, verify, login, /me probe, refresh, password-reset) are present as ACs. Nothing M1-required is dropped; nothing M2+ is pulled forward.

### 6. Backend-only (frontend deferred to 9aae8255)
**MATCHES.**
- Roadmap: wave-1 seed bundle authored M1 with sibling tasks "Postgres + Drizzle + SuperTokens auth backend" (this wave) and "Auth + profile frontend pages" (separate, 9aae8255) — `product-decisions.md:114`. Journey map `user-journey-map.md:52` marks auth pages "❌ Not built ... auth = next wave (b9118041)" and the deployment-status note confirms auth frontend is downstream.
- Spec body: "Backend only — auth/profile frontend pages are the separate task 9aae8255." `/me` is a backend probe route (AC #5), not a UI page. Consistent: the spec ships the API surface the later frontend task (the `/signup`/`/login`/`/verify`/`/forgot-password` pages in the journey map, `user-journey-map.md:26-29`) will call. No route invented, none skipped.

---

## Spec-GAPS (not drift — spec didn't fully anticipate, follow-up not block)

1. **Cross-service user-creation atomicity (G-1).** Signup writes to TWO stores: SuperTokens Core (its own Postgres tables) creates the auth user, then UsersModule inserts the app `users` row keyed by the returned userId (auth dataflow `_library.md:513-516`; spec AC #1; plan post-signup hook `P-3-plan.md:7,42`). The spec's edge-cases cover Resend failure (signup still succeeds) and duplicate-email (EMAIL_ALREADY_EXISTS), but do NOT specify what happens if the SuperTokens user is created and the app-`users` INSERT then fails (partial state: an auth identity with no app profile row). No prior decision addresses this either — it is a genuine gap the architecture left open, surfaced now because this is the first wave that crosses the boundary. **Recommendation:** B-block (supertokens-integration) must define the failure handling — run the app-row insert inside the SuperTokens `signUpPOST`/functions override so a failed insert fails the signup transactionally, OR make `/me` and downstream reads self-heal/lazily-create the app row on first authenticated access. Note in the spec or as a B-block decision; have @task-completion-validator confirm the chosen behavior at V-block.

2. **Auth-endpoint rate limiting (G-2).** `_library.md:113` locks `@nestjs/throttler` 10 req/min on auth endpoints as the architecture default. The spec correctly defers ("note as a follow-up if not provided by the core default; T-8 security stage assesses") rather than silently dropping it — so this is an acknowledged gap, not drift. **Recommendation:** T-8 Security (mandatory this wave per the security-scope-tightened gate) must verify auth-path throttling is either present or explicitly ticketed; do not let it fall through.

---

## Non-load-bearing observation

- **Migrations path shade.** Spec `data` + `P-3-plan.md:14` place Drizzle migrations at `apps/api/src/db/migrations/`, while `_library.md:164,279` and resolution #14 say `apps/api/drizzle/migrations/`. Same content, different directory. Not a contract conflict (no other artifact references the path; `drizzle.config.ts` sets it authoritatively at B-block), but B-1 should pick one and align `drizzle.config.ts` with whichever the schema files expect. Flag for B-block; does not affect the gate.

---

## Cross-agent notes
- Spec/plan are clean against decisions; the open behavioral question is the partial-failure path (G-1) — best validated by @task-completion-validator once B-block implements the signup hook.
- T-8 Security is already mandated this wave (auth/session/cookie/user-creation surface); G-2 (rate limiting) is its responsibility.
- No @code-quality-pragmatist concern — the plan holds to recipe defaults and rejects gold-plating (no MFA/OAuth/roles), consistent with self-use-mvp scope.

**Final: APPROVE.** No spec-drift against any locked decision. Carry G-1 + G-2 into the B-block / T-8 as named follow-ups.
