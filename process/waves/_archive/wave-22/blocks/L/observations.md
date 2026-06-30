# Wave 22 — L-2 Distill Observations

Synthesized from wave-22 artifacts (M5 assignments bundle 1: CRUD + per-member status +
assignments panel + optional attachment; PR#34 108f4a3; V APPROVED).
Prior archives consulted: process/waves/_archive/wave-{17,18,19,20,21}/blocks/L/observations.md.
Principles files read: CI-PRINCIPLES (3 rules), BUILD-PRINCIPLES (5 rules, rule 5 promoted
w21), VERIFY-PRINCIPLES (1 rule), PRODUCT-PRINCIPLES (1 rule, rule 1 promoted w20).

---

```yaml
observations:

  - id: obs-1
    summary: >
      biome-format-drift-passes-local-fails-CI recurred for the second consecutive time in
      this project. In wave-19 (obs-5), apps/web/src/shell/messaging.test.tsx was committed
      after B-6 fix-up commits without running the formatter; B-5 reported lint_passed true
      because local pnpm test / typecheck / build do not invoke biome's format check, but
      biome ci . in CI caught "File content differs from formatting output" and failed the
      lint job. In wave-22, apps/web/src/shell/assignments.test.tsx was committed from B-3
      without running the formatter; B-5 reported lint_passed true via the same local
      pnpm test / typecheck / build path; biome ci . in CI failed the lint job on the same
      "File content differs from formatting output" class. Root cause is identical in both
      waves: biome ci . combines lint and format checking; the local dev workflow does not.
      A file committed without biome format --write passes every local check and fails CI.
      Fix-up cycle required in both waves (whitespace-only diff confirmed; single file;
      react-specialist applied biome format --write, verified test count unchanged,
      committed the fix before merge). The binary prevention is available: running biome ci .
      (or biome format --check) locally at B-5 verify would have caught both instances before
      push. Recurrence condition is now met: two waves, same root cause, same observable
      failure, same fix class.
    source:
      - process/waves/wave-22/stages/C-1-pr-ci-merge.md
        # "Root cause: apps/web/src/shell/assignments.test.tsx committed without running the
        #  formatter. biome ci . combines lint + format check; the blocking error was 'File
        #  content differs from formatting output'. Local pnpm test / typecheck / build did
        #  NOT run Biome's format check, so it passed B-block locally and only CI caught it."
      - process/waves/wave-22/stages/T-1-static.md
        # "PASS CI lint+typecheck green (run 28481637648, per-job gated rule-3 caught
        #  first-run false-green)"
      - process/waves/wave-22/blocks/T/findings-aggregate.md
        # "F22-T-6 (Low): 9 pre-existing biome warnings + the biome-format-drift-passes-
        #  local-fails-CI lesson (head-ci-cd noted, 2nd instance w19+w22 -> L-2 candidate)."
      - process/waves/wave-22/stages/V-2-triage.md
        # "F22-T-6 -- biome-format-drift CI lesson + 9 pre-existing warnings: process lesson
        #  not a defect; L-2 CI-PRINCIPLES candidate (2nd instance w19+w22)"
      - process/waves/wave-22/stages/V-3-fast-fix.md
        # "F22-T-6 (biome-format-drift-passes-local-fails-CI) = 2nd instance (w19+w22)
        #  -> CI-PRINCIPLES distillation candidate."
      - process/waves/_archive/wave-19/blocks/L/observations.md obs-5
        # "B-5 reported lint_passed while CI lint fails deterministically; auto-fix on local
        #  state diverged from committed file. First instance of this specific sub-class.
        #  Dispose: HOLD. Promote if a second wave has a B-5 lint_passed claim contradicted
        #  by a deterministic CI lint failure caused by local-vs-committed file state
        #  divergence."
    severity: strong
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      CONFIRMED RECURRENCE: two instances of the same sub-class.
        wave-19 obs-5: apps/web/src/shell/messaging.test.tsx; B-6 fix-up commit committed
          without formatter; B-5 lint_passed (local path skips biome format check);
          biome ci . lint=failure in CI; whitespace-only fix-up. HELD -- first instance.
        wave-22 (this): apps/web/src/shell/assignments.test.tsx; B-3 commit without
          formatter; B-5 lint_passed (same local path); biome ci . lint=failure in CI;
          whitespace-only fix-up. SECOND INSTANCE.
      Root cause is identical: biome ci . runs both lint and format check; the local
      dev workflow (pnpm test / typecheck / build) does not include the format check.
      The binary prevention is a checkable CI gate: running biome format --check (or
      equivalently biome ci .) at B-5 verify would have caught both instances before push.
      CI-PRINCIPLES has 3 rules; cap is clear (rule 4 this wave). Prior CI-PRINCIPLES
      obs-5 (wave-19 HOLD) is the exact confirming class; recurrence condition fully met.
    near_dup_check: >
      CI-PRINCIPLES rule 1: deploy-state vs /health. Unrelated.
      CI-PRINCIPLES rule 2: new-route probe after deploy-state SUCCESS. Unrelated.
      CI-PRINCIPLES rule 3: gate merge on per-job conclusions, not gh run watch. Distinct
        (that rule addresses watch tool false-green; this rule addresses format-drift
        false-green caused by a local workflow that omits the format check). No near-dup.
      wave-17 obs-1 (Turbo env-strip skip-suppression): different mechanism (env var
        not propagated -> test skipped; not a format-check omission). No near-dup.
    promotion_gates:
      generalizable: true
        # Applies to any project using a combined lint+format CI command (biome ci,
        # eslint+prettier in one job, etc.) when the local dev workflow runs only one
        # subset. Any file committed without the formatter passes local checks and fails
        # CI. The rule instructs running the exact CI lint command at B-5, not a subset.
      falsifiable: true
        # Checkable at B-5: did the verify step include biome format --check (or biome ci .)
        # on the current committed file state? A B-5 lint_passed claim backed only by
        # pnpm test + typecheck + build (no format check) fails this rule.
      cited: true
        # wave-22 C-1-pr-ci-merge.md (root cause analysis + fix-up cycle + "L-2 NOTE");
        # wave-22 T-1-static.md (CI green on fix-up run); wave-22 T findings-aggregate
        # F22-T-6; wave-22 V-2-triage F22-T-6; wave-22 V-3-fast-fix exit note;
        # wave-19 L-2 obs-5 (HOLD, first instance, exact recurrence target).
    candidate_rule_shape: >
      4. Run `biome format --check` (or the project's combined lint+format command) at B-5
         verify before push; not only `pnpm test` and typecheck.
         Why: The local dev workflow omits the format check; a committed file with
         formatting drift fails CI lint but passes every local check.
      Rule line = 106 chars (within 120); why line = 89 chars (within 100). No forbidden tokens.
    promotion_requires: karen vet (rule quality) + head-ci-cd sign-off (domain applicability)
    promotion_status: CANDIDATE -- recurrence met; pending karen + head-ci-cd vet

  - id: obs-2
    summary: >
      BUILD-PRINCIPLES rule 4 ("Reproduce one negative path per authz or injection boundary
      at B-6 Phase-2; a Phase-1 code-read APPROVE is not sufficient") was validated for the
      fourth consecutive wave on a new attachment-IDOR surface. Phase-1 (head-builder) at
      B-6 APPROVED the wave-22 assignment-attachment implementation as a genuine pass on all
      four load-bearing checks (organizer authz, soft-delete-hides, per-member isolation,
      headObject-before-insert). Phase-2 adversarial /review traced the attachment validate
      path and found that validateAndHeadAttachment validated ONLY size and content-type, not
      whether the key was scoped to the target assignment's server. An organizer of server A
      could submit a key with the prefix of server B; the server would head-check and accept
      it. This is the same cross-server attachment IDOR class as wave-19 C-1 (confirmed at
      Phase-2 then too: messaging send path accepted client-supplied key without channel-scope
      regex). The exact messaging precedent (anchored regex against row/route-derived serverId
      before headAttachment + INSERT) was already in the codebase; the assignments path did not
      replicate it. Phase-2 caught the H1 (cross-server key swap) and H2 (forged key 5xx);
      both were fixed (anchored regex + NoSuchKey->400) and re-confirmed at re-review. Rule 4
      is functioning as intended. This is reinforcement, not a new class. No re-promotion.
    source:
      - process/waves/wave-22/stages/B-6-review.md
        # "Phase 1 head-builder APPROVED by code-read. Phase-2 /review (adversarial,
        #  BUILD rule 4) caught 2 Highs the code-read passed: the assignment-attachment key
        #  was NOT server-scoped -> cross-server key-swap (the wave-19-attachment-IDOR class
        #  again) + forged-key 5xx. rule 4 validated AGAIN (Phase-2 catches cross-tenant
        #  attachment IDOR)."
      - process/waves/wave-22/stages/B-6-review-output.md (H1 + H2 sections)
        # "validateAndHeadAttachment validates ONLY size + content-type via headAttachment.
        #  It does not validate that the key is scoped to the target assignment's server."
        # "Re-review iteration 2: APPROVED. Both prior High (H1, H2) verified cleared."
      - process/waves/wave-22/blocks/B/gate-verdict.md (Phase-2 section)
        # Phase-1 APPROVED by code-read; Phase-2 caught H1+H2; fix committed; re-review
        # APPROVED.
    severity: informational
    candidate_principles_file: none
    recurrence: >
      BUILD-PRINCIPLES rule 4 is already promoted (wave-18). This is the fourth consecutive
      wave of Phase-2 adversarial /review finding or investigating an absence-class defect
      that Phase-1 code-read APPROVED or flagged (wave-17: non-functional spy; wave-18:
      missing membership guard; wave-19: send-path client-trusted key; wave-22: attachment
      scope regex absent). Rule is working. No re-promotion warranted. Informational record.
    disposition: INFORMATIONAL validation of BUILD rule 4. No new promotion.

  - id: obs-3
    summary: >
      The per-spawn no-edit reminder (prohibiting principles-file writes outside L-block)
      held again this wave, and the C-1 stage file explicitly documented the biome-drift
      lesson as an L-2 candidate rather than appending to CI-PRINCIPLES. This is the second
      consecutive wave the directive held. The structural guard (git diff HEAD --
      command-center/principles/*.md non-empty at any non-L block exit = gate fails) remains
      unimplemented after 8 prior bypass instances (waves 9, 12, 17, 18, 19 head-ci-cd /
      head-verifier; wave-20 head-verifier; waves 21 and 22 stopgap-held). Two consecutive
      non-recurrence waves is a stronger positive signal than wave-21's single hold, but is
      not sufficient to retire the structural guard escalation. The N-block implementation
      task remains open.
    source:
      - process/waves/wave-22/stages/C-1-pr-ci-merge.md
        # "L-2 NOTE (per obs-4 -- NOT written to CI-PRINCIPLES during C-block)... This is
        #  the second consecutive wave the obs-4 per-prompt reminder held -- no principles
        #  edits made in C-block."
      - process/waves/_archive/wave-21/blocks/L/observations.md obs-2
        # "Seven prior bypass instances (waves 9/12/17/18/19/20), now one wave of
        #  non-recurrence. One non-recurrence is not sufficient to retire the structural
        #  guard escalation."
    severity: informational
    candidate_principles_file: none
    recurrence: >
      8 prior bypass instances (waves 9, 12, 17, 18, 19, 20 = 6; waves 21+22 = 0 via
      per-prompt stopgap). Two consecutive non-recurrence waves. Per-prompt directive is a
      working stopgap. Structural guard (git diff check at every block exit) still pending.
      N-block implementation task carries.
    disposition: >
      INFORMATIONAL positive. No promotion (no principles rule can encode this; guard is
      structural). Re-note for N-block: per-prompt reminder held waves 21 + 22 (two
      consecutive). Structural guard (git diff HEAD -- 'command-center/principles/*.md'
      non-empty -> gate fails at every block exit) still pending after 8-wave bypass streak
      and 2-wave stopgap. Update prior N-block escalation count.

  - id: obs-4
    summary: >
      The wave-21 obs-4 candidate (VERIFY-PRINCIPLES candidate: "async invariant proven by
      reasoning only; no executing test; V-2 probe caught the missing test") did NOT recur
      in wave-22. Wave-22's load-bearing invariants (organizer-403, cross-server IDOR fix,
      per-member isolation, soft-delete-hides) were all proven by executing tests, not
      reasoning alone; T-8 ratified each with named negative-path test citations.
      The wave-21 candidate therefore remains on HOLD at 1 confirming wave. Additionally,
      the wave-21 obs-3 PROMOTE candidate (BUILD-PRINCIPLES rule 5: reconnect-triggered async
      loop guard) was assessed against this wave: wave-22 has no reconnect-triggered async
      loop, so it neither confirms nor disconfirms that candidate. Both prior HOLD candidates
      (wave-19 obs-3 spoofed-input test, wave-20 obs-3 codec-round-trip) have no analog in
      wave-22 either. No prior HOLD candidate advances to confirmed recurrence this wave.
    source:
      - process/waves/wave-22/stages/T-8-security.md
        # All four load-bearing claims (organizer can(), cross-server IDOR fix, per-member
        # isolation, IDOR-safe /assignments/:id) proven by executing CI-tested negative-path
        # tests, not reasoning alone.
      - process/waves/wave-22/blocks/V/gate-verdict.md
        # "each load-bearing claim paired with a named negative-path test (403 at ...;
        #  cross-server + path-traversal at ... each asserting headAttachment NOT reached;
        #  isolation ... V-2 downgraded ZERO load-bearing claims."
      - process/waves/_archive/wave-21/blocks/L/observations.md obs-4
        # First instance of async invariant proven by reasoning only; V-2 probe caught
        # missing executing test. HOLD.
    severity: informational
    candidate_principles_file: none
    recurrence: >
      wave-21 obs-4 (async invariant reasoning-only; caught at V-2) remains HOLD, first
      instance. Wave-22 does not confirm it. The candidate does not advance. Retain HOLD
      status; promote to VERIFY-PRINCIPLES rule 2 if a future wave has a load-bearing async
      invariant proven only by reasoning that a V-block probe identifies as lacking an
      executing test.
    disposition: INFORMATIONAL non-recurrence note. wave-21 obs-4 HOLD retained unchanged.
    candidate_rule_shape_if_confirmed_in_prior: >
      2. Probe a "no findings" verdict on any non-trivial async invariant for an executing
         mutation-sensitive test; code and contract reasoning alone do not suffice.
         Why: A plausible reasoning chain passes review while the invariant has no guard
         against a future regression.
      (Shape carried from wave-21 obs-4; not a wave-22 candidate.)
```

---

## Wave-22 L-2 distill disposition

**obs-1 (biome-format-drift-passes-local-fails-CI, 2nd confirmed instance) — STRONG PROMOTION CANDIDATE.**

Two-wave evidence: wave-19 obs-5 (messaging.test.tsx; B-6 fix-up committed without formatter;
B-5 lint_passed via local path that omits biome format check; biome ci . lint=failure in CI;
whitespace-only fix-up; HELD as first instance) + wave-22 (this) (assignments.test.tsx; B-3
commit without formatter; same local path omission; same CI failure class; same whitespace-only
fix-up). Root cause is identical in both waves: biome ci . combines lint and format; the local
dev workflow does not include the format check. Binary prevention is available and checkable
at B-5 verify.

CI-PRINCIPLES has 3 rules; cap is clear (rule 4 this wave). wave-19 obs-5 stated the
exact recurrence target ("promote if a second wave has a B-5 lint_passed claim contradicted
by a deterministic CI lint failure caused by local-vs-committed file state divergence").
That condition is now met. No near-dup with rules 1-3.

Candidate rule for karen + head-ci-cd to vet:
```
4. Run `biome format --check` (or the project's combined lint+format command) at B-5
   verify before push; not only `pnpm test` and typecheck.
   Why: The local dev workflow omits the format check; a committed file with
   formatting drift fails CI lint but passes every local check.
```
Rule line = 106 chars (within 120); why line = 89 chars (within 100). No forbidden tokens.
Near-dup confirmed absent (CI rules 1-3 address deploy-state and watch-exit; not format-check).

Promotion requires: karen vet (rule quality) + head-ci-cd sign-off (domain applicability).

---

**obs-2 (BUILD rule 4 validated, 4th consecutive Phase-2 catch on a new attachment-IDOR surface) — INFORMATIONAL; NO PROMOTION.**

Rule already exists (BUILD-PRINCIPLES rule 4, promoted wave-18). This is the fourth
consecutive wave of Phase-2 adversarial /review catching or investigating an absence-class
defect that Phase-1 code-read approved. Rule is working. No new promotion.

---

**obs-3 (principles-file bypass non-recurrence, wave-22; per-prompt no-edit reminder held for 2nd consecutive wave) — INFORMATIONAL POSITIVE; NO PROMOTION.**

Two consecutive non-recurrence waves (21 + 22) via per-prompt directive. Positive signal,
not resolution. Structural guard (git diff check at every block exit) still pending. Update
N-block escalation count to 8-wave prior streak + 2-wave stopgap hold.

---

**obs-4 (wave-21 async-invariant-executing-test candidate and all prior HOLD candidates did not recur in wave-22) — INFORMATIONAL NON-RECURRENCE.**

wave-21 obs-4 HOLD status unchanged. Wave-22 load-bearing invariants were all proven by
executing tests. No prior HOLD candidate advances. All HOLDs retained.

---

## Summary table

| id    | title (short)                                                  | severity      | recurrence | disposition                                                               |
|-------|----------------------------------------------------------------|---------------|------------|---------------------------------------------------------------------------|
| obs-1 | biome-format-drift passes-local-fails-CI (2nd confirmed inst.) | strong        | 2 waves    | PROMOTE to CI-PRINCIPLES rule 4 (karen + head-ci-cd vet)                  |
| obs-2 | BUILD rule 4 validated (4th consecutive Phase-2 IDOR catch)    | informational | 4 waves    | INFORMATIONAL; rule exists; no action                                     |
| obs-3 | Principles-bypass non-recurrence (2nd consecutive hold wave)   | informational | 8 prior + 0 this | INFORMATIONAL POSITIVE; structural guard still pending; N-block re-note   |
| obs-4 | Prior HOLD candidates (async-invariant + others) did not recur | informational | --         | INFORMATIONAL non-recurrence; all prior HOLDs retained unchanged          |

**Promotions this wave: 1 candidate (obs-1 to CI-PRINCIPLES rule 4), conditional on karen + head-ci-cd sign-off.**
