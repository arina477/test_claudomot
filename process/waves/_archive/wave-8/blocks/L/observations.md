# Wave-8 L-block observations — candidate principles (L-2 vets for promotion)

Append-only candidate pool. L-2 distill + karen decide which (if any, max 1/file/wave) get promoted to the numbered Rules section of the matching `*-PRINCIPLES.md`. Wave-specific until a second wave confirms.

## C-block (CI/CD) — head-ci-cd deploy-verification reasoning + lessons

### Deploy-verification reasoning (this wave)
- Railway services here are CLI-uploaded (`source.repo` null) not GitHub-auto-deploy: a merge to main does NOT trigger a deploy. The pre-merge SUCCESS deployments were stale; only an explicit `railway up` from main HEAD ships the new code. Always confirm source-type before assuming auto-deploy.
- Verified deploy via the authoritative Railway `deployments` GraphQL status (SUCCESS) AND confirmed the prior deployment flipped to REMOVED, then health 200 — three independent signals that the NEW revision serves, not a /healthz that could answer from the old process.
- Migration applied to prod via the public TCP proxy (`*.proxy.rlwy.net`) BEFORE the new code deployed; `drizzle.config.ts` reads `DATABASE_URL_UNPOOLED ?? DATABASE_URL`, so both were set to the proxy URL for the migrate command.

### Rollback lesson (candidate)
- After `railway up`, the prior good deployment immediately goes REMOVED, so "roll back to the previous deployment id" is not directly available; the reachable rollback is re-deploying the prior commit. Capture the prior commit SHA before cutover, not just the prior deployment id.

### Backfill lesson (candidate)
- A nullable new column added by migration plus app-side set-on-create means existing rows stay NULL but degrade gracefully (permanent link absent) rather than crash; backfill is only needed when an existing row must have the value. Here prod had 0 servers so backfill was a no-op. Check the row count before assuming backfill work exists.

### Fixture gap (carry-forward, not a rule)
- No persistent email-verified prod fixture exists, so authed-join could not be live-probed; covered by the 179-test suite. command-center/testing/test-accounts.md should be filled with one verified Student Member fixture so future C-2 / T-5 / T-8 can exercise authed paths live.

### Candidate rule phrasings (for karen, if a 2nd wave confirms)
- Verify Railway deploys via the deployments GraphQL status plus prior-deployment REMOVED, never health alone.
  Why: A health 200 can answer from the old process before the new revision serves.
- Capture the prior commit SHA before cutover when the platform removes the prior deployment on deploy.
  Why: A removed prior deployment cannot be rolled back to by id; only the prior commit is redeployable.

---

# Wave-8 L-2 synthesis (knowledge-synthesizer)

Synthesized from wave-8 artifacts (M2 invites/join — two-tier CSPRNG invites, public minimal preview, verified atomic join, invite-join page + share modal; PR#18 8716b4e; V-APPROVED; 180 tests).
Prior archives consulted: process/waves/_archive/wave-{1,3,4,5,7}/blocks/L/observations.md (wave-2 and wave-6 absent).

```yaml
observations:

  - id: obs-1
    summary: >
      A worker restart in wave-8 reset the local filesystem to the pre-wave
      baseline, erasing the D-block design work: design/invite-join.html and
      design/invite-share.html were lost because they had not been pushed to
      origin before the restart. The D-block review-artifacts header reads
      "[re-run post-restart]", recording the recovery event. The mitigation
      applied in this wave — push to origin after each major B/D stage — was
      explicitly encoded in P-3-plan.md ("PUSH branch after each major stage
      (restart-loss lesson)") and in the B-block review-artifacts carry-forwards
      ("PUSH branch after each major B/D stage"). The B-block records per-stage
      push commits (B-3 commit 8697d42, B-5 "pushed"), confirming the cadence
      was followed. This is the second confirming instance of the same
      FS-loss-from-unpushed-work mechanism that was first recorded as wave-7
      obs-1, which set the explicit recurrence condition: "promote if the same
      FS-loss-from-unpushed-work mechanism recurs in a subsequent wave."
    source:
      - process/waves/wave-8/blocks/D/review-artifacts.md
        # header: "[re-run post-restart]" — confirms D-block designs required rebuild
        # after a worker restart erased local-only (unpushed) D-block work
      - process/waves/wave-8/blocks/P/review-artifacts.md
        # "RESTART-LESSON: push branch after each major B/D stage" — encodes the
        # mitigation as a carry-forward from the restart event
      - process/waves/wave-8/stages/P-3-plan.md
        # sequencing line: "PUSH branch after each major stage (restart-loss lesson)"
        # — shows the push cadence was planned as an explicit mitigation
      - process/waves/wave-8/blocks/B/review-artifacts.md
        # "B-3 done ... 8697d42" + "B-5 done ... pushed" — per-stage push confirmed
      - process/waves/_archive/wave-7/blocks/L/observations.md
        # obs-1 (warning): worker restart erased wave-7 backend + D-block
        # (P-block process files + design HTMLs + all B-0/B-1/B-2 commits);
        # recurrence condition: "promote if the same FS-loss-from-unpushed-work
        # mechanism recurs in a subsequent wave"
    severity: strong
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      wave-7 obs-1 (warning): worker restart erased all local-only commits — P-block
      process files, design/server-rail-sidebar.html + design/create-server.html,
      backend B-0/B-1/B-2 source + migration 0002_certain_miek.sql. First occurrence;
      held with explicit recurrence condition.
      wave-8 (this): worker restart erased D-block design HTMLs (invite-join.html +
      invite-share.html). D-block review-artifacts header "[re-run post-restart]"
      records the event. Second confirming instance; recurrence condition fires.
      The mechanism is identical across both waves: local FS state was not yet
      pushed to origin when the worker restart reset the working tree.
      The push-after-each-stage cadence was the applied mitigation in wave-8 and
      was effective for the B-block (no backend loss). The D-block loss shows the
      cadence was not yet established for D-stages at the point of the restart.
    generalizable: true
      # applies to any project where build or design stages produce local FS artifacts
      # (committed or uncommitted) that have not been replicated to a remote origin;
      # not specific to this platform, stack, or hosting model
    falsifiable: true
      # checkable at any B or D stage exit: does `git log @{u}..HEAD` show
      # committed-but-unpushed work? If yes, the rule is violated; if no, it is met.
    disposition_hint: rule-candidate
    proposed_rule: >
      2. Push the branch to origin after every B-block and D-block stage before
         starting the next stage.
         Why: A worker restart resets the local tree; unpushed commits are permanently lost.

  - id: obs-2
    summary: >
      Security acceptance criteria (CSPRNG entropy, minimal public preview, verified
      session gate, atomic max_uses) were flagged explicitly at P-0, encoded as typed
      ACs in the P-2 spec, and enforced at B-6 and T-8. The B-6 gate caught a genuine
      TOCTOU violation in the max_uses path (commit 92cc0f3 fixed it) before the
      C-block merge. T-8 verified all four security properties live against the
      deployed API. This is a positive process validation: the P-0 security-flagging
      discipline (flagging access-control surfaces and encoding them as ACs rather than
      prose requirements) allowed the gate to catch a concurrency defect that passed
      CI green with 178 unit tests.
    source:
      - process/waves/wave-8/stages/P-0-frame.md
        # "LOAD-BEARING flags -> P-2/T-8: (1) invite-code entropy CRITICAL...
        #  (4) max_uses check-and-increment must be ATOMIC (concurrency)"
      - process/waves/wave-8/blocks/B/gate-verdict.md
        # Attempt 1 REWORK: "max_uses enforcement is not atomic ... one load-bearing
        #  security AC is not met" — gate caught the TOCTOU, not CI
      - process/waves/wave-8/stages/T-8-security.md
        # "Atomic max_uses: conditional UPDATE...WHERE uses<max_uses RETURNING ...
        #  TOCTOU fixed (92cc0f3). Concurrency test (loser->404+rollback). T-8 PASS."
      - process/waves/wave-8/stages/V-1-karen.md
        # Claim 4: atomic conditional UPDATE verified in live+merged code;
        # TOCTOU "genuinely closed"
    severity: informational
    candidate_principles_file: null
    recurrence: >
      This is a process-validation finding, not a failure pattern.
      The security-AC encoding discipline (flag at P-0, encode as ACs at P-2, verify
      at T-8 / gate) is an existing always-on practice confirmed to be effective under
      adversarial conditions (TOCTOU, concurrency, minimal-preview leak) in an
      access-control wave. No prior obs records a failure of this discipline; this obs
      records a success. No rule promotion needed — the practice is already enforced
      by the stage structure (P-0 flags, P-2 spec, T-8 mandatory on auth/invite waves).
    generalizable: true
    falsifiable: true
      # checkable: does the P-0 frame explicitly list load-bearing security flags
      # that appear verbatim as ACs in the P-2 spec for any wave touching auth/invites?
    disposition_hint: informational

  - id: obs-3
    summary: >
      The no-verified-prod-fixture gap, first formally recorded as wave-7 obs-2
      (warning, task-candidate 4a2ad286), recurred in wave-8: authed-join could not
      be live-probed at C-2 / T-8 because no persistent verified prod fixture exists.
      The wave-8 T-8 finding reads "authed-join not live-probed (no persistent
      verified prod fixture) -> tracked 4a2ad286; covered by 179 tests + CI
      integration." The fixture task 4a2ad286 was queued at wave-7 L-2 but had not
      been completed before wave-8 shipped. This is the second consecutive wave where
      an authed, verify-gated path lacked a live prod fixture for C-2/T-8 verification.
    source:
      - process/waves/wave-8/stages/T-8-security.md
        # finding: "authed-join not live-probed (no persistent verified prod fixture)
        #  -> tracked 4a2ad286; covered by 179 tests + CI integration"
      - process/waves/wave-8/blocks/T/gate-verdict.md
        # findings #1: "authed-join not live-probed (no persistent verified prod
        #  fixture); covered by 179 tests + CI integration | 4a2ad286"
      - process/waves/_archive/wave-7/blocks/L/observations.md
        # obs-2 (warning): no persistent verified prod fixture; first formal capture;
        # task 4a2ad286 queued; disposition: task-candidate (not a rule)
    severity: warning
    candidate_principles_file: null
    recurrence: >
      wave-7 obs-2 (warning): first formal capture; no pre-verified fixture meant
      authed create-server path was verified via SuperTokens core admin API workaround
      (ad hoc, undocumented, not reproducible). Task 4a2ad286 queued.
      wave-8 (this): same gap recurs for the authed-join path; task 4a2ad286 still
      open (not completed between waves). Second consecutive authed-feature wave
      without a persistent prod fixture.
      The pattern is structural: every future authed-surface wave will hit this gap
      until task 4a2ad286 is completed. Disposition is task-escalation, not a rule.
    generalizable: true
    falsifiable: true
      # checkable: does command-center/testing/test-accounts.md record a prod account
      # with email verified status and a valid SuperTokens session token?
    disposition_hint: task-escalation
      # task 4a2ad286 should be prioritized before the next authed-feature wave;
      # the gap is now two-wave confirmed and the workaround is increasingly costly

  - id: obs-4
    summary: >
      Two spec-completeness drifts (finding 8a: migration missing the servers.invite_code
      backfill UPDATE; finding 8b: share modal always mints ad-hoc instead of defaulting
      to the permanent code) were caught by V-1 karen and V-1 jenny respectively, triaged
      as non-blocking by V-2, and accepted as deferred follow-ups rather than fast-fixes.
      Neither was a security regression; both were bounded in impact at the time of deploy
      (0 prod servers for 8a; functional link produced for 8b). They represent a class of
      partial-implementation where the data layer ships correctly but the interface/surfacing
      layer is incomplete, leaving a feature value partially unreachable by users.
      Both are follow-up task candidates, not principle-candidates.
    source:
      - process/waves/wave-8/stages/V-1-karen.md
        # Finding 8a: "Migration omits the permanent-code backfill (Medium / spec-drift,
        #  partial implementation)" — AC required backfill UPDATE; 0004_gigantic_saracen.sql
        #  has no UPDATE servers SET invite_code=... row
        # Finding 8b: "Share modal never uses the permanent code; always mints a fresh
        #  ad-hoc invite (Low / spec-drift, the 'two-tier' value is half-wired on the UI)"
      - process/waves/wave-8/stages/V-2-triage.md
        # 8a: "MOOT in prod (0 servers; new servers self-gen at creation). Follow-up:
        #  add backfill UPDATE to a future migration IF any NULL-code servers exist."
        # 8b: "follow-up: default InviteShareModal to servers.invite_code"
      - process/waves/wave-8/stages/V-3-fast-fix.md
        # deferrals: 8a "defer-followup-migration"; 8b "defer-next-M2-bundle"
    severity: informational
    candidate_principles_file: null
    recurrence: >
      Wave-4 obs-2 recorded a related class (account-gated external credentials
      causing partial-feature deploys) but the mechanism was credential-provisioning,
      not implementation drift. No prior obs records a migration-backfill omission or
      a UI-defaulting-wrong-tier drift specifically. First occurrence of this pairing.
      Hold in observations. Not a rule candidate — the V-block's deferral-tracking
      posture correctly handles bounded partial-implementation without requiring a new
      principle. The valuable signal is that the V-1 independent reviewers caught both
      gaps that CI and B-6 did not; that is the gate functioning as intended.
    generalizable: false
    falsifiable: true
    disposition_hint: follow-up-tasks
      # 8a: add backfill migration guarded by NULL check before next multi-server deploy
      # 8b: default InviteShareModal link to servers.invite_code; surface permanent
      #     code as default; restrict ad-hoc minting to an explicit "generate limited link" CTA
```

---

## Wave-8 L-2 distill disposition

**Summary:** 4 observations emitted.

**obs-1 (BUILD-PRINCIPLES push-after-stage candidate) — STRONG CANDIDATE.**
Wave-7 obs-1 set the explicit recurrence condition; wave-8 fires it.
Second confirming instance of the FS-loss-from-unpushed-work mechanism (D-block designs lost: `[re-run post-restart]` in D-block review-artifacts; mitigation applied in P-3-plan.md + B-block per-stage pushes confirmed).
Proposed rule:

```
2. Push the branch to origin after every B-block and D-block stage before starting the next stage.
   Why: A worker restart resets the local tree; unpushed commits are permanently lost.
```

Rule is generalizable (any project with local FS state not yet at origin), falsifiable (`git log @{u}..HEAD` at any stage exit), and the recurrence is cited across two wave archives with named artifacts. BUILD-PRINCIPLES currently has one rule; this would be rule 2. No near-dup exists in BUILD-PRINCIPLES (rule 1 addresses prod-artifact boot, not push cadence). The rule does not contain forbidden tokens. Length: rule line = 82 chars (within 120); why line = 55 chars (within 100).

**obs-2 (security-AC encoding) — informational; no promotion.**
Process-validation finding. The discipline works; no rule needed.

**obs-3 (no verified prod fixture) — task-escalation; no promotion.**
Wave-7 obs-2 disposition was task-candidate (task 4a2ad286). Wave-8 confirms the recurrence. Disposition remains task escalation, not a rule. Recommend prioritizing task 4a2ad286 before the next authed-feature wave.

**obs-4 (8a/8b partial-implementation drifts) — follow-up tasks; no promotion.**
Both non-blocking; V-block deferral posture handles them. Not a recurring pattern at the principle level.
