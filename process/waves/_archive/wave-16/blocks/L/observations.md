# Wave 16 — L-2 Distill Observations

Synthesized from wave-16 artifacts (authed create-server browser E2E + storageState harness;
TEST-INFRA only; PR#28 squash-merged main@6982ffe; V APPROVED).
Prior archives consulted: process/waves/_archive/wave-{11,12,13,14,15}/blocks/L/observations.md.
Principles files read: BUILD-PRINCIPLES (3 rules), CI-PRINCIPLES (2 rules), VERIFY-PRINCIPLES
(1 rule), PRODUCT-PRINCIPLES (0 rules), T-5.md (0 rules).

---

```yaml
observations:

  - id: obs-1
    summary: >
      biome.json had no vcs config, so `biome ci` scanned gitignored Playwright output
      directories (e2e/.auth/, test-results/, playwright-report/) and produced false
      format failures on generated JSON. The fix was explicit files.ignore globs in
      biome.json; no vcs integration was needed. The root cause: biome's default behaviour
      scans all files reachable from the project root regardless of .gitignore unless
      either vcs.enabled=true (honour .gitignore) or explicit files.ignore globs are
      present. Adding new gitignored artifact directories without updating biome.json
      triggers false lint failures in CI.
    source:
      - process/waves/wave-16/stages/B-5-verify.md
        # "biome ci: 0 errors after formatting biome.json + ignoring Playwright artifacts"
      - process/waves/wave-16/stages/B-6-review-output.md L-3
        # "biome.json diff is clean — ONLY artifact ignores + whitespace reformat;
        #  no lint rule, severity, or files/formatter behaviour changed"
      - process/waves/wave-16/stages/C-1-pr-ci-merge.md lint row
        # "Biome 0-errors (9 pre-existing warnings unchanged)"
    severity: warning
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      First occurrence. No prior wave observation records biome scanning gitignored
      Playwright artifacts via missing vcs/files config. Wave-15 obs-5 records a different
      biome.json scope error (global lint rule vs targeted inline suppress); the mechanism
      differs (missing exclusion vs over-broad rule disable). Single-wave occurrence.
      HOLD; promote to CI-PRINCIPLES if a second wave has a biome (or equivalent
      file-scope linter) false failure caused by new gitignored artifact directories.
    near_dup_check: >
      CI-PRINCIPLES rules 1-2: deploy-verification (rule 1) and new-route probe (rule 2).
      BUILD-PRINCIPLES rules 1-3: none address linter artifact exclusion. No near-dup.
    promotion_gates:
      generalizable: true
        # Applies to any project using biome (or a similar whole-tree linter without
        # vcs integration) when a new test tool writes output to a gitignored directory;
        # the linter scans the generated files and fails on formatting.
      falsifiable: true
        # Checkable at B-5/C-1: does biome ci produce zero errors after new gitignored
        # artifact dirs are added, without adding a matching files.ignore glob?
      cited: true
        # B-5-verify (resolution), B-6-review L-3 (diff confirmed clean), C-1 (lint pass).
    candidate_rule_shape: >
      3. Add a files.ignore glob to biome.json for every new gitignored artifact directory;
         biome scans the full tree without vcs integration by default.
         Why: biome ci produces false format failures on generated files unless the
         directory is explicitly excluded.
      Rule line = 108 chars (within 120); why line = 73 chars (within 100). No forbidden tokens.

  - id: obs-2
    summary: >
      The authed E2E harness pattern established in this wave (storageState setup-project
      that signs in once via the real /login form and saves httpOnly cookies to a gitignored
      fixture file; a separate unauthenticated smoke project with no storageState dependency;
      fixture credentials supplied via CI secrets and a local gitignored test-accounts file)
      passed its first CI run cleanly. The setup project hard-fails on missing env vars and
      on failed sign-in, so there is no silent skip. A new authed spec is added by dropping
      a *.spec.ts file in e2e/; it automatically joins the chromium-authed project. A new
      UNAUTHED spec must match smoke.spec.ts pattern or the ignore glob must be widened.
      The pattern is fully reusable for all future authenticated Playwright specs.
    source:
      - process/waves/wave-16/stages/B-3-frontend.md
        # 3-project split: setup / chromium-smoke / chromium-authed; storageState; gitignore
      - process/waves/wave-16/stages/V-1-karen.md Claim 2
        # "storageState approach: signs in ONCE via real /login; guards on AuthGuard-gated
        #  nav + /app URL before persisting. Fails loud on missing env."
      - process/waves/wave-16/stages/T-5-e2e.md
        # "RATIFIED REAL. Passed 4/4 CI e2e job against live prod."
    severity: informational
    candidate_principles_file: command-center/principles/test-layer-principles/T-5.md
    recurrence: >
      First instance of the authed Playwright harness in this project. Pattern is sound
      and CI-verified but only observed once. Single-wave occurrence. HOLD; promote to
      T-5.md if a second wave adds an authenticated E2E using the storageState setup-project
      pattern and it either succeeds cleanly or surfaces a refinement.
    near_dup_check: >
      T-5.md Rules: empty. No near-dup possible.
    promotion_gates:
      generalizable: true
        # Applies to any authed Playwright suite; the storageState + setup-project +
        # CI-secret credential pattern is a standard Playwright approach, not
        # project-specific.
      falsifiable: true
        # Checkable at T-5: for any authed spec, does a setup project gate storageState
        # persistence on the authenticated app shell being visible (not just login submission)?
      cited: true
        # B-3 (harness implementation), V-1-karen Claim 2 (storageState verification),
        # T-5 (CI-ratified real).
    candidate_rule_shape: >
      1. For an authed E2E project, persist storageState only after the auth-gated app
         shell is visible, not on form submission; throw on missing fixture creds.
         Why: A session persisted after form submit but before the guard can mask a
         failed or partial login.
      Rule line = 117 chars (within 120); why line = 74 chars (within 100). No forbidden tokens.

  - id: obs-3
    summary: >
      Fork PRs will always fail the chromium-authed e2e project because
      secrets.E2E_FIXTURE_EMAIL/PASSWORD are unavailable to fork contexts in GitHub
      Actions, causing auth.setup.ts to throw and the authed suite to hard-fail. For a
      solo/internal repo where all PRs come from branches on the same repo, secrets are
      available and this never fires. The risk is latent: if external contributions are
      ever accepted, every fork PR will show a red CI check. B-6 identified it as H-1
      (operational, non-blocking); the correct mitigation is to gate the setup project or
      the env block on secret presence, or run only the chromium-smoke project for fork PRs.
    source:
      - process/waves/wave-16/stages/B-6-review-output.md H-1
        # "fork PRs will fail the authed suite, by design but un-guarded"
      - process/waves/wave-16/stages/V-2-triage.md
        # "H-1 (fork-PR red) is design-correct for this repo's same-repo-PR model;
        #  recommended as follow-up tech-debt"
    severity: informational
    candidate_principles_file: none
    recurrence: >
      First occurrence. This project has no external contributors; the risk is latent
      only. Single-wave informational carry. No rule warranted at this time; file is
      a tech-debt note for the record if the contribution model changes.
    near_dup_check: >
      CI-PRINCIPLES rules 1-2: deploy/route verification. Unrelated. No near-dup.

```

---

## Wave-16 L-2 distill disposition

**obs-1 (biome scans gitignored artifacts without files.ignore globs) — HOLD.**

First occurrence of biome false-CI-failures from missing artifact exclusion. Wave-15 obs-5
(global rule disable vs targeted inline suppress) is a different biome scope error and
does not confirm the same class. Single-wave occurrence. Hold; promote to CI-PRINCIPLES
rule 3 if a second wave has a biome (or equivalent whole-tree linter) false failure
from a new gitignored artifact directory lacking an explicit exclude.

Candidate rule for second qualifying wave:
```
3. Add a files.ignore glob to biome.json for every new gitignored artifact directory;
   biome scans the full tree without vcs integration by default.
   Why: biome ci produces false format failures on generated files unless the
   directory is explicitly excluded.
```
Rule line = 108 chars; why line = 73 chars. No forbidden tokens.

**obs-2 (authed Playwright storageState harness, first instance) — HOLD.**

First and only instance of the storageState setup-project authed harness. CI-verified
and clean on first attempt. T-5.md has 0 rules; cap is clear. However single-wave
occurrence only. Hold; promote to T-5.md rule 1 if a second wave uses the authed
storageState pattern (whether as a straight reuse or a refinement to the harness).

**obs-3 (fork-PR CI red on authed suite) — INFORMATIONAL; NO PROMOTION.**

Latent risk only for a solo/internal repo. No pattern or principle warranted.

---

## Summary table

| id    | title (short)                                    | severity      | recurrence | disposition                                                  |
|-------|--------------------------------------------------|---------------|------------|--------------------------------------------------------------|
| obs-1 | biome scans gitignored artifacts (missing ignore) | warning      | 1 wave     | keep-as-observation; promote if recurs (CI-3)                |
| obs-2 | Authed storageState E2E harness (first instance)  | informational | 1 wave     | keep-as-observation; promote if recurs (T-5 rule 1)          |
| obs-3 | Fork-PR CI red on authed suite (latent, solo repo)| informational | 1 wave     | informational; no promotion                                  |

**Promotions this wave: 0.** This is a light test-infra wave; all candidates are
single-instance. No principles file receives a new rule this wave.
