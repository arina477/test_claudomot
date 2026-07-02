# Wave 36 — P-0 Frame

**Wave topic:** M7 test-hardening + polish — regression tests for the wave-35 privacy endpoints (seed 622a7bf3) + 2 siblings.
**Milestone:** M7 (6e2f68d8) in_progress · Class=product-polish · last H1 · MVP-completing.
**wave_db_id:** 5c430ddd-7960-4acd-9acc-4c7f59712b8f · **Mode:** automatic.

## Discover
- **wave_db_id:** 5c430ddd-7960-4acd-9acc-4c7f59712b8f (wave_number 36).
- **Prior work:** wave-35 (archived) shipped the M7 privacy endpoints LIVE; V-2 flagged the coverage-gap → this bundle discharges that debt.
- **Roadmap:** M7 active + in_progress; waves.milestone_id backfilled to M7.
- **Spec-contract short-circuit:** no-prior-spec (prose seed) → full P-1..P-3.
- **Product decisions:** none (no Tier-3 signal — test-hardening + tiny fixes; ceo-reviewer confirmed no spend/legal/data).

## Reframe (mvp-thinner NOT spawned — M7 Class=product-polish)
- **problem-framer → PROCEED** (no antipatterns). Symptom-vs-cause: writing the tests IS cause-appropriate — the authz/privacy boundary is currently proven only by ephemeral T-8 live reproduction; durable regression protection is the real gap. Deeper cause (wave-35 B-block should have authored tests inline) = a BUILD-PRINCIPLES observation candidate, NOT a reframe.
- **ceo-reviewer → PROCEED (HOLD-SCOPE)**. Test-hardening protects the wedge (privacy is the named Discord-displacer differentiator; a silent regression fires the bet's own falsifier at cohort-launch). No richer M7 feature waiting (notifications surface doesn't exist; canary gated <1000 DAU). Coherent, correctly sized. No Tier-3.

## P-0 outcome — **PROCEED**
### BINDING carry-forwards for P-2/P-3 (load-bearing):
1. **Real-Postgres integration for the authz tests** — the roster-filter (servers.service.ts:253) + data-export IDOR tests MUST run against real Postgres via the existing `apps/api/test/integration/pg-harness` (siblings: rbac-assignments-authz.spec.ts, servers-member-gate.spec.ts; CI postgres:16 container + DATABASE_URL_TEST). **Mocking the db = mock-the-SUT test-theater** — the single failure mode that voids this wave. Hard AC-shape constraint.
2. **Layer assignment:** toUiVisibility / updatePrivacy / beforeSend PII-scrub = unit; invalid-enum→400 = controller contract test (Zod safeParse); roster filter + export self-scoping = real-DB integration.
3. **Sibling 73e96a9d** = a spec-authoring / product-decisions note ("apply §113 states when a notifications UI is built"), NOT executable code — route as documentation at P-1/P-2, not a build item.
4. **Sibling b7feab30** = 1-line cosmetic (stub date) on the /privacy + /terms trust surface.
5. **LOC-floor exemption:** test-coverage waves are exempt from the normal P-1 minimum floor (wave-16 precedent) — relevant for P-1 sizing.

## Next
→ P-1 Decompose (3-task bundle; design_gap_flag likely FALSE — test-authoring + 1-line date; no new UI).
