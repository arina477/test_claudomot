# Wave 24 — T-4 Integration (KEY — the wave's deliverable)
**Pattern A (CI-verified).** This wave's WHOLE VALUE is new real-DB integration coverage. The BOARD risk-officer binding condition: verify per-CI-job the integration tier ACTUALLY executed (not a false-green).

## Verification (C-1 evidence, false-green guard HELD)
head-ci-cd at C-1 pulled the `test` job log (id 84471001038, run 28498812550) and confirmed the 3 NEW integration specs EXECUTED against the postgres:16 service (DATABASE_URL_TEST passthrough via turbo.json — the wave-17 fix):
- `presence-comembers.spec.ts` — 2 passed (getCoMemberUserIds real-DB: A→[B], no-membership→[]).
- `servers-member-gate.spec.ts` — 2 passed (listServerMembers real-DB: member→roster, non-member→ForbiddenException).
- `rbac-assignments-authz.spec.ts` — 6 passed (getEffectivePermissions 4 branches incl non-member→403 + can(manage_assignments) allow/deny).
- Integration config: "Test Files 4 passed (4)", **ZERO skips** → NOT a false-green.

## Boundary coverage
Every B-2 boundary now has real-DB integration coverage: presence co-member resolution, servers member-gate, and the wave-23 rbac/assignments authz surface (**closes F23-T-4** — the gap where the delegated-organizer authz shipped mock-only). B-6 head-builder + /review independently verified the specs are genuine real-DB round-trips (not mock-the-SUT).

```yaml
test_pattern: ci-verified
skipped: false
boundaries_audited: ["presence.getCoMemberUserIds", "servers.listServerMembers member-gate", "rbac.getEffectivePermissions + can(manage_assignments)"]
ci_evidence: ["C-1 test job log 84471001038: 3 new integration specs EXECUTED (2+2+6 passed), 0 skips, false-green guard held"]
findings: []
integration_tier_executed: true   # BOARD T-4 binding condition SATISFIED
```
