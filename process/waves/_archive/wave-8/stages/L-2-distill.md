# L-2 — Distill (wave-8, M2 invites/join)

> Owner: head-learn (L-block gate). Mode: automatic. Concurrent with L-1.

## Action 1+2 — Tasks marked done

Closed the full wave-8 bundle (seed + 3 siblings) in one batch; all 4 verified `done`:

| task id | status |
|---|---|
| c7443638-a32f-460c-887f-ecd575f2cede (seed: two-tier invite backend) | done |
| 77e2041a-198d-48a1-bc95-6900bd03ec44 (invite-preview + join membership API) | done |
| 72fc08ea-610c-4244-b747-218e3efbc5ae (invite-join page) | done |
| 54407e1d-1936-458d-b586-0d49d9cf9482 (invite-create + share UI) | done |

RETURNING returned 4 rows; verification SELECT confirms all 4 `done`. No skips.

## Action 3 — knowledge-synthesizer

Ran against `process/waves/wave-8/` + prior `_archive/wave-{1,3,4,5,7}/blocks/L/observations.md` + the existing wave-8 C/V candidate pool. Output appended to `process/waves/wave-8/blocks/L/observations.md` (synthesis section). **4 observations emitted.**

| obs | summary | severity | candidate file | disposition |
|---|---|---|---|---|
| obs-1 | Restart-loss recurrence: a 2nd worker restart (wave-8 D-block `[re-run post-restart]`) confirms the wave-7 FS-loss-from-unpushed-work mechanism; push-after-each-B/D-stage was the applied + working mitigation. | strong | BUILD-PRINCIPLES.md | **PROMOTE** (clears 2-wave bar) |
| obs-2 | Security-AC encoding worked end-to-end: P-0 flags (CSPRNG / verified-join / atomic max_uses TOCTOU) → P-2 ACs → T-8/B-6 caught the max_uses TOCTOU + preview leak before ship. | informational | null | process-validation, no rule |
| obs-3 | No verified-prod-fixture gap recurs (2nd authed-feature wave); wave-7 task `4a2ad286` still open. | warning | null | task (prioritize `4a2ad286`) |
| obs-4 | 8a (invite_code backfill omitted for existing rows) + 8b (share modal defaults to ad-hoc not permanent) — bounded V-1-caught drifts. | informational | null | follow-up tasks |

## Action 4 — Promotion candidates

obs-1 is the sole observation clearing all three gates (generalizable + falsifiable + cited) AND the head-learn promotion bar (new + **recurring across 2+ waves** + costly-if-ignored + binary/enforceable + non-self-violating exemplar).

**Recurrence proof (verified, not assumed):**
- Wave-7 obs-1 (`_archive/wave-7/blocks/L/observations.md`) recorded the first restart-loss, HELD with condition "promote if the same FS-loss-from-unpushed-work mechanism recurs in a subsequent wave."
- Wave-8 second occurrence confirmed against real files: `blocks/D/review-artifacts.md` header literally `[re-run post-restart]`; `blocks/P/review-artifacts.md` `RESTART-LESSON: push branch after each major B/D stage`; `stages/P-3-plan.md` `PUSH branch after each major stage (restart-loss lesson)`; B-block per-stage pushes (B-3 `8697d42`, B-5 "pushed").

## Action 5 — karen vetting

karen vetted the single candidate against BUILD-PRINCIPLES "Contract for new rules" AND spot-checked the recurrence code-claim against the repo.

- **Format:** PASS (2 lines, rule 96 chars ≤120, why 78 chars ≤100, no forbidden tokens, no war story / wave-ref, numbering `2.` correct, not a near-dup of rule 1).
- **Recurrence:** REAL and VERIFIABLE — all cited wave-8 artifacts exist literally; the wave-7 HOLD condition is satisfied.
- **Verdict: APPROVE.**

## Action 6 — Lint + promote

Candidate file: `process/waves/wave-8/blocks/L/candidates/BUILD-PRINCIPLES.md`. Deterministic linter: **`linter:OK`** (first attempt, no rewrite needed). Appended as **rule 2** to `command-center/principles/BUILD-PRINCIPLES.md` under `## Rules`:

```
2. Push the branch to origin after every B-block and D-block stage before starting the next stage.
   Why: A worker restart resets the local tree; unpushed commits are permanently lost.
```

## Action 7 — Follow-up tasks queued (M2, flat follow-ups)

| task id | title |
|---|---|
| 5331b7d5-511c-4370-9d86-b6729b60ced5 | 8b: Share modal defaults to permanent invite code |
| 08ff762f-c4fb-4f80-87f6-e12796a2a485 | 8a: Backfill servers.invite_code for pre-existing rows |
| 863c10ef-4f58-4451-9172-d319e751ec07 | Invite-revoke endpoint + UI |

(obs-3's `4a2ad286` already exists from wave-7; not re-queued.)

## Distill verdict

**PROMOTE 1** (BUILD-PRINCIPLES rule 2 — push-after-each-B/D-stage). The promotion is justified by a genuine, independently-verified 2-wave recurrence of a costly failure (restart-loss of unpushed work), is binary/enforceable (`git log @{u}..HEAD` shows unpushed commits at any B/D stage exit), and matches the contract format exactly. obs-2 is process-validation (no rule); obs-3/obs-4 route to tasks, not canon. No new↔existing rule contradiction.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: c7443638 done, 77e2041a done, 72fc08ea done, 54407e1d done"
  - "observations: process/waves/wave-8/blocks/L/observations.md (4 synthesis observations + C/V candidate pool)"
  - "principles promotions: 1 (command-center/principles/BUILD-PRINCIPLES.md rule 2)"
tasks_marked_done:
  - c7443638-a32f-460c-887f-ecd575f2cede
  - 77e2041a-198d-48a1-bc95-6900bd03ec44
  - 72fc08ea-610c-4244-b747-218e3efbc5ae
  - 54407e1d-1936-458d-b586-0d49d9cf9482
tasks_skipped_with_reason: []
observations_emitted: 4
promotion_candidates: 1
karen_verdicts:
  - {candidate_id: obs-1, target_file: command-center/principles/BUILD-PRINCIPLES.md, verdict: APPROVE}
linter_runs:
  - {candidate_id: obs-1, target_file: command-center/principles/BUILD-PRINCIPLES.md, attempt: 1, verdict: OK, rejection_code: ""}
candidates_dropped_by_linter: []
promotions_applied:
  - {file: command-center/principles/BUILD-PRINCIPLES.md, line: "rule 2", rule: "Push the branch to origin after every B-block and D-block stage before starting the next stage."}
followups_queued:
  - {id: 5331b7d5-511c-4370-9d86-b6729b60ced5, milestone: M2, title: "8b share modal permanent-code default"}
  - {id: 08ff762f-c4fb-4f80-87f6-e12796a2a485, milestone: M2, title: "8a invite_code backfill"}
  - {id: 863c10ef-4f58-4451-9172-d319e751ec07, milestone: M2, title: "invite-revoke endpoint + UI"}
note: "PROMOTE 1. Restart-loss cleared the 2-wave bar (wave-7 HOLD condition satisfied by wave-8 [re-run post-restart]). karen APPROVE + linter OK + recurrence independently verified."
```
