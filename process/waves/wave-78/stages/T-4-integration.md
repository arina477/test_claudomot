# T-4 — Integration (wave-78)

**Pattern:** A — Verified-via-CI. The new integration spec ran green on postgres:16 in CI; audited + spec read here.

## Action 1 — Pattern decision
CI (`.github/workflows` "CI") runs `pnpm --filter @studyhall/api test:ci` against a **postgres:16** service (C-1 `test` job, run 28905313490, 2m3s). Real-DB integration is CI-covered → Pattern A. No missing-infrastructure path.

## Action 2 — CI evidence
C-1 `test` job GREEN on merge commit 855e811 (headSha 8fe9bd6). Includes the new spec `apps/api/test/integration/profile-academic-role-clear.integration.spec.ts`, explicitly named in C-1's required-checks table.

## Action 3/4 — Boundary coverage audit (spec read)
Service boundary changed: `UsersService.updateProfile` write-path (`apps/api/src/users/users.service.ts`) — param + patch column widened to `| null`; the `if (fields.academicRole !== undefined)` gate now yields the three-way. No migration (users.academic_role already nullable text — B-0 schema SKIPPED), so the only boundary to cover is the service→DB write.

The spec exercises it against **real Postgres via the pg-harness** (CF-2: pg-harness is the first import; `process.env.DATABASE_URL = DATABASE_URL_TEST`), and critically **reads the stored value back through a SEPARATE harness connection** (`harnessQuery`) — proving committed, cross-connection SQL-NULL visibility rather than in-session SUT state (aligns with test-writing-principles #26/#28). Four cases:

| Case | Asserts | Boundary proven |
|---|---|---|
| set 'educator' then null | `academic_role` IS SQL NULL (both raw harness query + `findById`) | null → SQL NULL write |
| set 'educator', then PATCH displayName only | academic_role stays 'educator'; display_name updated | undefined ≠ null (absent = leave) |
| set 'staff' | persists 'staff' | enum-string write |
| clear (null) from already-null | stays NULL | idempotent clear |

This is the authoritative real-DB validation of the wave's central write-path claim (undefined/null/string three-way). Non-enum→400 is correctly NOT tested here — it is rejected at the Zod boundary before reaching the service (garbage never reaches the typed param); that path is covered at T-3 live (case 5).

## Coverage completeness
Every changed service boundary this wave has a passing real-PG integration test. No migration boundary (none this wave). No gap.

```yaml
test_pattern: ci-verified
skipped: false
boundaries_audited: [UsersService.updateProfile write-path (undefined/null/string three-way), service read-back via findById]
ci_evidence:
  - "C-1 test job run 28905313490 green (2m3s) on postgres:16; profile-academic-role-clear.integration.spec.ts named in required checks"
  - "spec: 4 cases, real pg-harness, cross-connection read-back proves SQL NULL"
active_run_output: ""
infrastructure_gap_recorded: false
findings: []
```
