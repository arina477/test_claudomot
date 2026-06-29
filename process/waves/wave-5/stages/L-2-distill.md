# L-2 — Distill (wave-5, M1 hardening)

## Action 1 + 2 — Mark claimed tasks done & verify
`claimed_task_ids` = [839af17f, 84e09891, e38c306e, a7667fb7, 478e9d43, c51589cd].

`UPDATE tasks SET status='done' WHERE id = ANY(<5 ids>) AND status IN ('todo','in_progress','blocked')` → **5 rows** returned. **84e09891 deliberately EXCLUDED.**

Verified state (`SELECT id, status WHERE id = ANY(<all 6>)`):
| Task | Status | Note |
|---|---|---|
| `839af17f` rate-limiting | done | 429 live ✓ |
| `e38c306e` version reporting | done | /health 0.0.1 ✓ |
| `a7667fb7` node-20 clear | done | zero deprecation annotations on 6c5dee8 ✓ |
| `478e9d43` branch-protection | done | active ✓ |
| `c51589cd` CI browser E2E | done | Playwright job passing ✓ |
| `84e09891` avatar | **in_progress** (NOT done) | CODE shipped (server-side 2MB + presign + 503-graceful); acceptance = "verify avatar upload LIVE" needs founder Railway Bucket creds — founder-blocked. Live-upload verification NOT done. |

84e09891 left `in_progress`: its acceptance criterion (live upload round-trip) is blocked on founder-supplied Railway Bucket creds. Not flipped to done; tracked as a founder-ops item (see L-1 milestone delta + N-1 flag).

## Action 3 — knowledge-synthesizer
Spawned over `process/waves/wave-5/` + prior `_archive/wave-{1,3,4}/blocks/L/observations.md` (wave-2 archive absent). Output: `process/waves/wave-5/blocks/L/observations.md` — **5 observations**, 2 candidate-grade. No overproduction (≤6).

## Action 4 — Filter to promotion candidates
Candidate-grade (generalizable + falsifiable + cited): **obs-1** (CI-PRINCIPLES, version-path compiled-dist boot outage, 4-wave recurrence, strong) and **obs-3** (CI-PRINCIPLES, enforce_admins direct-push, wave-3 obs-5 recurrence condition fired, warning). Both target the SAME file → per-file cap allows ≤1; obs-1 wins the tiebreak (severity strong > warning; generality count higher; outage-grade).

## Action 5 — karen vetting (obs-1)
Spawned karen on the obs-1 candidate (`process/waves/wave-5/blocks/L/candidates/CI-PRINCIPLES.md`) with the target file's contract + BUILD rule 1.

karen verdict: **REJECT.**
- **Format: PASS** (2 lines, rule 114c ≤120, why 90c ≤100, no forbidden tokens, falsifiable).
- **Code-claim: REAL.** Verified `git show 5364a32^:apps/api/src/version.ts` = unconditional `require('../package.json')` → resolves to `dist/package.json` (absent) from compiled `dist/src/version.js` → MODULE_NOT_FOUND at boot → full prod crash; local + CI green (src-run resolves correctly). Fixed PR#13 / 5364a32. CI (`.github/workflows/ci.yml`) confirmed source-only at the gate (lint/typecheck/test/build); `e2e` job targets a static deployed URL, not a CI-booted artifact.
- **Dedup: DUPLICATE → rejection ground.** Near-duplicate of BUILD-PRINCIPLES rule 1 ("Boot the production-built artifact in a prod-like container and exercise its runtime config before merge"). In this repo CI is the only pre-merge gate, so "before merge" (BUILD) and "before the merge gate" (candidate) name the same enforcement point; promoting fragments one invariant across two files (authoring-discipline "no near-dup" violation). Does not contradict BUILD rule 1 — restates it.

## Action 6 — Lint + promote
**Not reached** — karen rejected pre-linter. The deterministic linter runs only on a karen-APPROVED candidate; the candidate file is retained as the audit trail of the rejected promotion. **No promotion. No principles-file edit. No commit to any `*-PRINCIPLES.md`.**

Drop annotated in `observations.md` under the FINAL distill verdict (reason: dedup vs BUILD rule 1, not a linter failure).

## Action 7 — Observation pipeline state
- **obs-1** held; wave-5 RE-CONFIRMS BUILD rule 1 (4th instance). karen surfaced a genuinely distinct, non-duplicative future angle (CI `e2e` targets a static deployed URL, not a freshly-booted artifact → post-deploy detection-latency, NOT covered by BUILD rule 1) — promotable to CI-PRINCIPLES only after it recurs as its own pattern; not authored this wave.
- **obs-3** held as the standing NEXT-WAVE CI-PRINCIPLES candidate (set enforce_admins=true) — its recurrence condition fired this wave but it lost the per-file cap tiebreak to obs-1.
- **obs-2** (rate-limit XFF), **obs-4** (node-20 verification-mode), **obs-5** (stale-tree false-SUCCESS) — first-occurrence / informational, held.

**Follow-up task queued (optional, per brief):** `da242f6b` (todo, milestone M1) — "Add a CI job that boots the compiled API (node dist/src/main.js) and curls /health" — to close the recurring compiled-dist-boot outage class at the pipeline level (the distinct angle karen identified).

## Action 8 — Deliverable
This file.

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 839af17f done, e38c306e done, a7667fb7 done, 478e9d43 done, c51589cd done (84e09891 left in_progress — founder-creds-blocked)"
  - "observations: process/waves/wave-5/blocks/L/observations.md (5 observations)"
  - "principles promotions: 0 across [] (obs-1 karen-REJECTED as duplicate of BUILD rule 1)"
tasks_marked_done: [839af17f, e38c306e, a7667fb7, 478e9d43, c51589cd]
tasks_skipped_with_reason:
  - {id: 84e09891, reason: "live avatar-upload verification founder-blocked (Railway Bucket creds); code shipped, acceptance not met; left in_progress"}
observations_emitted: 5
promotion_candidates: 2
karen_verdicts:
  - {candidate_id: obs-1, target_file: command-center/principles/CI-PRINCIPLES.md, verdict: REJECT, reason: "duplicate of BUILD-PRINCIPLES rule 1 (same boot-before-merge invariant); code-claim verified real; format PASS"}
linter_runs: []     # not reached — karen rejected pre-linter
candidates_dropped_by_linter: []   # dropped at karen (dedup), not at linter
candidates_dropped_at_karen:
  - {candidate_id: obs-1, target_file: command-center/principles/CI-PRINCIPLES.md, final_reason: "dedup vs BUILD rule 1"}
promotions_applied: []
followup_tasks_queued:
  - {id: da242f6b, title: "Add a CI job that boots the compiled API (node dist/src/main.js) and curls /health", status: todo, milestone_id: "5a6efc9e"}
note: >
  PROMOTE ZERO — the disciplined, correct outcome. 5 observations, 2 candidate-grade, 0 promoted.
  obs-1 (strong, 4-wave recurrence) re-confirms but duplicates BUILD rule 1 — karen REJECT. obs-3
  (enforce_admins) meets bar but lost the per-file cap tiebreak and is held as wave-6's standing
  CI-PRINCIPLES candidate. No principles file edited; no canon bloat.
head_signoff:
  verdict: APPROVED
  stage: L-2
  reviewers: {karen: REJECT-obs-1}
  failed_checks: []
  rationale: >
    All 5 fully-complete tasks marked done; 84e09891 correctly held in_progress (live verification
    founder-blocked — not done). knowledge-synthesizer ran with full cross-wave input; observations
    cite concrete artifacts and are system-level. The sole strong promotion candidate cleared the
    recurrence and cost bars but was REJECTED by karen as a duplicate of an existing BUILD rule —
    the code-claim was verified real against the repo before judgment. Promoting zero this wave is
    correct: the lesson is already canon, and adding a sibling-file restatement would erode authority.
    obs-3's contradiction-free recurrence is recorded for wave-6 without being force-promoted now.
  next_action: PROCEED_TO_N-1
```
