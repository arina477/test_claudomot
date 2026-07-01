# Wave 23 — T-4 Integration

**Pattern:** A (CI-verified — the `test` job runs the real-Postgres integration tier via postgres:16 service).

## CI evidence
C-1 test job (run 28485682987) green on merge commit — includes the integration tier (test/integration/**, DATABASE_URL_TEST on 5432). No regression.

## Boundary coverage audit
| Boundary (B-0/B-2) | Real-DB integration coverage | Verified by |
|---|---|---|
| Migration 0011 (roles.manage_assignments column) | NO dedicated integration test | **C-2 direct prod query** (column verified boolean/NOT NULL/default false; ledger 11→12; backfill 0 rows) + Drizzle migrate exit 0 |
| getEffectivePermissions (DB→service) | NO real-DB integration test | 7 unit tests (mocked DB, all branches incl non-member→403) |
| assertOrganizer → can(manage_assignments) (DB→service→handler) | NO real-DB integration test | unit tests (4 organizer + 4 negative) + B-6 /review adversarial trace + C-2 live 401-not-404 probe |

## Finding (non-blocking → V-2)
**F23-T-4 (Low): no real-DB integration test for the new authz surface.** The `test/integration/` suite has only `create-server-rollback.spec.ts`; the migration 0011 column, getEffectivePermissions, and the manage_assignments gate are covered by the UNIT tier (mocked DB) + C-2 prod-migration verification + the C-2 live probe, but NOT by a dedicated real-Postgres integration test. Functionally verified by other means; the gap is a dedicated integration test. **Reinforces existing re-homed debt task `02fa8011` (Real-Postgres integration test tier for presence/services)** — the integration tier is thin project-wide, not a wave-23 regression. Candidate: extend 02fa8011's scope to cover rbac/assignments authz against a real DB.

```yaml
test_pattern: ci-verified
skipped: false
boundaries_audited: ["migration 0011 roles.manage_assignments", "getEffectivePermissions DB→service", "assertOrganizer manage_assignments gate"]
ci_evidence: ["C-1 test job run 28485682987 success (integration tier ran, no regression)"]
active_run_output: ""
infrastructure_gap_recorded: false   # tier exists + runs; gap is coverage of the NEW surface specifically
findings:
  - {severity: Low, boundary: "new authz surface (migration 0011 + getEffectivePermissions + manage_assignments gate)", description: "no dedicated real-DB integration test; covered by unit tier + C-2 prod-migration verification + C-2 live 401 probe. Reinforces debt task 02fa8011."}
```

## Exit
Integration tier green (no regression); new-surface real-DB coverage gap logged non-blocking (F23-T-4 → V-2, reinforces 02fa8011). → T-5.
