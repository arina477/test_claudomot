# Wave 24 — P-0 Frame

## Discover section
- **wave_db_id:** 60734a7e-2446-470b-8620-5f96b2a23c7f (wave_number 24, running).
- **Prior-work citation:** seed origin wave-14 V-2 (F-3/F-3b, mock-DB integration gap); the reusable real-PG harness was built at wave-17 (pg-harness.ts + create-server-rollback.spec.ts + vitest.integration.config.ts) — its docstring explicitly names task 02fa8011 as the intended thin-consumer. wave-23 F23-T-4 reinforced (new authz surface had no real-DB integration test).
- **Roadmap milestone:** M5 (a5232e16) Academic tooling: assignments — in_progress. Class=product-feature, Tier=T3. wave row milestone backfilled = M5.
- **Spec-contract short-circuit verdict:** no-prior-spec (seed is prose only — full P-1..P-3).
- **Product-decision resolutions:** none (test-infra debt; no money/security/major-UX Tier-3 signal).

## Reframe section
**Original task framing:** seed 02fa8011 — "docker/ephemeral Postgres test tier (or testcontainers) for presence co-member queries + servers member-gate" (wave-14 prose).

**problem-framer:** PROCEED (corrected framing). Symptom real ("integration tests mock the DB") but the cause is **coverage-thinness, NOT missing infrastructure** — the wave-14 "build a tier" prose is STALE. Verified the harness EXISTS: pg-harness.ts (docstring names task 02fa8011 as intended consumer) + create-server-rollback.spec.ts (sole consumer) + vitest.integration.config.ts. The task's own wave-17 V-2 appendix self-corrects: "THIN CONSUMER of that harness, not a from-scratch build." matched_antipatterns: [] (greenfield-rebuild/testcontainers latent in the stale head but neutralized). Restated framing = EXTEND with new specs. Flagged scope-accretion (presence+member-gate / mentions / createReply / rbac-assignments) to P-1 as a sizing call.

**ceo-reviewer:** SELECTIVE-EXPANSION — add real-PG integration coverage of the wave-23 delegated-authz surface (manage_assignments + /me effective-permissions). Rationale: head-next justified the seed by citing F23-T-4 (the NEW authz surface gap), but the seed's literal scope is the OLDER presence+member-gate — justification and coverage don't align. Adding the authz spec makes the wave close the gap it actually cites; one more spec file on the existing tier (WIP/reviewability hold). Cap at exactly one added surface. Flags: build-quality wave (indirect bet trace); reminders should preempt once the Resend key lands.

**mvp-thinner:** OK — seed (presence co-member + member-gate) is minimal-coherent; no gold-plating bundled (self-disciplined as thin-consumer). rbac/assignments is a DIFFERENT module → ceo-reviewer's expansion lane (not an mvp-thinner split). Pre-emptive CUT flags: no tier-rebuild/testcontainers, no new CI job, no exhaustive edge-specs. **Dead-test caveat:** the load-bearing assertion in each spec MUST be the real-DB round-trip (wave-17 false-green lesson — never strip the DATABASE_URL_TEST guard or revert to mock).

**Mediation outcome:** ceo-reviewer SELECTIVE-EXPANSION + mvp-thinner OK (not THIN) → no precedence-tie. Orchestrator ACCEPTS the expansion: it is scope-*correction* (aligns the wave with head-next's own F23-T-4 justification), capped at one surface, on the existing harness. No new sibling task — the expansion broadens seed 02fa8011's scope (all "extend the integration tier with new specs"); claimed_task_ids stays [02fa8011].

**Sibling task IDs added:** none (scope broadened within the seed).

**Disposition:** PROCEED (with accepted SELECTIVE-EXPANSION).

**Final framing for P-block:** EXTEND the existing wave-17 real-PG integration harness (pg-harness.ts + vitest.integration.config.ts) with new integration spec files covering: (1) presence.service co-member resolution, (2) servers.service member-gate (GET /servers/:id/members), (3) the wave-23 rbac/assignments authz surface (manage_assignments gate + getEffectivePermissions against a real DB). Do NOT rebuild the tier / add testcontainers / add a new CI job. Each spec's load-bearing assertion is a real-DB round-trip (no mock, no stripped DATABASE_URL_TEST — the wave-17 false-green lesson). P-1 sizes (likely under floor — a test-only wave; if the floor fires, this is a coherent debt-clearing slice, expect the same override-ship consideration as wave-23; but the expansion raises LOC toward the floor). design_gap_flag expected FALSE (test-infra, no UI) → B (skip D).

## Exit
Discovery + reframe complete. Scope = [02fa8011, broadened to 3 integration-spec surfaces on the existing harness]. → P-1 Decompose.
