# T-8 — Security (wave-16) — light check (no new auth surface)

**Scope.** The wave EXERCISES auth (fixture sign-in for the E2E) but adds NO auth/authz/session surface — no new
endpoint, no guard, no session logic. The only security concern is credential hygiene of the test harness.
There is no new IDOR/JWT/rate-limit surface to probe (the create-server endpoint's authz was already T-8-verified
in the wave it shipped; this wave does not touch it).

## Credential-hygiene check (ratified — head-builder + /review already verified)
1. **Fixture password NOT committed.** Only occurrence of `E2E_FIXTURE_PASSWORD` in any tracked file is
   `${{ secrets.E2E_FIXTURE_PASSWORD }}` in `ci.yml`. `auth.setup.ts` reads creds from `process.env`; no literal
   credential in the branch diff. `command-center/testing/test-accounts.md` is untracked. (gitleaks secret-scan
   passed at C-1.)
2. **CI secrets masked.** `E2E_FIXTURE_EMAIL`/`E2E_FIXTURE_PASSWORD` injected as GitHub Actions secrets, masked
   in logs (`E2E_FIXTURE_EMAIL: ***` observed in C-1 e2e job).
3. **Live-session storageState gitignored.** `e2e/.auth/` ignored (`apps/web/.gitignore:1-2`); `git check-ignore
   apps/web/e2e/.auth/fixture.json` → IGNORED; `fixture.json` NOT in `git ls-files`. The file holds a LIVE
   SuperTokens session cookie — correctly kept out of the repo.
4. **No artifact-leak surface.** The CI e2e job does NOT `upload-artifact` the playwright-report or storageState,
   and there is no `pull_request_target` workflow — so the masked secrets / live cookie cannot leak via CI artifacts.

```yaml
test_pattern: ci-verified
skipped: false
evidence:
  - "gitleaks secret-scan PASS at C-1; only E2E_FIXTURE_PASSWORD ref is ${{ secrets.* }} in ci.yml"
  - "git check-ignore apps/web/e2e/.auth/fixture.json -> IGNORED; not in git ls-files"
  - "no upload-artifact / no pull_request_target in ci.yml — no leak surface"
  - "CI logs show E2E_FIXTURE_EMAIL: *** (masked)"
findings: []
head_signoff:
  verdict: APPROVED
  stage: T-8
  failed_checks: []
  rationale: >-
    No new authz/session/IDOR/rate-limit surface — light check only. Credential hygiene is clean and ratified
    on load-bearing evidence: fixture password lives only as a masked CI secret (gitleaks green), the live-session
    storageState is gitignored + untracked (git check-ignore confirms), and there is no artifact-upload or
    pull_request_target path that could leak the secret or cookie. No probe target this wave.
  next_action: PROCEED_TO_T-9
```
