# Wave 28 — L-2 Distill Observations

Synthesized from wave-28 artifacts (single-spec backend security fix: POST /servers/:id/invite-code/rotate,
owner-ONLY CSPRNG rotate; PR#41 6eb62e4; V APPROVED).
Prior archives consulted: process/waves/_archive/wave-{24,25,26,27}/blocks/L/observations.md.
Principles files read: BUILD-PRINCIPLES (7 rules, rule 7 promoted w25), CI-PRINCIPLES (6 rules,
rule 6 promoted w27), PRODUCT-PRINCIPLES (2 rules, rule 2 promoted w27), VERIFY-PRINCIPLES (1 rule),
T-4.md (0 rules), T-8.md (1 rule, rule 1 already live).

---

```yaml
observations:

  - id: obs-1
    summary: >
      An entropy-based secret scanner (gitleaks generic-api-key heuristic) triggered a
      false-positive on a wave transcript file (process/waves/wave-28/blocks/B/gate-verdict.md
      line 26) because hyphenated descriptive noun-phrases in model-authored deliverables exceed
      the entropy threshold. The process/ tree is structurally secret-free by policy (secrets live
      in platform env vars per CLAUDE.md always-on rule 2), yet the scanner blocked CI merge for
      two full fix cycles. The correct structural fix is to add process/.* to the scanner's
      global path allowlist (gitleaks: singular [allowlist].paths, NOT a sibling [[allowlists]]
      array-of-tables — see obs-2 for that config trap). The generalizable class: any
      entropy-based secret scanner applied to a repo that commits model-authored transcript
      directories will generate false-positive matches on those directories, because model
      prose routinely produces high-entropy token sequences in descriptive text. The fix is
      a path-scoped allowlist applied at project bootstrap, not a per-finding suppression.
    source:
      - process/waves/wave-28/stages/C-1-pr-ci-merge.md
        # "gitleaks generic-api-key entropy 3.807 matched a hyphenated noun-phrase in
        #  process/waves/wave-28/blocks/B/gate-verdict.md:26 — prose describing auth
        #  posture. Classification: FALSE POSITIVE. No credential present."
        # "fix_up_cycles: 2 — first attempt ineffective (see obs-2); second attempt
        #  folded process/.* into singular [allowlist].paths, CI secret-scan green."
      - process/waves/wave-28/blocks/B/gate-verdict.md
        # Line 26 fingerprint: generic-api-key entropy 3.807 on phrase
        # "...server-side-at-every-door): auth at the guard, RBAC/ownership in the service."
    severity: warning
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "entropy-based scanner false-positives on model-authored
      transcript directories" class. HOLD. The class is generalizable (applies to any
      project where model-authored stage/gate deliverables are committed to the repo and
      an entropy heuristic is used for secret scanning). Promote to CI-PRINCIPLES rule 7
      on second confirming wave where an entropy scanner false-positives on a model-authored
      process/ or transcript directory.

      Near-dup check against CI rule 6 ("Run CI on every push to main... or scope the linter
      to source files only"): rule 6 addresses linter scope on bypass pushes; this candidate
      addresses secret-scanner false-positives on committed model-authored directories. Different
      scanner type, different axis, different fix (allowlist vs linter-ignore). No near-dup.

      Near-dup check against CI rule 4 ("Run the formatter check command at the wiring stage"):
      rule 4 targets formatter discipline in the B-block, not scanner configuration. No near-dup.

      CI-PRINCIPLES has 6 rules; slot 7 open.
    promotion_gates:
      generalizable: true
        # Applies to any project that commits model-authored deliverables (stage transcripts,
        # gate verdicts, review artifacts) and uses an entropy-based secret scanner on the
        # full repo tree. The process/ tree contains model-generated prose which reliably
        # contains high-entropy token sequences (hyphenated compound terms, base64url tokens
        # in test evidence, UUIDs in fingerprints). Any entropy heuristic applied repo-wide
        # will match these.
      falsifiable: true
        # Checkable at project bootstrap or at any C-1 where gitleaks (or equivalent) runs:
        # does the scanner's allowlist include the process/ (or equivalent transcript)
        # directory path? A CI config lacking this allowlist fails this rule when a model-
        # authored deliverable containing any high-entropy string is committed.
      cited: true
        # C-1-pr-ci-merge.md (false-positive confirmed: line 26, rule generic-api-key,
        #   entropy 3.807, phrase is prose not a credential; fix_up_cycles: 2; final fix:
        #   process/.* in singular [allowlist].paths, CI green run 28532913181);
        # B/gate-verdict.md line 26 (the matching content: hyphenated noun-phrase).
    candidate_rule_shape: >
      7. Add model-authored transcript directories to the secret scanner's path allowlist
         at project setup; entropy heuristics match model prose as false positives.
         Why: Model-generated deliverables contain high-entropy phrases that trigger generic
         secret rules and block CI until a path allowlist is configured.
      Rule line = 118 chars; why line = 97 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote to CI-PRINCIPLES rule 7 on second
      confirming wave where an entropy scanner false-positives on a model-authored directory.

  - id: obs-2
    summary: >
      A CI-tooling config fix was pushed without local verification, reproducing the identical
      failure and wasting a full CI round-trip. The first gitleaks allowlist fix used
      [[allowlists]] (plural array-of-tables) appended below the existing singular [allowlist]
      table. gitleaks 8.24.3 silently ignores any top-level [[allowlists]] array-of-tables
      block; only the singular [allowlist] table is the recognized global-allowlist key. The
      config was wrong, no error was emitted, and the SAME finding reproduced (CI run
      28532557839). The second attempt installed gitleaks locally, REPRODUCED the failure
      against the broken config, then verified the fix cleared it before pushing. That CI run
      passed (28532913181). The generalizable class: when a CI-config fix involves a tool's
      config format (toml, yaml, json schema), verify the fix locally against the REAL tool
      at the REAL version before pushing — a config error that a tool silently ignores will
      reproduce the failure at the same cost as the original. Guessing at config schema and
      pushing wastes a CI round-trip. The reproduce-and-verify discipline (reproduce failure
      on broken config, confirm clean on fixed config, then push) is the durable gate.
    source:
      - process/waves/wave-28/stages/C-1-pr-ci-merge.md
        # fix_up_cycle_1: "outcome: INEFFECTIVE — authored as sibling [[allowlists]]
        #   array-of-tables; gitleaks honors only the singular [allowlist] table, so the
        #   process/** path allowlist was silently ignored. Same finding reproduced."
        # fix_up_cycle_2: "folded process/.* into the singular [allowlist].paths array.
        #   outcome: VERIFIED — local gitleaks 8.24.3 zero leaks on full-history + main..HEAD
        #   (UUID FP still suppressed); CI run 28532913181 secret-scan success in 11s."
        # "prior_run_ids: [28532301006, 28532557839] — both 6/7, secret-scan FAILURE"
        # "fix_up_cycles: 2"
    severity: strong
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "CI-config fix pushed unverified wastes a full CI round-trip"
      class. HOLD. The cycle cost was measured (1 wasted CI run; 2 fix-up cycles instead
      of 1). The correct procedure is clear and falsifiable (install + reproduce + verify
      locally before pushing). Promote to CI-PRINCIPLES rule 7 or 8 on second confirming
      wave where a CI-config fix (gitleaks, github actions yaml, biome, tsconfig) is pushed
      without local reproduction and reproduces the failure.

      Near-dup check against CI rule 4 ("Run the formatter check command at the wiring stage
      before commit"): rule 4 targets B-block formatter discipline; this candidate targets
      CI-config tooling fixes at any stage. Different scope and actor. No near-dup.

      Note on slot: obs-1 also targets CI-PRINCIPLES (rule 7 slot). If both are promoted
      in the same wave, the per-file 1-rule cap applies. obs-2 is severity:strong (measured
      wasted cycle, immediate falsifiable fix protocol); obs-1 is severity:warning.
      obs-2 takes precedence for this wave's promotion slot if both confirm simultaneously.

      CI-PRINCIPLES has 6 rules; slot 7 open.
    promotion_gates:
      generalizable: true
        # Applies at any C-block or B-block fix cycle where a CI-tooling config is modified
        # (gitleaks, github actions yaml, biome.json, tsconfig, eslint config). The failure
        # class is: a config format error that the tool silently ignores causes the same
        # failure to reproduce, costing a CI round-trip. The prevent is: install the tool
        # locally, reproduce the failure on the broken config, confirm clean on the fixed
        # config, then push. Any project using gitleaks or a similarly config-driven scanner
        # is susceptible.
      falsifiable: true
        # Checkable at any CI-config fix commit: did the committer run the real tool locally
        # against the modified config file before pushing? A fix commit that was not
        # preceded by a local reproduce-and-verify run fails this rule. The measured
        # outcome of a violation: the identical failure reproduces in CI (same finding
        # fingerprint, same exit code).
      cited: true
        # C-1-pr-ci-merge.md (fix_up_cycle_1 = INEFFECTIVE: [[allowlists]] silently ignored;
        #   fix_up_cycle_2 = VERIFIED: local install + full-history scan + main..HEAD scan,
        #   then push; CI run 28532913181 success; fix_up_cycles: 2 vs expected 1).
    candidate_rule_shape: >
      8. Before pushing a CI-config fix, reproduce the failure locally, then confirm the fix
         clears it; a silently-ignored config error reproduces the identical CI failure.
         Why: Config formats tolerate unknown keys without error; local verification is the
         only gate before a wasted round-trip.
      Rule line = 116 chars; why line = 95 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote to CI-PRINCIPLES rule 7 or 8 on second
      confirming wave. Priority over obs-1 for same-wave promotion slot (strong vs warning).

  - id: obs-3
    summary: >
      BUILD rule 7 (run the lint/import-organizer check command before reporting done) has
      now failed to prevent formatter drift in THREE consecutive waves: wave-25 (import-sort
      miss, promoted rule 7), wave-26 (no formatter miss this class), wave-27 (B-4 flag,
      B-6 noted recurrence), wave-28 (B-2 node-specialist committed 2 unformatted spec
      files; caught at B-4; remediated by deterministic biome check --write commit f78552c).
      head-builder B-6 explicitly flagged: "if it fires a 3rd time, L-2 should promote a
      hard pre-commit biome gate." The existing BUILD rules 6 and 7 prescribe WHAT to run
      but are advisory; a specialist can omit them without a machine-enforced gate. The
      pattern across 3 instances is: the rule is stated, the rule is skipped, B-4 catches
      it, a fixup commit is required. The durable fix is not another rule refinement but a
      hard enforcement mechanism: a pre-commit hook (e.g. lint-staged + husky / lefthook)
      or a CI job that fails immediately on format/import-sort violations, forcing the
      specialist to fix before any commit lands. This is a new axis (enforcement mechanism)
      distinct from the wording of rules 6 and 7 (which describe what to run). The candidate
      rule belongs in BUILD-PRINCIPLES (as the build-time gate) or CI-PRINCIPLES (as the
      CI-enforcement gate); BUILD is the more actionable home since a pre-commit hook fires
      before CI.
    source:
      - process/waves/wave-28/stages/B-4-wiring.md
        # "lint_passed: true — after formatter fixup f78552c"
        # "B-2 (node-specialist) committed 2 unformatted spec files → BUILD rule 7 (local
        #  biome check before commit) was not applied. Remediated deterministically at B-4.
        #  Recurrence of the wave-25/26 formatter-drift pattern."
      - process/waves/wave-28/stages/B-6-review.md
        # "Noted B-2 formatter miss (non-blocking; remediated f78552c) — flagged: if it
        #  recurs a 3rd time, L-2 should promote a hard pre-commit biome gate."
      - process/waves/_archive/wave-27/blocks/L/observations.md
        # (no dedicated obs for this — wave-27 B-4 flagged it as "Recurrence of the
        #  wave-25/26 formatter-drift pattern (already promoted as BUILD rule 7 + CI rule 4);
        #  no re-promotion needed." — that assessment treated wave-27 as a reinforcement.
        #  Wave-28 is the 3rd confirmed instance per head-builder's explicit flag.)
      - process/waves/_archive/wave-25/blocks/L/observations.md
        # obs-1 (promoted to BUILD rule 7): "biome format --write does NOT run organizeImports;
        #  only biome check --write does. B-4 wiring caught a biome ci failure that biome
        #  format --write passed." — wave-25 was the 1st promotion of the rule wording.
    severity: strong
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      3RD CONFIRMING INSTANCE (wave-25 promotion of rule 7, wave-27 flagged at B-4/B-6,
      wave-28 explicit head-builder escalation). PROMOTABLE.

      Instance history:
      - wave-25: import-sort miss; promoted BUILD rule 7 (run check command, not formatter alone).
      - wave-27: formatter miss; B-4 flagged as recurrence of BUILD rule 7; B-6 noted
        "already promoted, no re-promotion needed" — treated as a reinforcement.
      - wave-28: formatter miss again; head-builder explicitly escalated: "if it fires a 3rd
        time, L-2 should promote a hard pre-commit biome gate."

      The signal has escalated from "wording refinement" (rule 7, wave-25) to "enforcement
      escalation" (pre-commit gate, wave-28). These are distinct candidates on different axes:
      rule 7 says WHAT to run; the new candidate says HOW to enforce it (machine gate that
      cannot be silently skipped). A pre-commit hook or equivalent that runs biome check --write
      automatically on staged files would have prevented all three B-4 fixup commits.

      Near-dup check against BUILD rule 7 ("Run the lint/import-organizer check command, not
      the formatter alone, before reporting a build task done"): the existing rule describes
      what the specialist should run. The new candidate describes adding a machine-enforced gate
      that prevents committing without the check passing. These are orthogonal: rule 7 is an
      instruction; the new candidate is an enforcement mechanism that makes rule 7 non-bypassable.
      Not a near-dup.

      Near-dup check against CI rule 4 ("Run the formatter check command at the wiring stage
      before commit"): CI rule 4 targets the wiring-stage operator; the new candidate targets
      the commit-time gate (pre-commit hook fires at git commit, not at wiring-stage review).
      Different trigger point. Not a near-dup.

      BUILD-PRINCIPLES has 7 rules; slot 8 open. PROMOTABLE. Flag for karen.
    promotion_gates:
      generalizable: true
        # Applies to any project using biome (or any format + lint + import-sort toolchain)
        # where B-block specialists are expected to run the check command manually before
        # committing. A pre-commit hook running biome check --write on staged files is the
        # standard enforcement mechanism. The pattern (specialist skips manual check, wiring
        # stage catches it, fixup commit required) repeats across any wave where multiple
        # specialists touch the same files.
      falsifiable: true
        # Checkable at project bootstrap or at any B-0: does the repo have a pre-commit
        # hook (lefthook, husky, lint-staged, or equivalent) that runs biome check --write
        # on staged files? A repo lacking this gate fails this rule. The measured cost
        # of absence: at least one B-4 fixup commit per formatter-miss wave.
      cited: true
        # B-4-wiring.md (formatter miss: node-specialist committed 2 unformatted spec files;
        #   BUILD rule 7 not applied; remediated deterministically by biome check --write
        #   at B-4, commit f78552c);
        # B-6-review.md (head-builder escalation: "if it recurs a 3rd time, L-2 should
        #   promote a hard pre-commit biome gate");
        # wave-25 L-2 obs-1 (1st promotion: biome format vs biome check distinction, rule 7);
        # wave-27 B-4 flag (2nd instance, treated as reinforcement of existing rule).
    candidate_rule_shape: >
      8. Gate commits with a pre-commit hook running the full check command on staged files
         so format and import-sort violations cannot be committed silently.
         Why: A rule prescribing what to run is advisory; a pre-commit hook enforces it at
         every commit without specialist discipline.
      Rule line = 114 chars; why line = 92 chars. No forbidden tokens.
    promotion_status: PROMOTABLE. 3rd confirming instance (w25+w27+w28). head-builder
      escalated explicitly. Enforcement-mechanism candidate distinct from BUILD rule 7.
      Flag for karen.

  - id: obs-4
    summary: >
      When deployed behavior diverges from the spec, the triage step must classify the
      divergence as spec-GAP (spec wrong, code correct) vs spec-drift (code wrong, spec
      correct) before recommending any action. Wave-28 surfaced a clean instance: AC1 + the
      api contract said "200"; the deployed endpoint returned "201" (NestJS @Post default).
      jenny V-1 classified it as spec-GAP because (a) 201 is semantically MORE correct for
      a credential-minting action, (b) the two sibling POST-create handlers in the same
      controller both carry @HttpCode(CREATED) deliberately, and (c) there is no client
      consumer forcing a status contract. V-2 concurred: the correct fix is to amend the
      spec (AC1 + api contract → 201/2xx), NOT to add @HttpCode(200) to the code. V-3
      applied the spec reconciliation (0 production LOC changed). The generalizable class:
      a spec-divergence finding must distinguish "the spec's author wrote an incidental
      placeholder (spec-GAP)" from "the code diverged from a load-bearing contract (spec-
      drift)"; a more-correct deployed behavior amends the spec, not the code. Acting on
      spec-GAP as if it were spec-drift would have added @HttpCode(200), making the rotate
      handler inconsistent with its sibling create handlers at zero consumer benefit.
    source:
      - process/waves/wave-28/stages/V-1-jenny.md
        # "Classification: spec-GAP (spec wrong), NOT spec-DRIFT."
        # "201 Created is arguably the MORE correct status than 200 — the sibling
        #   createServer (controller:38-40) and createInvite (controller:109-111) both
        #   deliberately carry @HttpCode(HttpStatus.CREATED)"
        # "V-2 recommendation: amend the spec to 201/2xx (do NOT add @HttpCode(200))."
      - process/waves/wave-28/stages/V-2-triage.md
        # F28-T8a classification: "spec-GAP (the SPEC was wrong, not the code): 201 is the
        #   MORE correct status for a credential-minting action and matches the sibling create
        #   handlers. Cleanest fix = amend the spec's AC1 + api contract to 2xx/201, NOT force
        #   @HttpCode(200)."
      - process/waves/wave-28/stages/V-3-fast-fix.md
        # "0 production LOC changed — jenny's explicit recommendation was to align the spec
        #   to the deployed-and-correct 201, not to add @HttpCode(200)."
    severity: informational
    candidate_principles_file: command-center/principles/VERIFY-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "deployed-behavior-vs-spec divergence: classify spec-GAP vs
      spec-drift before acting" class in wave L-2 observations. HOLD. Promote to VERIFY-
      PRINCIPLES rule 2 on second confirming wave where a V-block divergence finding is
      correctly or incorrectly classified as spec-GAP vs spec-drift and the classification
      drives a material difference in the fix action (code change vs spec amendment).

      Near-dup check against VERIFY rule 1 ("Verify seeding ACs by inspecting create-path
      source, not runtime behavior"): rule 1 targets seed-AC verification methodology at
      V-1. This candidate targets the triage of a divergence finding at V-2 (classification
      of spec-GAP vs spec-drift before recommending action). Different stage, different
      subject. No near-dup.

      VERIFY-PRINCIPLES has 1 rule; slot 2 open.
    promotion_gates:
      generalizable: true
        # Applies at V-2 triage for any wave where a finding reports a status code, field
        # name, response shape, or behavior that differs from the spec. The classification
        # question ("is the spec the authoritative contract here, or is the deployed
        # behavior semantically superior?") arises whenever a spec was authored with an
        # incidental placeholder vs when code genuinely diverged from a load-bearing
        # consumer contract. Both resolution paths are valid; choosing wrong adds
        # unnecessary churn (code change that makes the codebase inconsistent) or leaves
        # a genuine defect unaddressed.
      falsifiable: true
        # Checkable at V-2: does the triage record classify each divergence finding as
        # spec-GAP or spec-drift before routing to V-3 or B-re-entry? A V-2 that routes a
        # divergence finding directly to "code fix" without confirming the spec is load-
        # bearing (has a real downstream consumer asserting that exact contract) fails this
        # rule. The wave-28 instance provides a positive example: classification was explicit,
        # decision recorded, 0 production LOC changed.
      cited: true
        # V-1-jenny.md (spec-GAP classification, reasoning, sibling-handler consistency
        #   argument, explicit "do NOT add @HttpCode(200)" recommendation);
        # V-2-triage.md (F28-T8a: bucket = "non-blocking → fix in-wave (V-3)",
        #   routing = "spec-doc reconciliation", rationale = jenny spec-GAP classification);
        # V-3-fast-fix.md (0 production LOC changed; spec AC1 + api contract amended to 201).
    candidate_rule_shape: >
      2. At V-2 triage, classify each spec-divergence finding as spec-GAP or spec-drift
         before routing; a more-correct deployed behavior amends the spec, not the code.
         Why: Treating a spec-GAP as spec-drift adds code churn that makes an implementation
         inconsistent with its siblings at zero consumer benefit.
      Rule line = 115 chars; why line = 96 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote to VERIFY-PRINCIPLES rule 2 on second
      confirming wave where spec-GAP vs spec-drift classification drives a material fix
      decision.
```

---

## Prior held observations — second-instance status

| origin | obs | class | wave-28 status |
|--------|-----|-------|----------------|
| wave-27 | obs-1 | EXPLAIN test on small-seeded table needs enable_seqscan=off | NOT CONFIRMED this wave. No EXPLAIN-based integration test authored. Remains 1-wave HOLD (T-4 rule 1 candidate). |
| wave-27 | obs-3 | Perf wave: spec structural proofs sufficient for T-7, no load test | NOT CONFIRMED this wave. No performance wave. Remains 1-wave HOLD (T-7 rule 1 candidate). |
| wave-26 | obs-1 | Unit fixture seeds store with value real producer excludes; T-5 live E2E caught it | NOT CONFIRMED this wave. No store-keyed unit fixture authored. Remains 1-wave HOLD (T-2 rule 2 candidate). |
| wave-26 | obs-3 | Hard-coded date fixture without clock-mock rots as wall-time advances | NOT CONFIRMED this wave. No date-dependent test authored. Remains 1-wave HOLD (T-2 candidate next slot). |

---

## Signals evaluated and dropped (reinforcements only)

**Signal 4 — 404→401 route-liveness probe caught stale-revision false-green (C-2/V-1-karen):**
Re-confirms CI rules 1 and 2 (already promoted). V-1-karen used this exact probe (POST
/servers/:id/invite-code/rotate → 401 not 404) to re-confirm the deploy serves the merge commit.
Classified as REINFORCEMENT of existing rules, not a new observation. No promotion action.
Source: process/waves/wave-28/stages/V-1-karen.md § "Route live → 401 (not 404) — CONFIRMED".

**Signal 5 — T-8 defeated a CI-rule-5 false-green by pulling the integration job log:**
T-8 confirmed the integration job executed the nonzero spec count (7 active cases + skipIf guard).
Re-confirms CI rule 5 (assert nonzero executed-count; skipIf on missing env var silently skips).
Classified as REINFORCEMENT of CI rule 5, not a new observation. No promotion action.
Source: process/waves/wave-28/stages/T-8-security.md § Action 5 + V-1-karen.md § claim 5.

---

## Summary table

| id    | title (short)                                                                   | severity      | recurrence   | candidate file              | disposition                                                                              |
|-------|---------------------------------------------------------------------------------|---------------|--------------|-----------------------------|------------------------------------------------------------------------------------------|
| obs-1 | Entropy scanner false-positives on model-authored transcript directories         | warning       | 1st instance | CI-PRINCIPLES               | HOLD — CI rule 7 candidate; promote on 2nd confirming wave                               |
| obs-2 | CI-config fix pushed unverified reproduces identical failure; wasted CI cycle    | strong        | 1st instance | CI-PRINCIPLES               | HOLD — CI rule 7/8 candidate; takes priority over obs-1 for same-wave slot (strong)     |
| obs-3 | BUILD rule 7 formatter miss 3rd recurrence; head-builder escalated to pre-commit gate | strong   | 3rd instance | BUILD-PRINCIPLES            | PROMOTABLE — BUILD rule 8 candidate; enforcement-mechanism axis distinct from rule 7    |
| obs-4 | V-block spec-GAP vs spec-drift: classify before acting; correct behavior amends spec | informational | 1st instance | VERIFY-PRINCIPLES        | HOLD — VERIFY rule 2 candidate; promote on 2nd confirming wave                          |

**Observations emitted: 4**
**Severities: 2 strong, 1 warning, 1 informational**
**Candidate files: BUILD-PRINCIPLES (obs-3), CI-PRINCIPLES (obs-1, obs-2), VERIFY-PRINCIPLES (obs-4)**

---

## PROMOTION CANDIDATE FLAG FOR KAREN

**obs-3 is the only promotion candidate this wave.**

obs-3 is a 3rd-instance confirming signal with an explicit head-builder escalation from
process/waves/wave-28/stages/B-6-review.md. The candidate rule addresses a new axis
(machine-enforced pre-commit gate) distinct from the already-promoted BUILD rules 6 and 7
(which prescribe WHAT to run). The 3-wave history is:

- wave-25: rule wording promoted (BUILD rule 7: check command, not formatter alone)
- wave-27: formatter miss recurred; B-4 flagged; B-6 treated as reinforcement of existing rule
- wave-28: formatter miss recurred again; B-6 explicitly escalated to L-2 for pre-commit gate

Candidate rule shape (BUILD rule 8):
  8. Gate commits with a pre-commit hook running the full check command on staged files
     so format and import-sort violations cannot be committed silently.
     Why: A rule prescribing what to run is advisory; a pre-commit hook enforces it at
     every commit without specialist discipline.

Ready for karen vetting + head-builder approval before write to BUILD-PRINCIPLES.

obs-1 and obs-2 are both CI-PRINCIPLES candidates at the same slot (rule 7) but are 1st-instance
HOLDs this wave. If both confirm on the same future wave, obs-2 (strong) takes the per-file
promotion slot over obs-1 (warning).

obs-4 is a VERIFY-PRINCIPLES candidate and a 1st-instance HOLD this wave.
