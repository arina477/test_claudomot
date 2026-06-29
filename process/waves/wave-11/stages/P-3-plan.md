# Wave 11 — P-3 Plan
## Approach (devops-engineer / supertokens-integration)
- B (mostly an ops action, no app code): 
  1. Generate a CSPRNG password (openssl rand -base64 24).
  2. Signup a test user via the live api (POST /auth/signup with rid emailpassword) → capture the SuperTokens user-id. (Idempotent: if the email exists, find it / reset; don't duplicate.)
  3. Verify its email via the SuperTokens core admin API (POST to the core /recipe/user/email/verify/token then /recipe/user/email/verify, OR the equivalent admin endpoint — the path head-ci-cd used in waves 7/8/10). The core is internal-only on Railway — reach it via a temporary public domain on the supertokens service (API-key gated) created+deleted, OR via a one-off against the core's connection URI. 
  4. Record in command-center/testing/test-accounts.md (GITIGNORED): label, email, password, user-id, the verify method + a re-verify snippet.
  5. Prove: obtain a verified session (signin) + GET /me → 200 (or POST /servers → 201) against the live api.
- Specialist: devops-engineer or supertokens-integration (AGENTS.md ✓). 
## Secrets: password CSPRNG; ONLY in gitignored test-accounts.md; project.yaml label+email only.
## design_gap_flag FALSE (no UI). NO app code change → C-block is a near-no-op (no PR/deploy; the "deploy" is the prod-account provisioning; verify = the authed-route proof). T-8: user-creation/session probe.
## NOTE: if the SuperTokens admin-API approach hits a wall (core unreachable / token flow changed), fall back / escalate — but waves 7/8/10 used it successfully, so it's a known path.
