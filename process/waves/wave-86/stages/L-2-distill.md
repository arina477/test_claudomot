# L-2 — Distill (wave-86)

Backend-only CSRF-posture legibility wave. Owner: head-learn. Mode: automatic.

## Action 1+2 — Mark claimed task done + verify

```sql
UPDATE tasks SET status='done'
WHERE id='f8fb8023-544a-431f-a359-7392e9c75f5b' AND status IN ('todo','in_progress','blocked')
RETURNING id, status;
-- f8fb8023-544a-431f-a359-7392e9c75f5b | done   (UPDATE 1)

SELECT id, status FROM tasks WHERE id='f8fb8023-544a-431f-a359-7392e9c75f5b';
-- f8fb8023-544a-431f-a359-7392e9c75f5b | done
```

Single-spec wave; one claimed task (no siblings). Verified `done`.

## Action 3 — knowledge-synthesizer

Ran against `process/waves/wave-86/` + prior 5 waves' archived observations
(`_archive/wave-{85,84,83,82,81}/blocks/L/observations.md`) + all principles files + T-8.md.
Output: `process/waves/wave-86/blocks/L/observations.md` — **3 observations**.

- **obs-1** (strong, CI-PRINCIPLES) — Railway bare `serviceInstanceDeploy` (no commitSha)
  redeploys the pinned prior commit, not main HEAD. **2-wave recurrence VERIFIED** in archives:
  wave-86 C-2 (bare call redeployed pinned `5cb5e789`/wave-84 at identical imageDigest, SUCCESS
  at stale code; fixed with explicit `commitSha=a9556248`) + wave-84 C-2 (api served stale
  wave-83 commit `dd24a7d6`; resolved via `serviceInstanceDeployV2(commitSha)` at merge HEAD
  `5cb5e789`). → **PROMOTE-ELIGIBLE**.
- **obs-2** (warning, BUILD/PRODUCT) — a security-config value must be chosen against the actual
  SDK behavior + current transport mode, not the literal wording of an old finding (seed's
  `VIA_TOKEN` was wrong post header-transport; correct value `NONE`). **1st instance** → HOLD.
- **obs-3** (warning, T-8) — a transport-layer guard test must use a structurally-valid forged
  token; a garbage token is green under any transport pin (B-6 Phase-2 finding 2a, fixed
  `b9b31776`). **1st instance** → HOLD (adjacent to but distinct from wave-85 obs-3).

## Action 4 — Filter to promotion candidates

Only obs-1 meets generalizable + falsifiable + cited AND clears the 2+-wave recurrence bar.
obs-2 and obs-3 are clean, falsifiable 1st-instances → held in observations.md for a 2nd-wave
confirmation. 1 promotion candidate → CI-PRINCIPLES.md.

## Action 5 — karen vetting

Spawned karen on the obs-1 candidate against the CI-PRINCIPLES "Contract for new rules".
- De-dup: not a near-dup of rule 7 (served-bundle marker = detection) or rule 1 (deploy-state
  SUCCESS = orthogonal; this candidate exposes a case where rule 1's SUCCESS is the false-green).
- Substance: APPROVE (2-wave recurrence real; generalizable, binary, costly-if-ignored).
- Format: **REJECT** on first wording — Why line full-length 102 > 100 (linter measures the
  3-space indent + `Why:` prefix).

## Action 6 — Lint, then promote

Candidate file: `process/waves/wave-86/blocks/L/candidates/CI-PRINCIPLES.md`.

- Attempt 1 (synthesizer wording): `linter:why>100` (102 chars).
- Cap-1 karen rewrite: trimmed causal text; Why full line 98 ≤ 100.
- Attempt 2 (rewrite): **linter:OK** — rule line 118 ≤ 120, why line 98 ≤ 100, exactly 2 lines,
  no forbidden tokens.

Promoted rule 13 to `command-center/principles/CI-PRINCIPLES.md`:

```
13. Pass an explicit commitSha to serviceInstanceDeploy; a bare call redeploys the pinned prior commit, not main HEAD.
   Why: Railway pins the last-deployed commit, so a bare call returns green SUCCESS on stale code.
```

Committed with candidate file as audit trail: `docs(principles): L-2 promote rule 13 to
CI-PRINCIPLES from wave-86` → SHA `755ea0fa`, pushed to main.

## Action 7 — Observation pipeline state

3 observations recorded in `process/waves/wave-86/blocks/L/observations.md`. obs-2 + obs-3 held
for future synthesis (soft signals; no founder-checkpoint flag needed — both caught in-wave by
mandatory gates, no live risk).

## Deliverable footer

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: f8fb8023-544a-431f-a359-7392e9c75f5b done"
  - "observations: process/waves/wave-86/blocks/L/observations.md (3 observations)"
  - "principles promotions: 1 (CI-PRINCIPLES.md rule 13)"
tasks_marked_done: [f8fb8023-544a-431f-a359-7392e9c75f5b]
tasks_skipped_with_reason: []
observations_emitted: 3
promotion_candidates: 1
karen_verdicts:
  - {candidate_id: obs-1, target_file: command-center/principles/CI-PRINCIPLES.md, verdict: APPROVE-substance-then-format-rewrite}
linter_runs:
  - {candidate_id: obs-1, target_file: command-center/principles/CI-PRINCIPLES.md, attempt: 1, verdict: REJECT, rejection_code: "linter:why>100"}
  - {candidate_id: obs-1, target_file: command-center/principles/CI-PRINCIPLES.md, attempt: 2, verdict: PASS, rejection_code: ""}
candidates_dropped_by_linter: []
promotions_applied:
  - {file: command-center/principles/CI-PRINCIPLES.md, line: 165, rule: "13. Pass an explicit commitSha to serviceInstanceDeploy; a bare call redeploys the pinned prior commit, not main HEAD."}
note: "obs-1 2-wave recurrence verified in wave-84 + wave-86 C-2 archives. obs-2 + obs-3 clean 1st-instances held for 2nd-wave confirmation."
```
