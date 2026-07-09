# Wave 89 — V-3 Gate Verdict (head-verifier, Phase-1)

**Block:** V (Verify) · **Stage:** V-3 (block exit) · **Attempt:** 1
**Wave topic:** enable academic Save on client error + scroll/focus first errored academic field (a11y)
**Target:** deployed merge `b27277db` (web `https://web-production-bce1a8.up.railway.app`, 200; deployment `cf2cf979`)
**Reviewers:** karen APPROVE · jenny APPROVE (major spec-gap) · V-2 triage: 0 blocking

## RULING: (A) APPROVED — accept the wave; do NOT revert. Record the no-op-in-practice as a non-blocking spec-gap + strong re-plan signal + L-2 lesson.

---

## Central adjudication (jenny asked head-verifier to reconcile the P-0 "gap LIVE" claim vs the reachability finding)

**I verified jenny's no-op-in-practice claim myself against the merge commit — it is FACTUALLY CORRECT.**

Evidence (all at `b27277db`, independent Read/git of source — not paraphrased from jenny):

1. **Client validator caps** (`ProfilePage.tsx:55-61`): `ACADEMIC_MAX = { pronouns:40, bio:500, institution:120, program:120, academicYear:40 }`. The over-length branch fires only on `field.length > ACADEMIC_MAX.<field>` (`:347-370`).
2. **Native `maxLength` on all 5 fields** (`:900,931,967,999,1063`): each is `maxLength={ACADEMIC_MAX.<field>}` — the SAME numeric cap. The browser blocks keyboard entry + paste beyond the cap, so `.length` cannot exceed the cap via UI input.
3. **These `maxLength` lines are PRE-EXISTING** — in `git show b27277db -- ProfilePage.tsx` all 5 are context lines (space-prefixed); **0 are additions (`+`)**. They were not introduced (nor removed) by this wave. The wave changed the button-disable + added scroll/focus/aria; it did not touch the layer that actually blocks the state.
4. **Server Zod `.max()` mirror** (`packages/shared/src/profile.ts:35-43`): `pronouns.max(40)`, `bio.max(500)`, `institution/program.max(120)`, `academicYear.max(40)` — identical caps. No persisted (hence load-time) value can exceed the cap either.
5. **Tests reach the branch only via `fireEvent.change`** (`profile-academic.test.tsx:152` comment: "fireEvent.change bypasses the maxLength attribute in jsdom"; `:162` "dead-code-in-practice, reachable only via fireEvent.submit"). jsdom does not enforce `maxLength`; a real browser does.

**Conclusion:** `academicClientError` can NEVER become truthy through real user input (type / paste / server-load) in the deployed app. The shipped focus-management code is CORRECT and HARMLESS but defends a state real users cannot enter. This is a **spec-GAP against the wave's stated JOB** (fix a live off-screen-error hole), NOT a spec-DRIFT against the ACs (the code faithfully implements every AC). The P-0 "gap LIVE / verified" check confirmed the handler LACKED scroll/focus — it did NOT verify the error state is ENTERABLE.

## Why APPROVED and not REVERT (weighing B)

The code is **correct, harmless, and shipped**:
- Error path `return`s BEFORE `setAcademicSaving(true)` and `api.patchProfile(payload)` (`:376-385` → `:388,407`) — no invalid PATCH is ever sent; guarded independently by tests 5 (`patchProfile).not.toHaveBeenCalled` L178) and 6 (L209).
- Valid save is unaffected (`academicInvalidFieldKey` null → block skipped; test 7 asserts no `scrollIntoView` on valid save).
- Button-enable (`disabled={academicSaving}` only, `:1081`) is the correct realization of "on failed submit, jump to the problem" — a permanently-disabled button with an off-screen error is worse UX. Does not contradict any `product-decisions.md` entry; username-form asymmetry is AC5-sanctioned.
- `aria-invalid` is correct a11y even though it never triggers in practice: it's a latent-correct binding, zero cost, no regression. It has value the day the maxLength layer is ever intentionally relaxed (the natural home for that is the re-plan below).

Reverting correct + harmless + shipped code = **churn for zero benefit** and re-introduces the B-6 dead-control failure mode (permanently-disabled button) the wave fixed. REVERT rejected.

## Why APPROVED and not ESCALATE-as-blocker (weighing C)

The **narrow V-block question** — "is this wave ship-safe; accept or rework the code?" — has a clean, non-ambiguous answer: ship-safe, accept. That does not require the founder. The **strategic question** — "the seed was low-value + no-op, and combined with the backlog drain the real need is roadmap-replanning" — is real and important, but it is a **forward planning call, not a V-3 gate blocker**. Blocking a correct wave's gate on a seed-quality/roadmap concern would conflate two different decisions. So: APPROVE the gate, and route the strategic signal to its proper home (founder re-plan / N-block trigger) as a **strong non-blocking escalation signal**, recorded below and in the L-2 lesson. This is the honest split — the *code* is approved; the *seed-quality pattern* is escalated as signal.

## Confirming the upstream verdicts (probe of clean reviews on a non-trivial change)

- **karen APPROVE — SOUND.** Her 6 load-bearing claims are source-accurate (I re-checked lines 55-61, 347-372, 376-385, 900-1063, 1081). Her scope was claim-vs-codebase truth (button reachable, patchProfile guarded, deploy = merge commit, required checks green) — all true. The reachability-of-the-error-STATE question was outside her claim-verification lane; jenny owned it. No false-negative: the "clean" verdict is backed by evidence, and the one thing it did not assess (state enterability) was caught by the parallel reviewer. Independent review happened; author was not sole reviewer.
- **jenny APPROVE (spec-gap) — SOUND and independently reproduced above.** She correctly classified it GAP-not-DRIFT and correctly declined to make it a V-3 fast-fix (closing it is a scope question).
- **V-2 triage (0 blocking) — CORRECT.** No code defect, no drift, no regression, valid save works, aria-invalid is correct a11y. Fast-fix queue legitimately EMPTY. The e2e-red finding is genuinely pre-existing/non-required/tracked (5cc59349) — noise, correctly bucketed.

## Fast-fix loop

Iteration bound: 3. Iterations used: **0** (queue empty — nothing to fix; the wave is correct). No finding closed by weakening a test/assertion. No regression risk (no code changed at V-3).

## Non-blocking outputs (recorded, do NOT block the gate)

1. **Strong re-plan signal (escalate to founder / N-block trigger):** this is the third-in-a-row seed that describes a state that doesn't occur in practice — even the "genuine live bug" no-ops. Combined with the backlog-drain signal already flagged at P-0, the real need is roadmap-replanning, not more seeds off the current queue. Route to the founder as a plain-language scope call at N/re-plan, not as a V-block blocker.
2. **L-2 candidate lesson:** At P-0, verify a bug's TRIGGER / error-state is REACHABLE by a real user (type / paste / server-load), not merely that the code-path exists. problem-framer verified the handler lacked focus; it did not verify `academicClientError` is enterable past the native `maxLength` + server `.max()` guards. (Format-check against PRINCIPLES contract deferred to L-2 head-learn; recorded here as a candidate, not auto-promoted.)

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: V-3
  reviewers: { karen: APPROVE, jenny: APPROVE }
  failed_checks: []
  ruling: A
  rationale: >
    jenny's no-op-in-practice finding independently verified against merge b27277db:
    all 5 academic maxLength attrs equal the validator caps AND server Zod .max(),
    and are pre-existing (0 diff additions), so academicClientError is unreachable via
    real user input — the tests hit it only through fireEvent.change (jsdom bypasses
    maxLength). The shipped code is CORRECT and HARMLESS: error path returns before
    patchProfile, valid save unaffected, button-enable + aria-invalid are sound. This
    is a spec-GAP in the P-0 seed premise (verified the handler, not the state's
    enterability), NOT a code defect or drift. Reverting correct+harmless+shipped code
    is churn for zero benefit and re-introduces the dead-control failure mode; the
    strategic seed-quality/re-plan concern is a forward planning call, not a V-3 gate
    blocker. APPROVE the gate; escalate the re-plan signal + L-2 lesson non-blocking.
  fast_fix_iterations: 0
  fast_fix_bound: 3
  findings_blocking: []
  findings_non_blocking:
    - {source: jenny, severity: medium, item: "no-op-in-practice: native maxLength + server .max() make academicClientError unreachable; correct+harmless spec-gap in seed premise, do-not-revert, strong re-plan signal"}
    - {source: karen, severity: low, item: "e2e red on pre-existing unrelated flakes (non-required, tracked 5cc59349)"}
  escalation_signal_nonblocking: "3rd consecutive no-op seed + backlog drain -> route roadmap-replan to founder at N/re-plan (NOT a gate blocker)"
  l2_candidate_lesson: "At P-0, verify a bug's trigger/error-state is REACHABLE by real user input, not just that the code-path exists."
  next_action: PROCEED_TO_L1
```
