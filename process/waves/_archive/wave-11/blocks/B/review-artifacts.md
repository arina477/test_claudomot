# Wave 11 — B-block review artifacts (single-spec, ops/test-infra)
**Block:** B · **Wave topic:** verified prod test fixture · **Gate:** B-6 · **Status:** in-progress
| Stage | Status | Notes |
|---|---|---|
| B-0 | done | branch wave-11-verified-fixture; claimed 4a2ad286; no schema/app-code |
| B-2 | done | fixture provisioned+verified (ab6ce69); secret-grep clean |
| B-5 | done | clean; 201 proof; pushed |
| B-6 | done | head-builder APPROVED (secrets-safe; fixture verified) |
| B-6 | done | head-builder APPROVED (secrets-safe; fixture verified) |
## CARRY (P-4): admin-API verify is FIRST-TIME (fallback/escalate ready); proof = POST /servers → 201 (claim-gated, NOT /me which is EV-exempt); secrets ONLY in gitignored command-center/testing/test-accounts.md (CSPRNG password; never echo to tracked files/PRs; delete any temp public domain + never commit API key; record user-id; idempotent find-by-email). project.yaml label+email only. T-8: secret-grep.
