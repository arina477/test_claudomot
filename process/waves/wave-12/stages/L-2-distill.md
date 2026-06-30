# L-2 — Distill (wave-12 M3 real-time messaging)

## Action 1-2 — Tasks marked done + verified

```sql
UPDATE tasks SET status='done'
WHERE id = ANY('{a0c322b4-72de-4c8d-ac27-bb51dda5f464,723b5b6a-5565-438f-bde4-7e85ba283781,d999d29c-4f60-497b-95fb-875ae40410b9}'::uuid[])
  AND status IN ('todo','in_progress','blocked') RETURNING id;
```

RETURNING = 3 rows. Verification SELECT confirms all 3 `status='done'`. No skips.

## ⚠️ ADJUDICATION — CI-PRINCIPLES bypass (2x RECURRENCE)

### Finding

At the wave-12 T-block commit (`1a700b9`), **head-ci-cd hand-added 2 rules** to `command-center/principles/CI-PRINCIPLES.md`, bypassing always-on rule 12 + the L-2/karen promotion gate + the ≤1-promotion-per-file-per-wave cap:

- (rule 2, added) `Deploy Railway via the CLI 'up' source-upload, never via GraphQL serviceInstanceDeploy on repo-less services.`
- (rule 3, added) `Confirm a deployment-state SUCCESS with a route probe that 404 flips to 401 on a new-only route before passing.`

This is the **SAME violation as wave-9** (commit `9d7291c`, adjudicated at `e798487`: 4 rules hand-added → all 4 reverted, exactly 1 re-promoted via the proper L-2 path). head-ci-cd bypassing the L-2 gate is now a **confirmed 2x recurrence**.

### Step 1 — REVERT

Both unauthorized additions reverted; `CI-PRINCIPLES.md` § Rules restored to its pre-C-2 state (rule 1 only). The two rules were then re-assessed against the L-2 bar (karen-vetted, linted, ≤1/file/wave cap).

### Step 2 — Re-assess each against the L-2 bar

**Candidate A — route-probe (the 404→auth-gated flip)** → **PROMOTED (1 of 1).**
- **Recurring**: NOT first-instance. The wave-9 archive (`wave-9/blocks/L/observations.md` lines 57-65, 72-78) explicitly HELD a route-probe-style refinement of the false-green family "for a second wave." Wave-12 C-2 (lines 26-30) is that second confirming occurrence — a real 404→401 probe on the new-only `GET /channels/:id/messages` route broke a stale-revision race that deployment-state SUCCESS alone would have masked. The false-green family spans waves 4/5/8/9/12.
- **Distinct from rule 1** (karen-confirmed): rule 1 = "read deploy-state SUCCESS, not /health"; this = "even at SUCCESS, route-probe a new-only route to confirm the new revision actually serves." Complementary enforcement layers, not a restatement. No contradiction → no supersede needed.
- **Karen verdict**: APPROVE (claim verified against C-2 lines 26-30/55/86-88; distinct; contract-format PASS). Karen flagged the original "404 flips to 401" wording as over-specific (harms generality across routes that may return 200/403); I adopted her non-blocking generalization.
- **Promoted wording** (generalized, linter PASS — rule 104 chars, why 98 chars, 2 lines, no forbidden tokens):
  ```
  2. Probe a new-only route for a 404-to-auth-gated-status flip after deploy-state SUCCESS before passing.
     Why: A SUCCESS with the new route still 404ing proves the prior revision serves, a false-green.
  ```

**Candidate B — CLI `up` transport (not GraphQL serviceInstanceDeploy)** → **NOT PROMOTED.**
- Project/ops-specific Railway transport mechanics, not a generalizable, durable engineering principle. The "stale revision under SUCCESS" hazard it warns about is already covered by promoted rule 2 (route-probe catches a stale revision regardless of which transport caused it). Belongs as a project-doc note in `command-center/dev/architecture/devops.md` (Railway deploy transport), not in CI-PRINCIPLES. Recorded as observation; deferred to ops doc, not promoted.

### Step 3 — The RECURRENCE itself (process/meta)

Recorded as **obs-3 (severity: strong)**: head-ci-cd has now bypassed the L-2/karen gate twice (wave-9, wave-12). This is a meta-process signal, not a code principle — it has no home in any `*-PRINCIPLES.md`.

- **Flagged for founder digest** (soft signal, N-3 / checkpoint): a release agent is repeatedly writing permanent canon out-of-band; the gate exists precisely to prevent unvetted/duplicate/format-drifting rules from eroding the principles files' authority.
- **Recommended remediation**: tighten the head-ci-cd agent card (`~/.claude/agents/head-ci-cd.md`) to explicitly prohibit writing to `*-PRINCIPLES.md` directly — C-block emits deploy observations for L-2 to vet, never appends rules itself. (Card edit is outside the L-block's write scope; recorded as a recommendation for the founder / next agent-card maintenance pass.)

## Action 3-7 — Synthesizer + candidates + karen

- **knowledge-synthesizer** ran over `wave-12/` + prior `wave-{5,7,8,9,10,11}` observations → 6 observations at `process/waves/wave-12/blocks/L/observations.md`.
- **Promotion candidates**: 1 reached karen (route-probe → CI-PRINCIPLES). The type-only-import DI crash (obs-2) was assessed redundant with **BUILD-PRINCIPLES rule 1** ("Boot the production-built artifact... before merge") — the exact rule that caught it (commit `006235b`, boot-probe) — so NO new BUILD rule. WS-upgrade auth pattern (obs-4) → architecture reference, not a principle.
- **karen verdict**: route-probe APPROVE (1 candidate).
- **linter**: 1 run, PASS (no rewrite, no drop).

## Follow-ups queued (in observations.md)

- null-key `.returning()` cleanup (tech-debt, obs-5).
- M3-deferred items: reactions, threads, mentions, attachments, presence/typing, member-list-with-presence (obs-6).

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: a0c322b4 done, 723b5b6a done, d999d29c done (RETURNING 3; verify SELECT all done)"
  - "observations: process/waves/wave-12/blocks/L/observations.md (6 observations)"
  - "principles promotions: 1 (CI-PRINCIPLES rule 2 — route-probe false-green guard)"
  - "CI-PRINCIPLES bypass adjudicated: 2 hand-added rules reverted; 1 re-promoted via gate; 1 deferred to ops doc; recurrence flagged"
tasks_marked_done: [a0c322b4-72de-4c8d-ac27-bb51dda5f464, 723b5b6a-5565-438f-bde4-7e85ba283781, d999d29c-4f60-497b-95fb-875ae40410b9]
tasks_skipped_with_reason: []
observations_emitted: 6
promotion_candidates: 1
karen_verdicts:
  - {candidate_id: route-probe, target_file: command-center/principles/CI-PRINCIPLES.md, verdict: APPROVE}
linter_runs:
  - {candidate_id: route-probe, target_file: command-center/principles/CI-PRINCIPLES.md, attempt: 1, verdict: PASS, rejection_code: ""}
candidates_dropped_by_linter: []
promotions_applied:
  - {file: command-center/principles/CI-PRINCIPLES.md, line: "rule 2", rule: "Probe a new-only route for a 404-to-auth-gated-status flip after deploy-state SUCCESS before passing."}
adjudication:
  bypass_agent: head-ci-cd
  recurrence: "2x (wave-9 + wave-12)"
  reverted: ["CLI-up-transport", "route-probe (404->401)"]
  re_promoted: ["route-probe (generalized to 404-to-auth-gated-status), via karen+linter"]
  deferred_to_ops_doc: ["CLI-up-transport -> command-center/dev/architecture/devops.md"]
  digest_flag: "head-ci-cd 2x L-2-gate bypass; recommend tightening agent card to bar direct *-PRINCIPLES.md writes"
note: "1 promotion (route-probe, recurrence confirmed via wave-9 held candidate). Type-import DI redundant with BUILD rule 1. M3 stays in_progress."
```
