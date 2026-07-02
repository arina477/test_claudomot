# L-2 — Distill (wave-37: persistent in-app notifications)

**Owner:** head-learn (L-block gate) · **Mode:** automatic · **Distill verdict: PROMOTE ZERO**

## Action 1-2 — Mark claimed tasks done + verify

`claimed_task_ids` (from the spec-contract bundle): `0b33df33`, `f3f52d9a`, `edac03e0`.

```sql
UPDATE tasks SET status='done'
WHERE id = ANY('{0b33df33-...,f3f52d9a-...,edac03e0-...}'::uuid[])
  AND status IN ('todo','in_progress','blocked') RETURNING id, status;
-- UPDATE 3 — all three flipped in_progress → done
```

Verification SELECT confirms all three report `status='done'`. No skips, no stale ids.

## Action 3 — Observations (knowledge-synthesizer)

3 observations emitted to `process/waves/wave-37/blocks/L/observations.md`. Input: wave-37 artifacts + prior `min(5,N-1)` waves' observations (archive scan across wave-4..36) + BUILD-/CI-PRINCIPLES + T-layer principles.

| id | title | severity | candidate file | disposition |
|---|---|---|---|---|
| obs-1 | Worker-restart FS-loss; B-block recovered from origin/feature-branch | informational | BUILD-PRINCIPLES (rule 2) | **CONFIRM-EXISTING** — no new rule |
| obs-2 | Frontend↔backend HTTP verb mismatch shipped past service-level tests (B-6 HIGH-1) | strong | CI-PRINCIPLES / T-2 | **HOLD** (first instance) |
| obs-3 | Hook bootstraps list once + only increments count → stale list (B-6 HIGH-2) | warning | BUILD-PRINCIPLES / frontend | **HOLD** (first instance) |

## Action 4 — Filter to promotion candidates

Candidates must be generalizable AND falsifiable AND cited. Applying the strict recurrence bar (BUILD/CI "Authoring discipline": wave-specific holds until a 2nd wave confirms):

- **obs-1 → NOT a candidate.** The recovery *succeeded because BUILD rule 2 was followed* (B-block pushed to `origin/wave-37-notifications` after each stage). The only loss was P-block process transcripts (unpushed), which do not block wave completion. This is the 5th+ documented instance of the same FS-loss mechanism, and every prior L-2 held it informational once rule 2 existed. It confirms rule 2; it does not reveal a gap. The prompt's open question ("does this warrant a sharper CI/ops rule?") resolves **NO** — the existing rule is the correct control and it held. No falsifiable *new* rule exists that rule 2 doesn't already cover.
- **obs-2 → candidate shape recorded, but HOLD.** First recorded instance of an HTTP-verb-contract gap across all archives (grep confirmed no prior match). Real cost (a 404 reached the branch). Genuinely generalizable + falsifiable ("assert HTTP verb+path metadata on each new controller route"). But the bar requires **recurring** — one-off. The fix (controller.spec route-metadata assertion, commit 43f02cf) is already in the codebase and in CI, so the lesson is operationally captured. Candidate shape preserved verbatim in observations.md for a future L-2 to promote on recurrence.
- **obs-3 → HOLD.** First instance, frontend-specific. Same first-instance hold.

## Action 5 — karen vetting

**SKIPPED.** Zero candidates cleared the recurrence bar → no rule to vet against a Contract. (Per L-2 Action 5: 0 candidates → skip karen and Action 6.)

## Action 6 — Promotion

**NONE.** Promote ZERO this wave across all `*-PRINCIPLES.md` files. Restraint applied honestly: most waves promote nothing, and no candidate here is simultaneously new, recurring, costly-if-ignored, binary, and Contract-fitting. obs-2/obs-3 fail the *recurring* test (first instance); obs-1 fails the *new* test (rule 2 already governs it).

## Action 7 — Pipeline state

Observations recorded for cross-wave synthesis. Two live candidate shapes (obs-2 HTTP-verb-contract, obs-3 stale-list) are on watch — either promotes on a second confirming wave.

**Soft signal for founder's next checkpoint (no promotion):** the HTTP verb+path contract-test gap (obs-2, strong) is the most promotion-likely of the three if it recurs; the fix pattern is already the repo convention.

---
```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 0b33df33 done, f3f52d9a done, edac03e0 done (UPDATE 3 + verify SELECT)"
  - "observations: process/waves/wave-37/blocks/L/observations.md (3 observations)"
  - "principles promotions: 0 across [BUILD-PRINCIPLES, CI-PRINCIPLES, test-layer-principles/*]"
tasks_marked_done: [0b33df33-fafb-4572-ba32-6a6450cf63a6, f3f52d9a-984a-44a4-9a82-293e90be93b7, edac03e0-be3c-4b89-b3c7-e9d367ec275b]
tasks_skipped_with_reason: []
observations_emitted: 3
promotion_candidates: 0
karen_verdicts: []
linter_runs: []
candidates_dropped_by_linter: []
promotions_applied: []
note: "PROMOTE ZERO. obs-1 confirms BUILD rule 2 (recovery worked because rule 2 held); obs-2 (HTTP verb contract) + obs-3 (stale list) are first-instance HOLDs, candidate shapes preserved for recurrence."

head_signoff:
  verdict: APPROVED
  stage: L-2
  reviewers: {knowledge-synthesizer: emitted-3-observations, karen: skipped-zero-candidates}
  failed_checks: []
  rationale: >
    All L-2 stage-exit checks tick. Every claimed task is verified done (UPDATE 3 +
    confirming SELECT). Observations were authored by knowledge-synthesizer (not by me —
    gate, not production), are artifact-cited, blameless, and count-bounded (3 ≤ 6).
    Candidates were dedup-screened against existing canon BEFORE any proposal: obs-1
    duplicates the intent of BUILD rule 2 and is a confirmation, not a new rule; obs-2 and
    obs-3 are first-instance and fail the recurrence bar. Promote-zero is the correct,
    common outcome — no principles-file bloat. karen vetting correctly skipped with zero
    candidates. No contradiction with existing rules; no promotion left pending.
  distill_verdict:
    promoted: 0
    rationale: "No candidate is simultaneously new + recurring + binary + Contract-fitting. Restraint applied; canon authority preserved."
  next_action: PROCEED_TO_L-block-exit
```
