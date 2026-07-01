# Wave 24 — P-2 Spec (pointer)

**Spec contract lives in the DB:** `tasks.description` of seed `02fa8011-1d44-4a02-a808-eba7191fba1b` (single-spec YAML head + `---` + prose). This is a convenience pointer.

**wave_type:** single-spec. **claimed_task_ids:** [02fa8011]. **design_gap_flag:** false.

## Acceptance criteria (real-DB integration coverage, each a real-DB round-trip)
1. presence.service co-member resolution against real Postgres (shared-server co-members resolved from real server_members; empty set for no co-members).
2. servers.service member-gate (GET /servers/:id/members): member→roster, non-member→403, against real rows.
3. wave-23 rbac/assignments authz: getEffectivePermissions (owner all-true / member role-flags / no-role all-false / non-member 403) + assertOrganizer manage_assignments gate, against real roles rows.
4. Each spec's load-bearing assertion is a REAL-DB round-trip (harness fixtures + real query, no mock/stub); reuse wave-17 pg-harness; NO tier rebuild/testcontainers/new CI job.
5. The specs ACTUALLY execute in CI (postgres:16 + DATABASE_URL_TEST, nonzero count) — green-with-0/skipped = false-green (wave-17 lesson; T-4 verifies per-job).

## Binding BOARD condition (T-4)
Verify per-CI-job the integration tier executed (nonzero + real-DB row assertions), not just green.

## Out of scope
Reminders (cred-blocked, deferred); tier rebuild/testcontainers/new CI job; exhaustive edge specs; production code.

→ P-3 Plan.
