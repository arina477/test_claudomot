# Wave 10 — L-2 Distill

**Block:** L (Learn), stage L-2 (∥ L-1). Mode: `automatic`. head-learn owns the block.
**Wave:** M2 RBAC capstone. PR#20 + V-3 fast-fix PR#21. V-APPROVED, 176 tests.

## Action 1+2 — Mark every claimed task done, verify

`UPDATE tasks SET status='done' WHERE id = ANY(...) AND status IN ('todo','in_progress','blocked') RETURNING id;` → **4 rows updated**, verification SELECT confirms all 4 are `done`:

| task id | role | status |
|---|---|---|
| `35f191f4-2b63-4c8b-bf7e-a5c074310ec6` | seed — RbacModule (roles, `can()`, role CRUD + assignment) | done |
| `2c927c44-0b29-485d-9640-33401624b973` | channel-permission overrides + ChannelPermissionGuard | done |
| `7a10f13d-413f-46a2-a006-f60c0ab529f2` | owner-lockout last-owner invariant | done |
| `0b9bcf35-a6f1-40df-9da3-e9135307b900` | role-management UI (server settings) | done |

No skips; RETURNING count (4) == set size (4).

## Action 3 — knowledge-synthesizer

Ran over `process/waves/wave-10/` + prior observations `process/waves/_archive/wave-{7,8,9}/blocks/L/observations.md` + candidate principles files. Emitted **6 observations** → `process/waves/wave-10/blocks/L/observations.md`. Blameless, system-level, each artifact-cited.

| id | title (short) | severity | recurrence | disposition |
|---|---|---|---|---|
| obs-1 | Verified-prod-session fixture gap (`4a2ad286`) | strong | 4 waves | task-escalation → wave-11 SEED (NOT promoted; rule deferred to wave-11 L-2 once fixture exists) |
| obs-2 | Safe-by-default ≠ AC-met | warning | 2 waves | **PROMOTED → VERIFY-PRINCIPLES rule 1** |
| obs-3 | Split reviewer: adjudicate on standard, defer on bound | informational | 1 wave | keep-as-observation |
| obs-4 | Create-path / backfill-path identical seeds | warning | 2 waves | **PROMOTED → BUILD-PRINCIPLES rule 3** |
| obs-5 | Inflated test-count claim (270 vs 176) | warning | 1 wave | keep-as-observation (flag B-6 runner-count check) |
| obs-6 | Forward-scoped primitive deferral record | informational | 1 wave | keep-as-observation |

## Action 4 — Filter to promotion candidates

Three observations were 2+-wave recurring (obs-1, obs-2, obs-4). Head judgment:

- **obs-1 NOT promoted this wave.** The recurrence (4 waves) is unimpeachable, but promoting the T-8 "live-verify the authenticated authz path" rule *now* would create an **unenforced mandate** — the rule cannot be satisfied until the `4a2ad286` fixture exists. Promoting an unsatisfiable rule erodes the file's authority exactly like bloat. Correct vehicle this wave = a HARD task-escalation (4a2ad286 → wave-11 seed); the principle gets promoted at wave-11 L-2 from a real, non-self-violating exemplar once the fixture is used at T-8.
- **obs-2, obs-4 → karen.** Both 2-wave recurring, generalizable, falsifiable, cited, distinct target files.

## Action 5 — karen vetting

Karen verified BOTH code claims against the actual codebase (not hallucinated):
- obs-2: confirmed `apps/api/src/servers/servers.service.ts` create txn seeds the default Member role only after PR#21 `cfec993`; `rbac.service.ts` default-deny on null `role_id` is the masking fallback. Real.
- obs-4: confirmed `backfill-roles.ts` seeded the role for existing servers while create txn did not (wave-10), and the inverse wave-8 instance (invite_code forward seed in PR#18, backfill not added until PR#19). Both directions real via git timeline.

**Distinctness adjudication (head asked karen explicitly):** obs-2 and obs-4 both surface from the same wave-10 Karen-9a finding, so head challenged whether they are one incident double-counted. Karen's verdict: **genuinely distinct, promote both** — (i) each has an *independent* 2-wave recurrence on *different* wave-8 findings (8b share-modal default for obs-2; 8a backfill-omission for obs-4), and (ii) they fire at different gates on different artifacts (obs-2 = V-block reviewer inspection method; obs-4 = B-block construction rule). Each catches real cases the other misses. Head concurs: the per-file cap permits both, and suppressing either leaves a separately-recurring failure mode uncovered.

| candidate | target file | karen verdict |
|---|---|---|
| obs-2 (safe-by-default ≠ AC) | VERIFY-PRINCIPLES.md (→ rule 1) | APPROVE |
| obs-4 (backfill↔create identical seed) | BUILD-PRINCIPLES.md (→ rule 3) | APPROVE |

## Action 6 — Lint + promote

| candidate | target | attempt 1 | rewrite | attempt 2 | result |
|---|---|---|---|---|---|
| obs-2 | VERIFY-PRINCIPLES | `linter:why>100` (106 chars incl. indent) | cap-1 karen rewrite (dropped "state" → 100) | `linter:OK` | PROMOTED rule 1 |
| obs-4 | BUILD-PRINCIPLES | `linter:OK` | — | — | PROMOTED rule 3 |

The deterministic linter caught a real format drift karen's char-count missed (the 3-space indent pushes the Why line over 100). Cap-1 karen rewrite fixed it; re-lint PASS. Promoted both.

VERIFY-PRINCIPLES.md rule 1:
```
1. Verify seeding ACs by inspecting create-path source, not runtime behavior; a safe fallback hides a missing seed.
   Why: A default-deny or nullable fallback passes runtime probes while the required seed is absent.
```
BUILD-PRINCIPLES.md rule 3:
```
3. Any seed applied by a backfill must also appear in the create transaction, column-for-column.
   Why: A backfill-only seed leaves the forward create path producing a different initial state.
```

## Action 7 — Observation pipeline + escalations

Observations recorded in `process/waves/wave-10/blocks/L/observations.md` (6 obs). Carry-forward signals for N-1:

- **HIGH-priority escalation — `4a2ad286` (verified prod fixture):** 4-wave recurrence; obs-1 disposition is wave-11 SEED. Until executed, every authed-feature wave's 403/authed-RBAC core ships without live-authed verification. Make it the wave-11 primary deliverable, not a sibling carry-forward.
- **M3-onboarding tasks (from V-3 deferral):** member-list endpoint + guard/owner-lockout route-wiring — both M3-forward primitives (M3 messaging reuses `ChannelPermissionGuard`).
- **Soft flag (obs-5):** B-6 should verify test count from the runner output, not a planning-stage claim (270 vs 176 reached T-8/C-2 as a trust basis). One-wave; not a rule yet.

## Verdict / decision record

**Distill verdict: PROMOTE 2 (one per file, two files) + HARD task-escalation 1.**
Rationale: two genuinely-distinct, karen-verified, linter-clean, 2-wave-recurring rules to two different files; the strongest-recurrence signal (4a2ad286, 4 waves) deliberately NOT promoted as a rule this wave because the rule would be unenforceable until the fixture exists — routed as a wave-11 seed instead. No promotion left pending; no new↔existing rule contradiction (both target files had no conflicting rule).

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 35f191f4 done, 2c927c44 done, 7a10f13d done, 0b9bcf35 done (UPDATE 4 / verify 4)"
  - "observations: process/waves/wave-10/blocks/L/observations.md (6 observations)"
  - "principles promotions: 2 across [VERIFY-PRINCIPLES.md rule 1, BUILD-PRINCIPLES.md rule 3]"
tasks_marked_done: [35f191f4-2b63-4c8b-bf7e-a5c074310ec6, 2c927c44-0b29-485d-9640-33401624b973, 7a10f13d-413f-46a2-a006-f60c0ab529f2, 0b9bcf35-a6f1-40df-9da3-e9135307b900]
tasks_skipped_with_reason: []
observations_emitted: 6
promotion_candidates: 2
karen_verdicts:
  - {candidate_id: obs-2, target_file: command-center/principles/VERIFY-PRINCIPLES.md, verdict: APPROVE}
  - {candidate_id: obs-4, target_file: command-center/principles/BUILD-PRINCIPLES.md, verdict: APPROVE}
linter_runs:
  - {candidate_id: obs-2, target_file: VERIFY-PRINCIPLES.md, attempt: 1, verdict: REJECT, rejection_code: "linter:why>100"}
  - {candidate_id: obs-2, target_file: VERIFY-PRINCIPLES.md, attempt: 2, verdict: PASS, rejection_code: ""}
  - {candidate_id: obs-4, target_file: BUILD-PRINCIPLES.md, attempt: 1, verdict: PASS, rejection_code: ""}
candidates_dropped_by_linter: []
promotions_applied:
  - {file: command-center/principles/VERIFY-PRINCIPLES.md, line: 70, rule: "Verify seeding ACs by inspecting create-path source, not runtime behavior; a safe fallback hides a missing seed."}
  - {file: command-center/principles/BUILD-PRINCIPLES.md, line: 76, rule: "Any seed applied by a backfill must also appear in the create transaction, column-for-column."}
escalations:
  - {task: 4a2ad286-c068-406b-a2b3-4fee2a4d528b, priority: HIGH, action: "wave-11 SEED task (verified prod fixture) — gate on it before any further authed-feature wave"}
  - {tasks: [member-list-endpoint, guard/owner-lockout-route-wiring], action: "M3-onboarding tasks (V-3 deferral)"}
note: "obs-1 (4a2ad286, 4-wave recurrence) NOT promoted as a rule — unenforceable until fixture exists; routed as wave-11 seed. Rule promotes at wave-11 L-2 from a real exemplar."
```

## Exit criteria

- [x] Every claimed_task_id is `done` (Action 2 verified each).
- [x] knowledge-synthesizer ran with full input.
- [x] Observations recorded (6).
- [x] Candidates vetted by karen against contracts (code-claims verified, not hallucinated).
- [x] Each karen-APPROVED candidate passed the deterministic linter (obs-2 after one cap-1 rewrite).
- [x] At most one promotion per file (2 files, 1 each).
- [x] Promotion commits pushed with candidate files as audit trail.
- [x] `l_stage_verdict: COMPLETE`.
- [x] checklist L-2 row checked.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: L-2
  reviewers:
    knowledge-synthesizer: ran (6 observations, blameless, cited)
    karen: ran (2 code-claims verified against repo; 2 APPROVE; distinctness adjudicated)
  failed_checks: []
  rationale: >
    Promote few, promote real. Two genuinely-distinct, karen-code-verified, linter-clean,
    2-wave-recurring rules promoted to two different files (per-file cap honored). The single
    strongest-recurrence signal — the 4a2ad286 verified-prod-fixture gap, 4 consecutive waves —
    was deliberately NOT promoted as a rule, because a "live-verify the authed authz path" rule
    is unenforceable until the fixture exists; promoting it now would seed an unsatisfiable
    mandate that erodes the file's authority. It is routed as the concrete next action (wave-11
    seed) and the rule earns promotion at wave-11 L-2 from a real exemplar. All 4 claimed tasks
    closed and verified; no promotion left pending; no rule contradiction introduced.
  next_action: PROCEED_TO_L-block-exit
```
