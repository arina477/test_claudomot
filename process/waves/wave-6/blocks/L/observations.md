# Wave 6 — L-2 Distill Observations

Synthesized from wave-6 artifacts (CI-only: compiled-dist boot probe; single task da242f6b; PR #16 merged 75e7d9d).
Artifact range: P-0 through V-3. Prior archives consulted: wave-1, wave-3, wave-4, wave-5 L/observations.md (wave-2 archive has no L/observations.md — transcript-lost; not referenced in wave-5 chain either).

```yaml
observations:

  - id: obs-1
    summary: >
      The compiled-dist pre-merge boot probe (boot-probe CI job) now EXISTS as a REQUIRED
      check on main (6 required contexts: lint, typecheck, test, build, secret-scan,
      boot-probe). Wave-6 ships the artifact that BUILD-PRINCIPLES rule 1 had been obligating
      since wave-3's promotion ("Boot the production-built artifact in a prod-like container
      and exercise its runtime config before merge"). For four consecutive waves (wave-1
      obs-2, wave-3 obs-1, wave-3 obs-2, wave-5 obs-1) the compiled-dist boot-crash class
      recurred because the obligation existed only as a written rule, not an enforced CI step.
      Wave-6 closes the gap: the pipeline now machine-enforces BUILD rule 1 at the merge gate.
      The boot-probe's cold-boot log (attempt-1 connection-refused → attempt-2 /health ok)
      confirms it boots the real compiled artifact (node apps/api/dist/src/main.js), not a
      source proxy, and cannot pass without a genuine /health 200.
    source:
      - process/waves/wave-6/stages/C-1-pr-ci-merge.md
        # "attempt 1 (14:15:40.97): curl: (7) Couldn't connect to server — artifact not yet
        #  listening (real cold boot); attempt 2 (14:15:41.99): boot-probe: /health returned
        #  ok on attempt 2"; "boot-probe is a REQUIRED check on main (6 required contexts)"
      - process/waves/wave-6/stages/V-1-karen.md
        # "gh api .../branches/main/protection: required_status_checks.contexts =
        #  ['lint','typecheck','test','build','secret-scan','boot-probe'] — 6 contexts,
        #  boot-probe included"; "cold-boot log signature ... proves probe genuinely boots
        #  the compiled artifact and waits on a real /health 200"
      - process/waves/wave-6/stages/V-1-jenny.md
        # "AC4 — REQUIRED status check (branch protection) blocks merge on boot crash — MATCHES";
        # "closes the recurring CI-green-but-crashes-at-prod-first-boot class that source-level
        #  checks + deployed-URL e2e structurally miss"
      - process/waves/wave-6/stages/P-0-frame.md
        # "CI never boots the compiled dist; e2e only hits the deployed URL → crashes caught
        #  post-deploy"; "the boot ENVELOPE — crashes fire at module-load/app-wiring BEFORE
        #  any DB connection ... a minimal-env boot reaching /health 200 catches the whole class"
      - process/waves/_archive/wave-5/blocks/L/observations.md
        # obs-1 (strong, 4-wave streak): "Four-wave streak. BUILD-PRINCIPLES rule 1 (promoted
        #  wave-3) covers the 'boot before merge' enforcement obligation."
    severity: informational
    candidate_principles_file: none
    recurrence: >
      wave-1 obs-2: tsconfig outDir emits dist/src/main.js, prod boot breaks, CI green.
      wave-3 obs-1: Dockerfile missing ARG VITE_API_ORIGIN, CI green, prod broken.
      wave-3 obs-2: workspace package.json exports pointing at src/, CI green, prod ERR_MODULE_NOT_FOUND.
      wave-5 obs-1: require() path off-by-one from dist/src, CI green, prod crash at boot.
      wave-6 (this): boot-probe artifact shipped as REQUIRED check — the machine-enforcement
      layer that was absent across those four waves is now in place. This wave is the CLOSURE
      event for that recurrence, not a new instance of it. No new candidate rule is generated
      by a fix-forward; the obligation was already stated in BUILD rule 1.
    promotion_gates: ~   # not a candidate — closure event, not a new pattern

  - id: obs-2
    summary: >
      The key structural question from wave-5's L-2: does wave-6's boot-probe artifact
      create a PROMOTABLE CI-PRINCIPLES rule that is genuinely non-duplicative of
      BUILD-PRINCIPLES rule 1? Assessment: the boot-probe's existence FULFILLS BUILD
      rule 1 — it does not generate a new rule. BUILD rule 1 states "Boot the
      production-built artifact in a prod-like container and exercise its runtime config
      before merge." The wave-6 boot-probe is exactly that, expressed as a CI job.
      Karen's wave-5 REJECTION of the near-identical candidate still holds: in this repo,
      CI is the only pre-merge gate; "before merge" (BUILD) and "before the merge gate"
      (candidate CI) name the same enforcement point. Promoting "include a compiled-dist
      boot probe in CI" would fragment a single invariant — boot the prod artifact before
      merge — across two principles files while describing the same obligation. The wave-5
      candidate text ("CI must boot the compiled artifact and probe its health endpoint
      before the merge gate, not only source-level tests") and BUILD rule 1 are semantically
      identical in enforcement outcome for this project. Wave-6 is the BUILD rule 1
      exemplar, not a counter-example that demands a new CI rule.
      The STRONGEST CASE FOR a CI-PRINCIPLES rule: CI-PRINCIPLES and BUILD-PRINCIPLES
      serve different reading audiences and trigger points (C-block vs B-block readers).
      A CI-specific rule makes the enforcement mechanism checkable by a CI reviewer
      without cross-referencing BUILD-PRINCIPLES: "Does ci.yml include a job that boots
      node dist/<entry>?" is a CI-scope falsifiability test. The BUILD rule says WHAT must
      happen (boot before merge); a CI rule would say WHERE it must be wired (in the pipeline).
      These are potentially distinct obligations at an abstract level.
      The STRONGEST CASE AGAINST: in practice, the CI pipeline IS the pre-merge gate, so
      the location-of-enforcement detail adds zero new information. A CI reviewer who
      checks for a boot step is simply verifying BUILD rule 1 in their domain; there is no
      scenario where BUILD rule 1 is satisfied WITHOUT a CI boot job (unless a human
      manually boots and vouches — but that is not how this repo works). Creating a
      CI-PRINCIPLES rule identical in intent does not improve coverage; it creates a
      maintenance burden (two files must stay in sync) and dilutes the signal that
      BUILD rule 1 carries its own weight. This is precisely karen's wave-5 reasoning,
      and no new evidence overturns it. The wave-6 artifact CLOSES the obligation; the
      closing of an obligation is not itself evidence for a new rule.
    source:
      - process/waves/_archive/wave-5/blocks/L/candidates/CI-PRINCIPLES.md
        # candidate text: "CI must boot the compiled artifact and probe its health endpoint
        #  before the merge gate, not only source-level tests."
      - process/waves/_archive/wave-5/blocks/L/observations.md
        # "head-learn FINAL distill verdict — wave-5: PROMOTE ZERO"; karen REJECTED obs-1
        # "near-duplicate of BUILD rule 1 ... in this repo CI is the only pre-merge gate,
        #  so 'before merge' and 'before the merge gate' name the same enforcement point"
      - command-center/principles/BUILD-PRINCIPLES.md
        # Rule 1 text verbatim: "Boot the production-built artifact in a prod-like container
        #  and exercise its runtime config before merge."
      - process/waves/wave-6/stages/V-3-fast-fix.md
        # "the wave is a net suite-honesty gain — it closes the wave-5 compiled-dist
        #  boot-crash blind spot (MODULE_NOT_FOUND / init-order class) that source-level
        #  lint/typecheck/test/build and deployed-URL e2e structurally cannot catch,
        #  enforcing BUILD rule 1 at the pipeline level"
    severity: informational
    candidate_principles_file: none
    recurrence: >
      This observation exists to document the dedup reasoning for future L-2 passes.
      The question is settled: BUILD rule 1 is the invariant; the boot-probe CI job is
      its machine-enforced instantiation. No CI-PRINCIPLES rule is generated by this wave.
      If a future project arises where BUILD-PRINCIPLES and CI-PRINCIPLES serve genuinely
      separate teams or toolchains (e.g., a mono-repo where some contributors never read
      BUILD-PRINCIPLES), the location-of-enforcement angle becomes promotable. Not applicable
      here.
    promotion_gates: ~   # dedup analysis concludes no new rule; not a candidate

  - id: obs-3
    summary: >
      The enforce_admins=false posture on main branch protection (a standing CI-PRINCIPLES
      candidate since wave-5 obs-3, which itself met the recurrence condition from wave-3
      obs-5) persists through wave-6 unchanged. Wave-6 was a CI-only wave that intentionally
      preserved enforce_admins=false to maintain the bot-merge path. The B-6 gate-verdict
      explicitly records "enforce_admins: false (bot merge flow preserved)." Karen's V-1
      notes it non-blocking and outside wave-6 scope. The pattern from wave-5 obs-3 is
      therefore a THIRD-WAVE CARRY: it was first observed (wave-3), recurred (wave-5
      admin direct-push), and now persists (wave-6 intentional preservation).
      The wave-5 promotion was blocked only by the per-file cap (obs-1 had tiebreak priority
      and was itself rejected). In wave-6, obs-1's successor (this wave's obs-2) is concluded
      as non-promotable (dedup). The per-file cap slot for CI-PRINCIPLES is therefore open
      this wave. The enforce_admins candidate from wave-5 obs-3 is the standing next
      candidate for CI-PRINCIPLES promotion.
    source:
      - process/waves/wave-6/blocks/B/gate-verdict.md
        # "enforce_admins: false (bot merge flow preserved)" — wave-6 explicitly records
        #  the posture as a deliberate choice
      - process/waves/wave-6/stages/V-2-triage.md
        # "e2e not a required check ... pre-existing (predates wave-6)"; note on non-blocking
        #  findings; enforce_admins not re-flagged (pre-existing, unchanged)
      - process/waves/_archive/wave-5/blocks/L/observations.md
        # obs-3: "wave-3 obs-5's explicit 'promote if a second direct-push recurs' condition
        #  fired (6b4ed53 admin direct-push). MEETS bar but NOT promoted (per-file cap).
        #  obs-3 is the standing NEXT-WAVE CI-PRINCIPLES candidate (rule form:
        #  set enforce_admins=true)."
      - process/waves/_archive/wave-3/blocks/L/observations.md
        # obs-5: "direct push eed4c3c bypassed PR (branch protection absent); recommended
        #  branch protection; promotion_gates held for 'second direct-push recurs'"
    severity: warning
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      wave-3 obs-5: direct push eed4c3c bypassed PR (branch protection absent).
      wave-5 obs-3: admin direct-push 6b4ed53 bypassed PR gate via enforce_admins=false;
        recurrence condition from wave-3 obs-5 explicitly fired. MEETS bar; blocked by cap.
      wave-6 (this): enforce_admins=false persists by deliberate design choice.
        Three-wave carry. Cap slot now open (wave-6 obs-2 is non-promotable dedup). 
        The candidate rule has met the 2+ wave recurrence threshold and the falsifiability
        check since wave-5. Condition for promotion: karen judges the bot-merge workflow
        constraint (enforce_admins=false is required for GitHub Actions auto-merge) is a
        project-specific exception that should be noted in the rule, or that the rule should
        be scoped to "where admin-bypass is not load-bearing for CI automation."
    promotion_gates:
      generalizable: true   # any GitHub repo where branch protection is enabled
      falsifiable: true     # checkable: gh api repos/{owner}/{repo}/branches/main/protection | jq .enforce_admins.enabled
      cited: true           # wave-3 obs-5 + wave-5 obs-3 + wave-6 B-6 gate-verdict enforce_admins record

  - id: obs-4
    summary: >
      The e2e CI job targets an already-deployed Railway URL (static E2E_BASE_URL) rather
      than a freshly-booted artifact within the CI run. Karen's V-1 note flags this as
      a pre-existing non-blocking finding: "e2e is not a required check — a red e2e would
      not block merge." This means a build that compiles correctly and passes the boot-probe
      but breaks a user-facing flow is caught only AFTER deploy (when the live URL
      reflects the new code) rather than pre-merge. This is the detection-latency gap
      that wave-5's head-learn held as a "genuinely non-duplicative angle" pending
      recurrence — it is distinct from BUILD rule 1 (which covers boot crashes, not
      user-flow regressions against the deployed surface). Wave-6 does not close this gap;
      it closes only the boot-crash class. The gap is now more clearly defined because
      the boot-probe's existence makes the structural boundary explicit: boot-probe
      catches module-load/init-order crashes; e2e against a live URL catches post-deploy
      user-flow regressions; neither catches user-flow regressions BEFORE deploy.
    source:
      - process/waves/wave-6/stages/V-1-karen.md
        # "the e2e job runs in CI but is NOT in the required-contexts list — so a red e2e
        #  would not block merge. This is pre-existing and outside wave-6 scope"
      - process/waves/wave-6/stages/V-2-triage.md
        # "e2e not a required check ... pre-existing; optional future follow-up to add e2e
        #  to required contexts ... deliberately non-required was reasonable"
      - process/waves/wave-6/stages/P-0-frame.md
        # "e2e only hits the deployed URL → crashes caught post-deploy"
      - process/waves/_archive/wave-5/blocks/L/observations.md
        # "distinct future angle (held, NOT promoted): the CI e2e job targets a static
        #  already-deployed Railway URL (E2E_BASE_URL), so a crashing new build is caught
        #  only post-deploy (detection-latency class, NOT covered by BUILD rule 1)"
    severity: warning
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      wave-5 (first observation, held): e2e targets deployed URL; detection-latency class
        identified as a genuinely non-duplicative CI gap. Held pending recurrence.
      wave-6 (this): the structural gap is confirmed and more precisely bounded by
        the boot-probe's existence (it catches a different class). Second wave noting
        the same structural gap, though it has not yet CAUSED an observed failure this wave.
      Hold in observations. The recurrence condition for promotion should be an observed
      failure where a user-flow regression passed the boot-probe + all required checks but
      broke after deploy — i.e., the detection-latency gap fires in practice, not just in
      structural analysis. No such failure has occurred yet.
    promotion_gates:
      generalizable: true   # any project where CI e2e targets a static deployed URL
      falsifiable: true     # checkable: does E2E_BASE_URL in ci.yml reference a static
                            # pre-existing deploy (not a freshly-built artifact in the run)?
                            # Is e2e a required check?
      cited: true           # wave-5 head-learn held angle + wave-6 karen V-1 non-blocking note
                            # + wave-6 V-2 triage explicit pre-existing disposition
```

---

## head-learn distill pre-assessment

**Candidate-grade observations this wave: obs-3 only.**

**obs-1 (compiled-dist boot closure) — NOT a candidate.**
This is the closure event for a four-wave recurrence. BUILD rule 1 was already the canonical statement of the obligation. The boot-probe fulfills that rule; fulfillment does not generate a new rule. Severity informational.

**obs-2 (CI-PRINCIPLES dedup analysis) — NOT a candidate.**
This is an explicit analytical observation documenting WHY no CI-PRINCIPLES rule is generated despite the wave-5 candidate having been in play. The dedup verdict stands: BUILD rule 1 and the proposed CI rule name the same enforcement point in this repo. Strongest case against: karen's wave-5 reasoning is unimpeached by wave-6 evidence — the wave-6 boot-probe IS BUILD rule 1's machine-enforced expression, confirming rather than challenging the dedup call. Strongest case for: CI and BUILD principles have different reading audiences and trigger points, so a CI-specific statement could reduce cross-referencing burden. However, this project's CI is the only pre-merge gate; the cross-file maintenance cost outweighs a marginal navigability benefit. Verdict: redundant promotion would be lesson-inflation. Severity informational.

**obs-3 (enforce_admins — CI-PRINCIPLES candidate) — CANDIDATE, three-wave carry.**
Wave-3 obs-5 first observed a direct-push bypass. Wave-5 obs-3 confirmed recurrence and the wave-3 explicit promotion condition fired ("second direct-push recurs"). The per-file cap blocked it in wave-5 because obs-1 had tiebreak priority (and was itself rejected). In wave-6, the per-file cap slot is open (obs-2 is a non-promotable dedup resolution). The candidate is promotable in form:
  `N. Set enforce_admins=true on the main branch-protection rule so CI checks apply to all actors.`
  `   Why: Admin or bot principals can push directly to main and bypass required CI checks if enforce_admins=false.`
Karen must assess: wave-6 intentionally PRESERVED enforce_admins=false for the bot-merge path (gh pr merge --auto requires the merge actor to bypass protection or have admin rights). If this is a known acceptable trade-off the project has consciously chosen, promoting the rule as a universal obligation would create a rule this project itself violates. Karen may judge that the correct promotion form is either scoped ("prefer enforce_admins=true unless admin-merge automation requires the exception, and document the exception explicitly") or deferred until a third genuine bypass failure occurs rather than a structural preservation.

**obs-4 (e2e detection-latency gap) — NOT a candidate this wave.**
Second wave noting the structural gap; held as specified (condition for promotion is an observed failure, not structural identification alone). The gap is now more precisely bounded, which is useful for a future promotion argument, but no failure has occurred. Severity warning; hold.

**Net: 4 observations, 1 candidate-grade (obs-3), 0 recommended for promotion without karen assessment. The CI-PRINCIPLES dedup question is definitively closed: no new rule from the boot-probe artifact. BUILD rule 1 is the sole governing invariant; wave-6 is its machine-enforcement exemplar.**

---

## head-learn FINAL distill verdict — wave-6: PROMOTE ZERO

- **obs-1 / obs-2 (boot-probe → CI-PRINCIPLES) — NOT a candidate; no karen spawn.** The boot-probe artifact FULFILLS BUILD-PRINCIPLES rule 1 ("Boot the production-built artifact in a prod-like container and exercise its runtime config before merge"); it does not create a distinct invariant. In this repo CI is the only pre-merge gate, so "before merge" (BUILD) and "before the merge gate" (a CI rule) name the same enforcement point. Promoting would be duplicate-promotion + lesson-inflation. Wave-6 RE-CONFIRMS BUILD rule 1 as its machine-enforcement exemplar; the four-wave compiled-dist boot-crash recurrence (wave-1 obs-2, wave-3 obs-1, wave-3 obs-2, wave-5 obs-1) is now CLOSED by shipped infrastructure. No rule needed.
- **obs-3 (enforce_admins=true → CI-PRINCIPLES) — candidate written, karen HARD-REJECT.** Three-wave carry (wave-3 obs-5, wave-5 obs-3, wave-6 persistence) and the per-file cap slot was open. Candidate drafted at `candidates/CI-PRINCIPLES.md`. karen verified the infra claim REAL against live `gh api .../branches/main/protection` (`enforce_admins.enabled=false`, 6 required contexts), confirmed the candidate is contract-clean on format, but HARD-REJECTED on substance: the rule "Set enforce_admins=true" directly contradicts the project's deliberate, B-6-gate-recorded `enforce_admins=false` posture (preserved for the `gh pr merge --auto` bot-merge path). Promoting a principle the live config violates on day one is a contradiction-left-standing failure. Not a deferral — a third recurrence would still contradict the recorded decision. A cosmetic rewrite cannot clear it; only a differently-scoped rule ("an intentionally-granted admin/bot bypass must not be used to merge red") with its own provenance could ever be promotable, and that provenance does not exist yet.
  - promotion blocked by karen HARD-REJECT; candidate dropped at L-2 wave-6 (reason: karen-REJECT — contradiction with deliberate live enforce_admins=false posture). Re-framed signal retained: the lesson is "do not merge red even when bypass-capable," not "remove the bypass." Standing for a future wave only if the founder/BOARD moves the bot path to `enforce_admins=true` via `bypass_actors`.
- **obs-4 (e2e detection-latency gap) — held.** Second wave noting the structural gap; promotion condition is an OBSERVED post-deploy user-flow failure that passed all required checks, which has not occurred. Held in observations.

**Net: 4 observations emitted, 1 candidate-grade (obs-3), 0 promoted. PROMOTE ZERO is the disciplined, correct outcome — no principles file edited this wave (no bloat, no duplicate, no contradiction).**
