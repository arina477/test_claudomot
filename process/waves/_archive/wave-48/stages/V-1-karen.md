# V-1 Karen — Source-Claim Verification (wave-48)

**Stage:** V-1 (source-claim verifier axis; jenny runs spec-conformance independently)
**Wave:** 48 — DM candidate privacy negative-case integration test (TEST-ONLY)
**Merge commit under review:** `c79343b7ada67ff9e03566e35c4f0617456373a6`
**Verdict:** **APPROVE**
**Findings:** 7 claims verified TRUE, 0 contradictions, 0 antipatterns detected.

---

## Scope note

This is a test-only hardening wave. The load-bearing question is not "does a
feature work" but "are the two new assertions REAL (real SUT + real PG, not
mocks), did they RUN GREEN in CI, and is the diff genuinely test-only." I
verified each claim against files on disk + git + the C-1 CI deliverable. No
spec-conformance judgment is made here (jenny's axis).

---

## Claim-by-claim findings

### Claim 1 — Real SUT, not a mock. **CONFIRMED**
`apps/api/test/integration/dm-candidates.spec.ts`:
- Line 25: `import './pg-harness';` is the FIRST import (side-effect), before any SUT module.
- Line 38: `import { DmService } from '../../src/dm/dm.service';` — real SUT class, imported AFTER the harness (line 25) and after the named harness re-import (lines 26-33).
- Lines 71-72: `sut = new DmService(emitter)` — a real `DmService` instance (real `EventEmitter2`, not a mock of the service).
- Line 105 / 142: `await sut.getDmCandidates(CALLER)` — calls the REAL method.
- Harness `apps/api/test/integration/pg-harness.ts:17-21` sets `process.env.DATABASE_URL = process.env.DATABASE_URL_TEST` at module-eval, and `apps/api/src/db/index.ts:31` is a lazy `Proxy` that resolves the Pool at first property access (`_db = drizzle(getPool(), …)` at line 26). Import order therefore guarantees the SUT's `db` singleton binds to the TEST DB. No mock of `db`, `.where()`, or the query builder anywhere in the file.
- Evidence rules OUT the wave-46/47 "mock-the-SUT" antipattern (those used a mock whose `.where()` was a no-op). This test hits real PG.

### Claim 2 — WHERE predicate under test actually exists in the SUT. **CONFIRMED**
`apps/api/src/dm/dm.service.ts` `getDmCandidates` (lines 677-721), WHERE at lines 702-708:
```
and(
  inArray(alias.server_id, callerServerIds),   // line 704 — disjoint-isolation predicate (maps to assertion b)
  ne(alias.user_id, callerId),                 // line 705 — self-exclusion
  ne(users.who_can_dm, 'nobody'),              // line 706 — nobody-exclusion predicate (maps to assertion a)
)
```
Both test assertions map to REAL predicates, not a no-op:
- Assertion (a) nobody-exclusion → `ne(users.who_can_dm, 'nobody')` (line 706).
- Assertion (b) disjoint-isolation → `inArray(alias.server_id, callerServerIds)` (line 704), scoped by the caller's server IDs fetched at lines 679-686 (early-return `[]` at 684 when caller is in no servers — which is why assertion (b) expects length 0).

### Claim 3 — Positive control present (guards against vacuous negative). **CONFIRMED**
`dm-candidates.spec.ts` assertion (a):
- Line 97: inserts `USER_Y_EVERYONE` with `who_can_dm='everyone'`, a co-member of the shared server (membership line 103).
- Line 110: `expect(ids).toContain(USER_Y_EVERYONE)` — asserts the everyone-user IS returned.
- Line 113: `expect(ids).not.toContain(USER_X_NOBODY)` — asserts the nobody-user is NOT.
The positive control (line 110) proves the query returns co-members in general, so the negative (line 113) cannot pass vacuously by the query simply returning nothing. This is the exact guard against the decorative/vacuous-test antipattern. Self-exclusion also asserted (line 116).

### Claim 4 — Real disjoint user present. **CONFIRMED**
`dm-candidates.spec.ts` assertion (b):
- Line 133: inserts `USER_Z_DISJOINT`; lines 135-136 create `SERVER_S` (caller-owned) and `SERVER_T` (Z-owned); lines 139-140 make CALLER a member of `SERVER_S` ONLY and Z a member of `SERVER_T` ONLY — genuinely disjoint (no shared server).
- Line 147: `expect(ids).not.toContain(USER_Z_DISJOINT)` — absence.
- Line 150: `expect(candidates).toHaveLength(0)` — list length 0.
Both the absence AND the length-0 assertions are present as claimed.

### Claim 5 — Harness param backward-compat. **CONFIRMED**
`apps/api/test/integration/pg-harness.ts:100-105`:
```
export async function insertFixtureUser(
  id: string,
  email: string,
  username?: string,
  whoCanDm: 'everyone' | 'server-members' | 'nobody' = 'everyone',  // line 104 — defaulted
): Promise<void>
```
The `whoCanDm` param defaults to `'everyone'` (matches DB column default per doc comment lines 96-98). Diff (git show) confirms the only functional change was adding this defaulted 4th param + threading it into the INSERT (`who_can_dm` column, `$4`). Existing 3-arg callers are unaffected — verified by the default value; no existing call site was forced to change.

### Claim 6 — NO production code changed. **CONFIRMED**
`git show --stat c79343b…` — the only `apps/` changes are:
- `apps/api/test/integration/dm-candidates.spec.ts` (+160)
- `apps/api/test/integration/pg-harness.ts` (+9/-… test-only)
All other 17 files in the diff are `process/waves/wave-48/**` deliverable `.md` files (allowed). A grep of the name-only diff for `src/|schema|migration|drizzle|.tsx|.vue|apps/web` (excluding `test/`) returned only `process/waves/wave-48/stages/B-0-branch-and-schema.md` — a process doc whose filename merely contains the word "schema"; NOT a source/schema/migration/UI file. Confirmed: no `src/` production file, no schema, no migration, no UI.

### Claim 7 — CI ran it green (not skipped). **CONFIRMED**
`process/waves/wave-48/stages/C-1-pr-ci-merge.md`:
- Lines 45-46 record both assertions with a `✓` PASS marker (NOT `↓`/skip) and non-zero timings: `(a) … 60ms`, `(b) … 49ms` — real-Postgres round-trips, not 0ms mock/skip.
- Line 40 documents the `test` job sets `DATABASE_URL_TEST=postgres://…/studyhall_test` against a `postgres:16` service; the `describe.skipIf(!process.env.DATABASE_URL_TEST)` guard (spec line 43/62) therefore did NOT fire in CI.
- Line 50: grep for a dm-candidates skip line = NONE (the `SKIPPED:` branch at spec lines 156-159 did not execute).
- Line 51: integration pass = `Test Files 17 passed (17)`.
- Lines 65-84 `ci_stage_verdict: PASS` with `verdict_source: gh`; merge commit matches the SHA under review.

---

## Antipattern sweep (proportionate)

- **decorative/vacuous test** — NOT PRESENT. Positive control (claim 3, spec line 110) makes the negative non-vacuous.
- **claimed-but-fake** — NOT PRESENT. Every assertion described in the commit/spec is physically present in the file (lines 110, 113, 116, 147, 150).
- **mock-the-SUT** — NOT PRESENT. Real `DmService` + real PG via harness import-order + lazy `db` Proxy; no `.where()` no-op mock. This is the corrective for the wave-46/47 mock gap.

---

## Verdict

**APPROVE.** All 7 load-bearing claims are TRUE against codebase reality. The two
assertions are real (real SUT, real Postgres), non-vacuous (positive control +
length assertions), map to actual SUT WHERE predicates, ran GREEN in CI on
postgres:16 (60ms/49ms, not skipped), and the diff is genuinely test-only with
zero production/schema/migration/UI change. The harness param is backward-compatible.
Nothing found wrong on this small-but-non-trivial change.
