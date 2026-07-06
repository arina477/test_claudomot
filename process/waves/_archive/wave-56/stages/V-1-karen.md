# V-1 Karen — source-claim verification (wave-56 defensive LIMIT)

**Verdict: APPROVE**

Scope: verify every source claim for the wave-56 defensive-LIMIT change (merge `efc1a47` on `main`, PR #71) against the merge tree, the executed CI run, and the deployed artifact. All five claim groups verified true from independent inspection — no gap between claimed and actual.

## Merge / deploy provenance
- PR #71 `state=MERGED`, `headRefOid=1ca13d8`, `mergeCommit.oid=efc1a47` (squash-merge — the CI `headSha` 1ca13d8 is the pre-squash branch head; efc1a47 is the resulting commit on `main`). `git branch --contains efc1a47` → `main`. HEAD sequence: `4ac7010 → efc1a47 → 45889d9`. Reconciled and consistent.

## Claim 1 — service change (`apps/api/src/dm/dm.service.ts`)
- `dm.service.ts:83` — `export const DM_CANDIDATES_LIMIT = 500;` VERIFIED (exported const).
- `dm.service.ts:685-688` — `async getDmCandidates(callerId: string, limit: number = DM_CANDIDATES_LIMIT): Promise<DmCandidate[]>` VERIFIED (injectable second param, defaulting to the const).
- `dm.service.ts:720-721` — `.orderBy(users.id, asc(users.display_name)).limit(limit)` VERIFIED — `.limit(limit)` is applied immediately after `.orderBy`, on the DISTINCT-ON co-member query, before the in-memory `.sort()` at :730. Cap bites at the DB, not post-fetch.
- who_can_dm predicate unchanged — `dm.service.ts:713-719`: `and(inArray(alias.server_id, callerServerIds), ne(alias.user_id, callerId), ne(users.who_can_dm, 'nobody'))` intact. `DmCandidate` DTO shape (`userId`/`displayName`/`avatarUrl`) at :724-729 unchanged. VERIFIED.

## Claim 2 — controller unchanged (`apps/api/src/dm/dm.controller.ts`)
- `dm.controller.ts:169-171` — `getDmCandidates(@Req() req): Promise<DmCandidate[]> { const callerId = req.session.getUserId(); return await this.dmService.getDmCandidates(callerId); }` VERIFIED — single-arg call, no 2nd argument → production path uses the default 500. VERIFIED. (Controller does not appear in the `efc1a47 --stat`, confirming it was untouched.)

## Claim 3 — case (d) test (`apps/api/test/integration/dm-candidates.spec.ts`)
- `dm-candidates.spec.ts:252-280` — case (d) inserts CALLER_D + 3 eligible co-members (USER_D1/D2/D3, all default `who_can_dm='everyone'`) in one shared server.
  - `:266-267` — `getDmCandidates(CALLER_D, 2)` → `expect(capped.length).toBeLessThanOrEqual(2)` (cap bites). VERIFIED.
  - `:273-274` — `getDmCandidates(CALLER_D)` → `expect(uncapped).toHaveLength(3)` (default 500 leaves all 3). VERIFIED — matches "≤2 (bites) + ===3 (default)" claim.
  - `:279` — `expect(DM_CANDIDATES_LIMIT).toBe(500)` ties the const into the type-check. Non-vacuous: 3 rows vs injected cap 2 forces DB truncation; absent `.limit()` the first assertion fails.
- **Executed + passed on CI** — CI run `28763433748` (`conclusion=success`). Log shows all four cases green against real Postgres; case (d) `✓ (d) injected cap of 2 truncates 3 eligible co-members; default cap leaves all 3 intact 69ms` — matches the claimed run id + 69ms exactly. Not skipped (`DATABASE_URL_TEST` provided by the CI Postgres service). VERIFIED.

## Claim 4 — no schema/migration; deploy serves efc1a47; agent registered
- `git show efc1a47 --stat` — only production/test files touched are `dm.service.ts` (+14) and `dm-candidates.spec.ts` (+54); remainder is wave-55 archive moves (0-byte renames) + wave-56 process docs + `product-decisions.md`. **No migration file, no schema change.** VERIFIED.
- Deploy serves efc1a47: `GET https://api-production-b93e.up.railway.app/health` → `200` `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`. Host matches `project.yaml` deploy_targets (`api-production-b93e.up.railway.app`, health_endpoint `/health`). LIVE. VERIFIED.
- `node-specialist` present in `command-center/AGENTS.md:84` (row: NestJS backend / node work, pre-built VoltAgent). VERIFIED.

## Findings
No discrepancies. No false-completion, no vacuous test, no skipped test masquerading as green, no controller drift, no unclaimed schema change. The change is minimal, correctly bounded at the DB layer, and its non-vacuous proof executed against real Postgres in the merged CI run. Deployed artifact is live and serves the merge commit.

**APPROVE** — all source claims true.
