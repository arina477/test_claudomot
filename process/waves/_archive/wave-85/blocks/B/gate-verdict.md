# B-6 Gate Verdict — wave-85 (assignment-toggle-revert)

**Block:** B (Build) · **Stage:** B-6 Review · **Head:** head-builder (fresh independent review)
**Branch:** `wave-85-assignment-toggle-revert` · **Spec task:** 3ad35a42 · **B-3 commit:** 64c3b3eb
**Verdict:** **APPROVED**

---

## Scope recap

Fix AssignmentCard optimistic toggle-revert: snapshot the prior status before the optimistic flip, restore the snapshot (not assume-opposite) on PUT error, add a VISIBLE error toast (the P-4 jenny gap — `onAnnounce` is sr-only), announce to AT exactly once, and update the EXISTING `assignments.test.tsx` (which previously asserted the buggy behavior).

## Independent verification performed (not trusted from B-3)

Ran all three commands myself:
- `pnpm --filter @studyhall/web test` → **787 passed (59 files)**. GREEN.
- `pnpm exec tsc --noEmit` (apps/web) → exit 0. GREEN.
- `pnpm biome ci apps packages` → 408 files checked, no fixes. GREEN.

**Test-honesty probe (the critical check):** I reverted `AssignmentCard.tsx` to the pre-fix parent (`64c3b3eb^` — confirmed `console.error`-only, assume-opposite `newState === 'done' ? 'todo' : 'done'`, deps `[assignment.id, onStatusChange]`, no toast, no announce) and ran the new tests against it:
- **FAIL** — "rapid double-toggle race … restores its OWN captured prior"
- **FAIL** — "shows a VISIBLE error toast and announces exactly ONCE per failure"
- **PASS** — "restores the CAPTURED prior status through the real prop-wiring" (single binary toggle)

Then restored the fix → all pass. **The specialist's "2/3 new tests fail on the old code" claim is TRUE and I reproduced it.**

---

## Findings against the five judge criteria

### 1. Snapshot-restore correctness + stale-closure — PASS
`const prev = assignment.myStatus` is captured at the top of `handleToggle`, BEFORE the optimistic `onStatusChange(id, newState)`. The catch calls `onStatusChange(assignment.id, prev)` — the real captured snapshot, not the assumed opposite. Correct.

Adding `assignment.myStatus` to the `useCallback` deps is the RIGHT stale-closure fix and does **not** break the double-toggle race. Reasoning: each `handleToggle` invocation closes over the `prev` in its own lexical scope at call time. When the optimistic flip re-renders and recreates the callback (new identity, new `prev`), the already-executing prior invocation's `await`-suspended closure retains its OWN `prev` — recreating the callback cannot mutate an in-flight closure's captured binding. The race test empirically confirms `emitted === ['done','todo','todo','done']` (toggle-1 restores its captured `'todo'`, toggle-2 restores its captured `'done'`). No mid-flight identity hazard.

### 2. The honest binary-status caveat — HONEST, and the wave still delivers real value
B-3's claim is accurate and not a cop-out. For a SINGLE binary toggle, the assume-opposite revert value equals the snapshot-restore value — which is exactly why my probe shows the single-toggle value-only test PASSES on the old code. The genuine, testable improvements are therefore: (a) the **visible error toast** — a previously ABSENT surface (old code logged to console only; sighted users got zero feedback on a failed toggle); (b) **a11y announce** via the sr-only live region; (c) **per-invocation race-safety** — where assume-opposite genuinely diverges under a concurrent double-toggle; (d) correct-by-construction code that won't regress if status ever becomes non-binary. (a) and (c) are real, user-perceivable, and independently test-covered. Real value delivered.

### 3. Visible toast + double-announce — PASS, no a11y regression
`StatusErrorToast` is a `position:fixed` visible element (bottom toast, danger border, WarningCircle icon) — visible to sighted users, closing the P-4 jenny gap. It is `aria-hidden="true"`, so AT does NOT read it; the failure reaches screen readers exactly once via `announce(...)` into AssignmentsPanel's sr-only live region. No double-read: toast is muted for AT, announce owns the AT channel. Test asserts `aria-hidden === 'true'` AND `announce` called exactly once. Auto-dismiss via 3.5s timeout with cleanup. Correct.

### 4. Test honesty (critical) — GENUINE, not coverage theater
The two distinguishing tests assert the SURFACES + the RACE, not just the revert value:
- Toast test asserts `getByTestId('status-toggle-error-toast')` is in the document + `aria-hidden` + `announce` called exactly once — all things the old console-only code could never produce.
- Race test stalls both PUTs pending, fires two clicks so toggle-2 captures the mid-flight optimistic value as ITS prior, rejects both, and asserts each catch restores its OWN captured snapshot (`['done','todo','todo','done']`) + `announce` called twice (once per failure). Assume-opposite would diverge here.
Because a value-only single-toggle assertion CANNOT distinguish under binary equivalence, the specialist correctly built the distinguishing coverage around the race + the surfaces. My probe proves both fail on old code and pass on the fix. Genuine.

### 5. Updated existing file (not duplicate) + BUILD-12 — PASS
`assignments.test.tsx` was UPDATED in place (git shows 135 lines changed in the one existing file; no new test file). The old "failed toggle" assertion was replaced by 3 tests. Both failure tests drive through a stateful `Host` component that mirrors AssignmentsPanel's real prop-wiring (`onStatusChange` sets the `myStatus` prop → card re-renders), satisfying BUILD-12 (test through the real caller, so a stale-closure `prev` would misfire and be caught). Correct.

---

## Verdict rationale

Fix is correct-by-construction, all four verification gates are GREEN under my own run, the stale-closure dep addition is sound and race-proven, the visible-toast + announce-once closes the P-4 jenny gap with no a11y regression, and the test suite genuinely distinguishes the fix from the old behavior (2/3 fail on old code, reproduced independently). The binary-status equivalence caveat is honestly stated and does not undermine the wave — the value lives in the newly-added visible error surface and the race-safety, both real and both covered.

**APPROVED.**

---

verdict_complete: true
rework_attempt_cap_remaining: 3
