# P-4 Karen — Wave 11 source-claim verification (verified prod test fixture)

**Verdict: APPROVE** (with one corrected claim + one binding implementation note). Security-tightened (secrets + user creation) reviewed.

Small test-infra wave. The spec is real, autonomously implementable, secrets-safe, and not gold-plated. One source claim in P-3 is factually WRONG (mischaracterizes prior-wave history) but it does not invalidate the approach — the approach is independently supported by the SDK docs. Build proceeds; the corrected note must carry to B.

---

## Per-claim verification

### Claim 1 — secrets destination is gitignored; project.yaml is labels+emails only — **VERIFIED**
- `git check-ignore command-center/testing/test-accounts.md` → exit 0, path echoed. The password destination is NEVER committed.
- `git ls-files command-center/testing/` returns only `test-writing-principles.md` — `test-accounts.md` is untracked/ignored. Confirmed it is still a 53-line template (unfilled).
- `project.yaml:70-78` `test_users` header explicitly states "NEVER include passwords / tokens / secrets … claudomat doctor fails the schema if any appear here. Prod-fixture credentials live in command-center/testing/test-accounts.md (gitignored)." Matches rule 2 + the spec.

### Claim 2 — autonomous SuperTokens admin-API email-verify path is REAL, no Resend dependency — **VERIFIED (path real), WRONG (prior-wave provenance)**
- **Path is REAL + autonomous:** `command-center/dev/SDK-Docs/SuperTokens/supertokens.md:61-66` documents `EmailVerification.verifyEmailUsingToken(tenantId, token, …)` and `sendEmailVerificationEmail(...)` — the server-side recipe functions generate+consume a verification token in-process against the core (connectionURI + `SUPERTOKENS_API_KEY`, doc lines 88-89, 189-191, 383-384). No email round-trip, so **no Resend-domain dependency** — exactly as the spec asserts. The core REST endpoints `POST /auth/user/email/verify/token` and `GET/POST /auth/user/email/verify` (doc lines 280-281) back this. Setting the `st-ev` / `EmailVerificationClaim` to `true` (doc line 68) satisfies the global REQUIRED gate (doc line 568). The mechanism the spec relies on exists.
- **WRONG sub-claim — "the path head-ci-cd used in waves 7/8/10":** the archive contradicts this. The fixture was NEVER provisioned in any prior wave; the verify path was explicitly deemed *too costly* each time:
  - `_archive/wave-8/.../C-2…md:44` — "No persistent email-verified prod fixture exists; test-accounts.md is an unfilled template. Driving SuperTokens signup + email-verification (Resend round-trip) to mint a verified session was deemed too costly."
  - `_archive/wave-10/.../C-2-deploy-and-verify.md:40` — "403 non-permitted … NOT live-verified — carried forward. No prod verified-session fixture exists … Establishing this would re-invent the fixture that 4a2ad286 is meant to deliver."
  - This is the entire reason wave-11 exists (4-wave recurrence; `_archive/wave-10/L-2-distill.md` routes it as the wave-11 SEED).
  - **Impact: LOW on approach, but the plan's confidence basis is false.** "Waves 7/8/10 used it successfully, so it's a known path" (P-3 NOTE) is incorrect — it is an *unproven* path. The SDK docs (not prior execution) are what make it sound. **Binding carry-to-B:** treat the admin-API verify as first-time / unproven against prod; keep the P-3 fallback-or-escalate clause live (do NOT downgrade it on the false "known path" premise). The wave-8 reference to a "Resend round-trip" also signals the team may not yet have wired the in-process token path — B must confirm the core is reachable for token gen/consume (private DNS `supertokens.railway.internal:3567`, or a temporary API-key-gated public domain created+deleted).

### Claim 3 — live signup path (POST /auth/signup, emailpassword) is real — **VERIFIED**
- `supertokens.md:276` — `POST /auth/signup` is the documented default path; `:283` email-exists endpoint supports the idempotent find. Live api base `api-production-b93e.up.railway.app` confirmed in `project.yaml:65`. `EMAIL_ALREADY_EXISTS_ERROR` status (doc) gives the deterministic idempotency branch.

### Claim 4 — idempotent (find-by-email) + CSPRNG password, brain-generated — **VERIFIED**
- `openssl rand -base64 24` is a real generator the brain runs autonomously (rule 6). Idempotency via `GET /auth/emailpassword/email/exists` or catching `EMAIL_ALREADY_EXISTS_ERROR` (doc line 53). Recording the SuperTokens user-id for re-verify-not-recreate is sound and matches the spec edge-cases.

### Claim 5 — specialist in AGENTS.md — **VERIFIED**
- `command-center/AGENTS.md:79` `supertokens-integration` (signup/login/verify/reset) and `:85` `devops-engineer` (Railway deploy wiring) both present. Either fits; `supertokens-integration` is the better-targeted owner for the verify-token flow.

### Claim 6 — antipatterns (gold-plating / claimed-but-fake) — **VERIFIED clean**
- No gold-plating: spec AC-4 explicitly bounds the deliverable to "a tiny re-verify snippet/script … minimal, NOT a fixture-management framework." One fixture + one gitignored record + one end-to-end proof (GET /me → 200 or POST /servers → 201). Right-sized for test-infra.
- No claimed-but-fake *in the deliverable*. The only fake-ish element is the *provenance claim* in claim 2 (history misstated), not a claimed capability that doesn't exist.

---

## CRITICAL secrets-safety confirmation — **PASS**

The password is CSPRNG-generated by the brain and has exactly ONE destination: `command-center/testing/test-accounts.md`, which is **git-ignored (verified, exit 0; absent from `git ls-files`)**. `project.yaml test_users` receives a label+email only (header enforces; `claudomat doctor` schema-fails on secrets there). **No code path in the plan writes the password to any committed file.** The provisioning is an ops action (no app source change), so there is no risk of a secret leaking into a tracked source/config/test file. Secrets-safety: confirmed.

**Binding guardrails for B (so this stays true):**
1. Do not echo the password into any committed artifact, PR description, commit message, or `process/waves/**` transcript (those are tracked). Write it ONLY to the gitignored `test-accounts.md`.
2. If a temporary public domain is opened on the supertokens service for core access, delete it after provisioning (per P-3) and never commit the API key.
3. The re-verify snippet (AC-4) must read the user-id/email from the gitignored record — it must not hardcode the password.

---

## Carry-to-B summary
- APPROVE — proceed to B (near-no-op C-block per plan: provisioning IS the "deploy"; verify = authed-route proof).
- **Correct the record:** the admin-API verify path is UNPROVEN against prod (NOT "used in waves 7/8/10"). Keep P-3's fallback/escalate clause live; confirm core reachability for in-process token gen/consume before assuming success.
- Owner: `supertokens-integration` (preferred) or `devops-engineer`.
- Secrets-safety verified PASS; the three guardrails above are binding.
