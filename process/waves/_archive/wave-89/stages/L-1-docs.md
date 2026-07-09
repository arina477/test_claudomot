# Wave 89 — L-1 Docs

Owned by head-learn (L-block gate). Wave-89 enabled the academic-identity Save button
(was disabled while editing) and, on a failed academic-save, added scroll + `.focus()` to the
first errored field plus `aria-invalid`. Live at web `b27277db` (PR #110). V-1 jenny + V-3
head-verifier ruled it ship-safe / do-not-revert but **no-op-in-practice**: native `maxLength`
on the academic fields equals the validator cap (and server Zod `.max()` mirrors it), so
`academicClientError` can never fire via real user input — the fix is correct + harmless but
defends an unreachable state.

## Action 1 — CHANGELOG entry — DONE (honest, terse)

**Decision: write ONE line, framed on the button-enable + focus/a11y, NOT as a bug fix.**

Rationale: the seed's target error state is unreachable via real user input (jenny/head-verifier),
so a "Fixed" entry claiming the errored-field-scroll bug is resolved would over-claim a fix for a
bug no user can hit. But the change is not fully invisible: the academic-identity **Save button
now stays active while you edit** (previously disabled on client-error, which is itself the state
users can't enter — but the enable is a real, honest, user-perceivable behavior change), and each
field carries `aria-invalid` wiring + focus-on-error should the app ever surface one. That is a
genuine, honestly-describable delta. Recorded as a **Changed** entry (existing feature modified),
plain-language per rule 16, no over-claim, cited `(#110)`.

- File: `CHANGELOG.md` — appended under `## [Unreleased]` → `### Changed`, immediately after the
  `(#109)` DM-senderKeyRef line (last line of the Changed block before `### Fixed`).
- Entry text: "Saving your academic identity on the profile page is a little smoother: the Save
  button stays active while you edit, and if the app ever needs to flag a field it now moves focus
  straight to it so it's never left off-screen. No change to a normal save. (#110)"
- The "if the app ever needs to flag a field" hedge is deliberate — it does not assert users
  currently hit that path (they can't), keeping the note honest about the no-op-in-practice reality.

## Action 2 — Milestone delta — SKIPPED (with reason)

Seed task `45f0a88d-90dd-47b1-a827-e6cf8bbf606e` has `milestone_id = NULL` (confirmed in DB:
`status='done'`, `milestone_id` NULL, `wave_id=6d995b9d…`). The wave's single claimed task came
off the unassigned queue with no milestone assignment (roadmap terminal since wave-80; bug-fix /
polish phase, roadmap-planning founder-deferred). No milestone progressed → Action 2 skips per
stage file § "Skip when no milestone progressed." No `milestones` row UPDATE.

## Action 3 — README touchups — SKIPPED (with reason)

Nothing user-facing changed in a way that affects install / CLI / env / quick-start. The change is
a profile-page a11y/button-state polish on an already-documented page (no new command, flag, env
var, install step, or breaking change). README touchups skip per stage file § "Skip when nothing
user-facing changed." CHANGELOG carries the note.

## Action 4 — Commit

FS-side touchup (CHANGELOG + this deliverable + L-2 deliverable + observations) committed as part
of the L-block closeout. Milestone progression had no DB write (skipped). Direct doc commit to the
working branch per project convention. **Not committed by this step per invocation directive; the
orchestrator batches the L-block commit.**

## Deliverable footer

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:128 (Changed entry, #110)"
  - "milestone delta: SKIPPED — seed task milestone_id NULL (DB-confirmed)"
  - "README: SKIPPED — nothing user-facing in install/CLI/env/quick-start scope"
changelog_entry_added: true
roadmap_milestones_progressed: []
roadmap_skip_reason: "seed task 45f0a88d milestone_id IS NULL (unassigned queue; roadmap terminal, bug-fix phase)"
readme_sections_touched: []
note: >
  CHANGELOG framed honestly on the Save-button-enable + focus/aria a11y, NOT as a fix for the
  errored-field bug — that error state is unreachable via real input (native maxLength == validator
  cap), per V-1 jenny + V-3 head-verifier (no-op-in-practice, ship-safe, do-not-revert). No
  over-claim. The strategic no-op-seed / roadmap-replan signal is a founder/N-block concern
  (already surfaced at V-3 + P-0 digest), not an L-1 doc delta.
```

## head-learn L-1 sign-off

```yaml
head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    CHANGELOG entry appended, honest and terse, plain-language, cited (#110), framed on the real
    user-perceivable delta (Save-button-enable + a11y) rather than over-claiming a fix for the
    unreachable errored-field state. Milestone delta correctly skipped (milestone_id NULL,
    DB-confirmed) with reason recorded. README correctly skipped (no install/CLI/env/user-facing
    surface changed) with reason recorded. Every L-1 exit checkbox ticked.
  next_action: PROCEED_TO_N (after L-2 exit; L-1 ∥ L-2)
```

l_stage_verdict: COMPLETE
