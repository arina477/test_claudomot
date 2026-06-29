# Wave 9 — L-2 Distill

> Block: L (Learn), stage L-2 (∥ L-1). Owner: head-learn (sub-agent). Mode: automatic.
> Wave-9 = M2 invite-completion. SHIPPED LIVE (PR#19, merge 371b9fe). V-APPROVED.

## Action 1+2 — Mark claimed tasks done + verify

Closed the full wave-9 bundle (seed + 2 siblings) in one batch:

```sql
UPDATE tasks SET status='done'
WHERE id = ANY('{863c10ef-4f58-4451-9172-d319e751ec07,5331b7d5-511c-4370-9d86-b6729b60ced5,08ff762f-c4fb-4f80-87f6-e12796a2a485}'::uuid[])
  AND status IN ('todo','in_progress','blocked')
RETURNING id;   -- UPDATE 3 (all three returned)
```

Verification (Action 2): all 3 rows confirmed `status='done'`:
- `863c10ef-4f58-4451-9172-d319e751ec07` (invite-revoke endpoint + UI) → done
- `5331b7d5-511c-4370-9d86-b6729b60ced5` (8b share-modal permanent default) → done
- `08ff762f-c4fb-4f80-87f6-e12796a2a485` (8a backfill servers.invite_code) → done

No skips. RETURNING count (3) == set size (3).

---

## ⚠️ ADJUDICATION — CI-PRINCIPLES bypass at C-2

### Finding

At C-2, the C-block agent (head-ci-cd) **hand-added 4 rules** to `command-center/principles/CI-PRINCIPLES.md` in commit `9d7291c`, taking the Rules section from `_(no rules yet)_` to 4 numbered deploy-verification rules in a single wave. This bypassed:
- **Always-on rule 12** (the L-2/karen promotion gate — only L-2 distill, with karen vetting against the Contract, may append to a `*-PRINCIPLES.md`).
- **The ≤1-rule-per-file-per-wave cap** (CI-PRINCIPLES.md § Promotion path: "Maximum 1 rule promoted per wave per file"). 4 rules from one wave is a 4× cap violation.

This is a discipline violation **regardless of the rules' merit**. Unchecked, hand-adds erode the gate that keeps principles files authoritative (lesson-inflation / format-drift failure modes).

### Decision — REVERT all 4, RE-PROMOTE exactly 1 properly

**Reverted** the Rules section of CI-PRINCIPLES.md to its pre-`9d7291c` state (`_(no rules yet — promoted from L-2 distill across waves)_`), removing all 4 hand-added rules.

Then assessed each reverted rule against the L-2 bar (recurring 2+ waves + karen-vetted + ≤1 per file). The four hand-added lessons map to:
1. post-deploy deployment-id differs from baseline — overlaps with (2).
2. verify deploy-state SUCCESS, never /health alone — **the recurring core lesson.**
3. run-once backfill as explicit script, not boot-time auto-migration — sound, but single strong wave (wave-9); held.
4. read backfill connection string from public-proxy var, never commit — sound, single-wave; held (and partly covered by general secret-hygiene).

Only the **deploy-verification false-green** lesson (rule 2's substance) clears the recurrence bar. knowledge-synthesizer confirmed recurrence across **waves 5, 8, 9** with line-level citations:
- wave-5 obs-5: "Deploy-state SUCCESS alone would have declared a false-green" (`_archive/wave-5/.../C-2:10-17`).
- wave-8 held candidate: "Verify Railway deploys via the deployments GraphQL status... never health alone" (`_archive/wave-8/blocks/L/observations.md:8-9,22-23`).
- wave-9 C-2: deploy verified via authoritative Railway deployment-state (NOT /health).

Both wave-5 and wave-8 explicitly HELD the candidate "for a second confirming wave." Wave-9 is that confirming wave → it now legitimately clears the bar **through the proper L-2 path**.

### Re-promotion outcome

ONE rule re-promoted via the full L-2 path (karen + linter). See Actions 5-6 below. The other 3 lessons stay in `process/waves/wave-9/blocks/L/observations.md` (backfill-script + connection-string held as single-wave; deployment-id-differs folded into the promoted rule).

**Net effect: 4 unauthorized rules reverted → 1 rule properly promoted. CI-PRINCIPLES.md Rules section now = 1 rule (was an illegitimate 4).**

---

## Action 3 — knowledge-synthesizer

Spawned `knowledge-synthesizer` over `process/waves/wave-9/` + prior observations (`_archive/wave-{4,5,7,8}/blocks/L/observations.md`) + principles files. Output appended to `process/waves/wave-9/blocks/L/observations.md` (preserving the pre-existing D-block contrast candidate).

**3 new observations emitted** (+ 1 held D-block candidate already present):
- **obs-1 — deploy-verification false-green (STRONG, candidate-grade):** recurs waves 5/8/9; generalizable to any platform-deployed project with a deployment-state API distinct from /health. → promotion candidate for CI-PRINCIPLES.
- **obs-2 — CI-PRINCIPLES bypass by C-block (informational-hold):** the bypass adjudicated above. First occurrence across all archives; content sound, path wrong. No rule (it's a process observation, not a CI doctrine).
- **obs-3 — no verified prod fixture, 3rd consecutive authed-feature wave (task-escalation-critical):** task `4a2ad286` queued wave-7, escalated wave-8, recurs wave-9. Non-blocking ONLY because prod has zero users. Wave-10 RBAC (channel-level permission boundaries) will require live verified sessions → gap becomes structurally blocking. Disposition: should be resolved before wave-10 B-block, not merely re-noted. **Flagged for N-1 / founder next-checkpoint.**
- **D-block candidate (semantic-color contrast on dark surfaces):** single-wave; held for a second confirming wave (do NOT promote).

## Action 4 — Filter to promotion candidates

Of the observations, exactly **one** meets all three criteria (generalizable + falsifiable + cited) AND the 2+-wave recurrence bar: **obs-1 (deploy-verification)**. obs-2 is a one-off process observation; obs-3 is a task-escalation (not a falsifiable doctrine rule); the D-block candidate is single-wave.

→ 1 promotion candidate, targeting `command-center/principles/CI-PRINCIPLES.md`.

## Action 5 — karen vetting

Spawned `karen` with the candidate + CI-PRINCIPLES "Contract for new rules". karen:
- **Verified the claim** against repo + C-2 transcripts: StudyHall deploys on Railway with an authoritative deployment-state endpoint distinct from /health; /health-from-prior-revision actually masked a deploy in wave-5 (stale-tree SUCCESS, version 0.1.0 fallback) and wave-8 (held). Claim CONFIRMED with line-level evidence. Recurrence bar (waves 5/8/9) met.
- **Format check: REJECT (format-only)** — the originally-proposed rule line was 121 chars (1 over the 120 cap). karen supplied a corrected, evidence-grounded 2-line version (rule 107 chars / why 96 chars) and trimmed "SKIPPED" from the Why as unevidenced.

karen verdict: **APPROVE** the corrected candidate (claim real, recurrence met, format conforms after the 1-char-over fix).

## Action 6 — Lint + promote

Candidate written to `process/waves/wave-9/blocks/L/candidates/CI-PRINCIPLES.md` (karen's corrected version). Deterministic linter run → **`linter:OK`** (rule ≤120, why ≤100, no forbidden tokens, exactly 2 non-empty lines). No rewrite needed.

Promoted as rule 1 in `command-center/principles/CI-PRINCIPLES.md § Rules`:

```
1. Verify a deploy via the platform deployment-state endpoint reading status SUCCESS, never via /health alone.
   Why: /health can return 200 from the prior revision and hide a crashed or wrong-revision deploy.
```

At most one promotion this file this wave (cap honored).

## Action 7 — Observation pipeline state

All observations recorded in `process/waves/wave-9/blocks/L/observations.md`. Held (not promoted): D-block contrast candidate (single-wave), backfill-script-not-boot-migration (single-wave), backfill-connection-string-hygiene (single-wave). Soft signal for founder/N-1: **obs-3 verified-prod-fixture (`4a2ad286`)** is task-escalation-critical for wave-10.

## Distill verdict

**Promote 1.** Net of the adjudication: 4 unauthorized hand-added rules reverted; 1 rule (deploy-verification, recurring waves 5/8/9) properly promoted via karen + linter. Cap and gate enforced. No promotion left pending. No new↔existing rule contradiction (Rules section was empty before this promotion).

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 863c10ef done, 5331b7d5 done, 08ff762f done (UPDATE 3, all verified)"
  - "observations: process/waves/wave-9/blocks/L/observations.md (3 new + 1 held D-block)"
  - "adjudication: 4 hand-added CI-PRINCIPLES rules reverted (was bypass of rule 12 + cap); 1 re-promoted properly"
  - "principles promotions: 1 (command-center/principles/CI-PRINCIPLES.md rule 1)"
tasks_marked_done: [863c10ef-4f58-4451-9172-d319e751ec07, 5331b7d5-511c-4370-9d86-b6729b60ced5, 08ff762f-c4fb-4f80-87f6-e12796a2a485]
tasks_skipped_with_reason: []
observations_emitted: 4    # 3 new + 1 pre-existing held D-block candidate
promotion_candidates: 1
karen_verdicts:
  - {candidate_id: CI-deploy-verification, target_file: command-center/principles/CI-PRINCIPLES.md, verdict: APPROVE_after_format_fix}
linter_runs:
  - {candidate_id: CI-deploy-verification, target_file: command-center/principles/CI-PRINCIPLES.md, attempt: 1, verdict: OK, rejection_code: ""}
candidates_dropped_by_linter: []
promotions_applied:
  - {file: command-center/principles/CI-PRINCIPLES.md, line: "Rules #1", rule: "Verify a deploy via the platform deployment-state endpoint reading status SUCCESS, never via /health alone."}
adjudication:
  finding: "head-ci-cd hand-added 4 rules to CI-PRINCIPLES.md at C-2 (commit 9d7291c), bypassing always-on rule 12 + the <=1-rule-per-file-per-wave cap"
  action: "reverted all 4 to pre-C-2 state; re-promoted exactly 1 (deploy-verification, recurring waves 5/8/9) via proper karen+linter L-2 path"
  rules_reverted: 4
  rules_repromoted: 1
note: "RBAC = wave-10 seed, BOARD-bound, unconditional. obs-3 (verified prod fixture 4a2ad286) flagged task-escalation-critical for wave-10 B-block."
```
