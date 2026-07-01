# Wave 23 — T-2 Unit

**Pattern:** A (CI-verified). Did NOT re-execute — audited C-1 evidence.

## CI evidence
C-1 test job = success on merge commit 489c86a (run 28485682987), with the postgres:16 service (unit + integration tiers). Local tiers: **api 395 + web 216 unit passing**.

## Coverage audit (new surface)
| New/changed surface | Unit coverage | Verdict |
|---|---|---|
| `getEffectivePermissions` (rbac.service.ts) | 7 tests (B-6 rework): owner→all-true, member-role→flags, null-role→all-false, missing-role→all-false, **non-member→403**, manage_assignments-true, all-false | STRONG (all 6 branches) |
| `assertOrganizer` swap manage_channels→manage_assignments | 4 organizer-path tests updated (assert can(manage_assignments)) + 4 non-organizer→403 negative tests (permission-agnostic mockResolvedValue(false)) | STRONG (both paths) |
| AssignmentsPanel CTA gate (owner→owner\|\|manage_assignments) | web tests updated to mock getMyPermissions + **NEW** non-owner-with-manage_assignments-sees-CTA test | STRONG |
| ServerRolesPage PERM_FLAGS 5th entry | server-roles.test.tsx renders the permission list (existing) | ADEQUATE |
| createRole/updateRole/roleToDto +flag | covered by existing rbac.service.spec role tests + the DTO round-trip | ADEQUATE |

Both authz boundaries have in-block negative-path unit coverage (BUILD rule 4, confirmed at B-6). No mock-the-system-under-test; the `as any` DI casts are mock-injection idiom (T-1 finding, acceptable).

## Flakes
None new. B-5 flakes_documented: []. C-1 flake_rerun_succeeded: n/a (0 fix-up cycles).

## Discipline note
The B-6-driven pattern — add the authz-boundary negative-path unit test in the SAME wave that swaps the permission (not deferred to T-block) — is good discipline worth reinforcing. Already covered by BUILD rule 4; no new T-2.md candidate.

```yaml
test_pattern: ci-verified
skipped: false
evidence:
  - "C-1 unit-test job: run 28485682987 success (api 395 + web 216)"
modules_audited: [rbac.service, rbac.controller, assignments.service, AssignmentsPanel, ServerRolesPage, shared/rbac]
new_flakes: []
findings: []
```

## Exit
Unit CI green + coverage strong on both authz boundaries. → T-3 ∥ T-4.
