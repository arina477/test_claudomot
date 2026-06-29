# Wave 3 — L-2 Distill

## Tasks marked done (Action 1 + verified Action 2)
Both claimed tasks closed in one batch; verification confirms `done`:
- 9aae8255-34b3-4f63-bdd4-97f39cf1d842 (Auth + profile frontend pages) → done
- a3328023-bdb2-4937-8e65-0d214442bd12 (Reconcile /me email-verification gating) → done

## Observations (Action 3)
knowledge-synthesizer ran over `process/waves/wave-3/` + prior `process/waves/_archive/wave-1/blocks/L/observations.md` (only wave-1 is archived; wave-2 transcripts lost in worker reset — reasoned from wave-1 + checklist note). 6 observations emitted to `process/waves/wave-3/blocks/L/observations.md`. All blameless + artifact-cited.

| id | theme | severity | candidate file | disposition |
|---|---|---|---|---|
| obs-1 | Build-time env/build-arg not baked into prod container (VITE_API_ORIGIN) | strong | BUILD-PRINCIPLES | **PROMOTED** (3-wave recurrence) |
| obs-2 | Workspace pkg exports → src not dist; runtime resolution breaks in prod | strong | BUILD-PRINCIPLES | folded into obs-1 rule (same failure class); per-file cap = 1 |
| obs-3 | Cross-origin SPA→API needs SameSite=None+Secure + CORS credentials + exact origin | strong | BUILD-PRINCIPLES | HOLD — first occurrence, needs 2nd wave |
| obs-4 | NestJS global filter must guard res.headersSent vs SuperTokens | warning | BUILD-PRINCIPLES | HOLD — first occurrence |
| obs-5 | Direct-push to main bypassed PR; no branch protection | warning | CI-PRINCIPLES | HOLD for recurrence; addressed via follow-up task |
| obs-6 | Dynamic `await import()` breaks instanceof at exception-filter boundary | warning | BUILD-PRINCIPLES | HOLD — first occurrence |

## Promotion candidates (Action 4)
Filtered to ALL of {generalizable, falsifiable, cited} AND head-learn bar {new, recurring, costly, binary, enforceable}:
- obs-1 + obs-2 both target BUILD-PRINCIPLES (per-file cap = 1). obs-1 has the cleaner cross-wave recurrence (wave-1 obs-2 deploy trap confirmed in archive + wave-2 reference + wave-3). The promoted rule was generalized to the **failure class** ("boot the prod-built artifact and exercise runtime config before merge") so it covers obs-1 (build-arg), obs-2 (workspace resolution), and obs-3's runtime-config half — one rule, not three narrow ones.
- obs-3/4/6 are first-occurrence; contract requires 2+ waves. HELD in observations.md.
- obs-5 (direct-push) is a one-off process deviation, not a recurring pattern → does NOT clear the recurrence bar for CI-PRINCIPLES. Promote ZERO to CI-PRINCIPLES. Addressed operationally via follow-up task 478e9d43 (enable branch protection on main).

## Karen vetting (Action 5)
Single candidate (BUILD-PRINCIPLES rule 1) → karen APPROVE.
- Format/contract: PASS (2 lines, rule 94 chars, falsifiable, zero dup risk).
- Code-claim verification (all VERIFIED line-level against the real codebase):
  - Claim 1 (Dockerfile VITE_API_ORIGIN ARG/ENV missing pre-PR#9, fixed 04244de): VERIFIED — `apps/web/Dockerfile:22-26`.
  - Claim 2 (shared pkg exports src→dist post PR#6 b3efa82): VERIFIED — `packages/shared/package.json:5-13`.
  - Claim 3 (cross-origin SameSite=None+Secure + CORS credentials + exact origin): VERIFIED — `apps/api/src/auth/supertokens.config.ts:93-97`, `apps/api/src/main.ts:35,41-43`.

## Linter (Action 6)
- Attempt 1: `linter:why>100` (Why line 117 chars incl. indent).
- Cap-1 karen rewrite → Why line shortened to 97 chars; rule line unchanged.
- Attempt 2: `linter:OK`.

## Promotion applied (Action 6)
`command-center/principles/BUILD-PRINCIPLES.md` rule 1:
```
1. Boot the production-built artifact in a prod-like container and exercise its runtime config before merge.
   Why: Config and build-arg defects pass local and CI green but surface only on first prod boot.
```
Candidate audit trail: `process/waves/wave-3/blocks/L/candidates/BUILD-PRINCIPLES.md`.

## Distill verdict (recorded)
**Promote 1 rule** (BUILD-PRINCIPLES rule 1), **promote 0** to CI-PRINCIPLES. Rationale: only the deploy-config failure class has genuine cross-wave recurrence (3 waves); every other observation is first-occurrence and held per the 2-wave contract. No new↔existing rule contradiction (both files had zero prior rules). The direct-push deviation is handled as a backlog task, not a premature principle.

## Follow-up task created
478e9d43-9cd1-4227-94e1-fa6d9572af0d — "Enable branch protection on main (require PR + green CI)", under M1, wave_id NULL, status todo.

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 9aae8255 done, a3328023 done"
  - "observations: process/waves/wave-3/blocks/L/observations.md (6 observations)"
  - "principles promotions: 1 across [command-center/principles/BUILD-PRINCIPLES.md]"
tasks_marked_done: [9aae8255-34b3-4f63-bdd4-97f39cf1d842, a3328023-bdb2-4937-8e65-0d214442bd12]
tasks_skipped_with_reason: []
observations_emitted: 6
promotion_candidates: 1
karen_verdicts: [{candidate_id: obs-1, target_file: command-center/principles/BUILD-PRINCIPLES.md, verdict: APPROVE}]
linter_runs:
  - {candidate_id: obs-1, target_file: command-center/principles/BUILD-PRINCIPLES.md, attempt: 1, verdict: REJECT, rejection_code: "linter:why>100"}
  - {candidate_id: obs-1, target_file: command-center/principles/BUILD-PRINCIPLES.md, attempt: 2, verdict: OK, rejection_code: ""}
candidates_dropped_by_linter: []
promotions_applied:
  - {file: command-center/principles/BUILD-PRINCIPLES.md, line: 70, rule: "Boot the production-built artifact in a prod-like container and exercise its runtime config before merge."}
follow_up_tasks_created: [478e9d43-9cd1-4227-94e1-fa6d9572af0d]
note: "Promote 1 / promote 0 to CI. Restraint applied: 5 deploy/runtime defects this wave but only the deploy-config class cleared the cross-wave recurrence bar; obs-3/4/5/6 held for a 2nd wave."
```
