# Wave 41 — L-2 Distill Observations

Synthesized from wave-41 artifacts (M8 foundation: educator role via `moderate_members`
permission on existing RBAC + light moderation — delete-any, member timeout; PR #55
squash-merged 5a5f79a; V-block APPROVED after one V-3 fast-fix round).
Inputs read:
process/waves/wave-41/stages/P-0-frame.md, stages/P-0-problem-framer.md,
stages/B-6-review-output.md, stages/B-6-review.md,
stages/C-1-pr-ci-merge.md, stages/C-2-deploy-and-verify.md,
stages/V-1-jenny.md, stages/V-1-karen.md, stages/V-3-fast-fix.md.
Prior archives consulted: process/waves/_archive/wave-{36,37,38,39,40}/blocks/L/observations.md
(prior-held queue + recurrence checks on all candidate classes).
Principles files read: BUILD-PRINCIPLES (8 rules), CI-PRINCIPLES (8 rules),
VERIFY-PRINCIPLES (2 rules), PRODUCT-PRINCIPLES (3 rules).

---

```yaml
observations:

  - id: obs-1
    summary: >
      V-3 Phase 2 fast-fix: after frontend commit ac243af was pushed to main,
      head-ci-cd redeployed the web service using the mutation
      `serviceInstanceDeployV2(serviceId, environmentId)` with NO `commitSha` or
      `latestCommit:true` argument. The service was git-connected (connected in C-2 via
      `serviceInstanceUpdate(source:{repo})`). Despite being git-connected, the unparameterized
      V2 mutation rebuilt the CURRENTLY-PINNED commit (c032720, the initial C-2 deploy),
      not ac243af. Deployment id cd6d866b (first V-3 attempt) returned SUCCESS, the bundle
      hash was UNCHANGED (`index-DAuJKUJG.js`), and the old unconditional-guard code served
      traffic. jenny REJECTED the first re-verify (correct) on the basis that the gate
      substring was absent from the served bundle and the bundle id was identical to the
      pre-fix bundle. The correct redeploy (`serviceInstanceDeployV2(..., commitSha:"ac243af")`)
      produced a new deployment id and a new bundle (`index-L7b3GM-K.js`) with the gated form.

      The root: `serviceInstanceDeployV2` without an explicit commit pin rebuilds whatever
      commit is currently pinned to the service instance, not the branch HEAD — even after
      a git-connect. The initial C-2 deploy had used `serviceInstanceDeploy(latestCommit:true)`,
      which correctly pulled HEAD; the V-3 re-deploy used the V2 variant without an
      equivalent flag and silently pinned to the old snapshot.

      CI-PRINCIPLES rule 7 mandates "assert a change-unique marker appears in the served
      bundle after deploy" but explicitly scopes to "non-git-connected Railway service."
      The wave-41 instance is a git-connected service — the scope clause creates a formal
      gap. The corrective lesson extends rule 7's verify obligation to any Railway deploy
      or redeploy regardless of connection type: verify the served bundle HASH CHANGED;
      deploy-state SUCCESS on an unparameterized redeploy is not evidence a new commit
      was built.
    source:
      - process/waves/wave-41/stages/V-3-fast-fix.md
        # "Deploy correction (false-green caught by jenny): first web redeploy used
        #   serviceInstanceDeployV2(serviceId, environmentId) WITHOUT a commit arg →
        #   it rebuilt the pinned HEAD (c032720), NOT ac243af, and served the SAME stale
        #   bundle index-DAuJKUJG.js with the unconditional guard. jenny REJECTed on this."
        # "head-ci-cd redeployed web pinned to commitSha: ac243af → deployment cd6d866b
        #   SUCCESS, NEW bundle index-L7b3GM-K.js, gate substring present."
        # "Notes for L-2 distill: Deploy false-green: serviceInstanceDeployV2 without a
        #   commit argument redeploys the pinned snapshot, not main HEAD — always pin
        #   commitSha (or verify the served artifact hash CHANGED + contains the exact fix
        #   substring) after a redeploy."
      - process/waves/wave-41/stages/C-2-deploy-and-verify.md
        # Step 2: initial deploy used serviceInstanceDeploy(latestCommit:true), correctly
        #   built the git default-branch HEAD (c032720); cliCaller:null + real commitHash.
        # Distinguishes from stale CLI-upload snapshots (which had cliCaller:"claude_code",
        #   commitHash:null); confirms git-connect was established in C-2.
    severity: warning
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
      # Target: rule 7 scope extension (from "non-git-connected" to "any Railway deploy
      # or redeploy") or a new rule 9 if an amendment is rejected.
    recurrence: >
      FIRST RECORDED INSTANCE of the "git-connected Railway service + unparameterized
      redeploy mutation → stale pinned snapshot; deploy-state SUCCESS false-green" sub-class.

      Broader class lineage:
      - wave-34: false-green on a NON-git-connected service — CLI-upload snapshot served
        stale code; the failure was a non-git service whose source never changed. Wave-35
        promoted CI-PRINCIPLES rule 7 ("non-git-connected Railway service: assert
        change-unique marker in served bundle"). The "non-git-connected" scope was correct
        for that mechanism.
      - wave-41: the services ARE git-connected. The failure is a different triggering
        condition — an unparameterized redeploy mutation on a git-connected service that
        does not pull the branch HEAD. The outcome is the same (stale bundle served,
        deploy SUCCESS), but the root (parameterization of the redeploy mutation) and the
        applicable scope (git-connected) are new.

      Near-dup check against CI rule 7 as written: rule 7 scopes to "non-git-connected
      Railway service." The wave-41 instance is a git-connected service — not covered by
      the current rule text. This is a scope extension, not a near-dup.

      Near-dup check against CI rules 1-2 (deploy-state and route-flip verification):
      rule 1 mandates checking deploy-state SUCCESS, not /health alone. Rule 2 mandates a
      route 404-to-gated-status flip. Both rules address the INITIAL deploy; neither
      addresses a redeploy scenario where the service already has a prior commit pinned and
      the mutation must explicitly target the new commit. No near-dup.

      The class is falsifiable at any V-3 or hotfix redeploy: does the redeploy mutation
      specify `commitSha` or `latestCommit:true`? Does the served bundle hash differ from
      the pre-redeploy bundle hash? An unspecified redeploy on a git-connected service that
      returns SUCCESS without a hash change fails both checks.

      HOLD. First instance of the git-connected sub-class. Promote CI-PRINCIPLES rule 7
      scope amendment (or rule 9) on second confirming wave where: (a) an unparameterized
      redeploy on any Railway service (git-connected or not) produces a stale-code
      false-green that reaches verification, OR (b) an explicit "pin commitSha or
      latestCommit:true on every redeploy" check prevents the gap.
    promotion_gates:
      generalizable: true
        # Applies at any V-3 fast-fix, hotfix, or re-deploy step on any Railway service
        # (git-connected or not). The check: does the redeploy mutation include either
        # commitSha pointing to the new commit, or latestCommit:true? An unparameterized
        # serviceInstanceDeploy / serviceInstanceDeployV2 call fails this check for any
        # service, because Railway pins to the previously-built commit rather than
        # pulling the branch HEAD. Grep signal: serviceInstanceDeploy or
        # serviceInstanceDeployV2 call in a stage transcript with no commitSha or
        # latestCommit argument, followed by no bundle hash change.
      falsifiable: true
        # Checkable at any post-redeploy verification step: (1) did the redeploy mutation
        # include commitSha or latestCommit:true? (2) does the served bundle hash differ
        # from the immediately pre-redeploy hash? A SUCCESS status with no hash change
        # confirms a stale pinned-snapshot false-green. Independent check: the new commit's
        # specific change-unique minified shape must be present in the served bundle (not
        # just any symbol that existed before).
      cited: true
        # V-3-fast-fix.md: "first web redeploy... WITHOUT a commit arg → rebuilt the
        #   pinned HEAD (c032720), NOT ac243af, and served the SAME stale bundle
        #   index-DAuJKUJG.js"; "Notes for L-2 distill: serviceInstanceDeployV2 without
        #   a commit argument redeploys the pinned snapshot, not main HEAD."
        # C-2-deploy-and-verify.md: confirms git-connect was established this wave
        #   (cliCaller:null + real commitHash from serviceInstanceDeploy(latestCommit:true));
        #   the V-3 failure used a different mutation variant without the latestCommit flag.
    candidate_rule_shape: >
      [target: CI-PRINCIPLES rule 7 amendment or rule 9]
      After any Railway redeploy, verify the served bundle hash changed; deploy-state
      SUCCESS alone does not guarantee a new commit was built.
      Why: An unparameterized redeploy mutation rebuilds the pinned snapshot, not the
      branch HEAD, on any service type.
      Rule line = 108 chars; why line = 86 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance of the git-connected sub-class. The mechanism is the same
      underlying false-green class that CI rule 7 addresses (stale code served after
      redeploy), but the triggering condition differs (unparameterized mutation on a
      git-connected service, not a non-git source). Rule 7 should be amended to drop the
      "non-git-connected" scope qualifier and state the bundle-hash verification obligation
      for any Railway deploy/redeploy. Alternatively, a new rule 9 can encode the pinning
      obligation. Watch for: any V-3, hotfix, or mid-wave redeploy stage where the
      mutation transcript does not show a commitSha or latestCommit:true argument.


  - id: obs-2
    summary: >
      At V-3 Phase 2, karen verified the first V-3 redeploy by GREPping the served
      minified bundle for the symbol `canModerateMembers` — the symbol introduced as part
      of the V1-F1 fast-fix (delete-any affordance gated on `canModerateMembers` in
      SentRow / MainColumn). Karen found the symbol, returned APPROVE, and concluded the
      fix was live.

      The symbol WAS present in the bundle — but in the PRE-EXISTING `MemberListPanel`
      component, which had used `canModerateMembers` as a local variable since the main
      feature landed at C-2. The old bundle (hash `index-DAuJKUJG.js`, built from c032720,
      the pre-fix commit) already contained `canModerateMembers` from MemberListPanel.
      Karen's grep matched the pre-existing occurrence in MemberListPanel, not the new
      SentRow gate — which was absent from the stale bundle because the unparameterized
      redeploy never built ac243af.

      jenny independently verified the specific call-site's minified shape: the gated
      form in `SentRow` minified to `onDelete:(g||c)&&i!==null?()=>b("deleting"):null`
      (g=isOwn, c=canModerateMembers). jenny found this form ABSENT from the stale bundle
      and the UNCONDITIONAL form PRESENT — and correctly REJECTED.

      The generalizable class: verifying a frontend fix is live by grepping a minified
      bundle for a symbol name is unsound when that symbol also exists in any pre-existing
      component. The symbol presence proves the module is loaded; it does not prove the
      specific new call-site was built from the new commit. The correct verification is:
      (a) confirm the bundle HASH changed from the pre-redeploy hash, AND (b) confirm
      the specific call-site's minified shape is present or the unconditional/prior form
      is absent.
    source:
      - process/waves/wave-41/stages/V-3-fast-fix.md
        # "Karen's APPROVE was a false-positive — she matched the PRE-EXISTING
        #   MemberListPanel.canModerateMembers symbol, not the new SentRow gate."
        # "jenny REJECTed on this (correct)"
        # "head-ci-cd redeployed web pinned to commitSha: ac243af → deployment cd6d866b
        #   SUCCESS, NEW bundle index-L7b3GM-K.js, gate substring
        #   onDelete:(g||c)&&i!==null?()=>b('deleting'):null (g=isOwn, c=canModerateMembers),
        #   unconditional form absent."
        # "Notes for L-2 distill: Karen false-positive pattern: grepping a minified bundle
        #   for a symbol NAME that ALSO exists in an unrelated pre-existing component
        #   yields a false 'fix is live' — verify the SPECIFIC call site's minified shape,
        #   not just symbol presence. (VERIFY-PRINCIPLES candidate.)"
    severity: warning
    candidate_principles_file: command-center/principles/VERIFY-PRINCIPLES.md
      # Target: rule 3 (slot open).
    recurrence: >
      FIRST RECORDED INSTANCE of "symbol-name grep on a minified bundle yields a false
      'fix is live' confirmation because the same symbol exists in a pre-existing
      component already present in the bundle" as a standalone L-2 observation.

      Near-dup check against CI-PRINCIPLES rule 7 ("assert a change-unique marker appears
      in the served bundle after deploy"): rule 7 mandates asserting a change-unique
      marker — but its focus is on the DEPLOYMENT STEP (C-2), not the V-1/V-3 verification
      lane. The wave-41 obs-2 failure occurred in V-3 karen's verification step: the
      redeploy was already wrong (obs-1), and the verification method failed to catch it
      because the symbol was not unique to the new commit. CI rule 7's "change-unique
      marker" does imply uniqueness, but rule 7 does not name the specific failure mode
      (same symbol in pre-existing component) and does not apply to the verification lane
      explicitly. Complementary, not a near-dup.

      Near-dup check against VERIFY-PRINCIPLES rules 1-2: rule 1 addresses seeding ACs
      (create-path vs runtime); rule 2 addresses spec-vs-behavior divergence. Neither
      addresses the V-1/V-3 verification method for bundle content. No near-dup.

      Near-dup check against wave-39 obs-3 (informational): karen independently re-derived
      the served-bundle content check at V-1 in wave-39 and confirmed a TRUE positive. The
      wave-39 obs-3 class was "V-1 independently re-deriving C-2's bundle assertion is
      positive practice." That observation was informational (no rule opened). The wave-41
      obs-2 class is the FAILURE mode of that practice: the re-derivation fails when the
      checked symbol is not unique to the new commit. Different axis. Not a near-dup.

      The class is falsifiable at any V-1/V-3 bundle verification step: for each symbol
      grepped in the served bundle to confirm a fix is live, does the symbol appear
      EXCLUSIVELY in code introduced by the current fix, or could it appear in a
      pre-existing component? A grep that can match a pre-existing component fails this
      check. Safe form: grep for the specific minified call-site shape (not just the
      symbol name), or confirm the bundle HASH changed + verify the prior (unfix) form is
      absent.

      HOLD. First instance. Promote to VERIFY-PRINCIPLES rule 3 on second confirming wave
      where: (a) grepping a minified bundle for a symbol name yields a false-positive
      approval because the symbol exists in a pre-existing component and the actual
      fix-site's form is absent, OR (b) an explicit call-site-shape verification (or
      hash-change-first check) prevents a false-positive.
    promotion_gates:
      generalizable: true
        # Applies at V-1/V-3 verification for any wave with a frontend fix that introduces
        # or modifies a symbol that may also exist in a pre-existing component. The check:
        # is the grep target unique to the new fix's call site? If the same symbol name
        # (e.g., canModerateMembers, onDelete, isOwn) appears in any component that was
        # already in the bundle before this fix, grepping for the name is insufficient.
        # Safe form: verify bundle HASH changed + grep for the specific minified call-site
        # shape (the new gate condition's minified form) OR verify the prior unconditional
        # form is absent.
      falsifiable: true
        # Checkable at V-3 (or V-1) after a redeploy: (1) did the bundle hash change from
        # the pre-redeploy hash? (2) is the specific call-site's minified form present in
        # the new bundle? A verification that only grep-searches for a symbol name without
        # confirming (1) is at risk. A symbol grep that returns a match in the old bundle
        # (same hash as before the redeploy) is the definitive failure signal. jenny's
        # method (check for the specific gate condition's minified shape AND confirm the
        # unconditional form is absent) is the canonical safe form.
      cited: true
        # V-3-fast-fix.md: "Karen false-positive pattern: grepping a minified bundle for
        #   a symbol NAME that ALSO exists in an unrelated pre-existing component
        #   (canModerateMembers in MemberListPanel) yields a false 'fix is live' — verify
        #   the SPECIFIC call site's minified shape, not just symbol presence."
        # V-3-fast-fix.md: gate substring confirmed in NEW bundle (index-L7b3GM-K.js):
        #   onDelete:(g||c)&&i!==null?()=>b("deleting"):null; unconditional form absent.
        #   This is the canonical correct verification shape (call-site form, not symbol).
    candidate_rule_shape: >
      [target: VERIFY-PRINCIPLES rule 3]
      Confirm a frontend fix is live by verifying the bundle hash changed and the specific
      call-site's minified shape is present, not by symbol-name grep alone.
      Why: A symbol present in any pre-existing component passes a name grep in the old
      bundle, masking a stale redeploy.
      Rule line = 114 chars; why line = 89 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance. The failure is mechanically clean: the OLD bundle contained
      the symbol; grep confirmed the symbol; karen APPROVED; jenny's call-site check
      caught the stale state. The two verifiers in the same wave produced opposite results
      via two different methods (symbol grep vs call-site shape), making the failure class
      well-evidenced. Watch for: any V-1 or V-3 verification step that confirms a frontend
      fix by grepping a minified bundle for a symbol that is also used in any pre-existing
      component. The tell-sign at detection time: the bundle hash is UNCHANGED from the
      pre-deploy hash despite a SUCCESS deployment status.

      Competing VERIFY-PRINCIPLES slot 3 candidates (all first-instance HOLDs):
        - wave-33 obs-2 (warning, 8-wave HOLD): error-mapping fix must fire against a
          real upstream error from the actual code path.
        - wave-29 obs-2 (warning, 12-wave HOLD): V-3 head-verifier pattern scan beyond
          named sites catches reviewer-missed occurrence.
        - wave-30 obs-3 (warning, 11-wave HOLD): accept+track+observe dispose of a
          spec-consistent design-limitation finding.
        - wave-41 obs-2 (warning, this wave): symbol-grep false-positive from pre-existing
          component.
      First-to-confirm takes the slot. Wave-41 obs-2 is the first instance with a live
      false-positive/false-negative pair from the same wave (karen false-positive,
      jenny correct-reject), which gives strong evidential support.


  - id: obs-3
    summary: >
      B-6 Phase-2 adversarial review caught HIGH H-1: the `muted_until` send-gate
      (`assertNotMuted`) was implemented only in `createMessage`; `createReply` had no
      mute check at all. `POST /messages/:parentId/replies?channelId=` is a live REST
      endpoint reaching `createReply` directly. A timed-out member could bypass the mute
      by posting thread replies from the reply composer in the UI — the primary purpose
      of the timeout feature (silencing a disruptive student) was trivially circumvented.

      The B-6 Phase-2 report noted: "the spec text (B-2-backend.md line 6) scopes the
      gate to 'createMessage', so this is arguably spec-conformant-as-written — but it is
      a genuine security hole regardless of spec wording."

      Why green tests missed it: the integration spec only asserted the block on the
      `createMessage` path; no test exercised `createReply` while muted. The spec omission
      is what made the test omission appear acceptable.

      Fix: extract `assertNotMuted` into a shared private helper and call it in both
      `createMessage` and `createReply` (commit 03e1102). A `createReply`-while-muted
      integration case was added.

      The generalizable class: when a new enforcement gate (mute check, rate limit, authz
      gate) is implemented on a PRIMARY write path (createMessage), the spec may name only
      that path — but any PARALLEL path to the same logical operation (createReply) must
      also receive the gate. Tests covering only the primary path give a false green on
      the parallel path, and B-6 Phase-2 is the structural catch-point.

      This is additive to BUILD rule 4 ("Reproduce one negative path per authz or injection
      boundary at B-6 Phase-2"): rule 4 mandates adversarial review but does not name the
      parallel-path enumeration obligation. The spec may scope the gate to one path;
      B-6 Phase-2 must enumerate all entry points to the same logical operation regardless
      of spec scope.
    source:
      - process/waves/wave-41/stages/B-6-review-output.md
        # H-1: "The muted_until send-gate is implemented ONLY in createMessage (lines 456-475).
        #   createReply (line 1008+) has no mute check at all."
        # "A member who has been timed out... is blocked from top-level messages but can
        #   freely post thread replies into any channel they can view."
        # "Why green tests miss it: the integration spec only asserts the block on the
        #   createMessage path (criterion 3); no test exercises createReply while muted."
        # "Fix: extract the muted-sender check into a shared private helper (assertNotMuted)
        #   and call it in createReply... Add a createReply-while-muted integration case."
        # "Note: the spec text (B-2-backend.md line 6) scopes the gate to 'createMessage',
        #   so this is arguably spec-conformant-as-written — but it is a genuine security
        #   hole regardless of spec wording."
      - process/waves/wave-41/stages/B-6-review.md
        # findings_high: "send-gate mute NOT on createReply (thread-reply mute bypass)
        #   → FIXED 03e1102 (assertNotMuted shared helper on createMessage + createReply)"
        # final_verdict: APPROVE
      - process/waves/wave-41/stages/V-1-jenny.md
        # Claim 2 VERIFIED: "assertNotMuted defined (:1744) AND called in BOTH createMessage
        #   (:461) AND createReply (:1062)" — confirms fix is in the deployed tree.
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
      # Target: rule 9 (slot open; contested). Complementary to rule 4 (adversarial review),
      # not a near-dup — rule 4 says HOW to probe (adversarial pass); this candidate says
      # WHAT to probe (enumerate all parallel paths to the same logical operation).
    recurrence: >
      FIRST RECORDED INSTANCE of "new enforcement gate applied only to the primary write
      path; parallel path ungatted; spec-conformant-as-written; B-6 Phase-2 catches HIGH
      bypass; fix: shared helper extracted and called from all paths" in L-2 history
      (searched waves 5 through 40: no prior obs records this specific parallel-path
      enumeration class).

      Near-dup check against BUILD rule 4: rule 4 requires "Reproduce one negative path
      per authz or injection boundary at B-6 Phase-2." The wave-41 H-1 WAS caught by
      rule 4's mechanism (Phase-2 adversarial review). However, rule 4's obligation ("one
      negative path") is satisfied by testing the primary path (createMessage-while-muted).
      The obligation this candidate adds is: enumerate ALL entry points to the logical
      operation before concluding gate coverage is complete. Rule 4 says to run the
      adversarial pass; this candidate says what the adversarial pass must enumerate.
      Complementary, not a near-dup.

      Near-dup check against BUILD rules 1-8: no existing rule addresses the obligation
      to enumerate parallel write paths when adding a new enforcement gate. BUILD slot 9
      is open (heavily contested). No near-dup.

      The class is falsifiable at B-6 Phase 1: for a new enforcement gate in the diff,
      enumerate all controller routes and service methods that represent the same logical
      operation. Does each receive the same gate? A handler implementing the gate on
      `createMessage` (or equivalent) but not on `createReply` (or equivalent) fails this
      check. Grep signal: new helper call (assertNotMuted, canPerformAction, checkRateLimit)
      in the primary write method body but absent from sibling methods on the same resource
      (reply, edit, react, upload).

      HOLD. First instance. Promote to BUILD-PRINCIPLES rule 9 on second confirming wave
      where: (a) a new enforcement gate covers a primary write path but not a parallel path,
      and a HIGH or CRITICAL finding surfaces at B-6 Phase-2 or in production, OR (b) an
      explicit parallel-path enumeration check at B-6 Phase-1 prevents the gap.
    promotion_gates:
      generalizable: true
        # Applies at B-6 Phase 1/Phase 2 for any wave adding a new enforcement gate
        # (mute check, rate limit, authz gate, quota check) to a primary write or send
        # path. The check: enumerate all sibling methods that perform the same logical
        # operation (create, reply, edit, react, upload) and confirm each receives the
        # same gate. A gate absent from any sibling method is a parallel-path gap. The
        # test suite check: does the test matrix exercise the muted/blocked/forbidden
        # state on EACH sibling path, not only the primary one? Missing test coverage
        # on a sibling path is the confirmatory signal.
      falsifiable: true
        # Checkable at B-6 Phase 1: for a new helper call in method M (assertNotMuted,
        # hasPermission, etc.), grep the same file for sibling methods that perform the
        # same operation class (createReply, editMessage, reactToMessage, uploadFile)
        # and confirm each also calls the helper. A sibling method without the helper
        # call fails this check. T-block confirmation: does the integration spec include
        # at least one test case exercising the enforcement state on the sibling path?
        # A spec that covers only the primary path but not the sibling path fails the
        # T-block check independently.
      cited: true
        # B-6-review-output.md H-1: full impact analysis (trivially bypassed from UI;
        #   defeats primary purpose of the feature; why green tests miss it: integration
        #   spec only asserts createMessage path; spec-conformant-as-written is not a
        #   defense for an exploitable bypass);
        # B-6-review.md gate verdict: HIGH FIXED 03e1102 (assertNotMuted shared helper);
        # V-1-jenny.md Claim 2 VERIFIED: assertNotMuted called in BOTH createMessage
        #   and createReply in deployed tree (confirmed fix in place).
    candidate_rule_shape: >
      [target: BUILD-PRINCIPLES rule 9]
      When a new enforcement gate is added to a primary write path, confirm every parallel
      path to the same logical operation receives the same gate.
      Why: A spec that names only the primary path leaves parallel entry points unguarded,
      and tests covering only the primary path give a false green.
      Rule line = 113 chars; why line = 96 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance. The HIGH severity (trivially exploitable from UI via reply
      composer) and the explicit note that the gap is "spec-conformant-as-written" make
      this a strong candidate despite being a first instance. The rule is falsifiable at
      B-6 Phase 1 (grep for the new gate helper call across sibling methods). Watch for:
      any wave adding a new gate (mute, rate-limit, authz check, quota) to one handler
      method on a resource that also has sibling handlers for parallel operations (reply,
      react, edit, upload) where the sibling handlers are not in the diff.

      Competing BUILD-PRINCIPLES slot-9 candidates (all HOLDs):
        - wave-31 obs-1 (strong, 10-wave HOLD): credential-endpoint membership-before-load
          — highest priority by severity and age.
        - wave-39 obs-1 (strong, 2-wave HOLD): async auth SDK call with no error path.
        - wave-36 obs-1 (warning, 5-wave HOLD): authz tests deferred to follow-up wave.
        - wave-36 obs-3 (warning, 5-wave HOLD): two-layer IDOR proof for session-only-userId
          endpoints.
        - wave-37 obs-3 (warning, 4-wave HOLD): bootstrap-once list + live-count-only hook.
        - wave-38 obs-1 (warning, 3-wave HOLD): B-5 omits repo-root lint command.
        - wave-38 obs-3 (warning, 3-wave HOLD): process.env = undefined stringification trap.
        - wave-40 obs-4 (warning, 1-wave HOLD): text-column route params bypass global 22P02
          filter.
        - wave-41 obs-3 (warning, this wave): parallel-path enforcement gap.
        - wave-32 obs-1 (warning, linter-blocked HOLD): enumerated-mock factory staleness.
        - wave-33 obs-3 (informational, 8-wave HOLD): clone shipped error-walk helper depth.
        - wave-32 obs-3 (informational, 9-wave HOLD): typed api-client method vs inline
          consumer.
      First-to-confirm takes the slot; wave-31 obs-1 and wave-39 obs-1 (both strong) have
      priority over all warning-severity candidates.


  - id: obs-4
    summary: >
      The P-0 problem-framer caught two overlapping antipatterns in the seed's framing:
      (1) false-absent premise: assignments are ALREADY gated via `can(userId, serverId,
      'manage_assignments')` in assignments.service.ts — the seed's "re-gate assignments"
      delta was unnecessary; any role granting the flag already manages assignments. (2)
      false-taxonomy invention: the seed framed "educator" as a distinct ROLE TYPE, but the
      RBAC model has no role-type concept — a role is a per-server `roles` row with
      independent boolean permission columns; "Educator" is simply a role whose flags
      include moderation. The corrected framing ("add a moderation permission flag to the
      existing boolean-permission RBAC") replaced both errors without changing scope.

      Both classes fall squarely within PRODUCT-PRINCIPLES rule 1's domain ("Verify every
      seed claim about what exists or is absent in the code"). The false-absent premise is
      a direct instance: `manage_assignments` gate exists, re-gate is absent from the work
      needed. The false-taxonomy claim is an extension of the same class: the "role type"
      concept does not exist in the RBAC data model.

      This wave applies rule 1 cleanly. The problem-framer verified the actual RBAC schema
      (`packages/shared/src/rbac.ts`, `apps/api/src/db/schema/servers.ts`) before accepting
      the seed's framing, matched antipatterns #1/#2/#4, and issued a REFRAME. Head-product
      mediation adopted the corrected framing; the rest of the wave executed against the
      corrected model. P-4 APPROVED (no re-REWORK on model or scope). 0 fix-up cycles
      attributable to framing.

      This is a confirmation-by-application of PRODUCT-PRINCIPLES rule 1 working as
      designed, not a new principle class.
    source:
      - process/waves/wave-41/stages/P-0-frame.md
        # "problem-framer verdict: REFRAME (file P-0-problem-framer.md; antipatterns
        #   #1/#2/#4). (1) No role-TYPE concept in the RBAC — a role is a per-server
        #   roles row with independent boolean permission columns. 'Educator' is NOT a
        #   new kind of role — it's a role whose flags include moderation. (2) Assignments
        #   are ALREADY can()-gated on manage_assignments (assignments.service.ts
        #   assertOrganizer ~L56) — not an owner-hardcode."
        # "Reframe: 'add a moderation permission flag to the existing RBAC; educator = a
        #   role bundling it,' NOT 'new role type + re-gate assignments.'"
      - process/waves/wave-41/stages/B-6-review-output.md
        # Items checked and CLEARED: "can(moderate_members) gating — all entry points
        #   covered... Owner short-circuits can() to true (correct). moderate_members
        #   correctly added to the Permission union, role CRUD, getEffectivePermissions,
        #   and DTO/schema." — confirms corrected framing was built without friction.
    severity: informational
    candidate_principles_file: command-center/principles/PRODUCT-PRINCIPLES.md
      # rule 1 already covers this class; this is a confirmation-by-application, not a
      # new principle. No promotion track opened.
    recurrence: >
      CONFIRMATION-BY-APPLICATION of PRODUCT-PRINCIPLES rule 1 ("Verify every seed claim
      about what exists or is absent in the code"). Wave-41's P-0 applied rule 1 in two
      directions: existence check (manage_assignments gate already exists) and vocabulary
      check (role-type concept does not exist in the RBAC model). Both catches prevented
      scope inflation and model misalignment.

      NOT a new principle class. Rule 1 encodes the obligation. This observation records
      the application for lineage and confirms rule 1 is actionable at P-0 for vocabulary
      mismatches as well as pure feature-existence checks.

      No new promotion track opened. No candidate_rule_shape.
    promotion_status: >
      NOT A NEW CANDIDATE. PRODUCT-PRINCIPLES rule 1 encodes the obligation. This
      confirmation-by-application is recorded for lineage only.


  - id: obs-5
    summary: >
      Wave-38 obs-1 recorded: B-5 omitted the repo-root `biome ci .` command due to the
      "root/CI owns lint" rationalization; three deterministic Biome errors reached C-1
      (1 fix-up cycle). Waves 39 and 40 each applied the lesson proactively (B-5 ran
      `biome ci .` with explicit "wave-38 lesson" citation; both waves had 0 lint-related
      fix-up cycles at C-1). Wave-41 continues the pattern: C-1 run 1 (commit 1266f90)
      shows `lint: pass` in 24s across all CI checks; the fix-up cycle 1 at C-1 was for
      a test-author assertion defect (ForbiddenException vs NotFoundException), not a lint
      error. The specialist's local pre-push note before the fix-up push confirms "biome
      check clean" was run. No lint errors reached CI from wave-41 code.

      This is the third consecutive wave (39, 40, 41) in which the wave-38 obs-1 lesson
      was applied and no lint errors reached C-1. Operationalizability of the candidate
      rule is confirmed across three waves. However, the promotion bar for wave-38 obs-1
      is a second FAILURE instance (B-5 omits the CI lint command AND deterministic lint
      errors reach C-1). Three consecutive non-failure applications are evidence the
      rule is being followed; they do not satisfy the second-failure promotion criterion.
    source:
      - process/waves/wave-41/stages/C-1-pr-ci-merge.md
        # "lint: pass (24s)" in CI run 1 (commit 1266f90) and CI run 2 (commit 3f46532).
        # "fix_up_cycles: 1" — the cycle was for a test-author assertion defect
        #   (NotFoundException vs ForbiddenException), not a lint error.
        # "Local pre-push checks: api typecheck pass, biome check clean." (fix-up commit
        #   3f46532 push note) — confirms biome was run before the push.
      - process/waves/_archive/wave-38/blocks/L/observations.md
        # obs-1: "B-5 omits repo-root lint command; 3 deterministic Biome errors reach CI;
        #   HOLD. First instance." (BUILD-PRINCIPLES rule 9 / rule 7 sharpen candidate)
    severity: informational
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
      # wave-38 obs-1 target; this wave is a third consecutive application-confirmation.
    recurrence: >
      3RD CONSECUTIVE CONFIRMATION-BY-APPLICATION of wave-38 obs-1 (BUILD-PRINCIPLES
      rule 7 sharpen / rule 9 candidate). Waves 39 and 40 also applied the lesson without
      lint reaching CI. Wave-38 obs-1 remains at 1-wave HOLD (the failure bar requires a
      second FAILURE instance, not a third application). No promotion action.
    promotion_status: >
      NOT PROMOTION-ELIGIBLE this wave. Wave-38 obs-1 remains 1-wave HOLD. Three
      consecutive application-confirmations (waves 39, 40, 41) confirm the candidate rule
      is operationally effective when read. The promotion bar (second wave where B-5 omits
      the CI lint command and deterministic lint errors surface at C-1) has not been met.
      Watch for: any B-5 transcript that documents "no package-level lint script" without
      also showing the repo-root CI lint command was run.
```

---

## Prior held observations — second-instance status (wave-36 through wave-40)

| origin | obs | class | wave-41 status |
|--------|-----|-------|----------------|
| wave-40 | obs-1 | T-8-sourced fix mechanism contradicts live architectural decision + wrong column error class | NOT CONFIRMED. No prior T-8 finding's remediation executed this wave; the moderation feature is new scope with no prior T-8 carry. Remains 1-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate, strong). |
| wave-40 | obs-3 | server-roles.test.tsx "marks role dirty" fires at CI (3rd full-suite fire; stabilization task recommended) | NOT FIRED as a flake. C-1 notes: "server-roles.test.tsx passed clean — failure was unrelated real defect, not a flake, no rerun." The wave-41 test failure was a new real defect in the moderation integration spec. NOT CONFIRMED as a new flake firing. obs-3 was PROMOTE-ELIGIBLE at wave-40; wave-41 does not affect that status. |
| wave-40 | obs-4 | Global 22P02 filter does not cover text-column NUL-byte errors; text-keyed route params need per-route boundary guards | NOT CONFIRMED. The new moderation endpoints (`/servers/:serverId/members/:userId/timeout`) use UUID-typed route params resolved against UUID-keyed columns; not text-column typed. Remains 1-wave HOLD (BUILD-PRINCIPLES rule 9 / T-8 rule 2 complement candidate). |
| wave-39 | obs-1 | Async auth SDK call (signOut) with no error path; always-resolving mock hides reject path; B-6 caught CRITICAL | NOT CONFIRMED. Wave-41 frontend changes are moderation affordances (SentRow gate, MemberListPanel timeout UI); no async auth SDK call followed by navigation or state transition in the diff. Remains 2-wave HOLD (BUILD-PRINCIPLES rule 9 candidate, strong). |
| wave-39 | obs-4 | Sole-doorway entry wired to one route ships second dead-end for other unreachable surfaces | NOT CONFIRMED. Wave-41 introduces new moderation controls (no entry-point wiring to existing routes). Remains 2-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-38 | obs-1 | B-5 omits repo-root lint command; "root/CI owns lint" rationalization; lint errors reach CI | APPLIED (3rd consecutive; not re-failed). See obs-5 above. Remains 1-wave HOLD (BUILD-PRINCIPLES rule 7 sharpen / rule 9 candidate). |
| wave-38 | obs-2 | P-3 empirically probes live external service before architecture commitment | NOT CONFIRMED. No external service access-semantics architecture decision at P-3; moderation is server-internal. Remains 3-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-38 | obs-3 | process.env.X = undefined stringification trap; Biome noDelete suggested fix leaves key truthy | NOT CONFIRMED. No process.env teardown in wave-41 test files; integration tests use real-PG (no env manipulation). Remains 3-wave HOLD (BUILD-PRINCIPLES or T-2.md candidate). |
| wave-38 | obs-4 | T-8 rule 2 scope gap: public unauthed :id endpoints unprobed for malformed input | NOT CONFIRMED. The new moderation endpoints are auth-gated (POST/DELETE /timeout require session + moderate_members). No new public unauthed :id endpoint introduced. Remains 3-wave HOLD (T-8.md rule 2 amendment candidate). |
| wave-37 | obs-2 | HTTP verb mismatch (client POST vs controller @Patch) passes service-layer tests; controller route-metadata assertion catches it | NOT CONFIRMED. No new controller routes with a verb mismatch between frontend api.ts and controller decorator. Remains 4-wave HOLD (CI-PRINCIPLES or T-2.md candidate). |
| wave-37 | obs-3 | Bootstrap-once list + live-count-only hook leaves list surface stale on reopen | NOT CONFIRMED. No new hook that bootstraps a list at mount and live-increments a count. Remains 4-wave HOLD (BUILD-PRINCIPLES or T-2.md candidate). |
| wave-36 | obs-1 | Security-boundary authz/IDOR tests deferred to follow-up wave; no committed artifact in shipping wave | NOT CONFIRMED. Wave-41 shipped the moderation integration tests inline (`moderation.integration.spec.ts`) in the same wave as the boundary — the correct pattern. Remains 5-wave HOLD (BUILD-PRINCIPLES rule 9 candidate). |
| wave-36 | obs-3 | Two-layer IDOR proof: service integration + controller session-scoping test for session-only-userId endpoints | NOT CONFIRMED. The timeout/moderation endpoints derive target identity from URL params (serverId, userId) validated against server membership (IDOR check at the membership level), not from session-only derivation. Remains 5-wave HOLD (BUILD-PRINCIPLES or T-8.md candidate). |

---

## Signals evaluated and dropped

**Signal: B-6 delete-any rank guard asymmetry (MEDIUM M-1) as a separate observation:**
The B-6 Phase-2 report (B-6-review-output.md) flagged that `deleteMessage` on the moderator
path had no `assertRankGuard`, while `setMemberTimeout` did. The gate verdict (B-6-review.md)
recorded this as HIGH and fixed it (03e1102: `assertDeleteRankGuard` on moderator-delete path).
The generalizability is real: when a new permission gate covers two operations (delete-any,
timeout), and a rank guard is specified for one (timeout) but not the other (delete-any), the
asymmetry creates unintended privilege. However, this class is closely related to obs-3
(parallel-path enforcement gap): both are about a guard covering one path but not another.
The delete-rank-guard class is a design-consistency catch (spec-conformant but authz-inconsistent)
rather than a parallel-path enumeration gap. It is narrower than obs-3 and does not add a
distinct principle beyond BUILD rule 4's adversarial review obligation. ABSORBED into obs-3's
lineage; dropped as standalone observation.

**Signal: V-1 jenny fixture doc drift (WRONG_CREDENTIALS_ERROR for user B):**
Jenny flagged that user B's credentials are rejected on the deployed api, preventing
live two-user flow reproduction (muted user's send block, non-moderator 403 on delete/timeout).
This is test-account fixture doc drift, not a product bug; V-1 jenny confirmed the four
affected paths via deployed-source trace and T-8 real-PG results. The class (test-account
fixture doc drift that limits live V-block two-user verification) is real but narrow. It is
the first recorded instance; it is also remediable without a principle (update the fixture
doc). DROPPED as wave-specific operational gap; not a general observation.

**Signal: C-1 test-author-bug fix-up (NotFoundException vs ForbiddenException) as a principle:**
C-1 cycle 1 was a copy-paste assertion error: `.rejects.toBeInstanceOf(ForbiddenException)`
copied from the rank-guard cases and never updated for a non-member target (which correctly
throws NotFoundException, not ForbiddenException). The fix was test-only. This is not a
new principle class — it is the expected outcome of authoring dense integration suites with
many similar assertion shapes. The Iron Law was correctly honored (no direct fix; routed via
/investigate). DROPPED as wave-specific execution correction.

**Signal: C-2 tooling path (CLI-blocked → GraphQL git-connect self-serve):**
The initial C-2 ESCALATE was triggered by a deploy-tooling contradiction (CLI-upload sources,
railway-guard blocking CLI, no GraphQL source-upload mutation). Founder authorized the GraphQL
git-connect path. The resolution is specific to the project's Railway provisioning state at
wave-41. The learning ("serviceInstanceUpdate.source is the working git-connect mutation;
serviceConnect and githubRepoUpdate return Not Authorized for the project-scoped token") is
project-specific infra knowledge, not a generalizable principle. DROPPED; recorded in C-2
stage artifact for operational lineage.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | V-3 redeploy false-green: unparameterized serviceInstanceDeployV2 on git-connected service rebuilds pinned snapshot; SUCCESS is stale-code false-green | warning | 1st instance (git-connected sub-class; broader class is CI rule 7 domain) | CI-PRINCIPLES | HOLD — rule 7 scope amendment or rule 9 candidate; promote on 2nd confirming wave |
| obs-2 | Symbol-grep false-positive: canModerateMembers in old bundle from pre-existing MemberListPanel; karen APPROVEd stale deploy; jenny caught by call-site shape | warning | 1st instance | VERIFY-PRINCIPLES | HOLD — rule 3 candidate; promote on 2nd confirming wave |
| obs-3 | Parallel-path enforcement gap: assertNotMuted on createMessage only; createReply unguarded; B-6 HIGH; spec-conformant-as-written is not a defense | warning | 1st instance | BUILD-PRINCIPLES | HOLD — rule 9 candidate (complementary to rule 4); promote on 2nd confirming wave |
| obs-4 | P-0 REFRAME: false-taxonomy (no role-type in RBAC) + false-absent (assign gate exists); PRODUCT rule 1 confirmed-by-application | informational | confirmation-by-application | PRODUCT-PRINCIPLES | NOT A NEW CANDIDATE — rule 1 encodes this; lineage only |
| obs-5 | wave-38 obs-1 (biome ci at B-5) applied for 3rd consecutive wave; no lint fix-up at C-1 | informational | 3rd consecutive application-confirmation | BUILD-PRINCIPLES | HOLD status unchanged (wave-38 obs-1 remains 1-wave HOLD; bar is second FAILURE) |

**Observations emitted: 5 (obs-1, obs-2, obs-3, obs-4, obs-5)**
**Severities: 3 warning (obs-1, obs-2, obs-3), 2 informational (obs-4, obs-5)**
**Candidate files: CI-PRINCIPLES (obs-1), VERIFY-PRINCIPLES (obs-2), BUILD-PRINCIPLES (obs-3 new hold; obs-5 applied-confirmation)**
**Promotion-eligible this wave: NONE (obs-1 through obs-3 are first-instance HOLDs; obs-4 and obs-5 are informational non-candidates)**
**Dropped: B-6 delete-rank-guard asymmetry (absorbed into obs-3); V-1 jenny fixture doc drift (wave-specific operational gap); C-1 test-author-bug fix-up (wave-specific, Iron Law honored); C-2 tooling path (project-specific infra knowledge)**

---

## Promotion candidate flags for karen

**No observations are promotable this wave. Three first-instance HOLDs; two informational non-candidates.**

**obs-1** (CI-PRINCIPLES rule 7 scope amendment or rule 9 candidate, warning severity) closes
the "non-git-connected" scope gap in CI rule 7. The underlying mechanism (stale snapshot served
after redeploy, SUCCESS false-green) is the same class rule 7 encodes; the new triggering
condition (git-connected service + unparameterized mutation) is distinct. Rule 7's first clause
("For a non-git-connected Railway service") would need to be broadened to "For any Railway
deploy or redeploy" to cover this. The verify obligation (bundle hash changed + specific fix
substring present) is the same. The correction of the deploy mutation itself (must specify
commitSha or latestCommit:true) is the prevention mechanism. Watch for: any stage transcript
where a Railway redeploy mutation lacks an explicit commit argument, followed by a bundle hash
that did not change.

**obs-2** (VERIFY-PRINCIPLES rule 3 candidate, warning severity) is the first formal instance
of a symbol-name grep yielding a false-positive because the symbol exists in a pre-existing
component already in the old bundle. The failure mechanism is clean and documented in the
same wave by two reviewers using two different methods (karen: symbol grep → false approve;
jenny: call-site shape → correct reject). The candidate rule is falsifiable (bundle hash
unchanged = strong signal; symbol in pre-existing component = confirmatory). Competing VERIFY
slot 3 candidates are all long-standing HOLDs; this wave's obs-2 has the strongest single-wave
evidence base (direct false-positive/correct-reject pair from the same wave). Watch for: any
V-1 or V-3 transcript that confirms a frontend fix by grepping for a symbol that appears in
more than one component across the codebase.

**obs-3** (BUILD-PRINCIPLES rule 9 candidate, warning severity) extends the adversarial review
obligation from "reproduce a negative path" to "enumerate all parallel entry points to the
same logical operation." The HIGH severity (trivially exploitable mute bypass from the reply
composer UI) and the "spec-conformant-as-written" note make this a meaningful addition:
spec conformance on the primary path does not grant exemption for the parallel path. The rule
is falsifiable at B-6 Phase 1 (grep for new gate helper across sibling methods). Competing
BUILD slot 9 candidates: wave-31 obs-1 (strong, 10-wave HOLD) and wave-39 obs-1 (strong,
2-wave HOLD) take priority by severity. Watch for: any wave adding a new enforcement gate
to a primary write method where sibling methods on the same resource do not also receive
the gate.

**Competing CI-PRINCIPLES rule 9 candidates:**
  - wave-37 obs-2 (strong, 4-wave HOLD): HTTP verb mismatch (client vs controller verb)
    passes service-layer tests; controller route-metadata assertion catches it.
  - wave-28 obs-1 (warning, 13-wave HOLD): entropy scanner false-positives on transcript dirs.
  - wave-28 obs-2 (warning, 13-wave HOLD): CI-config fix pushed unverified reproduces failure.
  - wave-41 obs-1 (warning, this wave): unparameterized redeploy false-green on git-connected
    service.
  Wave-37 obs-2 (strong, 4-wave HOLD) takes priority by severity. If it confirms before
  obs-1, it takes slot 9; obs-1 would then amend rule 7 rather than occupying slot 9.

**Competing VERIFY-PRINCIPLES rule 3 candidates (all HOLDs):**
  - wave-33 obs-2 (warning, 8-wave HOLD): error-mapping fix must fire against a real upstream
    error from the actual code path.
  - wave-29 obs-2 (warning, 12-wave HOLD): V-3 head-verifier pattern scan beyond named sites.
  - wave-30 obs-3 (warning, 11-wave HOLD): accept+track+observe dispose of design-limitation.
  - wave-41 obs-2 (warning, this wave): symbol-grep false-positive from pre-existing component.
  First-to-confirm takes the slot. Wave-41 obs-2 has the strongest single-wave evidence but
  is the newest entrant. Age priority goes to wave-29 obs-2 (12-wave HOLD) if it confirms.

---
## L-2 promotion disposition (wave-41) — 0 promotions

karen vetted 3 candidates:
- **obs-1 → CI rule 7 scope refinement (deploy false-green on git-connected service):** karen APPROVE *as an in-place scope amendment* (drop "non-git-connected" qualifier). **NOT promoted** — the CI-PRINCIPLES contract is append-only; an in-place edit of promoted rule 7 breaks it, and a net-new rule fails the first-instance recurrence bar. Held as a STRONG candidate: promote when it either recurs cleanly as a net-new rule OR head-ci-cd/founder explicitly authorizes an append-only exception for a proven-wrong scope qualifier. (Second cross-wave instance of the served-stale-bundle false-green class: wave-34 non-git + wave-41 git-connected.)
- **obs-2 → VERIFY rule 3 (minified symbol-grep false-positive):** karen REJECT/HOLD — first-instance net-new; no exception applies.
- **obs-3 → BUILD rule 9 (parallel-entry-point guard coverage):** karen REJECT/HOLD — first-instance net-new, complementary to rule 4, outranked by older strong slot-9 candidates.
