# Wave 24 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-wave24-P4-attempt1)
**Reviewed against:** process/waves/wave-24/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This is a debt-clearing test-infra wave that adds genuine, not theatrical, regression coverage, and the P-block is coherent frame → decompose → spec → plan. The frame is correct: the problem is coverage-thinness, not missing infrastructure, and the stale wave-14 "build a Postgres test tier / testcontainers" prose was correctly reframed to "extend the wave-17 harness with new specs." I spot-checked the single load-bearing claim the whole frame rests on — the harness exists at apps/api/test/integration/pg-harness.ts (exports setupHarness / truncateTables / insertFixtureUser / countRows / teardownHarness) and the services under test are real (RbacService.can + getEffectivePermissions, presence co-member resolution) — so "extend, not build" is grounded, and the plan's harness-extension step (add insertFixtureServer/Role/Membership) is accurate about what the harness currently lacks. The wave maps to a live milestone (M5, a5232e16, in_progress) and closes the concrete wave-23 F23-T-4 gap: the manage_assignments / getEffectivePermissions authz surface shipped LIVE with zero real-DB integration coverage — testing a freshly-shipped security boundary is the least-theater coverage there is. The below-floor override-ship is BOARD-ratified 6/7 (1 ABSTAIN, no hard-stops), properly recorded in the escalation file and product-decisions, with the 3 binding conditions carried forward (T-4 false-green guard, Resend escalation, floor-rubric-revision L-2 candidate); the gate does not re-litigate a ratified sizing decision. The 5 ACs are each falsifiable and observable: AC1-3 name specific real-DB behaviors (co-member resolution incl. empty set, member→roster / non-member→403, the four getEffectivePermissions branches + manage_assignments allow/deny), and — critically for a test wave — AC4 (each load-bearing assertion is a real-DB round-trip, no mock, harness reused, no tier rebuild) and AC5 (specs ACTUALLY execute in CI, nonzero count, green-with-0/skipped = false-green) are the two guards against coverage theater. AC5 is genuinely checkable by a later reviewer per-CI-job (executed count nonzero + real-DB row-count assertions) and correctly encodes the risk-officer's binding T-4 condition. The plan maps every AC to a file-level step owned by test-automator (present in AGENTS.md), reuses the locked architecture (pg-harness + vitest.integration.config singleFork + CI postgres:16) rather than inventing a parallel path, and correctly rejects testcontainers / a new CI job as gold-plating. Non-goals are explicit (reminders arc, tier rebuild, testcontainers, new CI job, exhaustive edge specs, production code) and design_gap_flag=false is justified (test-only, no UI surface → skip D, go to B). No security-surface tightening is triggered: the wave tests an authz boundary but modifies no production auth / session / cookie / user-creation code.

## Checklist trace (concrete-artifact ticks)
- **Frame — root cause, not symptom:** PASS. Reframe from "missing infra" → "coverage-thinness"; harness existence verified by spot-check (pg-harness.ts exports present). Not a demo-path artifact.
- **Frame — one live bet/milestone cited:** PASS. M5 (a5232e16) in_progress; F23-T-4 authz-integration gap cited as the concrete driver.
- **Frame — falsifiable:** PASS. Observable solved-signal = the 3 specs execute (nonzero) in CI with real-DB round-trip assertions.
- **Frame — problem-framer + ceo-reviewer reconciled:** PASS. problem-framer PROCEED (corrected framing) + ceo-reviewer SELECTIVE-EXPANSION + mvp-thinner OK; mediation recorded, no silent override.
- **Decompose — below-floor override BOARD-ratified:** PASS. 6/7 APPROVE A, 1 ABSTAIN, no hard-stops; logged in escalation file + product-decisions 2026-07-02; 3 conditions carried.
- **Decompose — no unbuilt cross-bundle dependency:** PASS. Solo seed [02fa8011], consumes an already-built harness; no dependency on an unbuilt task.
- **Spec — each AC independently verifiable:** PASS. AC1-5 each name an observable pass/fail condition.
- **Spec — AC5 "actually executes" checkable:** PASS. Per-CI-job nonzero executed count + real-DB row assertions; false-green (0/skipped) explicitly fails — a later reviewer (T-4) can check it.
- **Spec — non-happy states for the surface:** PASS (test-wave mapping). Edge-cases block covers cross-spec truncation/teardown, non-member 403 against a real absent row, and the false-green path (DATABASE_URL_TEST stripped → fail loud, never silent-skip). Empty/loading/error/offline do not map to a no-UI test-infra wave.
- **Spec — non-goals explicit:** PASS. Out-of-scope enumerated.
- **Spec — contract embedded as fenced YAML head of primary task description:** PASS. Verified via psql on 02fa8011 — YAML head + `---` + prose present.
- **Spec — auth/session/cookie/rate-limit surface flag:** N/A. Wave tests an authz boundary but modifies no production auth surface; no tightened-security-gate trigger.
- **Plan — reuses locked architecture:** PASS. pg-harness + vitest.integration.config; testcontainers explicitly rejected.
- **Plan — no unneeded infra:** PASS. No Redis/replica/new-CI-job/new-dep; test-only.
- **Plan — each step → bundle task + observable artifact:** PASS. Self-consistency sweep maps AC1→presence spec, AC2→member-gate spec, AC3→rbac-authz spec, AC4→all-specs+harness real round-trip, AC5→B-4/B-5+T-4 execution proof.
- **Anti-coverage-theater:** PASS. Genuine regression coverage on a security-sensitive authz boundary that shipped mock-only; AC4/AC5 are specified strongly enough that a T-block can catch a false-green.

---

# Wave 24 — P-4 Verdict — Phase 2 (Gemini cross-review CONCERN triage)

**Reviewer:** head-product (same gate, Phase-2 triage tick)
**Input:** Gemini cross-review returned one material-CONCERN (text truncated by the helper).
**Triage question:** is the concern MATERIAL (structural spec/plan gap → back to P-2/P-3) or NOT-MATERIAL (log + proceed on karen+jenny APPROVE)?

## Gemini CONCERN (as received, truncated)
> "CONCERN: The plan addresses adding fixture helpers but overlooks the critical failure mode of data leakage between test files. Extending a 'createServer-scoped truncateTables' function is a band-aid that solves for cleaning specific tables but ignores the root [issue of test isolation]."

## Triage verdict: NOT-MATERIAL

## Rationale
The concern collapses into two claims; I evaluated each against the P-3 plan and the locked wave-17 harness architecture.

1. **"Ignores the root issue of test isolation."** FALSE at the artifact level. The isolation STRATEGY is present and locked in P-3, not overlooked: the integration tier runs SERIALLY in a single fork (`vitest.integration.config.ts` = `fileParallelism:false` + `singleFork:true`), so the exact failure mode Gemini names — "data leakage BETWEEN test files" — cannot occur as a parallel-DB race; there is no concurrency to leak across. On top of serial execution, the plan mandates truncate-between-cases so each spec starts from a clean DB (P-3 edge-cases: "each spec starts from a clean DB (truncate in beforeEach/afterEach) so no cross-spec row bleed; parallel-safe via the existing singleFork integration config"). This is a *structural* isolation decision (serial + truncate-between), not a per-table band-aid — and it is the established, CI-green-since-wave-17 pattern (`create-server-rollback.spec.ts`). An isolation strategy that is proven in CI across seven waves is not "ignored."

2. **"Extending truncateTables to clean specific tables is a band-aid."** This reduces to truncate-list COMPLETENESS — i.e. "does the truncate cover every table the new fixtures insert into?" That is a B-2 implementation-completeness detail, not a spec/plan structural gap, AND it is already carried: karen's Phase-2 review flagged the exact correction — extend `truncateTables` to cover the fixtured set (`server_members` / `servers` / `users` / `roles`; `roles` is already truncated at pg-harness.ts:75) and drop the phantom `assignment*` truncate the P-3 plan text erroneously names (there is no `assignment*` table — `manage_assignments` is a column on `roles`). The residual risk Gemini gestures at (a real fixtured table omitted from truncate) is precisely what karen's carry closes by naming the tables explicitly.

3. **False-green safety net.** Even in the counterfactual where B-2 shipped an incomplete truncate list, the leakage would surface as a FAILING or flaky spec, not a silent false-green: AC4 (every load-bearing assertion is a real-DB round-trip on inserted rows) and AC5 (specs must actually execute, nonzero count, green-with-0/skipped = false-green) are the gate's coverage-theater guards, and T-4 verifies per-CI-job execution. A row-bleed bug would flip a row-count assertion red. So the concern's worst case is caught downstream by design, not laundered into a passing suite.

**Net:** Gemini's "band-aid" framing is aimed at truncate-list completeness, which is (a) a B-2 execution detail, (b) already flagged with the exact fix by karen, and (c) backstopped by AC4/AC5 + the serial-singleFork architecture. The isolation *strategy* — the only thing that would constitute a P-2/P-3 structural gap — is present, sound, and CI-proven. No P-stage rework is warranted. (Caveat noted honestly: the Gemini text was truncated by the helper; I triaged the reconstructed intent. Nothing in the fuller reconstruction changes the verdict — a deeper isolation objection would still be answered by serial execution + truncate-between + the false-green guards.)

## Carry to B-2 (binding, from karen's Phase-2 flag)
- `truncateTables` MUST cover every table the new fixtures insert into: `server_members`, `servers`, `users`, `roles` (roles already at pg-harness.ts:75).
- DROP the phantom `assignment*` truncate from the P-3 plan text — no such table exists; `manage_assignments` is a column on `roles`.
- Keep truncate-between-cases (beforeEach/afterEach) + the singleFork serial config; do not invent a per-file parallel path.

## Disposition
Gate PROCEEDS on karen + jenny APPROVE. Concern logged as NOT-MATERIAL with the table-coverage correction carried to B-2. No return to P-2/P-3.

## Footer (Phase 2)
- phase2_triage_complete: true
- concern_disposition: NOT-MATERIAL / carried-to-B-2

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---

## Phase 2 — Karen + jenny + Gemini (appended)

**Verdict: PASS** (Karen APPROVE + jenny APPROVE; Gemini CONCERN triaged NOT-MATERIAL by head-product).

| Reviewer | Verdict | Notes |
|---|---|---|
| karen (a6a365186e869a2f7) | APPROVE | All load-bearing premises VERIFIED (harness exists + lacks the 3 fixture helpers; getCoMemberUserIds :119, listServerMembers :223, getEffectivePermissions :278 + can() manage_assignments all real; test-only). |
| jenny (a9ada0e25e44c643d) | APPROVE | All 5 ACs MATCH; matches BOARD decision + prior floor-override precedent; false-green guard present; reminders OUT; M5 not over-claimed. |
| Gemini | CONCERN → NOT-MATERIAL | test-isolation/leakage concern; head-product (a2b363ff8a0127afa) triaged: isolation strategy exists (serial singleFork + truncate-between-cases, CI-green since w17); reduces to truncate-list completeness (B-2 detail); AC4/AC5 false-green guards catch leakage as a failing spec. Gate proceeds. |

### Binding B-2 carries (from Phase-2 — fold into B-2, NOT rework)
1. **karen:** member-gate method = `listServerMembers` (servers.service.ts:223, gate :232, roster innerJoin :244), NOT `:128` (that's `findMyServers`). Target listServerMembers.
2. **karen + Gemini:** truncate-list completeness — `roles` already truncated (pg-harness.ts:75); there is NO `assignment*` table (manage_assignments is a column on roles) → drop the phantom assignment* truncate; ensure `truncateTables` covers all fixtured tables (server_members/servers/users/roles).
3. **jenny:** AC2 non-member → 403 is definite (spec governs); resolve the P-3 "ForbiddenException/empty" hedge against actual listServerMembers behavior at B-2 so the assertion is unambiguous.

### Gate result
Phase 1 APPROVED + Phase 2 PASS → **P-block gate-passed**. design_gap_flag=false → next block **B** (D skipped).
