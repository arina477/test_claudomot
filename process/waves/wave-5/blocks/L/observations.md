# Wave 5 — L-2 Distill Observations

Synthesized from wave-5 artifacts (M1 hardening: rate-limit, version, avatar, CI/ops, branch-protection, E2E; 6 specs, LIVE + V-APPROVED).
Artifact range: P-0 through V-3, PRs #12-#15, fix-forwards: version-path (PR#13), rate-limit trust-proxy (PR#14), node-20 partial (PR#15).
Prior archives consulted: wave-1, wave-3, wave-4 L/observations.md.

```yaml
observations:

  - id: obs-1
    summary: >
      A source-relative require() path in a TypeScript file that is correct when
      run via ts-node/vitest from src/ resolves one directory level wrong from the
      compiled dist/src/ output. apps/api/src/version.ts:21 used require('../package.json');
      from dist/src/version.js that resolves to dist/package.json (absent), not
      apps/api/package.json. Node throws MODULE_NOT_FOUND at boot, crashing every
      route. Local dev and CI (src-run) were green; only the compiled-dist prod boot
      exposed the failure. Recovery required a roll-forward (PR#13) because no healthy
      prior revision existed. This is the fourth consecutive wave with a prod-only,
      CI-green compiled-dist breakage.
    source:
      - process/waves/wave-5/stages/C-2-deploy-and-verify.md
        # "Cannot find module '../package.json' at dist/src/version.js:21 MODULE_NOT_FOUND";
        # "recovery is roll-FORWARD to the corrected revision, not rollback"
      - process/waves/wave-5/stages/V-1-karen.md
        # spec e38c306e note: "try-both-paths resolution... the PR#13 fix that recovered the boot-crash outage"
      - process/waves/wave-5/blocks/T/gate-verdict.md
        # "the version-path outage was a dist-vs-src package.json resolution failure
        #  that the src-run unit test did NOT catch — only live /health exposed it;
        #  the unit layer has a blind spot for compiled-dist runtime behavior"
      - process/waves/_archive/wave-1/blocks/L/observations.md
        # obs-2: tsconfig outDir emits dist/src/main.js, prod boot breaks, CI green
      - process/waves/_archive/wave-3/blocks/L/observations.md
        # obs-1: Docker ARG VITE_API_ORIGIN absent, CI green, prod container bakes fallback
        # obs-2: shared-pkg package.json exports point at src/, prod-container ERR_MODULE_NOT_FOUND
    severity: strong
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      wave-1 obs-2: tsconfig outDir emits wrong entry path; prod start script broken, CI green.
      wave-3 obs-1: Dockerfile missing ARG VITE_API_ORIGIN before pnpm build; CI green, prod broken.
      wave-3 obs-2: workspace package.json exports pointing at src/; CI green, prod-container ERR_MODULE_NOT_FOUND.
      wave-5 (this): require() path off-by-one from dist/src; CI green, prod crash at boot.
      Four-wave streak. BUILD-PRINCIPLES rule 1 (promoted wave-3) covers the "boot before merge"
      enforcement obligation. The CI-specific gap is distinct: CI itself does not include a step
      that boots or exercises node dist/... (the compiled output); it runs src-level unit/typecheck/build
      only. A src-run test is structurally incapable of catching dist-relative-path failures.
      The CI-PRINCIPLES locus is: machine-enforced compiled-dist boot probe in the CI pipeline,
      not a process-level "remember to boot it." BUILD rule 1 covers the process obligation (before merge);
      a CI rule would cover the enforcement mechanism (pipeline step).
    promotion_gates:
      generalizable: true   # any TypeScript project where CI runs src-level tests but deploys compiled dist
      falsifiable: true     # checkable: does ci.yml include a job/step that runs node dist/<entry> or docker run with HEALTHCHECK probe?
      cited: true           # C-2 crash logs verbatim + T-9 head-tester L-note + wave-1/3 prior obs chain

  - id: obs-2
    summary: >
      A rate limiter keyed on the incoming REMOTE_ADDR or the raw express req.ip
      behind a multi-hop reverse proxy (Railway 2-hop LB) trips on the varying
      load-balancer IP rather than the real client IP. The spec verified correctly
      in local curl (single-hop) and CI (no proxy); only the live Railway deploy
      exposed the failure because the real client IP is carried in x-forwarded-for[0]
      not in the socket address. Fixed by keying on XFF[0] (PR#14).
    source:
      - process/waves/wave-5/stages/C-2-deploy-and-verify.md
        # attempt-1 stale-tree: "15 rapid POST /auth/signin → all 200, NO 429 (rate-limit absent)"
        # C-2 resolved: "rate-limit not firing (Railway 2-hop XFF; trust-proxy keyed on varying LB IP)
        #  → fixed PR#14 (key on XFF[0]=real client IP)"
      - process/waves/wave-5/stages/V-1-karen.md
        # spec 839af17f note: "Keys on x-forwarded-for[0] (real client IP behind Railway 2-hop proxy)
        #  apps/api/src/main.ts:42-44"
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      First occurrence in this project. No prior wave records an XFF/trust-proxy keying failure.
      Hold in observations. Promote if a second rate-limit or IP-keyed feature is deployed behind
      a multi-hop proxy and the same XFF misconfiguration recurs.

  - id: obs-3
    summary: >
      With enforce_admins=false, an admin or bot principal can push directly to a
      branch-protected main branch, bypassing the PR and CI gate that the protection
      rule enforces for all other actors. Commit 6b4ed53 (rate-limit XFF fix) reached
      main via admin direct-push during the C-block fix-forward, the exact failure mode
      branch protection was meant to prevent. The spec AC (blocks non-admins) was met,
      but the protection is weaker than its intent.
    source:
      - process/waves/wave-5/stages/C-2-deploy-and-verify.md
        # "6b4ed53 reached main via admin direct-push (enforce_admins:false allows admin/bot bypass;
        #  rule blocks non-admins). Flag for L/retro — consider enforce_admins"
      - process/waves/wave-5/stages/V-1-karen.md
        # spec 478e9d43: "commit 6b4ed53 reached main via admin direct-push this very wave"
      - process/waves/wave-5/stages/V-1-jenny.md
        # findings table Low: "enforce_admins=false — admin/bot can bypass the rule"
      - process/waves/_archive/wave-3/blocks/L/observations.md
        # obs-5: eed4c3c direct-pushed to main (pre-branch-protection); recommended branch protection;
        # promotion_gates held for "second direct-push recurs"
    severity: warning
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      wave-3 obs-5: direct push eed4c3c bypassed PR (branch protection absent); recommended
      enabling branch protection. Wave-3 obs-5 held with condition "promote if ... second direct-push recurs."
      wave-5 (this): branch protection is now active but enforce_admins=false allowed a direct push
      to main anyway. Second direct-push to main confirmed; the recurrence condition from wave-3 obs-5 fires.
    promotion_gates:
      generalizable: true   # any GitHub repo with branch protection and admin/bot actors
      falsifiable: true     # checkable: gh api repos/{owner}/{repo}/branches/main/protection | jq .enforce_admins.enabled
      cited: true           # C-2 process note + karen 478e9d43 + wave-3 obs-5 recurrence condition

  - id: obs-4
    summary: >
      A node-20 deprecation-clearing task claimed completion in B-2 and B-6 review on
      the basis of source inspection (seeing checkout@v5 + setup-node@v5), without
      running the CI pipeline and reading its annotation output. Two deprecation-emitting
      actions (pnpm/action-setup@v4 and gitleaks-action@v2) were not in the inspected set
      and remained. Karen's V-1 REJECT caught the literal-AC miss. The fix (PR#15) was
      cheap (action-version bumps only); the issue was a verification-mode gap at B-block:
      source inspection cannot confirm "annotations no longer appear."
    source:
      - process/waves/wave-5/stages/V-1-karen.md
        # spec a7667fb7: "pnpm/action-setup@v4 (lines 18,29,49,61,83) and gitleaks/gitleaks-action@v2
        #  NOT addressed... annotations still appear... inaccurate completion claim in B-2/B-6"
      - process/waves/wave-5/stages/V-3-fast-fix.md
        # "a7667fb7 partial fix: literal-AC miss + inaccurate B-2/B-6 completion claim"
      - process/waves/_archive/wave-1/blocks/L/observations.md
        # obs-5: first node-20 deprecation observation (task a7667fb7 inserted at V-2)
    severity: informational
    candidate_principles_file: none
    recurrence: >
      wave-1 obs-5: node-20 annotation noise first flagged; task a7667fb7 inserted at V-2.
      wave-5 (this): a7667fb7 attempted partial fix; completion claimed on source inspection alone
      without CI run evidence. The annotation-noise pattern recurs; the new angle
      (source inspection alone is insufficient to verify annotation clearance) is first occurrence.
      Hold — the verification-mode gap is a single instance of a broader claim-vs-evidence
      discipline issue. If a second AC claimed complete on source inspection without CI evidence
      recurs, consider a VERIFY-PRINCIPLES or CI-PRINCIPLES candidate.

  - id: obs-5
    summary: >
      A deploy-platform (Railway) returned deployment status SUCCESS for a revision that
      served the wrong code, because the local worktree had diverged from origin/main during
      an aborted rebase. Deploy-state SUCCESS does not guarantee the deployed code matches
      the intended commit. Behavior probes (version check + 429 burst) were what exposed
      the wrong-revision deploy; platform status alone would have declared a false-green.
    source:
      - process/waves/wave-5/stages/C-2-deploy-and-verify.md
        # "Attempt 1 — STALE-TREE deploy: railway deployment a36adbf0 reported SUCCESS...
        #  /health version 0.1.0 (fallback), NO 429 — the merged code was NOT deployed.
        #  Lesson: deploy-state SUCCESS alone would have declared a false-green."
    severity: informational
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      First occurrence. No prior wave records a stale-tree false-SUCCESS deploy.
      The mitigation (behavior probes required in C-2 before declaring deploy complete)
      is already consistent with the C-2 stage's verification protocol.
      Hold for a second occurrence before considering a CI-PRINCIPLES candidate.
      Noting because the stale-worktree vector (aborted rebase leaving working tree
      behind origin/main) is a real risk for solo-dev repos with frequent rebase workflows.
```

---

## L-2 head-learn distill pre-assessment

Candidate-grade observations (have promotion_gates): obs-1, obs-3.

**obs-1 (CI-PRINCIPLES candidate) — STRONG.**
Four-wave compiled-dist-breakage recurrence. BUILD-PRINCIPLES rule 1 covers process obligation.
The CI-PRINCIPLES angle is genuinely distinct: enforce compiled-dist boot in the CI pipeline
(machine-enforced), not just a process reminder. Candidate rule form:
"Include a compiled-dist boot probe in CI (run `node dist/<entry>` or a prod-container
healthcheck) so path-relative require() failures surface before merge."
Karen should assess whether this clears the near-dup check against BUILD rule 1 (different
enforcement locus: CI pipeline vs. human process).
Promotion verdict: STRONG CANDIDATE — refer to karen.

**obs-3 (CI-PRINCIPLES candidate) — MEETS bar.**
Wave-3 obs-5 recurrence condition explicitly fires ("second direct-push recurs").
Candidate rule form: "Set enforce_admins=true on branch-protected main so no actor
can bypass the required PR and CI checks."
Single rule per wave per file cap applies: if both obs-1 and obs-3 are promoted in the
same wave, that exceeds the CI-PRINCIPLES cap. Karen should rank by severity and defer
the lower one to the following wave.
Promotion verdict: MEETS BAR — promotion slot priority is lower than obs-1 (obs-1
is outage-grade with 4-wave streak; obs-3 is process discipline with 2-wave streak).
Defer obs-3 to wave-6 unless karen judges it the stronger candidate.

**obs-2, obs-4, obs-5 — informational/warning, no promotion this wave.**
```

---

## L-2 head-learn FINAL distill verdict — wave-5: PROMOTE ZERO

- **obs-1 (CI-PRINCIPLES candidate) — REJECTED by karen; candidate dropped (reason: dedup vs BUILD-PRINCIPLES rule 1).** Karen confirmed the code-claim is REAL (`git show 5364a32^:apps/api/src/version.ts` = unconditional `require('../package.json')`, MODULE_NOT_FOUND at compiled-dist boot; fixed PR#13/5364a32) and the candidate format is clean, but judged the rule a near-duplicate of BUILD rule 1 ("Boot the production-built artifact in a prod-like container and exercise its runtime config before merge"). In this repo CI is the only pre-merge gate, so "before merge" (BUILD) and "before the merge gate" (candidate CI) name the same enforcement point; promoting would fragment one invariant across two files. Wave-5 RE-CONFIRMS BUILD rule 1 (4th instance: wave-1 obs-2, wave-3 obs-1, wave-3 obs-2, wave-5 version.ts) — no new rule needed. Held in observations.
- **obs-1 distinct future angle (held, NOT promoted):** karen identified a genuinely non-duplicative gap — the CI `e2e` job targets a static already-deployed Railway URL (`E2E_BASE_URL`), not a freshly-booted artifact, so a crashing new build is caught only post-deploy (detection-latency class, NOT covered by BUILD rule 1). Promotable to CI-PRINCIPLES only after it recurs as its own pattern; not authored this wave.
- **obs-3 (CI-PRINCIPLES enforce_admins candidate) — MEETS bar but NOT promoted (per-file cap).** Wave-3 obs-5's explicit "promote if a second direct-push recurs" condition fired (6b4ed53 admin direct-push). It targets the same file as obs-1; only one promotion per file per wave is allowed; obs-1 had tiebreak priority and was itself rejected. obs-3 is the standing NEXT-WAVE CI-PRINCIPLES candidate (rule form: set enforce_admins=true).
- **obs-2, obs-4, obs-5 — held.** First-occurrence / informational; no promotion.

Net: 5 observations emitted, 2 candidate-grade, 0 promoted. Zero is the disciplined, correct outcome — no principles file edited this wave (no bloat, no duplicate).
