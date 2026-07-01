# Wave 23 — P-0 Frame

## Discover section
- **wave_db_id:** e894f8a9-92bc-40e7-a5f7-4e8c7d5f1ecb (wave_number 23, status running; FS dir ↔ DB row trace).
- **Prior-work citation:** wave-22 (M5 assignments bundle 1, LIVE). product-decisions.md ll.295-298 logged the manage_channels reuse + the dedicated manage_assignments follow-on as immaterial UNTIL the first non-owner assignment-organizer role exists.
- **Roadmap milestone:** M5 (a5232e16) Academic tooling: assignments — in_progress. Class=product-feature, Tier=T3, Horizon=H1. wave row milestone backfilled = M5.
- **Spec-contract short-circuit verdict:** no-prior-spec (seed 8aa67564 carries prose only — full P-1..P-3 run).
- **Product-decision resolutions:** none (additive, risk-free authz refinement; no Tier-3 money/security/major-UX signal).

## Reframe section
**Original task framing:** seed 8aa67564 — add a dedicated `manage_assignments` RBAC permission split from `manage_channels` (extend Permission union 4→5, roles-table flag, role DTOs + roleToDto, swap the single assignments controller can() call site).

**problem-framer:** PROCEED. Targets the cause (capability conflation: one permission bit now means channel-admin AND assignment-posting) at the correct layer (rbac Permission model). Premises verified in code: rbac.service.ts:29 (4-permission union), :123-126/:155-158/:550-566 (role flag columns + create/update DTO + roleToDto), assignments.service.ts:61 (single assertOrganizer can(manage_channels) call site), backfill-roles.ts:50 (owner-only seed → no rows to migrate). Not premature-abstraction (one flag, one live consumer). Deferred value/sequencing to ceo-reviewer.

**ceo-reviewer:** SELECTIVE-EXPANSION — bundle the seed WITH wave-22 V-2 follow-on edbdea8f (/me-roles client CTA gate). The seed alone is invisible plumbing (0 users, no non-owner roles, half-wired permission); the CTA alone re-entrenches the over-grant. Together = first user-perceivable end-to-end slice: "delegate assignment-posting to a TA without channel-management rights" — exactly where the wave-22-named MATERIAL trigger fires. Both additive, risk-free, autonomous (no Resend cred). Bundle EXACTLY these two; fall back to seed-alone if sizing over ceiling.

**mvp-thinner:** OK — seed already minimal-coherent; a permission with no roles-column/DTO/consumer is a dead permission, so no split (splitting = OVER-CUT). No gold-plating to cut (no role-mgmt toggle UI bundled, no backfill needed, no test sprawl). Independently flags edbdea8f as the natural end-to-end pairing (converges with ceo-reviewer) — but defers the bundling/sizing call to P-1 + ceo-reviewer's lane.

**Mediation outcome:** ceo-reviewer proposes SELECTIVE-EXPANSION; mvp-thinner = OK (not THIN) → no precedence-tie. Orchestrator ACCEPTS the expansion: both ambition + thinness lenses independently converge on edbdea8f as the cheap, disproportionate-leverage addition that turns dead plumbing into a perceivable capability, and the wave-22 decision log's material trigger fires this wave. edbdea8f re-parented under seed 8aa67564 (parent_task_id set, stale wave-22 provenance wave_id cleared). V-2 finding provenance preserved in edbdea8f's description prose.

**Sibling task IDs added:** edbdea8f-71c9-43f0-8f1f-0bcea355f183 (now parent_task_id=8aa67564).

**Disposition:** PROCEED (with accepted SELECTIVE-EXPANSION).

**Final framing for P-block:** Deliver delegated assignment-organizer authz end-to-end. (1) Backend: add a dedicated `manage_assignments` permission (Permission union 4→5, roles-table flag + additive migration, role create/update DTOs + roleToDto, swap the assignments controller can() call site manage_channels→manage_assignments). (2) Surface: a per-server effective-permissions read (/me/roles or equivalent) + gate the assignments create/edit CTA on manage_assignments rather than ownership, so a non-owner holding the new permission both IS authorized server-side AND sees the CTA. Backend-RBAC + small read endpoint + frontend gate change. **P-1 confirms sizing** — if the pair exceeds the wave ceiling, fall back to seed-alone (8aa67564) per ceo-reviewer's documented fallback, re-deferring edbdea8f.

## Exit
Discovery + reframe complete. Bundle = [8aa67564 seed, edbdea8f sibling] (provisional, P-1 sizes). → P-1 Decompose.
