# V-1 Karen — source-claim verification (wave-87)

**Verdict: APPROVE**

Scope: verify the wave's load-bearing claims against the DEPLOYED merge commit
`1d2ef9df5e1bec4f74f503d4bf3f1684d7fbfc7e` (PR #107, on `main`) and the repo at
`origin/main` HEAD (`509aae84`, which adds the T-4 integration test via PR #108).
All checks run against `origin/main` (fetched state), not local working tree.

Feature: assign the server's `is_default` role to new members at join time
(`joinPublicServer` + `joinViaInvite`), null-safe, behavior-preserving, no schema change.

---

## Findings (each claim → evidence → verdict)

### 1. Resolver exists as claimed — CONFIRMED
`ServersService.resolveDefaultRoleId(tx, serverId)` exists at
`apps/api/src/servers/servers.service.ts:697-709` (origin/main). Body:
```
.select({ id: roles.id }).from(roles)
.where(and(eq(roles.server_id, serverId), eq(roles.is_default, true)))
.orderBy(asc(roles.position), asc(roles.id))
.limit(1);
return row?.id ?? null;
```
Matches the claim exactly: `where server_id + is_default=true`, `order by position asc, id asc`,
`limit 1`, returns `row?.id ?? null`. Private method, typed `Promise<string | null>`.

### 2. Both join paths stamp role_id — CONFIRMED
- `joinPublicServer` (`servers.service.ts:723-748`): resolves `roleId` at line 738, then
  `.values({ server_id: serverId, user_id: userId, role_id: roleId })` at line 743.
- `joinViaInvite` (`servers.service.ts:750-...`): resolves `roleId` at line 783, then
  `.values({ server_id: serverId, user_id: userId, role_id: roleId })` at line 789.
Both branches of `joinViaInvite` (ad-hoc invite + permanent `invite_code`) flow through the
single resolve→insert path (serverId is resolved earlier per branch, then one shared stamp+insert).

### 3. onConflictDoNothing preserved on both inserts — CONFIRMED
- `joinPublicServer:744` → `.onConflictDoNothing();`
- `joinViaInvite:790` → `.onConflictDoNothing().returning();` (`.returning()` +
  `newMemberJoined` + invite use-count accounting untouched).
Re-join does not restamp: `onConflictDoNothing` skips the insert entirely, so an existing
member's `role_id` is never touched. No UPDATE / upsert path exists on either method.

### 4. No schema change / no migration — CONFIRMED
- `apps/api/src/db/schema/servers.ts:68` already defines
  `role_id: uuid('role_id').references(() => roles.id, { onDelete: 'set null' })` — nullable FK,
  pre-existing (not added this wave). `set null` on delete is consistent with the null-safe design.
- `git diff --name-only 1d2ef9df^ 1d2ef9df` — `apps/api/src/db/schema/servers.ts` is NOT in the
  changed-file set; no `migrations`/`drizzle` files changed in PR #107. Diff-stat on the schema
  file is empty. Confirmed: zero schema change, zero migration.

### 5. Deploy serves the merge commit — CONFIRMED (within stated evidence limits)
- Live probe: `curl -fsS https://api-production-b93e.up.railway.app/health` → **HTTP 200**,
  body `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`.
- Deploy-hash claim relies on the C-2 deliverable (I have no Railway API access, as instructed):
  C-2 records deployment `d907a6e0-fc6d-46bc-9768-afbb8bdb6882`, state SUCCESS,
  `meta.commitHash = 1d2ef9df...` via the CI-13-safe commit-pinned `serviceInstanceDeployV2(commitSha:)`
  mutation (explicitly not the stale `a9556248`), newest `edges[0]` for the service, shared
  `staticUrl`. C-2's evidence chain is internally consistent and the /health probe corroborates a
  live, healthy service. Caveat (already noted by C-2): the health body carries a static app
  version, not a commit SHA, so an independent in-body SHA cross-check is not available to me —
  the deploy-hash rests on the C-2-captured Railway deployment-state, which I accept as the
  authoritative source per my task constraints.

### 6. Integration test is real + merged — CONFIRMED
- `apps/api/test/integration/join-default-role.integration.spec.ts` exists on `origin/main`
  (header comment confirms wave-87 T-4 real-Postgres intent).
- PR #108 (`509aae84`) is MERGED. Branch-protection required checks on `main` are exactly
  `[lint, typecheck, test, build, secret-scan, boot-probe]` — **all SUCCESS** on PR #108's head.
  The `test` job (which runs the unit + integration suite) passed.
- **Non-blocking observation:** PR #108 also has an `e2e` check with conclusion **FAILURE**.
  `e2e` is NOT in the required-check set, so it did not block the merge and the "required `test`
  job passed" claim is precisely true. Flagged for awareness only — a failing e2e job is worth a
  glance at some point, but it is out of scope for this wave's claims and was not a merge gate.

### 7. Antipattern catalog / tripwire spot-check — CONFIRMED REAL (not theater)
Independently reproduced the B-5 load-bearing claim in an isolated worktree at `origin/main`:
reverted the production stamp (removed `role_id: roleId` from both `.values(...)` inserts) and
ran `servers.service.spec.ts`:
- Result: **5 failures**, all others green. Failing tests:
  - `joinPublicServer > stamps the server default role id ... (AC1)`
  - `joinPublicServer > inserts role_id: null ... no default role (AC3)`
  - `joinViaInvite > stamps ... via ad-hoc invite (AC2)`
  - `joinViaInvite > stamps ... via permanent invite_code (AC2)`
  - `joinViaInvite > inserts role_id: null ... no default role (AC3)`
- **All AC4 re-join tests stayed GREEN** (behavior unchanged on re-join).
This matches B-5's claim word-for-word ("reverting the production stamp turned AC1/AC2/AC3 red
(5 failures) while AC4 stayed green"). Assertions are real regression tripwires — AC1/AC2 assert
`role_id: 'role-default-1'`, AC3 asserts `role_id: null` explicitly (so even the null-fallback
path is a tripwire, not just a happy-path check). No decorative assertions, no
claimed-but-fake tests, no undocumented deferred work detected. (B-5's endpoint-level smoke
deferral to the T-block is documented and appropriate for a service-internal change.)

---

## Summary
Every load-bearing source claim in P-2/P-3/B-2/B-5/C-2 is true against the deployed merge commit
and the repo. Resolver, dual-path stamp, `onConflictDoNothing` preservation, zero schema/migration,
and the real (empirically reproduced) unit tripwire all hold. Deploy-hash rests on C-2's Railway
evidence (no independent SHA cross-check available to me) plus my own 200-OK /health probe. One
non-blocking note: PR #108 has a failing non-required `e2e` check that did not gate the merge.

**Verdict: APPROVE**
