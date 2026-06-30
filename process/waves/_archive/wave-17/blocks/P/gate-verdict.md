# Wave 17 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product@P-4-phase1)
**Reviewed against:** process/waves/wave-17/blocks/P/review-artifacts.md
**Attempt:** 1  (first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This wave proves the one thing the current test suite cannot: that the create-server transaction actually rolls back. The existing unit test replaces the database transaction with an always-run stub, so if a server is half-created (server + role + member inserted, then a later step fails) nothing today catches orphaned rows. That is a real, root-cause gap — not a symptom or demo artifact — and a real database is the only thing that can prove the rollback. The single task is correctly framed against milestone M3 (the create-server atomicity guarantee), scoped to create-server only (owner-lockout transaction and the parked real-database tier 02fa8011 are deferred, not bundled — no gold-plating), and the acceptance criteria are all observable and falsifiable: forced mid-transaction failure must leave zero rows across all five tables, a successful run must commit all five, real migrations applied, deterministic and CI-green. I verified the infrastructure the plan rests on against the codebase (CI Postgres 16 service + DATABASE_URL_TEST present; the create-server transaction and its five inserts present; the user foreign-key the fixture needs present), and the harness choice (reuse the existing CI Postgres service over a new in-process engine) is the sounder option because it exercises the exact database driver production uses and is reusable by the follow-on task. Two non-blocking carry-flags below for Phase 2 and the build block. The binding tech-debt-vs-feature ordering note from the strategic review is correctly recorded and re-asserted for the next-wave survey.

## Checklist walk (P-0 → P-3, ticked from artifacts)

**P-0 Frame**
- [x] Root-cause problem: the create-server unit test stubs db.transaction (servers.service.spec.ts:76, always-invoke), so the rollback path is empirically unproven. Verified the real transaction at servers.service.ts:68 runs five inserts (server → role → member → category → channel). Cause, not symptom.
- [x] Maps to one live milestone: M3 (6198650e), seed 25523fb0 is an M3 top-level todo (wave-7 carry).
- [x] Falsifiable: observable signal = forced mid-txn failure yields zero orphan rows across the five tables; a green real-PG test is the solved signal.
- [x] problem-framer (PROCEED) + ceo-reviewer (PROCEED/HOLD-SCOPE + BINDING note) + mvp-thinner (OK) present and reconciled.

**P-1 Decompose**
- [x] One seed, no forced siblings — single indivisible test+harness; 02fa8011 correctly NOT bundled (becomes a thin harness-consumer follow-on).
- [x] Floor override (single-spec < 1500 LOC) is defensible: identical test-infra exemption as wave-16, logged in product-decisions. Test code is inherently low-LOC; a tech-debt seed cannot spawn feature-siblings.
- [x] No dependency on an unbuilt task outside the bundle.

**P-2 Spec**
- [x] ACs enumerated and independently verifiable (real txn not stub; mid-txn failure → zero orphan rows in all 5 tables; positive commit; real migrations applied; deterministic/isolated/anti-flake/CI+local-green).
- [x] Edge cases specified: failure at first insert, failure at last insert, isolation between rollback/success cases, ephemeral DB not prod/live-app.
- [x] Non-goals implicit and honored: no schema change, no API change, no new dep, scope = create-server only.
- [x] No auth/user-creation/cookie/rate-limit/session SURFACE is BUILT — backend integration test only. Security-tightened gate does NOT apply. (The test needs a user-row fixture for the owner_id/user_id FK to users.id — verified at servers.ts:17,50 — but builds no auth path.)
- [x] Spec contract embedded as fenced YAML head in tasks.description of 25523fb0 (verified) + pointer copy at P-2-spec.md.

**P-3 Plan**
- [x] Harness reuses the established node-postgres + drizzle path (the same driver prod uses) rather than inventing a parallel mechanism. Verified CI Postgres 16 service + DATABASE_URL_TEST exist (ci.yml:38-46).
- [x] No infra the MVP doesn't need: no new dep, no Redis/multi-replica/billing; reuses existing CI service and drizzle migrator.
- [x] Each plan step maps to a bundle task and produces an observable artifact (integration spec, optional harness helper, vitest config, CI confirm).

## Carry-flags (non-blocking; for Phase 2 + B-block)

### CF-1 — Spec-vs-plan harness deviation is INTENTIONAL and correctly justified (jenny watch)
The spec lists PGlite as "PREFERRED" and says the harness "stands up its own ephemeral Postgres ... must NOT depend on the prod DB or the live app." The plan deliberately deviates: reuse the existing CI Postgres service via DATABASE_URL_TEST (no new dep, exercises the real driver, reusable by 02fa8011). This is a documented, well-reasoned deviation within the spec's own `sdk` contract (which explicitly admits "OR a dedicated test Postgres") — NOT silent drift. The "must NOT depend on prod DB / live app" intent is still satisfiable: the test points at an isolated test database (DATABASE_URL_TEST), never prod. Phase-2 jenny should confirm this reads as intentional, not as the spec being quietly abandoned; recommend a one-line note in product-decisions if jenny flags it.

### CF-2 — db-singleton wiring is load-bearing and under-specified in the plan prose (karen watch / B-block)
`createServer` uses the module-level imported `db` singleton (servers.service.ts:18 `import { db } from '../db/index'`), and that singleton resolves its pool from `process.env.DATABASE_URL` — NOT DATABASE_URL_TEST (verified db/index.ts: getPool reads DATABASE_URL). The cited precedent db/index.spec.ts is a laziness/import-guard test — it does NOT open a real connection or run a transaction, so it is NOT a real-DB connection precedent. Therefore the plan's prose "connect a drizzle instance to DATABASE_URL_TEST and run the ACTUAL createServer" is imprecise: a separately-constructed drizzle instance would NOT be the one createServer calls. The correct interpretation (resolvable within AC #1, which mandates the ACTUAL db.transaction): set process.env.DATABASE_URL to the test DB before the lazy Proxy first resolves, OR have the harness inject the test instance. The lazy Proxy in db/index.ts makes the env-redirect approach clean. This does NOT block the gate — AC #1 + the codebase pin the only-correct path and the plan names an acceptable wrapped-client fallback — but B-block must wire the SUT's own `db`, not a side instance. Phase-2 karen should verify the builder targets the imported singleton.

## Escalation
(none — APPROVED)

---

## P-4 Phase-2 Triage — Gemini CONCERN (shared CI Postgres + vitest file-parallelism)

**Reviewer:** head-product (same gate, Phase 2)
**Inputs reconciled:** karen APPROVED, jenny APPROVED, Gemini CONCERN (single concern, below).

### Gemini CONCERN (verbatim)
> "The plan to reuse a single, shared CI Postgres database for all integration tests introduces a significant risk of test flakiness. While truncation provides isolation between serial test cases, it fails to prevent state contention if test files are ever run in parallel, undermining the 'anti-flake' and 'deterministic, isolated' goals."

### Verdict: **MATERIAL** → small P-3 plan annotation (NOT a rework, NOT a P-2 AC change)

### Grounding (verified against codebase, not inferred)
- **Does it fire for THIS wave? NO.** This wave adds exactly ONE real-DB integration spec (create-server rollback). `grep` confirms no other spec opens a real PG connection — the cited precedent `apps/api/src/db/index.spec.ts` is an import-laziness guard that never connects or transacts. With a single real-DB file there is zero cross-file contention today; truncate-between-cases is sufficient now.
- **Is the substrate real? YES.** `apps/api/vitest.config.ts` is bare — no `fileParallelism`, no `poolOptions.singleFork`. Vitest's DEFAULT is to parallelize test FILES across workers. So the concern's mechanism is live the instant a second real-DB spec lands.
- **Is it a real forward risk? YES, and it is built-in by the plan.** P-3 explicitly frames the harness as REUSABLE (`apps/api/test/integration/pg-harness.ts` — "the reusable real-PG tier 02fa8011 will consume"). The moment task `02fa8011` adds a 2nd integration spec against the same shared DB, vitest runs the two files in parallel by default → file A's truncate wipes file B's rows mid-run → exactly the flake the spec's own anti-flake / "deterministic, isolated" AC forbids.

### Why MATERIAL despite not firing today
The deciding test for a P-4 triage is not "does it break this wave" but "does shipping the artifact as-specified plant a trap inside a deliverable whose stated purpose is reuse." It does. The harness is sold as reusable; reusing it parallel-unsafe is the default vitest behavior, not an exotic misuse. The fix is one config directive — cheaper to specify now (when the harness author is in the file) than to debug as an intermittent CI red after `02fa8011` lands. Specifying it now also makes the harness honor its own AC ("deterministic, isolated, anti-flake") by construction rather than by luck-of-single-file. This is a parallel-path / anti-flake guardrail the plan should name, not new scope.

### P-3 annotation to apply (exact)
Add to P-3 `### Wiring` (and reflect in the `vitest.config.ts` row of the file-level steps table):

> **Integration specs run parallel-safe by construction.** The integration test project MUST NOT share-DB-contend across files. Builder picks ONE of, in preference order: (a) **`fileParallelism: false`** for the integration vitest project (a dedicated project/config that matches `**/test/integration/**` and runs its files serially) — simplest, sufficient at MVP scale; or (b) **transaction-per-test isolation** (each case runs inside a txn that is rolled back) — strongest, no truncation needed; or (c) a unique schema/database per worker. Default to (a) unless the builder finds (b) cleaner with the existing drizzle instance. The `pg-harness.ts` helper and the integration vitest project are the home for this setting so `02fa8011`'s future specs inherit it automatically. Truncate-between-cases remains for intra-file isolation.

### Bounds of the change
- **No P-2 AC change.** The existing AC "deterministic, isolated, anti-flake; green in CI + local" already DEMANDS this; the annotation only names the mechanism that satisfies it for the reusable case. No spec contract edit, no `tasks.description` rewrite required — but recommend a one-line note in `tasks.description`'s plan-pointer that the integration project is `fileParallelism:false` (or txn-per-test).
- **No rework.** Single-spec scope, single specialist (backend-developer), single milestone (M3) all unchanged. Harness choice (reuse CI Postgres) unchanged — this hardens it, does not replace it.
- **B-block carry:** B-4 (vitest/CI wiring) must implement the chosen isolation directive; B-6 head-builder verifies the integration project is parallel-safe (run/config evidence), not just that the single spec is green.

### Reconciliation with karen/jenny
karen + jenny both APPROVED and neither contradicts this — their passes were against the single spec's load-bearing claims (karen: SUT's own `db` singleton, CF-2) and spec-vs-bet fidelity (jenny: intentional harness deviation, CF-1). Gemini's concern is orthogonal to both (forward parallel-safety of the reusable harness) and is the only Phase-2 finding requiring a plan touch. No verdict conflict to escalate.

### Disposition
- **Gate remains APPROVED** (the concern is a small hardening annotation, not a blocker; nothing here re-opens P-0/P-1/P-2).
- P-3 plan updated with the annotation above before B-0.
- Logged for `02fa8011`: its future specs inherit the parallel-safe integration project — do not re-introduce a shared-DB parallel path.

**head_signoff (Phase 2): APPROVED with P-3 annotation. next_action: PROCEED_TO_B-0 (apply P-3 annotation first).**

---

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
- proceed_to: Phase 2 (karen + jenny + Gemini)
- ceo_BINDING_carry_ratified: true — tech-debt-vs-feature ORDERING decision must route to BOARD at wave-17 N-1 if the next seed would again out-prioritize M3 threads/attachments (2/3 line reached; one more tech-debt wave then decide). Confirmed recorded in P-0-frame.md:12 and review-artifacts.md.
- design_gap_flag: false → on full gate pass, D-block SKIPS → B-0.
- security_tightened_gate: NOT triggered (no auth/session/cookie/rate-limit/user-creation surface built).

---
## Phase 2 final (appended by orchestrator)
| Reviewer | Verdict |
|---|---|
| karen | APPROVE — harness/SUT-redirect/CI-PG claims VERIFIED at cited lines. CF-2 (redirect the SUT's own db singleton, not a side instance) = mandatory B annotation. db/index.spec.ts NOT a real-conn precedent. |
| jenny | APPROVE — 1:1 with wave-7 carry intent; CF-1 (PGlite→CI-PG) intentional + in-contract (sdk line allows "a dedicated test Postgres"); no creep; floor-exempt consistent; ceo binding-note = roadmap guardrail not spec change. |
| Gemini | CONCERN (shared-PG parallel flake) → head-product triaged MATERIAL → small P-3 annotation (parallel-safe integration project: fileParallelism:false / txn-per-test). Gate stays APPROVED. |

## Gate result: PASSED → B-block (design_gap_flag false → D SKIPS)
- B-block carries: (1) parallel-safe integration vitest project [B-4, B-6 verifies]; (2) CF-2 redirect SUT db singleton to test DB; (3) migrate fail-loud; (4) CI-runs/local-skips. Backend-developer specialist.
- ceo BINDING ordering note carried to N-1 (tech-debt-vs-feature BOARD decision if wave-18 would be tech-debt again).
