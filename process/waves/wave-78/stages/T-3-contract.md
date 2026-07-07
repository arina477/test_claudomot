# T-3 — Contract (wave-78)

**Pattern:** mixed — CI-verified (Zod round-trip in shared suite) **+ active live probe** against deployed prod (the write contract is a live HTTP surface changed this wave: `packages/shared/src/profile.ts` `UpdateProfileSchema.academicRole`).

## Action 1 — Pattern decision
B-1 `contracts_authored: [packages/shared/src/profile.ts]`, `sdk_regenerated: false`. Project-internal Zod contract → Pattern A applies (shared suite 41/41 green in CI). BUT the changed contract governs the live `PATCH /profile` boundary, so an active prod probe was run to prove the deployed binary honors the new nullable + `''`→null behavior end-to-end. No external SDK.

## Action 2/3 — Live contract matrix (prod, fixture A via Bearer session)
Base: `https://api-production-b93e.up.railway.app`. Authenticated as fixture A (studyhall-e2e-fixture, SuperTokens signin → `st-access-token` Bearer). Pre-test snapshot captured (`academicRole: "educator"`) and restored after (see T-3 findings / prod-clean note).

| # | Request | Expected | Live result | Verdict |
|---|---|---|---|---|
| 1 | `PATCH /profile {academicRole:"student"}` | 200, GET→student | 200, GET `academicRole=student` | PASS |
| 2 | `PATCH /profile {academicRole:null}` | 200, persists NULL, GET→null | **200**, GET `academicRole=None (null)` | PASS |
| 3 | set 'staff', then `PATCH {displayName:...}` (academicRole ABSENT) | staff unchanged (undefined≠null) | 200, GET `academicRole='staff'` (unchanged) | PASS |
| 4 | `PATCH /profile {academicRole:""}` | 200, coerced→null | **200**, GET `academicRole=None (null)` | PASS |
| 5 | `PATCH /profile {academicRole:"teacher"}` (non-enum) | **400**, value unchanged | **400**, GET `academicRole=None` (unchanged) | PASS |

All five acceptance-criterion cases from task 4be3b084 pass **live on the deployed binary**. The three-way distinction (undefined=leave / null=clear / string=set) and the `''`→null preprocess are both proven against real prod, not just the unit round-trip.

## Action 4 — Read-path shape (PublicProfileSchema) — GET /profile/:userId
`GET /profile/:userId` (self) returns exactly the safe-field allowlist — 11 keys: `academicRole, academicYear, accentColor, avatarUrl, bio, displayName, institution, program, pronouns, userId, username`. **No `email`/`mail` key** (grep clean). Read schema shape unchanged this wave (B-1 confirmed read schemas untouched); `academicRole` nullable already tolerated by the read schema (round-tripped null in case 2/4 above).

## Coverage trace
- Write contract nullable + `''`→null: covered (shared 41/41 CI + live cases 2/4).
- undefined-vs-null three-way: covered (live case 3 + T-4 integration real-PG).
- Enum preservation (non-enum→400): covered (live case 5).
- Read schema shape / no-email: covered (live GET + grep).

```yaml
test_pattern: mixed
skipped: false
contracts_audited: [packages/shared/src/profile.ts UpdateProfileSchema.academicRole]
ci_evidence:
  - "shared suite 41/41 green (C-1 run 28905313490); B-1 runtime parse vs dist: ''->null, null->null, 'student'->'student', absent->undefined, 'teacher'->Zod error"
active_probe_results:
  - "PATCH {academicRole:null} -> 200, GET null (prod, 855e811)"
  - "PATCH {academicRole:''} -> 200, GET null (prod)"
  - "PATCH {displayName} academicRole absent -> academicRole 'staff' unchanged (prod)"
  - "PATCH {academicRole:'teacher'} -> 400, value unchanged (prod)"
  - "GET /profile/:userId PublicProfile 11-key allowlist, NO email (prod)"
infrastructure_gap_recorded: false
findings:
  - {severity: low, contract: "T-3 absent-field probe (case 3) required PATCHing a non-academicRole field; used displayName which is min-length/non-null validated so it could not be restored to its original null. Fixture A displayName now 'Fixture A' (was null). Harmless self-declared test text; no A<->B block. academicRole (the wave's field) restored exactly to 'educator'.", description: "prod-state residue, non-blocking"}
```
