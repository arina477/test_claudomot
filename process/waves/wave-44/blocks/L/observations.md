# Wave 44 — L-2 Distill Observations

Synthesized from wave-44 artifacts (M8 polish/hardening: class-scheduling 1024 responsive
a11y fix + 5 accumulated sibling polish/coverage tasks; PR squash-merged to main; V-block
APPROVED).
Inputs read:
process/waves/wave-44/stages/B-6-review.md,
process/waves/wave-44/stages/B-2-backend.md,
process/waves/wave-44/stages/T-6-layout.md.
Prior archives consulted:
process/waves/_archive/wave-{41,42,43}/blocks/L/observations.md
(recurrence checks on dialog a11y class, stranded-follow-up class, transient-finding class,
multi-round review discipline).
Principles files read: BUILD-PRINCIPLES (9 rules), VERIFY-PRINCIPLES (2 rules).

---

```yaml
observations:

  - id: obs-1
    summary: >
      The wave-44 seed was a fix for a wave-43 T6-F1 responsive defect (narrow-≤1024
      detail overlay crushing the agenda card). The B-6 fix introduced a NEW a11y gap:
      the overlay was rendered without the full WCAG dialog contract — no role=dialog,
      no aria-modal, no Esc handler, no focus trap, no initial focus, no aria-hidden on
      background. B-6 /review round 1 caught this as H1 (HIGH: WCAG dialog gap introduced
      by the fix). The react-specialist fix (7605c5b) applied the complete dialog contract.
      Round 2 then found a NEW regression: the overlay's capture-phase Esc + stopPropagation
      closed the underlying session form when both were mounted simultaneously (modal-stacking
      bug). That required a second fix (70c388a). Round 3 was CLEAN.

      The pattern: when a layout fix introduces a new modal or overlay surface, the fix
      author applied a minimal "render an overlay" approach rather than treating the new
      surface as a dialog that needs the full contract (role/aria-modal/Esc/trap/inert/
      focus-restore/stacking). The fix was responsive-layout-focused; the a11y contract
      was not in scope until /review flagged it.

      Cross-wave recurrence check on "new dialog surface ships without full WCAG dialog
      contract":
      - wave-41 (member moderation): SessionForm and moderation menu were designed with
        aria-label + role=menu + sr-only muted text per D-3 handoff annotations.
        B-3-frontend.md shows no dialog surfaces added; the moderation affordances were
        inline row controls + menu, not dialogs. B-6 caught no dialog-a11y gap. No instance.
      - wave-42 (assignment submissions): Return dialog shipped with role=dialog, focus trap,
        Esc+restore verified at T-5 per T-6-layout.md (T6-F1 LOW noted "role=dialog, focus
        trap, Esc+restore all verified at T-5"). Full contract present at authoring time.
        No instance.
      - wave-43 (class scheduling): SessionForm (role=dialog + aria-modal + focus trap + Esc
        + aria-live) AND SessionDetail DeleteDialog (role=dialog + focus trap + Esc+restore)
        both shipped with the full contract per B-3-frontend.md. B-6 caught no dialog-a11y
        gap. No instance.
      - wave-44 (this wave): FIX introduces an overlay → overlay ships without the full
        contract → B-6 H1. FIRST RECORDED INSTANCE.

      Distinct sub-class: the gap does not arise when authoring a NEW dialog surface
      (waves 42/43 both got it right). It arises when a RESPONSIVE FIX introduces an
      overlay as a side-effect — the fix is scoped to layout/behavior, and the a11y
      contract for the resulting overlay is omitted. The fix author's mental model is
      "render an overlay to solve the layout problem"; the reviewer's mental model is
      "any overlay that traps user focus is a dialog and needs the full contract."

      Near-dup check against BUILD rule 4 (adversarial reproduction at B-6 Phase 2):
      rule 4 addresses what Phase 2 must probe (one negative authz/injection path). This
      class is about what Phase 2 must ALSO check for any new overlay/modal surface: the
      full WCAG dialog contract. Complementary, not a near-dup. No existing rule addresses
      the dialog-contract completeness obligation at B-6.

      Near-dup check against wave-43 obs-3 (T-6 layout-budget collision at constrained
      breakpoints): obs-3 addresses a design-origin gap (D-block didn't specify panel
      collapse). This obs addresses an implementation-origin gap (fix introduces overlay
      without full dialog contract). Different axis. Not a near-dup.

      FIRST RECORDED INSTANCE of "a responsive/layout fix introduces a new overlay surface;
      the overlay ships without the full WCAG dialog contract (role/aria-modal/Esc/trap/
      focus-restore/stacking); B-6 Phase 2 catches HIGH a11y gap."
    source:
      - process/waves/wave-44/stages/B-6-review.md
        # "Round 1: HAS-FINDINGS — H1 (HIGH: narrow-≤1024 detail overlay lacked Esc/
        #   focus-trap/inert + false comment — the T6-F1 fix introduced a new WCAG dialog gap)"
        # "Fix 1 (7605c5b, react-specialist): narrow overlay → role=dialog aria-modal + Esc
        #   + focus trap + initial focus + aria-hidden background + focus-restore; M2 focus-
        #   restore fallback to newSessionBtnRef when trigger detached."
        # "Round 2: H1+M2 FIXED, but NEW HIGH — modal-stacking: editing from the narrow
        #   overlay left both dialogs mounted; overlay's capture-phase Esc + stopPropagation
        #   closed the wrong (underneath) modal."
        # "Fix 2 (70c388a, react-specialist): gate the overlay Esc effect on !formOpen"
        # "Round 3: CLEAN"
      - process/waves/_archive/wave-42/stages/T-6-layout.md
        # T6-F1 LOW: "role=dialog, focus trap, Esc+restore all verified at T-5" — confirms
        #   wave-42 Return dialog shipped with full contract; not the same class.
      - process/waves/_archive/wave-43/stages/B-3-frontend.md
        # "SessionForm.tsx: role=dialog aria-modal + focus trap + Esc close + aria-live"
        # "SessionDetail.tsx: DeleteDialog (role=dialog, focus trap, Esc+restore)"
        #   — confirms wave-43 dialogs shipped with full contract; not the same class.
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
      # Target: BUILD rule 10 (slot open after rule 9 promotion at wave-43).
      # Candidate rule class: any new overlay/dialog-shaped surface (including ones
      # introduced as a side-effect of a layout fix) must ship with the full WCAG dialog
      # contract. B-6 Phase 1 or Phase 2 must check the contract completeness, not just
      # the layout correctness of the fix.
    recurrence: >
      FIRST RECORDED INSTANCE of "layout/responsive fix introduces an overlay surface
      that ships without the full WCAG dialog contract; B-6 Phase 2 H1 a11y catch;
      fix introduces modal-stacking regression requiring a second fix round."

      Checked waves 41/42/43 for the "new dialog surface ships without full contract"
      class: waves 42 and 43 both authored new dialog surfaces with the full contract at
      B-block; wave 41 had no new dialog surfaces. The wave-44 instance is distinguishable:
      it is a fix-introduced surface, not a feature-authored surface, and the fix author's
      scope was responsive layout, not dialog authoring.

      The modal-stacking regression (round-2 new HIGH) is an emergent consequence: adding
      the full dialog contract (Esc handler with capture + stopPropagation) to a surface
      that overlaps another dialog creates a stacking interaction that did not exist before.
      This sub-class (dialog-contract addition produces modal-stacking regression) is
      itself a first instance and is absorbed into this obs as a consequence, not opened
      as a separate class.
    promotion_gates:
      generalizable: true
        # Applies at B-6 Phase 1 or Phase 2 for any wave whose diff includes a new overlay,
        # panel, or surface that (a) appears above existing content, (b) may receive keyboard
        # focus, or (c) is introduced as a side-effect of a layout/responsive fix rather than
        # a feature addition. The check: does the overlay have role=dialog (or role=alertdialog),
        # aria-modal=true, an Esc handler, a focus trap, initial focus set, aria-hidden on the
        # background, and focus-restore on close? A surface missing any of these is incomplete.
        # Additionally: if the overlay is added while another dialog may be open concurrently,
        # does the Esc handler gate on whether the other dialog is open?
      falsifiable: true
        # Checkable at B-6 Phase 1: grep the diff for any new element with position:fixed,
        # position:absolute, or z-index higher than 0 that wraps interactive content. For each
        # such element, check whether role=dialog is present and whether an Esc keydown handler
        # is attached. A fix that adds a new overlay without role=dialog in the diff fails this
        # check. Modal-stacking check: if a second dialog may be open while the overlay is
        # rendered, does the Esc handler check whether the other dialog is open before
        # consuming the event?
      cited: true
        # B-6-review.md: Round 1 H1 "narrow-≤1024 detail overlay lacked Esc/focus-trap/
        #   inert + false comment — the T6-F1 fix introduced a new WCAG dialog gap";
        # fix 7605c5b: "role=dialog aria-modal + Esc + focus trap + initial focus +
        #   aria-hidden background + focus-restore";
        # Round 2 new HIGH: "modal-stacking: editing from narrow overlay left both dialogs
        #   mounted; overlay's capture-phase Esc + stopPropagation closed the wrong modal";
        # fix 70c388a: "gate the overlay Esc effect on !formOpen."
    candidate_rule_shape: >
      [target: BUILD-PRINCIPLES rule 10]
      Any new overlay or modal surface introduced by a diff — including as a fix side-effect
      — must include the full WCAG dialog contract: role, trap, Esc, initial-focus, restore.
      Why: A layout-fix author scopes to the responsive problem; the a11y contract for the
      resulting overlay is omitted unless explicitly checked.
      Rule line = 117 chars; why line = 95 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance. The wave-43 and wave-42 evidence confirms that feature-authored
      dialog surfaces do get the full contract; the gap is specific to fix-introduced surfaces
      where the author's scope excludes a11y. The modal-stacking sub-class (adding the dialog
      contract introduces a stacking regression) confirms that dialog-contract completeness
      has cascading correctness implications beyond accessibility. Watch for: any B-block diff
      that adds an overlay, panel, or modal-shaped surface as a side-effect of a layout,
      responsive, or bug-fix change, where the surface does not appear in the D-block design
      artifacts as a named dialog.


  - id: obs-2
    summary: >
      Task c50f3040 (fixture-B WRONG_CREDENTIALS finding from wave-41 T-5) sat with a non-NULL
      wave_id for 3 waves (wave-41, wave-42, wave-43) before being resolved in wave-44. It was
      included in the wave-44 bundle (as a sibling) precisely because it had been re-homed by
      wave-43 N-1 (wave_id cleared to NULL, parent_task_id set to the seed). The wave-41 N-1
      survey explicitly recorded the two moderation follow-ups (8828484f + ca43eb12) as
      "parked (re-home reminder in checkpoint note)" with "wave_id set → excluded" as the
      seed-filtering reason — and noted they would strand without a future N-1 re-home.
      Wave-42 and wave-43 N-1 subsequently re-homed them by clearing wave_id.

      The mechanism: V-2-triage sets wave_id = producing wave (provenance). N-2 seed picker
      requires wave_id IS NULL. So any V-2 follow-up with wave_id set is invisible to N-2 until
      a future N-1 manually detects it via the survey and clears it. MEMORY already records
      this as "V-2 milestone-followup-wave-id-must-be-null-for-n2-seed."

      Cross-wave status: the MEMORY entry is the currently active mitigation. The wave-41/42/43
      N-1 survey logs show the re-home was discovered and applied, confirming the workaround
      works. The c50f3040 case is the fourth confirmed instance of a follow-up stranding and
      being manually re-homed (prior instances: wave-32 a2dd9f3d; wave-41 8828484f; wave-43 N-1
      re-homed both 8828484f and ca43eb12). The MEMORY note documents the V-2 SQL fix (set
      wave_id=NULL at insert) but that fix has not been applied to V-2's Action 4 ritual across
      waves — the insert still sets wave_id to the producing wave in practice, as evidenced by
      the recurring re-home need.

      Candidate promotion: the MEMORY entry ("V-2 milestone follow-up wave_id must be NULL for
      N-2 seed") captures the fix. The question is whether this is promotable to a principles
      file. The class is not a BUILD, VERIFY, CI, or PRODUCT principle — it is a process ritual
      correctness issue (V-2 Action 4 insert SQL). The relevant promotion target would be a
      V-block or N-block principles file if one existed, or VERIFY-PRINCIPLES as the closest
      V-block file.

      Near-dup check against VERIFY-PRINCIPLES rules 1-2: neither addresses V-2 task
      insertion. No near-dup.

      This obs is informational in this wave — the MEMORY entry is the authoritative
      mitigation record. The obs documents that the structural fix (V-2 Action 4 must set
      wave_id=NULL) has not been made to the ritual after 4+ stranding instances, and that
      every affected N-1 must manually re-home stranded follow-ups. It is recorded as
      cross-wave pressure on the ritual author to correct V-2 Action 4.
    source:
      - process/waves/wave-44/stages/B-2-backend.md
        # "ca43eb12 (prereq): fixture-B is WORKING — signs in 200 (user da74148e) with the
        #   existing test-accounts.md password; the wave-41 WRONG_CREDENTIALS does NOT
        #   reproduce. No re-provision needed. → c50f3040 marked DONE (fixture-B usable)."
        # "ca43eb12's delete-any E2E is now UNBLOCKED (B-5)."
      - process/waves/_archive/wave-41/stages/N-1-survey-and-triggers.md
        # "M8 children: seed_candidates=0 (2 open rows carry this-wave wave_id → excluded)."
        # "Seed-stranding (4): 8828484f + ca43eb12 left with wave_id set (excluded-but-tracked)
        #   to preserve N-2 oldest-seed ordering... Re-home reminder recorded in checkpoint note."
      - process/waves/_archive/wave-43/stages/N-2-seed.md
        # "Siblings (5): 8828484f, ca43eb12, 683fec9b, 8d971bc2, 0308cdf1 (the re-homed
        #   w41/w42/w43 polish+coverage follow-ups)" — confirms re-home was applied.
    severity: informational
    candidate_principles_file: command-center/principles/VERIFY-PRINCIPLES.md
      # Nearest V-block file. Target: rule 3 (contested slot). However, this is a ritual
      # correctness issue (V-2 Action 4 SQL), not a verification principle. The preferred
      # resolution is a V-2 ritual doc correction (wave_id=NULL in Action 4 INSERT), not a
      # principles promotion. HOLD as informational pressure item.
    recurrence: >
      4TH DOCUMENTED STRANDING INSTANCE of the "V-2 follow-up inserted with wave_id = producing
      wave; N-2 seed picker requires wave_id IS NULL; follow-up strands until N-1 re-home" class.

      Documented instances:
        - wave-32: task a2dd9f3d stranded; re-homed at N-block. MEMORY entry authored at wave-32.
        - wave-41: tasks 8828484f + ca43eb12 stranded; wave-41 N-1 noted but did not re-home
          (preserved assignment bundle ordering); wave-42/43 N-1 subsequently re-homed them.
        - wave-44: task c50f3040 confirmed as a re-homed follow-up (stranded since wave-41 V-2;
          re-homed at wave-43 N-1; resolved in wave-44).

      MEMORY entry is the active mitigation. The structural fix (V-2 Action 4 must set
      wave_id=NULL for milestone-scoped seeds intended for N-2) has not been applied to the
      ritual docs across 4+ instances. This obs records the continued pressure.
    promotion_gates:
      generalizable: true
        # The V-2 Action 4 INSERT with wave_id = producing wave is the root; any
        # milestone-scoped follow-up inserted this way strands. The fix is deterministic:
        # INSERT with wave_id=NULL and record provenance in the description prose.
      falsifiable: true
        # Checkable at any N-1 survey: does the M8 (or active milestone) child list include
        # any row in status='todo' with wave_id IS NOT NULL and parent_task_id IS NULL?
        # Such a row is a stranded V-2 follow-up. A non-zero count fails the check.
      cited: true
        # wave-41 N-1: "2 open rows carry this-wave wave_id → excluded" from seed_candidates.
        # wave-43 N-2: "the re-homed w41/w42/w43 polish+coverage follow-ups" as siblings.
        # wave-44 B-2: ca43eb12 resolved as a sibling in this wave's bundle.
    candidate_rule_shape: >
      [NOT a principles file candidate — ritual doc fix: V-2 Action 4 INSERT must set
      wave_id=NULL for any milestone-scoped follow-up task intended as a future N-2 seed.
      MEMORY entry already captures this. Promotion target is V-2-triage.md ritual correction,
      not a new principle line.]
    promotion_status: >
      NOT A PRINCIPLES PROMOTION CANDIDATE. MEMORY entry is the authoritative record; the
      fix target is V-2 Action 4 ritual SQL (wave_id=NULL at insert). Informational cross-
      wave pressure item. The 4th stranding instance is recorded here to document that the
      structural ritual fix has not been applied after wave-32's MEMORY entry. Action: ritual
      author (or N-1 agent) should correct V-2 Action 4 INSERT to set wave_id=NULL for
      milestone-scoped follow-ups and rely on description prose for provenance.


  - id: obs-3
    summary: >
      The wave-41 T-5 finding for task c50f3040 stated fixture-B returned WRONG_CREDENTIALS
      on sign-in. Wave-44 B-2 verified fixture-B directly and found it works — signs in 200
      with the existing test-accounts.md password; the WRONG_CREDENTIALS error did NOT
      reproduce. The task was then marked DONE (fixture-B usable) with no re-provisioning
      needed.

      This is the first recorded L-2 instance of "a prior-wave T-block finding that was
      used as the basis for a filed task did not reproduce on re-verification; the filing
      wave did not re-verify before filing the task as a hard constraint on subsequent
      waves."

      The c50f3040 task remained marked todo (and was treated as a prerequisite blocker by
      wave-44 B-2 before it verified) for 3 waves before verification showed the finding was
      transient or wrong. The cost: wave-42 and wave-43 E2E coverage on the delete-any path
      was reduced (the fixture-B gap was cited as the reason; ca43eb12 was a sibling in the
      wave-44 bundle with "fixture-B verified working → delete-any E2E now UNBLOCKED" as its
      resolution). The fixture-B WRONG_CREDENTIALS finding was never cross-verified in a
      minimal repro before being filed as a task — the T-5 agent accepted the live error at
      face value.

      The generalizable class: a T-5 (or T-block) finding that produces a filed task should
      be cross-verified with a minimal repro before the task is filed as a hard blocker on
      future waves. A single-session credential error (WRONG_CREDENTIALS) is a transient
      class — network state, session cache, or MCP browser state can produce it without the
      credentials being wrong. Filing a task based on an unverified transient error strands
      coverage work for an indeterminate number of waves.

      Near-dup check against VERIFY-PRINCIPLES rules 1-2: rule 1 (seeding ACs by inspecting
      create-path source, not runtime behavior) addresses the AC-verification direction. This
      obs is about T-block finding verification before filing — whether the finding was
      real before a task is opened on it. Different axis. Not a near-dup.

      Near-dup check against BUILD rule 4 (adversarial reproduction at B-6 Phase 2): rule 4
      mandates reproducing a negative path; it does not address whether a T-block finding
      requires re-verification before filing. Not a near-dup.

      Near-dup check against PRODUCT-PRINCIPLES rule 1 ("Verify every seed claim about what
      exists or is absent"): rule 1 applies at P-0 to seed claims. This class applies at
      T-block finding time. Complementary scope, not a near-dup.

      FIRST RECORDED INSTANCE of "T-block finding (credential failure / transient error)
      filed as a hard-blocker task without a minimal repro cross-verification; finding did
      not reproduce on later re-verification; coverage deferred for multiple waves."
    source:
      - process/waves/wave-44/stages/B-2-backend.md
        # "ca43eb12 (prereq): fixture-B is WORKING — signs in 200 (user da74148e) with the
        #   existing test-accounts.md password; the wave-41 WRONG_CREDENTIALS does NOT
        #   reproduce. No re-provision needed. → c50f3040 marked DONE."
      - process/waves/_archive/wave-41/stages/L-2-observations.md
        # (obs-5 V-1 jenny fixture doc drift note: "user B's credentials are rejected on the
        #   deployed api" — wave-41 classified this as test-account fixture doc drift)
    severity: warning
    candidate_principles_file: command-center/principles/VERIFY-PRINCIPLES.md
      # Target: rule 3 (contested slot).
      # Candidate rule class: a T-block credential or auth failure must be reproduced in a
      # second attempt (new browser context or fresh session) before being filed as a task;
      # a single-session transient error does not constitute a confirmed finding.
    recurrence: >
      FIRST RECORDED INSTANCE of this class. The cost is proportional to the number of
      waves the unverified task sits as a prerequisite blocker: 3 waves in this case, with
      measurable E2E coverage reduction on the delete-any path across those waves.

      Near-dup check against all prior held obs (waves 28-43): no prior obs records the
      "T-block transient finding filed without repro verification → strands coverage" class.
      First instance.
    promotion_gates:
      generalizable: true
        # Applies at any T-5 (or T-block) stage where a finding is a credential failure,
        # authentication error, or session-state error. The check: was the failure reproduced
        # in a second attempt with a fresh browser context or fresh MCP session before the
        # task was filed? A single-attempt credential failure that was not cross-verified fails
        # this check. The tell: the task description's "failure evidence" cites a single T-5
        # run result with no repro attempt noted.
      falsifiable: true
        # Checkable when a later wave re-verifies the finding: does the credential / auth
        # failure reproduce? If not, the original filing was based on an unverified transient.
        # Pre-filing check: does the T-5 transcript show a second attempt in a new browser
        # context? If not, the credential error is unconfirmed.
      cited: true
        # wave-44 B-2-backend.md: "fixture-B is WORKING — signs in 200 (user da74148e);
        #   the wave-41 WRONG_CREDENTIALS does NOT reproduce."
        # wave-41 V-1-jenny: fixture-B credential rejection confirmed live at V-block; filed
        #   as task c50f3040 without a noted second-attempt repro.
    candidate_rule_shape: >
      [target: VERIFY-PRINCIPLES rule 3 — contested slot]
      Before filing a task on a T-block credential or session error, reproduce it in a fresh
      browser context; a single-attempt transient error is not a confirmed finding.
      Why: Session cache, MCP browser state, or network blip can produce a credential error
      that does not reproduce; filing it as a hard task strands coverage work.
      Rule line = 116 chars; why line = 98 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance. The c50f3040 case is the only documented instance. Three-wave
      strand duration gives it cost weight, but the class has not recurred in the L-2 archive.
      Watch for: any T-5 or T-block stage transcript that files a task on a credential error
      (WRONG_CREDENTIALS, 401, session-cookie missing) without citing a second-attempt
      verification in a new browser context.

      Competing VERIFY-PRINCIPLES slot-3 candidates (all HOLDs; same queue as wave-43):
        - wave-33 obs-2 (warning, 10-wave HOLD): error-mapping fix must fire against a real
          upstream error from the actual code path.
        - wave-29 obs-2 (warning, 14-wave HOLD): V-3 head-verifier pattern scan beyond named
          sites catches reviewer-missed occurrence.
        - wave-30 obs-3 (warning, 13-wave HOLD): accept+track+observe for spec-consistent
          design limitation.
        - wave-41 obs-2 (warning, 3-wave HOLD): symbol-grep false-positive from pre-existing
          component.
        - wave-43 obs-3 (informational, 1-wave HOLD): DESIGN-SYSTEM-collapsible panel
          collision at 1024px.
        - wave-44 obs-3 (warning, this wave): T-block transient credential error filed without
          repro verification.
      Age priority: wave-29 obs-2 and wave-30 obs-3 are the longest-standing HOLDs. First-
      to-confirm takes the slot.


  - id: obs-4
    summary: >
      B-6 /review ran 3 rounds this wave: round 1 found H1+M2, round 2 found a NEW HIGH
      after the round-1 fixes were applied (modal-stacking), round 3 was CLEAN. This is
      the expected multi-round loop behavior when a fix introduces a new defect. The
      relevant question for L-2 is whether this class — "fix applied between rounds
      introduces a regression that /review's re-review catches" — is already encoded in
      existing principles or is a new observation class.

      Prior waves:
      - wave-42 B-6: 2 rounds (REWORK phase 1; round 2 CLEAN after fix). Phase 1 was a
        contract bug; re-review found no new regression. 2-round loop, no fix-introduced
        regression caught by re-review.
      - wave-43 B-6: 2 rounds (H1+M2+M1 round 1; round 2 CLEAN). Fixes were applied; no
        new regression introduced by the fixes in round 2. 2-round loop, no fix-introduced
        regression.
      - wave-41 B-6: 1 round (2 HIGHs in a single round; fixes applied; re-verify clean).
        No separate re-review round documented.
      - wave-44 B-6: 3 rounds. The round-2 new HIGH (modal-stacking) was ONLY possible
        because the round-1 fix added the dialog contract (Esc handler) — the dialog
        contract is what creates the stacking interaction. Without the fix, the modal-
        stacking bug would not have been testable. This is the "fix-introduced regression
        caught by re-review" class.

      Assessment: the 3-round loop is not itself a new observation class — it is /review
      working correctly. The BUILD-PRINCIPLES already encode Phase-2 adversarial review
      (rule 4), and wave-42 and wave-43 both required 2-round loops without producing a
      new principle. The specific value of wave-44 is that a fix-introduced regression
      (not just a fix-independent finding from round 1) was caught at round 2. This
      confirms the value of re-reviewing after each fix, not just after the full fix set.

      Near-dup check against BUILD rule 4: rule 4 mandates "Reproduce one negative path per
      authz or injection boundary at B-6 Phase-2; a Phase-1 code-read APPROVE is not
      sufficient." Rule 4 already implies that /review is the catch-point for regressions.
      The wave-44 instance is a confirmation-by-application of the multi-round /review
      discipline: the re-review after fix 1 caught a regression that would have shipped
      if the re-review round had been skipped.

      This is NOT a new principle class. The multi-round /review discipline is confirmed
      as working and catches fix-introduced regressions. The wave-44 instance reinforces
      the value of the "re-review after each fix round, not only after all fixes" behavior,
      but this is a sub-behavior of rule 4's existing Phase-2 mandate. No new principle slot
      opened. Recording as a confirmation-by-application.
    source:
      - process/waves/wave-44/stages/B-6-review.md
        # "Round 2 (re-review): H1+M2 FIXED, but NEW HIGH — modal-stacking: editing from
        #   the narrow overlay left both dialogs mounted; the overlay's capture-phase Esc +
        #   stopPropagation closed the wrong (underneath) modal."
        # "Phase 2 /review (code-reviewer), 3 rounds"
        # "phase2_review_invocations: 3"
    severity: informational
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
      # Confirmation-by-application of rule 4's Phase-2 multi-round behavior. No new slot.
    recurrence: >
      CONFIRMATION-BY-APPLICATION of BUILD-PRINCIPLES rule 4 (adversarial reproduction at
      B-6 Phase 2). The wave-44 instance is the first documented case where the fix-
      introduced regression (modal-stacking new HIGH) was ONLY catchable after the round-1
      fix had been applied — confirming that re-reviewing after each fix round (not just
      once) is the mechanism that caught it. This adds nuance to the existing rule 4 mandate
      without opening a new principle class: the "after each fix" behavior is what the
      wave-44 result proves valuable.

      NOT a new promotion track. Recorded as a confirmation-by-application with the nuance
      that "re-review after each fix round" is the specific sub-behavior that was load-
      bearing in this wave.
    promotion_status: >
      NOT A NEW CANDIDATE. BUILD rule 4 encodes the Phase-2 adversarial review obligation.
      This wave confirms that the re-review sub-behavior (re-invoke /review after each fix
      round, not only after all fixes) is what catches fix-introduced regressions. The
      nuance could be encoded as an addition to rule 4's scope if a second confirming wave
      shows that a "single re-review after all fixes" approach would have missed a fix-
      introduced regression. Watch for: any B-6 where a second fix round's changes
      introduce a regression that a one-shot re-review would miss because the re-review
      was not done incrementally.
```

---

## Prior held observations — second-instance status check (wave-44)

| origin | obs | class | wave-44 status |
|--------|-----|-------|----------------|
| wave-43 | obs-1 | Integration specs deferred from B-block to T-4 (BUILD rule 9 PROMOTED at wave-43) | PROMOTED — rule 9 now encodes this. Closed. |
| wave-43 | obs-2 | createSession missing weekly defensive guard; service-layer defense independent of Zod controller | NOT CONFIRMED. No new service method with a controller-layer Zod guard but missing service-layer guard in the wave-44 diff (backend tasks were DTO emission + doc-only comment fix). Remains 1-wave HOLD. |
| wave-43 | obs-3 | New detail drawer at 1024px co-visible with DESIGN-SYSTEM-collapsible members panel; T-6 MAJOR | CONFIRMED-BY-RESOLUTION — the wave-44 seed IS the fix for this exact finding (T6-F1 from wave-43). The fix introduced the obs-1 class (overlay without dialog contract). Wave-43 obs-3 is resolved (the layout defect is fixed in wave-44 T-6: agenda card 311px, MAJOR closed). RESOLVED. Remains 1-wave HOLD for promotion (no new confirming instance; the resolution is not a recurrence of the layout-budget class). |
| wave-43 | obs-4 | Third failure instance of biome-ci-not-before-push; BUILD rule 7 scope edit pressure | NOT CONFIRMED (no lint failure at C-1 this wave; no new failure instance). BUILD rule 7 scope edit remains a head-builder action item. In-place edit at head-builder's discretion (karen's wave-42 ruling stands). |
| wave-42 | obs-3 | Return route resolves on submission PK; roster DTO does not expose id; B-6 REWORK | NOT CONFIRMED. No new route resolved on a DB PK absent from the shared DTO. Remains 2-wave HOLD. |
| wave-42 | obs-4 | default-false include flag on list endpoint backs writable form; resubmit silently clears educator return | NOT CONFIRMED. No new list endpoint with a nullable include flag. Remains 2-wave HOLD. |
| wave-41 | obs-1 | V-3 redeploy false-green: unparameterized serviceInstanceDeployV2 on git-connected service | NOT CONFIRMED. No V-3 fast-fix redeploy this wave. Remains 3-wave HOLD. |
| wave-41 | obs-2 | Symbol-grep false-positive: canModerateMembers in old bundle from pre-existing component | NOT CONFIRMED. No V-1/V-3 bundle verification via symbol-name grep this wave. Remains 3-wave HOLD. |
| wave-41 | obs-3 | Parallel-path enforcement gap: assertNotMuted on createMessage only; createReply unguarded | NOT CONFIRMED. No new enforcement gate added to a primary write path with unguarded sibling paths. Remains 3-wave HOLD. |

---

## Signals evaluated and dropped

**Signal: fixture-B "WRONG_CREDENTIALS" as a finding-validity class vs. a principle:**
The obs-3 above records this class. The question of whether it also warrants a separate
"prior-wave finding was wrong → don't treat as hard blocker" observation was evaluated.
This is absorbed into obs-3 (the candidate rule is the pre-filing verification obligation,
not a separate "treat prior findings skeptically" class). No standalone second obs opened.

**Signal: wave-44 B-6 multi-round /review as a new principle:**
Evaluated as signal 4 from the task brief. Recorded as obs-4 and assessed as a
confirmation-by-application of BUILD rule 4. No new principle class. Dropped as standalone
candidate.

**Signal: T-6 CLEAN (wave-44) as confirmation-by-application of wave-43 obs-3 resolution:**
T-6 this wave verified the overlay at 1024 clean (agenda card 311px; breakpoint switching
correct). This closes wave-43 obs-3 (the layout-budget collision finding is resolved). It
does not confirm the LAYOUT-BUDGET collision class — it confirms the fix. DROPPED as
standalone signal.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Responsive/layout fix introduces overlay without full WCAG dialog contract; B-6 H1 a11y; fix-introduced modal-stacking regression caught at round 2 | warning | 1st instance (fix-introduced surface; feature-authored surfaces in waves 42/43 got the contract right) | BUILD-PRINCIPLES rule 10 | HOLD — promote on 2nd confirming wave where a fix-introduced overlay ships without the dialog contract |
| obs-2 | V-2 follow-up task (c50f3040) stranded 3 waves due to wave_id≠NULL; 4th stranding instance; MEMORY entry is the mitigation; structural V-2 Action 4 ritual fix not applied | informational | 4th stranding instance (MEMORY already active) | VERIFY-PRINCIPLES / V-2 ritual doc | NOT A PRINCIPLES CANDIDATE — V-2 Action 4 ritual SQL fix is the correct target |
| obs-3 | wave-41 fixture-B WRONG_CREDENTIALS finding did not reproduce on wave-44 re-verification; filed without a second-attempt repro cross-verification; 3-wave coverage strand | warning | 1st instance | VERIFY-PRINCIPLES rule 3 (contested) | HOLD — promote on 2nd confirming wave where a T-block transient credential error is filed without repro verification |
| obs-4 | B-6 3-round /review caught fix-introduced modal-stacking regression at round 2; confirmation-by-application of rule 4's Phase-2 multi-round discipline | informational | confirmation-by-application of BUILD rule 4 | BUILD-PRINCIPLES | NOT A NEW CANDIDATE — rule 4 encodes Phase-2 adversarial review; nuance recorded |

**Observations emitted: 4 (obs-1, obs-2, obs-3, obs-4)**
**Severities: 2 warning (obs-1, obs-3), 2 informational (obs-2, obs-4)**
**Candidate files: BUILD-PRINCIPLES rule 10 (obs-1), VERIFY-PRINCIPLES rule 3 (obs-3)**
**Promotion-eligible this wave: NONE (obs-1 and obs-3 are first-instance HOLDs)**
**Dropped: obs-3/obs-4 merged into parent obs; T-6 CLEAN (resolution confirmation); multi-round /review (confirmation-by-application of rule 4)**

---

## Promotion candidate flags for karen

**No observations are promotable this wave. Two first-instance HOLDs; two informational non-candidates.**

**obs-1** (BUILD-PRINCIPLES rule 10 candidate, warning severity) is the first instance of
"layout/responsive fix introduces an overlay surface that ships without the full WCAG dialog
contract." The key distinguishing factor: waves 42 and 43 BOTH got dialog contracts right
when authoring dialog surfaces as features — the gap is specific to fix-introduced surfaces
where the fix author's scope excludes a11y. The modal-stacking sub-consequence (adding a
dialog contract to a surface that may coexist with another dialog creates a stacking
interaction) confirms that dialog-contract completeness has cascading correctness implications.
The rule is falsifiable at B-6 Phase 1 (grep diff for new overlay elements; check for
role=dialog). Watch for: any B-block diff introducing an overlay, modal, or panel as a fix
side-effect where the surface does not appear as a named dialog in D-block artifacts.

**obs-3** (VERIFY-PRINCIPLES rule 3 candidate, warning severity) is the first instance of
"T-block credential/session error filed as a hard-blocker task without a second-attempt
repro verification; finding did not reproduce on re-verification; coverage deferred for
multiple waves." The candidate rule is falsifiable at T-5 stage time (does the transcript
show a second-attempt verification in a new browser context?) and at later wave re-verification
(does the error reproduce?). Three-wave strand cost is documented. Watch for: any T-5 stage
that files a task on a WRONG_CREDENTIALS, 401, or session-state error without a cited
second-attempt repro.

**Competing VERIFY-PRINCIPLES slot-3 candidates (no change from wave-43 queue, updated ages):**
  - wave-29 obs-2 (warning, 14-wave HOLD): V-3 head-verifier pattern scan beyond named sites.
  - wave-30 obs-3 (warning, 13-wave HOLD): accept+track+observe for spec-consistent limitation.
  - wave-33 obs-2 (warning, 10-wave HOLD): error-mapping fix must fire against real upstream error.
  - wave-41 obs-2 (warning, 3-wave HOLD): symbol-grep false-positive from pre-existing component.
  - wave-43 obs-3 (informational, 1-wave HOLD): DESIGN-SYSTEM collapsible panel collision — RESOLVED
    this wave (wave-44 fix closes the layout defect; no recurrence). Status changes to CLOSED-BY-FIX
    (not promotion-eligible; the layout was fixed, not the class confirmed by a second instance).
  - wave-44 obs-3 (warning, this wave): T-block transient credential filing without repro.
  Age priority: wave-29 obs-2 and wave-30 obs-3 are the longest-standing; first-to-confirm takes
  the slot.

**Head-builder action item (carried from wave-43):**
BUILD rule 7 scope edit — three failure instances of biome-ci-not-before-push (waves 38, 42, 43)
+ no new failure this wave (no confirmation, no reversal). Karen's wave-42 ruling stands: in-place
scope edit at head-builder's discretion. This action item is carried unchanged into wave-45.

---
## L-2 promotion disposition (wave-44) — 0 promotions
No promotion-eligible candidates (all 4 observations HOLD/informational/ritual-doc):
- obs-1 (overlay-without-full-dialog-contract): 1st instance → HOLD (BUILD rule 10 candidate; waves 42/43 got it right for FEATURE dialogs, gap is fix-introduced surfaces).
- obs-2 (V-2 follow-up strand, 4th instance): the correct fix is a V-2 RITUAL DOC correction (V-2 Action 4 INSERT should set wave_id=NULL for future-seed follow-ups) — but that's brain-owned/vendored (replaced on sync), so not an L-2 principles promotion. Persistent cross-wave pressure; MEMORY is the active mitigation.
- obs-3 (unverified hard-blocker, fixture-B): 1st instance → HOLD (VERIFY rule 3 candidate).
- obs-4 (/review multi-round caught fix-introduced regression): confirms BUILD rule 4; no new rule.
karen NOT spawned (0 candidates per L-2 Action 5).
