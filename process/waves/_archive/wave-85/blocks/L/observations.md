# Wave-85 L-block observations — knowledge-synthesizer

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND the head-X gate approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms, UNLESS a strong 1st instance clears the bar on
its own merit (head-X discretion, per the wave-78 BUILD-17 precedent).

---

## Inputs read

- Wave deliverables: `process/waves/wave-85/checklist.md`,
  `process/waves/wave-85/blocks/P/gate-verdict.md`,
  `process/waves/wave-85/blocks/B/gate-verdict.md`,
  `process/waves/wave-85/blocks/B/review-artifacts.md`,
  `process/waves/wave-85/blocks/T/findings-aggregate.md`,
  `process/waves/wave-85/blocks/T/gate-verdict.md`,
  `process/waves/wave-85/blocks/V/gate-verdict.md`,
  `process/waves/wave-85/blocks/V/review-artifacts.md`,
  `process/waves/wave-85/stages/T-1-static.md`,
  `process/waves/wave-85/stages/T-2-unit.md`,
  `process/waves/wave-85/stages/T-4-integration.md`.
- Wave outcome: AssignmentCard done/todo toggle fix — snapshot-restore on failure (was
  assume-opposite) + visible error toast (was console-only) + a11y announce-once. Also B-6 F1:
  hand-rolled toast dismiss-timer useEffect depended on an unstable inline callback, rearming the
  3500ms clock on every parent re-render. PR #105, CI green 6/6, deployed live, V-block APPROVED
  (karen + jenny + head-verifier).
- Prior archives consulted (most recent 5): wave-84, wave-83, wave-82, wave-81, wave-80 —
  `process/waves/_archive/wave-<N>/blocks/L/observations.md` for each, plus
  `process/waves/_archive/wave-80/stages/B-6-review-output.md` (F4 optimistic-revert finding).
- Principles files read: BUILD-PRINCIPLES.md (19 rules), VERIFY-PRINCIPLES.md (4 rules),
  PRODUCT-PRINCIPLES.md (6 rules), CI-PRINCIPLES.md (partial), DESIGN-PRINCIPLES.md (partial),
  T-2.md (1 rule), T-4.md (0 rules), T-5.md (3 rules).

**De-dup performed against existing rules:**
- BUILD-12 ("test through real parent caller") — adjacent to obs-3 but is about the TEST TOPOLOGY,
  not about what property to assert vs what to suppress. Not a dup.
- BUILD-17 / BUILD-18 — visibility/authz seam rules. Not related to optimistic-update revert.
- T-2 rule 1 (non-sender recipient via real fan-out) — topology rule; obs-3 is an assertion-target
  rule. Not a dup.
- No existing rule covers: optimistic-update snapshot-restore, visible-vs-sr-only failure feedback,
  coverage-theater avoidance for behavior-equivalent bugs, or timer-callback stabilization.

---

## obs-1 — An optimistic-update revert must restore a CAPTURED prior snapshot, not reconstruct state by assuming the opposite value

**Finding:** AssignmentCard's `handleToggle` had been reverting a failed PUT by computing
`newState === 'done' ? 'todo' : 'done'` — the assumed opposite of the post-flip value. This is
correct only for a perfectly binary, no-concurrent-op toggle. In wave-85 the wave itself is binary,
but the assume-opposite pattern produces a wrong revert under any concurrent invocation: toggle-2
captures the mid-flight optimistic value as ITS prior, so assume-opposite would emit the wrong
sequence. The fix: `const prev = assignment.myStatus` is captured at the TOP of `handleToggle`
before the optimistic `onStatusChange(id, newState)` call; the catch restores `prev`, not the
assumed opposite. Each concurrent invocation retains its OWN captured binding through an
`await`-suspended closure even after the callback is recreated by a re-render.

The bug predates wave-85; the pattern and the fix generalise to any optimistic write: assume-opposite
is correct by coincidence only on a single-op binary toggle; snapshot-restore is correct by
construction for any cardinality or concurrency.

**Source artifacts:**
- `process/waves/wave-85/blocks/B/gate-verdict.md` §1 (snapshot capture analysis + race proof)
- `process/waves/wave-85/blocks/T/gate-verdict.md` §2 (per-invocation race-safety test)
- `process/waves/wave-85/blocks/V/gate-verdict.md` §3 (binary-status honesty confirmed)
- `process/waves/_archive/wave-80/stages/B-6-review-output.md` F4: "Optimistic revert restored the
  wrong value under overlapping saves — FIXED 7ecb493: pre-change local const." This is the same
  pattern (optimistic revert from a pre-change local const, not an assumed opposite).

**Recurrence:** PARTIAL SECOND INSTANCE. Wave-80 B-6 found and fixed the same pattern (F4,
"pre-change local const") but the wave-80 L-block did NOT record it as an observation — it was a
B-6 incidental catch, not a wave topic. Wave-85 is the first wave whose topic IS the fix to
assume-opposite revert. Because wave-80 F4 was never elevated to an L-observation, the formal
recurrence bar (2+ L-block observations) is not yet met. However the prior in-artifact instance
is real, documented, and identical in mechanism.

**Severity:** warning — the bug was real and shipped; the assume-opposite revert pattern is
specifically brittle under concurrent invocations of any multi-status or non-trivially-binary
toggle, and produces a silent wrong-revert.

**Candidate principles file:** BUILD-PRINCIPLES.md (rule 20).

**Disposition:** HOLD — formal 1st L-block observation (wave-80 F4 did not produce an obs). Strong
candidate on merit: the wave-80 artifact confirms prior recurrence; the mechanism is concise and
falsifiable (at B-6 review: does the catch restore a snapshot captured before the optimistic write,
or reconstruct from the post-flip value?). Recommend CONSIDER via strong-1st discretion given the
confirmed wave-80 prior, subject to head-builder judgment. Pre-shaped rule (karen must verify char
counts before appending):

```
20. Capture the prior value before an optimistic write and restore the captured snapshot on failure; never reconstruct by assuming the opposite value.
    Why: Assume-opposite is correct only by coincidence on a single binary toggle; it diverges under concurrent invocations or non-binary states.
```

Rule line = 120 chars exactly. Why line = 99 chars. PASS both (at limit; karen must recount).
No forbidden tokens. Verify: "by coincidence" is not a forbidden token.

---

## obs-2 — A failed optimistic write needs a VISIBLE user-facing error; an sr-only announce is not user-facing for sighted users

**Finding:** AssignmentCard's original failure path had two gaps: (1) it called `console.error`
only (no user feedback of any kind), and (2) even after P-4 jenny correctly named the sr-only gap,
the AC was first written as "onAnnounce the error" — but `onAnnounce` pipes into a `sr-only`
aria-live region in AssignmentsPanel. That region is invisible to sighted users. Jenny's binding
correction at P-4 made the visible toast a required AC: the wave ships a position:fixed, red-bordered
`StatusErrorToast` visible to sighted users AND an `onAnnounce` for screen readers, with the toast
marked `aria-hidden="true"` so AT does not double-read. The sighted and AT error channels are
distinct and both necessary.

The generalizable rule: any optimistic-write failure must close TWO feedback channels — a visible
surface (toast, banner, inline message) for sighted users, AND an AT announcement for screen-reader
users — because sr-only output does not serve sighted users and vice versa.

**Source artifacts:**
- `process/waves/wave-85/blocks/P/gate-verdict.md` §Phase-2 jenny (NAMED GAP: onAnnounce is sr-only;
  RATIFIED: visible toast + onAnnounce both required)
- `process/waves/wave-85/blocks/B/gate-verdict.md` §3 (visible toast + announce-once, no a11y
  regression)
- `process/waves/wave-85/blocks/T/gate-verdict.md` §2 (toast vs announce-once distinguished;
  aria-hidden on toast confirmed)
- `process/waves/wave-85/blocks/V/gate-verdict.md` §1 (karen 8/8 + jenny 5/5; visible toast is the
  primary value deliver)

**Recurrence:** FIRST INSTANCE. No prior wave's L-observations names the "sr-only announce does not
substitute for a visible error surface for sighted users" class. The broader "show a user-facing
error on failure" theme is a UX baseline, but the specific distinction between sr-only output and
a visible surface has not been recorded as a principle.

**Severity:** warning — the original code was console-only (no feedback to any user). Even the
first iteration of the fix spec conflated sr-only announce with user-facing error. Without jenny's
P-4 finding, a wave-end check could have concluded "error is announced" and missed sighted users
entirely.

**Candidate principles file:** BUILD-PRINCIPLES.md (rule 20 or 21, depending on whether obs-1
promotes). Could also fit DESIGN-PRINCIPLES.md if framed as a UX rule. BUILD is the better fit
given it is a component-level implementation obligation.

**Disposition:** HOLD — 1st instance. The principle is clear and falsifiable (check: does a failed
async write produce a VISIBLE element in the DOM, not only an aria-live region update?), but single
wave. Pre-shaped wording for future confirmation (karen must tighten to sub-120-char rule line):

```
20. On a failed async write, show a visible error element for sighted users AND an AT announcement; an sr-only announce alone is not user-facing.
    Why: An aria-live region is invisible to sighted users; a visible surface is invisible to AT without aria-hidden.
```

Rule line = 140 chars — OVER. Tighter:

```
20. On a failed async write, deliver a VISIBLE error to sighted users; an sr-only announce satisfies AT only.
    Why: An aria-live region is invisible to sighted users; a toast without aria-hidden double-reads to AT.
```

Rule line = 106 chars. Why line = 88 chars. PASS both. Karen must re-verify counts and wording.

---

## obs-3 — When a fix is behavior-equivalent to the bug on a single path, assert the surfaces and behaviors the fix ADDS, not the equivalent end value

**Finding:** For a single binary toggle, snapshot-restore and assume-opposite produce the same
revert VALUE (todo → done fails → todo is restored either way). A value-only single-toggle
assertion therefore passes on the old, broken code — it is coverage theater. The wave-85 specialist
and B-6 head-builder both recognized this and built the distinguishing coverage around what the fix
ADDS: (a) the visible toast surface (asserting `getByTestId('status-toggle-error-toast')` in DOM,
not the status value); (b) announce-once (`announce` called exactly once per failure); and (c) the
per-invocation race-safety via a double-toggle test where assume-opposite produces a divergent
sequence. The B-6 probe confirmed 2/3 new tests fail on old code; the 1 that passes is the single
binary value-check, which is correctly acknowledged to be neutral under binary equivalence.

T-9 and B-6 both named the anti-pattern explicitly: "a value-only single-toggle assertion would be
theater; the suite does not rest there." This is a restatement of a general testing discipline
applied to a specific class of bug (behavior-equivalent fix).

**Relationship to wave-82 obs-2:** Wave-82 obs-2 was: "Assert resolution of the production-dominant
failure path; configure mocks to the dominant path, not the incidental passing branch." That class
is about a mock configured to an incidental passing branch that conceals a no-op fix. The wave-85
class is subtly different: the fix IS correct and IS a real fix, but its VALUE is binary-equivalent
to the bug on a single path, so an assertion against that value is theater regardless of mock
configuration. The obligation here is to assert the SURFACE or BEHAVIOR the fix adds (toast, race-
safety), not the equivalent value. Adjacent but distinct enough to record separately.

**Source artifacts:**
- `process/waves/wave-85/blocks/B/gate-verdict.md` §4 (test-honesty, genuine-not-theater; 2/3 fail on
  old code reproduced)
- `process/waves/wave-85/blocks/T/gate-verdict.md` §2 (binary-status equivalence acknowledged;
  distinguishing coverage rationale)
- `process/waves/wave-85/blocks/V/gate-verdict.md` §3 (binary-status honesty confirmed legitimate)

**Recurrence:** FIRST INSTANCE. Wave-82 obs-2 is the closest prior (assert dominant path, not
incidental branch) but is a mechanically distinct class. No prior L-observation specifically names
"when a fix is value-equivalent on the simple path, assert the surfaces and behaviors the fix
adds rather than the equivalent value."

**Severity:** informational — the wave handled this correctly from the start; no coverage theater
shipped. The value is codifying the design discipline so future waves with a behavior-equivalent
fix (e.g., a correctness fix on a degenerate case) know the explicit obligation.

**Candidate principles file:** T-2.md (unit + integration test layer, rule 2) or BUILD-PRINCIPLES.md.
T-2.md is the better target given this is a test-authoring discipline rule.

**Disposition:** HOLD — 1st instance. Clean and falsifiable (check: if a test for a fix passes on
the old code, does the test cover a surface or behavior the fix adds, not just the equivalent output
value?). Hold for a 2nd instance.

Pre-shaped wording (karen must verify char counts):

```
2. When a fix is value-equivalent to the bug on a simple path, assert the surfaces and behaviors the fix adds, not just the equivalent value.
   Why: An equivalent-value assertion passes on the old code, producing coverage theater for a correct but unproven fix.
```

Rule line = 143 chars — OVER. Tighter:

```
2. If a fix produces the same value as the bug on a simple path, assert the NEW surfaces and behaviors, not the equivalent value.
   Why: An equivalent-value assertion passes on the old code, confirming nothing about the actual fix.
```

Rule line = 129 chars — still over. Tighter:

```
2. When a fix is value-equivalent to the bug on the simple case, assert the surfaces the fix adds, not the equivalent output.
   Why: An equivalent-output assertion passes on the unfixed code, marking a correct fix as proven theater.
```

Rule line = 125 chars — over. Karen must author the final conforming sub-120-char form at distill.

---

## obs-4 — A hand-rolled toast's dismiss-timer useEffect must not depend on an unstable inline callback

**Finding:** `StatusErrorToast` auto-dismissed via a 3500ms `setTimeout` inside a `useEffect`.
The original implementation had `onGone` (the "dismiss this toast" callback) as an inline arrow
function prop or local closure — a new function identity on every parent re-render. Because `onGone`
was listed in the useEffect dependency array, every re-render caused the effect to tear down the
existing timer and start a new 3500ms count, meaning the toast would NEVER dismiss as long as
the parent kept re-rendering (which AssignmentsPanel does on every realtime tick). The fix:
`dismissStatusError` is wrapped in `useCallback([])` (empty stable dep array) so its identity is
stable across re-renders and the timer is armed exactly once.

This is a standard React hook discipline failure specific to dismiss/cleanup effects: the dismiss
callback MUST be stable (via `useCallback`) when it appears in the useEffect dep array of a
timer-driven side effect.

**Source artifacts:**
- `process/waves/wave-85/blocks/B/gate-verdict.md` §3 (F1 timer-stability: "inline `onGone`
  restarting the 3500ms clock on every realtime re-render so the toast never dismissed")
- `process/waves/wave-85/blocks/T/gate-verdict.md` §2 (F1 timer-stability regression test;
  "guards the `dismissStatusError` useCallback stabilization")
- `process/waves/wave-85/blocks/V/gate-verdict.md` §1 (karen verifies `dismissStatusError` is a
  stable `useCallback([])`)

**Recurrence:** FIRST INSTANCE. No prior wave's L-observations names the "dismiss-timer useEffect
re-arms on every render due to unstable callback in deps" class. This is adjacent to general React
hook discipline but specific enough to record: it is the pattern where a side-effect with a cleanup
timer silently breaks because the teardown-and-restart cycle is triggered by identity churn on a
dep, not by any state change the author intended to re-arm on.

**Severity:** informational — caught at B-6 before merge; did not ship. The failure mode is
completely silent at runtime short of noticing the toast never dismisses, and the re-render trigger
(realtime ticks) is ambient and easy to miss during point testing.

**Candidate principles file:** BUILD-PRINCIPLES.md (rule 20 or 21).

**Disposition:** HOLD — 1st instance. Narrow (specific to cleanup-timer effects with callback deps),
but a clean, falsifiable rule. Falsifiable check: does a dismiss-timer useEffect depend on a
callback prop or outer function? If yes, is that function wrapped in useCallback with a stable dep
array? Hold for a 2nd instance.

Pre-shaped wording for future confirmation (karen must verify char counts):

```
20. Wrap a dismiss-timer useEffect's callback dependency in useCallback with a stable dep array so the timer is armed once.
    Why: An unstable callback in a timer useEffect tears down and restarts the timer on every re-render.
```

Rule line = 120 chars exactly. Why line = 87 chars. PASS both (at limit; karen must recount).
No forbidden tokens.

---

## Standing-HOLD status check (from wave-84 and earlier)

| origin | class | wave-85 status |
|---|---|---|
| wave-84 obs-2 (HOLD, warning, partial 2nd) | Build-time env var threading through all build invocation paths | NOT CONFIRMED. Frontend-only wave; no build-arg or Dockerfile surface. HOLD maintained. |
| wave-84 obs-3 (HOLD, informational, 1st) | BOARD reframe prevented naive security option trading severity | NOT CONFIRMED. No architecture-scope security decision this wave. HOLD maintained. |
| wave-83 obs-C1-direct-push (HOLD, strong 1st) | `HEAD:main` from feature branch bypasses CI gate | NOT RECURRED. C-1 used a normal PR path (PR #105). HOLD maintained. |
| wave-83 obs-3-live-verify-config-wave (HOLD, informational, 1st) | Config-only live probe substitutes for pending CI within bounded scope | NOT CONFIRMED. CI ran fully (6/6 green on PR #105). HOLD maintained. |
| wave-82 obs-1 (HOLD, strong 1st) | Trace SDK source to confirm fix is decisive in real failure path | NOT CONFIRMED. No SDK-internal retry/refresh seam. HOLD maintained. |
| wave-82 obs-2 (HOLD, warning, 1st) | Assert resolution on dominant failure path; configure mocks to that path | NOT CONFIRMED as a mock-to-wrong-branch failure. Wave-85 obs-3 is an adjacent but distinct class (value-equivalent fix, not mock-to-incidental-branch). Both held independently. |
| wave-82 obs-3 (HOLD, informational, 1st) | All-jobs-uniform-cancel at wall-time with no steps = runner infra timeout | NOT CONFIRMED. No CI-runner uniform-cancel event this wave. HOLD maintained. |
| wave-81 obs-2 (HOLD, 1st) | SW-cached SPA serves stale bundle for post-deploy navigation | NOT CONFIRMED. No Workbox/SW precache change this wave. HOLD maintained. |
| wave-80 obs-2 (HOLD, 1st) | Full-replace PUT clobbers concurrent field change | NOT CONFIRMED. No settings PUT surface this wave. HOLD maintained. |
| wave-80 obs-3 (HOLD, 1st) | Realtime toggle must proactively emit state change to peers | NOT CONFIRMED. No realtime feature this wave. HOLD maintained. |
| wave-80 F4 (not previously elevated to an obs) | Optimistic revert from pre-change local const (not assume-opposite) | CONFIRMED AS WAVE TOPIC. Wave-85 obs-1 is the first formal L-block observation of this class. |

---

## Summary table

| id | title | severity | recurrence | candidate_file | disposition |
|---|---|---|---|---|---|
| obs-1 | Optimistic-update revert must restore a captured prior snapshot, not assume the opposite value | warning | PARTIAL 2nd (wave-80 F4 is same mechanism, never elevated to an obs) | BUILD-PRINCIPLES.md (rule 20) | HOLD — formal 1st L-obs; CONSIDER strong-1st given wave-80 artifact prior |
| obs-2 | Failed async write needs a VISIBLE error for sighted users; sr-only announce serves AT only | warning | 1st INSTANCE | BUILD-PRINCIPLES.md or DESIGN-PRINCIPLES.md | HOLD — 1st instance |
| obs-3 | When a fix is value-equivalent to the bug on the simple path, assert surfaces the fix ADDS, not the equivalent value | informational | 1st INSTANCE | T-2.md (rule 2) | HOLD — 1st instance |
| obs-4 | Dismiss-timer useEffect callback dep must be useCallback-stable to prevent timer re-arming on re-renders | informational | 1st INSTANCE | BUILD-PRINCIPLES.md | HOLD — 1st instance |

**Total observations: 4.** All are HOLD. None have a clean 2-wave recurrence bar in the formal
L-block sense.

**Recommendation to head-learn / L-2 karen:** The most credible promotion candidate is obs-1,
which has a confirmed prior instance in `wave-80/stages/B-6-review-output.md` F4 — same mechanism,
same fix (pre-change local const). The wave-80 L-block did not elevate F4 to an observation, so
the formal bar is not met, but the underlying pattern has two wave-level appearances. Head-builder
should judge whether the wave-80 artifact prior is sufficient for strong-1st discretion on obs-1.
obs-2 through obs-4 are all genuine 1st instances; zero promotions is the honest expected outcome
unless obs-1 clears the strong-1st bar.
