# L-2 — Distill (wave-11)

**Block:** L (Learn), stage L-2 (∥ L-1). head-learn owns the block.
**Wave:** persistent verified prod test fixture (user-id 21984eb2; POST /servers 201 authed proof; creds gitignored). V-APPROVED. PR#22.

## Action 1+2 — Mark every claimed task done, verify

`claimed_task_ids: [4a2ad286-c068-406b-a2b3-4fee2a4d528b]` (single seed; no siblings this wave).

```sql
UPDATE tasks SET status='done'
WHERE id='4a2ad286-c068-406b-a2b3-4fee2a4d528b'
  AND status IN ('todo','in_progress','blocked') RETURNING id;
```

→ **1 row updated** (`4a2ad286`); pre-state was `in_progress`. Verification `SELECT id,status` → `4a2ad286 | done`. RETURNING count (1) == set size (1); no skips.

## Action 3 — knowledge-synthesizer

Ran over `process/waves/wave-11/` + prior observations `process/waves/_archive/wave-{1,7,8,9,10}/blocks/L/observations.md` + candidate principles files. Emitted **4 observations** → `process/waves/wave-11/blocks/L/observations.md`. Blameless, system-level, each artifact-cited. (4 ≤ 6; no overproduction pruning needed.)

| id | title (short) | severity | recurrence | disposition |
|---|---|---|---|---|
| obs-1 | CI false-green: `gh run watch --exit-status` streams last-completed job, not suite conclusion | warning | first-occurrence | keep-as-observation (hold-for-recurrence) |
| obs-2 | gitleaks false-positive on a UUID identifier; resolved via scoped `.gitleaks.toml` allowlist | informational | first-occurrence | keep-as-observation |
| obs-3 | P-3 plan cited false prior-wave provenance; caught at P-4 | warning | first-occurrence (sub-class) | keep-as-observation; P-4 gate is the existing control |
| obs-4 | Verified-prod-fixture gap closed; T-8 principle precondition from wave-10 L-2 now satisfied | informational | resolves 4-wave finding | **PROMOTED → T-8 rule 1** |

## Action 4 — Filter to promotion candidates

Only **obs-4** clears all three bars AND the head's promotion bar:

- **obs-1 (CI false-green) — HELD.** Generalizable + falsifiable + cited, but **first-occurrence** of this specific mechanism (`gh run watch --exit-status` reflecting the last-streamed job's exit, not the aggregate run conclusion). Verified against prior observations: no wave-1/7/8/9/10 record of this mechanism. It is adjacent to but DISTINCT from CI-PRINCIPLES rule 1 (deploy-state-vs-/health): rule 1 governs *deploy* verification via the platform deployment-state endpoint; obs-1 governs *CI-check* verification via `gh pr checks` / run conclusion over `gh run watch`. Distinct enough to be promotable in principle, but the recurrence discipline (`Wave-specific "broke once" stays in observations until a second wave confirms`) governs: ONE occurrence does not clear the bar. The cost was zero this wave (caught pre-merge). **Hold for recurrence.** If a second wave hits a `gh run watch` false-green, promote then.
- **obs-2 (gitleaks identifier-not-credential) — HELD.** Informational, first-occurrence; the scoped triple-constrained allowlist with `useDefault=true` worked and is documented. Becomes a CI-PRINCIPLES note candidate only if the identifier-vs-credential classification recurs.
- **obs-3 (P-3 false provenance) — HELD.** First-occurrence of this sub-class (a plan asserting false prior-wave execution). Related to wave-10 obs-5 (inflated test count) but distinct mechanism + earlier detection point (P-4 vs V-1). The P-4 gate functions correctly as the existing structural control; no new rule warranted until a second confirming instance.
- **obs-4 (T-8 authz live-verify) — PROMOTION CANDIDATE.** See Action 5.

## Action 5 — karen vetting (1 candidate → T-8.md)

Candidate file: `process/waves/wave-11/blocks/L/candidates/T-8.md`. Target: `command-center/principles/test-layer-principles/T-8.md` (Rules section empty; no near-dup). Provenance verified: head independently confirmed against `process/waves/_archive/wave-10/stages/L-2-distill.md` + wave-10 obs-1 that wave-10 L-2 **deliberately deferred** this exact T-8 rule, citing the unsatisfiable-mandate risk, with the explicit instruction "promote the T-8 rule at wave-11 L-2 once the fixture exists and was used." Precondition now met (fixture exists + used; POST /servers 201). This is NOT a fresh one-off — it is a 4-wave-recurring (wave-7/8/9/10) finding whose promotion was correctly gated on the fixture's existence.

karen verdict: **APPROVE.**
- **Format PASS** — 2 lines; rule 107 chars (≤120), why 94 chars (≤100); no forbidden tokens; ends with periods; sequential rule 1; falsifiable.
- **Code-claim VERIFIED real** (not hallucinated) against the live guard architecture:
  - `apps/api/src/auth/auth.guard.ts:24` — SuperTokens `verifySession()` 401 short-circuit = the auth gate.
  - `apps/api/src/rbac/channel-permission.guard.ts:54-57` — `RbacService.canViewChannel()` → 403, runs only post-auth = the authz core a 401 probe never exercises.
  - `apps/api/src/auth/session-no-verify.guard.ts` — the `/me` EV-exempt bypass, which is why the proof correctly targeted EV-gated POST /servers.
  - Fixture live + secrets-safe: V-1-jenny AC1/AC3 (201, user.id 21984eb2); `git ls-files command-center/testing/test-accounts.md` empty + `git check-ignore` exit 0 (re-run by karen).

| candidate | target file | karen verdict |
|---|---|---|
| obs-4 (T-8 authz live-verify) | test-layer-principles/T-8.md (→ rule 1) | APPROVE |

## Action 6 — Lint + promote

| candidate | target | attempt 1 | rewrite | result |
|---|---|---|---|---|
| obs-4 | T-8.md | `linter:OK` | — | **PROMOTED rule 1** |

T-8.md rule 1:
```
1. Live-probe the authz path against prod at T-8 with a verified prod fixture on every authed-feature wave.
   Why: A 401 probe confirms only the auth gate; the authz core needs a real verified session.
```

One promotion this wave (T-8.md only; per-file cap respected; all other observations held). This closes a 4-wave gap from a real, non-self-violating exemplar — the disciplined opposite of bloat.

## Action 7 — Observation pipeline + carry-forward

Observations recorded in `process/waves/wave-11/blocks/L/observations.md` (4 obs). No candidates dropped by linter. Carry-forward signals for N-1:

- **N-1 decompose flag — M3 first messaging bundle (`backlog-stockout`):** M3 messaging feature scope is undecomposed (0 feature tasks; 3 open are carried tech-debt). The verified fixture + new T-8 rule 1 now mandate live-verifying authed message paths in that bundle. Likely shape: `messages` table + send/list API + Socket.IO gateway + message UI; reuses wave-10 `ChannelPermissionGuard`.
- **Soft signal (obs-1):** if a second wave hits a `gh run watch --exit-status` false-green, promote a CI-PRINCIPLES rule (`treat run conclusion / gh pr checks as authoritative over gh run watch exit status`).
- **Soft signal (obs-2):** gitleaks identifier-vs-credential classification — note candidate if it recurs.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 4a2ad286-c068-406b-a2b3-4fee2a4d528b done (verified via SELECT)"
  - "observations: process/waves/wave-11/blocks/L/observations.md (4 observations)"
  - "principles promotions: 1 across [test-layer-principles/T-8.md]"
tasks_marked_done: [4a2ad286-c068-406b-a2b3-4fee2a4d528b]
tasks_skipped_with_reason: []
observations_emitted: 4
promotion_candidates: 1
karen_verdicts: [{candidate_id: obs-4, target_file: "command-center/principles/test-layer-principles/T-8.md", verdict: APPROVE}]
linter_runs: [{candidate_id: obs-4, target_file: "command-center/principles/test-layer-principles/T-8.md", attempt: 1, verdict: OK, rejection_code: ""}]
candidates_dropped_by_linter: []
promotions_applied: [{file: "command-center/principles/test-layer-principles/T-8.md", line: "Rules rule 1", rule: "Live-probe the authz path against prod at T-8 with a verified prod fixture on every authed-feature wave."}]
note: "1 promotion (T-8 rule 1) closing a 4-wave recurring gap whose promotion wave-10 L-2 explicitly deferred to wave-11 once the fixture existed. 3 first-occurrence observations held for recurrence."
```

## Exit criteria

- [x] Every claimed_task_id is `done` (verified via Action 2 SELECT).
- [x] knowledge-synthesizer ran with full input (wave-11 + prior {1,7,8,9,10} + principles).
- [x] Observations recorded (4) in blocks/L/observations.md.
- [x] Promotion candidate (1) vetted by karen against the T-8 contract; code-claim verified real.
- [x] karen-APPROVED candidate passed the deterministic linter (attempt 1 OK).
- [x] At most one promotion per principles file (1 → T-8.md).
- [x] Promotion commit pushed with candidate file as audit trail.
- [x] L-2 deliverable written; `l_stage_verdict: COMPLETE`.
- [x] checklist L-2 row checked.
