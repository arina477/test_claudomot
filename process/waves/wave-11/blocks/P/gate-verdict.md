# Wave 11 — P-4 Verdict

**Reviewer:** head-product (fresh spawn)
**Reviewed against:** process/waves/wave-11/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This is a small, single-task test-infra wave that provisions a persistent verified prod test user to close a 4-wave authed-path verification gap and de-risk the heavily-session-gated M3 messaging milestone — a real, falsifiable problem laddering to a live milestone (M3 6198650e). Judged under the security-tightened gate (user creation + sessions + secrets), every binding check passes: the CSPRNG password is brain-generated (`openssl rand -base64 24`) and lives ONLY in `command-center/testing/test-accounts.md`, which is confirmed gitignored (`git check-ignore` exit 0, untracked, `.gitignore` line 8), while `project.yaml test_users` carries label+email at most (`local_dev: []` with an explicit no-secrets comment) — rule 2 honoured at every layer. The verify mechanism is the autonomous SuperTokens core admin-API token generate+consume path proven in waves 7/8/10 (no Resend-domain dependency, no founder dep). Provision is idempotent (find-by-email, don't duplicate), persistence records the SuperTokens user-id (re-verify not re-create), and the acceptance criterion is a genuinely falsifiable end-to-end proof (verified session → GET /me 200 or POST /servers 201). Scope is correctly lean — one fixture + record + a tiny re-verify snippet, with "NOT a fixture-management framework" named as a non-goal — and the named specialists (devops-engineer / supertokens-integration) both exist in AGENTS.md. design_gap_flag FALSE is correct (no UI surface). Build-ready; proceed to Phase 2 (Karen + jenny + Gemini) given the security-sensitive secrets-handling surface.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---
## Phase 2 — Karen + jenny — PASS
- **Karen APPROVE** — secrets-safety PASS (test-accounts.md gitignored verified; project.yaml labels-only doctor-enforced; password single-destination). admin-API verify path REAL (SDK supertokens.md EmailVerification.verifyEmailUsingToken, in-process via core connectionURI + SUPERTOKENS_API_KEY, no Resend). CORRECTION: the "used in waves 7/8/10" provenance is WRONG — archive shows the fixture was NEVER provisioned (deemed too costly) → treat as FIRST-TIME/unproven, keep the fallback/escalate clause. 3 secrets guardrails → B: never echo password to tracked transcripts/PRs/commits; delete any temp public domain + never commit the API key; re-verify snippet reads from the gitignored record.
- **jenny APPROVE** — faithful minimal impl of the 4-wave escalation; scope exact (no framework creep); secrets correct; no founder dep; design FALSE. CORRECTION: use POST /servers → 201 as the AC3 proof (NOT GET /me — it's EmailVerification-EXEMPT per wave-3, so /me-200 wouldn't prove the verified claim works).
GATE: PASS → B-block (no D, non-UI). CARRY to B: admin-API verify is first-time (fallback ready); proof route = POST /servers 201 (claim-gated); secrets ONLY in gitignored test-accounts.md (3 guardrails). T-8: secret-grep + the fixture session works.
