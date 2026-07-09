# Wave 89 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn)
**Reviewed against:** process/waves/wave-89/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
REWORK

## Rationale

The build is clean, minimal, and correctly DRY — but it defends a path the user
cannot reach, so it does not deliver the spec's stated core value. I verified the
central reachability finding directly against source, not from B-3's summary:

- The academic form (`ProfilePage.tsx:877`, `<form onSubmit={handleAcademicSave}>`)
  contains exactly one submit control: the button at :1079-1087, which is
  `disabled={academicSaving || !!academicClientError}` (:1081). There is no other
  `type="submit"` element in the form.
- Per HTML implicit-submission semantics, when a form's default (first) submit
  button is **disabled**, pressing Enter in a text `<input>` does **not** submit.
  `bio` is a `<textarea>` where Enter is a newline. So while `academicClientError`
  is truthy — which is *exactly and only* when the new branch has anything to do —
  the button is un-clickable AND implicit submission is suppressed.
- Consequently the new `if (academicInvalidFieldKey) { scrollIntoView + focus; return; }`
  branch in `handleAcademicSave` (:376-386) is unreachable via real user
  interaction. It fires only under `fireEvent.submit(form)`, which is precisely how
  the two error-path tests reach it — the test even comments "the save button is
  disabled... so submit the form directly." The core deliverable ("scroll+focus to
  pull the off-screen errored field into view on a failed save") is defending
  dead-code-in-practice.

Being intellectually honest per the adjudication ask: this is ruling (B), REWORK —
not (A) APPROVED. The spec's headline AC ("on failed submit, take the user to the
first invalid field instead of the silent early-return") is aimed at a submit event
that the page's own disable-logic guarantees never occurs. The "silent early-return"
the reframe set out to fix is not actually reachable either — the user is stopped one
step earlier by the disabled button, and the P-0 reframe's own live-gap check
("no save handler calls scrollIntoView/.focus()") confirmed the *absence* of the
behavior but never checked whether the submit that would invoke it is reachable. That
is the framing miss.

Two things I explicitly credit and want preserved through rework:
1. **The `aria-invalid` bindings ARE live and valuable.** They are bound to
   `academicInvalidFieldKey === '<key>'` (:899/:930/:966/:998/:1062), derived
   reactively from field state every render, independent of any submit. As a field
   crosses its max, `aria-invalid=true` is announced to SR users live. Genuine a11y
   value that ships regardless of the submit branch. Keep it.
2. **The DRY derivation is correct.** `academicInvalid` is the single
   priority-ordered source; `academicClientError` (:371) and `academicInvalidFieldKey`
   (:372) both project from it — message and key cannot diverge. No contract drift,
   no over-abstraction, scope is minimal, tests are real tripwires (they assert
   focus, aria-invalid, first-in-priority-order, preserved role="alert", and
   no-PATCH-on-error — not coverage theater). If reachability were not the issue this
   would be a clean APPROVED.

The real, reachable user gap the spec was trying to serve still exists but is
mis-located: a user with an off-screen over-length field sees the Save button
disabled with **no discoverable reason** — the `role="alert"` message and the
disabled button can both be scrolled out of view. The fix belongs on the
error-*appearance* path (when `academicInvalid` becomes truthy), not on the
submit-*attempt* path (which can't happen). That is a genuine reframe, so this goes
back to B-3, not a rubber-stamp forward.

## Rework instructions

### Stages requiring rework
- B-3: relocate the scroll+focus trigger from the unreachable submit path to the
  reachable error-onset path; preserve the live aria-invalid work as-is.

### Per stage

#### B-3
- **What's wrong:** The scroll+focus logic lives inside `handleAcademicSave`
  (:376-386), gated behind a form submit. The academic submit button is
  `disabled={academicSaving || !!academicClientError}` (:1081) and is the form's
  only submit control, so implicit (Enter) submission is suppressed and explicit
  (click) submission is blocked whenever `academicClientError` is truthy. The branch
  is therefore unreachable by any user; it only executes under the test's
  `fireEvent.submit(form)`. The spec's core AC ("on failed submit… take the user to
  the first invalid field") targets an event that cannot occur.
- **Heuristic fired:** Dead-path-in-practice — the guarded branch's precondition
  (`academicInvalidFieldKey` truthy) is mutually exclusive with the branch being
  reachable (submit requires `!academicClientError`). The behavior is provable only
  by bypassing the same guard (`fireEvent.submit`) that the UI enforces, i.e. the
  test manufactures reachability the product denies.
- **What "good" looks like:** The first over-length academic field is scrolled into
  view + focused + marked `aria-invalid` **at the moment the error becomes
  discoverable to a real user** — i.e. when `academicInvalid` transitions from null
  to a value (a keystroke pushes a field over its max), NOT on a submit that the
  disabled button forbids. Concretely, one of:
  - **(preferred, smallest)** Drive scroll+focus from an effect keyed on
    `academicInvalidFieldKey` becoming newly truthy:
    `useEffect(() => { if (academicInvalidFieldKey) { const ref =
    academicFieldRefs.current[academicInvalidFieldKey]; ref?.scrollIntoView({block:'center'});
    /* do NOT steal focus mid-typing — see below */ } }, [academicInvalidFieldKey])`.
    Focus-stealing while the user is actively typing in the field that just went
    over-length is user-hostile (the field is already focused anyway on the
    single-field case), so on the error-onset path SCROLL the alert/field into view
    and rely on the live `aria-invalid` + `role="alert"` for announcement; reserve
    `.focus()` for the genuinely-off-screen multi-field case only if it doesn't
    interrupt the caret. react-specialist to choose the least-surprising interaction.
  - **(alternative, if the team prefers keeping a submit affordance)** Keep the Save
    button ENABLED when only a client-validation error is present (drop
    `|| !!academicClientError` from :1081, keep `academicSaving`), and let
    `handleAcademicSave`'s existing early-return + scroll+focus do its job — this
    makes the *original* spec path genuinely reachable. This changes the disable
    contract, so it needs a one-line product note (a disabled-with-no-reason button
    is itself the UX bug the wave is chasing) and the tests must drop the
    `fireEvent.submit` workaround in favor of a real button click.
  - Either way, the valid-submit path must stay untouched (no scroll/focus on a
    clean save) and the `role="alert"` message must remain.
- **Re-do instructions:**
  1. Route to **react-specialist** (per command-center/AGENTS.md) with this verdict.
     Do NOT fix from the orchestrator (Iron Law).
  2. Pick the interaction model (effect-on-error-onset preferred; enable-button
     alternative acceptable if the product note is added). If choosing the
     enable-button path, flag it to head-product / the active mode's decision route
     since it alters a shipped disable contract.
  3. Keep the live `aria-invalid` bindings and the DRY `academicInvalid` derivation
     exactly as built — they are correct and are the surviving real value.
  4. Rewrite the two error-path tests to exercise the *reachable* trigger (a
     keystroke that crosses the max, asserting scroll + live aria-invalid + preserved
     alert), removing the `fireEvent.submit(form)` bypass. The valid-save test stays.
  5. Re-run B-4 (repo typecheck) and B-5 (full verify) before re-entering B-6.

### Cascade

| Trigger stage | Stages that must re-run downstream |
|---|---|
| B-3 frontend | B-4 (route registration / typecheck), B-5 (re-verify) |

- **Stages that must re-run after the above:** B-4, B-5, then B-6 Action 0 (fresh
  head-builder, attempt 2).
- **Stages that stay untouched:** B-0, B-1 (SKIP — no contract), B-2 (SKIP —
  frontend-only).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

# Wave 89 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn)
**Reviewed against:** process/waves/wave-89/blocks/B/review-artifacts.md + source (`ProfilePage.tsx`, `profile-academic.test.tsx`)
**Attempt:** 2  (post-rework)

## Verdict
APPROVED

## Rationale

The single reachability defect that drove the attempt-1 REWORK is fixed, and the
fix is sound rather than cosmetic. I re-verified every claim against source, not
against the B-3 summary, and independently re-ran the suite + typecheck.

**1. The path is now genuinely user-reachable.** The academic Save button is
`disabled={academicSaving}` (ProfilePage.tsx:1081) — the `|| !!academicClientError`
term that previously suppressed both click and implicit-Enter submission is gone. A
user whose field is over its max now sees an *enabled* button; clicking it fires
`handleAcademicSave`, which hits `if (academicInvalidFieldKey) { ref.scrollIntoView({
block: 'center' }); ref.focus(); return; }` (:376-385). The branch the attempt-1
verdict called dead-code-in-practice now executes on real user interaction. This is
the crux of the rework and it holds.

**2. The tests exercise the CLICK path and guard against regression.** All three new
tests submit via `fireEvent.click(saveBtn)` — the `fireEvent.submit(form)` bypass the
attempt-1 verdict flagged is gone. Both error-path tests assert
`expect(saveBtn).not.toBeDisabled()` *before* clicking (test lines ~160 and ~215),
which is exactly the tripwire that would have failed attempt 1: if a future change
re-disables the button on a client error, these tests break, surfacing the
unreachability instead of hiding it behind a synthetic submit. The multi-field test
still proves priority order (pronouns before bio; bio asserted `aria-invalid=false`),
and the valid-save test asserts `scrollIntoView` was NOT called on the happy path.
Real tripwires, not coverage theater.

**3. The credited work from attempt 1 is preserved intact.** The live `aria-invalid`
bindings on all five fields (:899/:930/:966/:998/:1062, bound to
`academicInvalidFieldKey === '<key>'`) are unchanged. The `role="alert"` over-length
message (:1073-1077) is unchanged. The DRY `academicInvalid` single-source derivation
(:347-370) with `academicClientError` and `academicInvalidFieldKey` both projecting
from it (:371-372) is unchanged — message and key still cannot diverge. No contract
drift, no over-abstraction introduced by the rework.

**4. Enabling the button is a sound product choice, not a regression.** This is the
"enable-button alternative" the attempt-1 verdict itself sanctioned. The client-side
over-length guard still prevents the actual PATCH — the early `return` fires before
any network call, and the tests confirm `patchProfile` is never called on the error
path. So the button's contract changes from "disabled, silently un-actionable" to
"click → jump to the problem," which is strictly better UX: it converts a
disabled-with-no-discoverable-reason button (the exact anti-pattern the wave set out
to fix) into an actionable affordance. The save is still guarded; only the *feedback*
path opened up. No new door, no bypass of validation.

**5. Blast radius is contained.** `git diff --stat main...` shows the only production
file touched is `ProfilePage.tsx`, and every hunk sits inside the academic form. The
handle/display-name form, the account form, and all other surfaces are untouched.

**Independent verification I ran this turn (not inherited from B-5):**
- `pnpm --filter web exec vitest run src/pages/profile-academic.test.tsx` → **8/8 passed**.
- `pnpm --filter web run typecheck` (`tsc --noEmit`) → **clean, no diagnostics**.

The wave now delivers its stated user-facing value: a user with an off-screen
over-length academic field, on a failed save attempt, is scrolled to and focused on
the first invalid field with a live `aria-invalid` + `role="alert"` announcement,
instead of hitting a silent early-return or a dead-end disabled button. Every B-6
stage-exit checkbox is tickable from concrete artifacts: reviewed by an agent other
than the author (this gate + prior specialist routing), no over-engineering for MVP
scope (minimal ref map + one derivation), and the one reachability failure was
root-cause classified and routed to react-specialist at attempt 1 rather than
patched from the orchestrator. No open failed checks.

## Handoff
- APPROVED → C-block (head-ci-cd) for PR authoring + CI.
- No BUILD-PRINCIPLES promotion warranted: the reachability lesson (a guarded
  submit-handler branch is dead-in-practice when the form's sole submit control is
  disabled on the same condition that arms the branch) is real but narrow; it is
  captured here in the audit trail and does not meet the recurring-across-waves bar
  for a principles-file rule. L-2 distill may reconsider.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 1
- head_signoff:
    verdict: APPROVED
    stage: B-6
    reviewers: { reachability: source-verified, tests: re-run-8/8, typecheck: clean }
    failed_checks: []
    rationale: Reachability defect fixed (button enabled on client error); click-path tests with not-disabled tripwire; aria-invalid/role=alert/DRY derivation preserved; enable-button is a sound UX choice with the PATCH still guarded; blast radius contained to the academic form. 8/8 tests + typecheck independently green.
    next_action: PROCEED_TO_C
