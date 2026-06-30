# Wave 16 — P-4 Verdict

**Reviewer:** head-product (fresh spawn)
**Reviewed against:** process/waves/wave-16/blocks/P/review-artifacts.md
**Attempt:** 1  (first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-16 adds the first authenticated browser E2E for the live create-server flow (sign in as verified fixture → create a uniquely-named server → assert it appears in the server rail and #general appears in the channel sidebar), closing the wave-7 V-3 carry where the core auth-gated front-door shipped (M1, LIVE) with zero browser coverage. The framing is sound: the reframe trio (problem-framer PROCEED, ceo-reviewer PROCEED/HOLD-SCOPE, mvp-thinner OK) independently confirmed this is a real root-cause coverage gap fixed at the right layer, ladders to M3 (cited milestone 6198650e), is falsifiable (the E2E either exists-and-passes or not), and is right-sized happy-path with edge cases (empty-name validation) correctly deferred — no gold-plating. The single-task bundle has no unbuilt dependency: the blocking fixture dependency is resolved (studyhallfixturea/b provisioned waves 11/14/15). The spec contract is embedded in the primary task row's `tasks.description` as a YAML head with five independently-verifiable ACs plus edge-cases and explicit non-goals. The plan reuses the canonical Playwright authed pattern (setup project + storageState) rather than inventing a parallel per-test sign-in, introduces no schema/API/dep, and the anti-flake contract (web-first assertions, no sleeps, deterministic unique names, no retry-masking) is load-bearing and concrete given the project's known server-roles flake. I ratify the P-1 floor-override (detail below) and the security-surface disposition (detail below). All upstream stage-exit boxes tick from concrete artifacts. Proceeding to Phase 2 (Karen + jenny + Gemini).

## Key judgments ratified

### 1. Floor-override (P-1) — RATIFIED
P-1 found the single E2E (~400–700 LOC est.) below the >1500 single-spec floor and applied an OVERRIDE-SHIP test-infra exemption directly as a technical/process call (rule 17), kept single-task, logged in `command-center/product/product-decisions.md` (wave-16 entry, lines 215–218). This is defensible and I ratify it:
- The LOC floor is a **feature-sizing heuristic** guarding against thin *feature* waves. Test code is inherently lower-LOC than the feature it covers; a test-coverage tech-debt seed structurally cannot clear a feature-LOC floor. Applying it here is a category error, not a thinness signal.
- The decomposer **cannot** author feature-siblings for a tech-debt seed — the seed (46f16288) is not a milestone `## Scope` feature item, so RESCOPE-AUTO-MERGE correctly no-ops (confirmed: it already no-op'd at wave-15 N-1). There is no feature-sibling merge available.
- The adjacent create-server test tasks (25523fb0 PG-rollback, 02fa8011 real-PG-tier) are **unrelated test-debt**, not siblings of this seed. Bundling them to inflate LOC would be decomposition bloat and would violate the N-2 single-seed pick — the wrong move. Convening a BOARD floor-merge for an inapplicable heuristic is disproportionate ceremony with no decision content.
- The override is correctly scoped: single-task preserved, no autonomous scope balloon, logged for future test-infra waves to apply rather than re-litigate. This is the right disposition — neither escalate nor bundle.

### 2. Security-scope tightened gate — EVALUATED, does NOT trip
The wave drives a sign-in + authenticated session and sets repo secrets — surfaces I am obligated to evaluate against `{auth, sessions, user-creation, cookies, rate-limit, payments}`. Disposition: the tightened P-4 security gate does **not** apply, because the wave **adds no auth/session production surface** — it *exercises* the already-shipped, already-verified SuperTokens login + session from the outside via a browser test. `wave_touches ∩ {security set} = ∅` for the gate's purpose (the gate guards changes to those surfaces, not black-box tests of them). Two security hygiene items are nonetheless load-bearing and correctly specified in P-3, which I confirm:
- **Credential handling:** the verified-fixture password lives only in gitignored `command-center/testing/test-accounts.md`; it is read from env (`E2E_FIXTURE_EMAIL`/`E2E_FIXTURE_PASSWORD`), set in CI via `gh secret set` (orchestrator ops, rule 6 — provisioned test creds, not account-issued), and **never committed**. Correct and secure.
- **storageState secrecy:** `e2e/.auth/fixture.json` holds a live session and is gitignored. Correct — never commit a live session artifact.
These are spec/plan hygiene, satisfied; they do not escalate the gate tier. Karen will spot-check the no-commit claims in Phase 2.

## Stage-exit checklist (all ticked from artifacts)
- **P-0 Frame:** concrete user job (authed create-server front-door) ✓; root cause not symptom (zero-coverage gap, not a demo artifact) ✓; one cited milestone M3/6198650e ✓; falsifiable (E2E exists+green) ✓; problem-framer + ceo-reviewer + mvp-thinner verdicts present and reconciled ✓.
- **P-1 Decompose:** one seed, no must-ship siblings (single tech-debt seed) ✓; nothing to re-classify (test-infra, no AC-thinness purchase per mvp-thinner) ✓; no dependency on unbuilt task (fixture resolved) ✓; floor-override ratified ✓.
- **P-2 Spec:** five enumerated independently-verifiable ACs ✓; edge/failure states specified (sign-in fail → loud fail not silent skip; collision via unique suffix; empty-name out of scope) ✓; non-goals explicit (validation, threads/attachments) ✓; security surface evaluated (above) ✓; spec contract embedded as YAML head in `tasks.description` of 46f16288 (verified by direct DB read) ✓.
- **P-3 Plan:** reuses canonical storageState authed pattern, not a parallel path ✓; no infra the MVP doesn't need (no schema/API/dep/Redis/replica) ✓; every AC maps to a file-level step producing an observable artifact (self-consistency sweep present) ✓.

---

# P-4 Phase-2 Triage — Gemini cross-review CONCERN

**Reviewer:** head-product (same spawn, Phase 2 triage)
**Phase:** 2 (Karen + jenny APPROVED; this triages the single Gemini CONCERN)
**Source claim (verbatim):** "The 'best-effort' cleanup strategy for test-created servers in the production environment is a band-aid that masks a future, inevitable failure mode. While unique naming prevents assertion collisions, it allows state to accumulate until the test account hits a product limit (e.g., max servers), at which point the test will deterministically fail."

## Decision
**NOT-MATERIAL** — accept-with-logged-follow-up. Gate proceeds to B.

## Grounding (read the actual create/delete code)
Decisive facts, verified against `apps/api/src/servers/servers.{service,controller}.ts` and `apps/api/src/db/schema/servers.ts`:

1. **No per-user max-servers limit exists.** `ServersService.createServer` (servers.service.ts:67–117) performs an unconditional `INSERT INTO servers` inside a transaction — zero count/quota check before insert. The `servers` schema has no per-owner constraint. Grep for `max.?server|server.?limit|quota|MAX_SERVERS` across `apps/api/src` returns nothing relevant: the only `Too Many Requests` hit is the global HTTP rate-limiter in `main.ts` (a per-window *request-rate* throttle), which a once-per-run create cannot trip; the only `count`-ish server hit is a presence ref-count comment. **There is no product limit for accumulation to collide with.**
2. **No delete/leave-server affordance exists.** `@Delete` decorators in the API exist only for roles, channel-overrides, and messages (`rbac/`, `channel-override`, `messaging/messages.controller.ts`). There is no `deleteServer`, `leaveServer`, or `removeMember` route on the servers surface. The E2E *cannot* delete the server it creates — the endpoint a teardown would call does not exist.

## Why NOT-MATERIAL (per the triage decision tree, branch 3)
- Gemini's "deterministic future failure" is explicitly conditioned on hitting "a product limit (e.g., max servers)." **That limit does not exist in the code.** With no cap and no delete endpoint, accumulation is real but **unbounded-tolerable**: it produces cosmetic data growth in one verified prod fixture account, not a deterministic test failure. The failure mode Gemini names is contingent on a precondition the codebase does not satisfy, so the CONCERN does not land as material against this codebase.
- The cheap-and-correct fix Gemini implies (afterAll teardown via `DELETE /servers/:id`) is **not available** — there is no delete affordance to call. Forcing teardown would require building a delete-server feature first, which is a separate product surface, out of scope for a test-coverage tech-debt seed and would be exactly the gold-plating P-1 already guarded against.
- The remaining alternative (retarget the E2E at a LOCAL/ephemeral app instead of live PROD) is a materially larger change that contradicts the wave's accepted design (authed E2E against `E2E_BASE_URL`, default live PROD, verified prod fixture) — ratified in Phase 1. Re-opening it on a non-load-bearing accumulation concern is disproportionate.
- P-3's stated disposition ("best-effort/tolerated — unique names keep runs independent; a teardown that deletes the created server is a nice-to-have **if a delete-server affordance exists**, else accept accumulation") is exactly correct given the code: the affordance does not exist, so "accept accumulation" is the right branch, and it was authored with the correct conditional.

## Disposition / follow-up logged
- **Accept-with-documented-risk.** The risk is bounded and cosmetic at self-use-MVP scope (founder is the only user; one fixture account). No P-3 or P-2 rework required.
- **Follow-up seed (logged, not blocking):** when a delete-server / leave-server affordance ships (its own milestone), add an `afterAll`/`afterEach` teardown to this E2E that deletes the server it creates via the new endpoint. This is a test-debt follow-up gated on a feature that does not yet exist — it is NOT a precondition for this wave. To be carried as an N-1 trigger note / backlog item, not a sibling of seed 46f16288.
- If accumulation ever becomes operationally visible before that feature ships (e.g., the fixture's server rail becomes unwieldy for manual dogfooding), a one-off manual/DB cleanup of `name LIKE 'e2e-%'` rows is sufficient — no code change needed.

## What would have flipped this to MATERIAL
For the record (so a future wave doesn't re-litigate): this flips to MATERIAL the moment EITHER (a) a per-user/per-account max-servers limit is introduced in `createServer`, OR (b) a `DELETE /servers/:id` affordance ships. Under (a) accumulation becomes a genuine deterministic future failure and the test must gain teardown or a fresh-fixture-per-run strategy; under (b) the cheap teardown fix becomes available and required. Until then, accept.

## Phase-2 verdict
**APPROVED** — Karen APPROVE + jenny APPROVE + Gemini CONCERN triaged NOT-MATERIAL (logged). No spec-vs-bet or load-bearing-claim drift unresolved. design_gap_flag = false (backend/test-infra wave, no UI gap) → handoff to B-block.

---

## Footer
- verdict_complete: true
- phase2_complete: true
- gemini_concern_disposition: NOT-MATERIAL-accept-with-logged-follow-up
- rework_attempt_cap_remaining: 3

---
## Phase 2 final (appended by orchestrator)
| Reviewer | Verdict |
|---|---|
| karen | APPROVE (create-server flow VERIFIED real: CreateServerModal/ServerRail/ChannelSidebar exist, #general server-seeded; fixtures present; CI job exists). **B-block carry: test-automator NOT in AGENTS.md → use `ui-comprehensive-tester` (catalog Playwright author) + note swap (rule 11).** |
| jenny | APPROVE (1:1 with wave-7 carry intent; floor-exemption coherent; no creep into real-PG-tier/PG-rollback; test-infra, no M3-close). |
| Gemini | CONCERN (prod test-server accumulation) → head-product triaged NOT-MATERIAL (no max-servers limit + no delete affordance; accept-with-logged-follow-up; flip if either ships). |

## Gate result: PASSED → B-block (design_gap_flag false → D SKIPS)
- B-block carries: (1) spawn `ui-comprehensive-tester` not `test-automator` (note swap); (2) follow-up backlog: add E2E teardown deleting the created server once a DELETE /servers/:id affordance ships (N-1 note, not a sibling).
