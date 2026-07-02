# V-1 — Karen reality-check (wave-33, malformed-UUID param → 400)

**Wave:** 33 · **Block:** V (Verify) · **Stage:** V-1 (Karen lane) · **Mode:** automatic
**Scope:** LOAD-BEARING claim verification against the **DEPLOYED prod state** (merge `e1a64f6`, api deployment `d69feba2`, prod `api-production-b93e`). NOT spec conformance (jenny's lane). No fixes attempted (read-only).
**Spec truth:** task `a2dd9f3d` (DB row) · Plan `P-3-plan.md` · Deploy `C-2-deploy-and-verify.md`

---

## VERDICT: APPROVE

Every load-bearing claim holds in the deployed state, verified by independent evidence (git object reads at the merge SHA, live prod curls, Railway API cross-check, and CI job-log greps — not by trusting the deliverables' own prose).

---

## Claim → evidence

### Claim 1 — Four files exist on merge e1a64f6 · HOLDS
`git cat-file -e e1a64f6:<path>` returned present for all four:
- `apps/api/src/auth/pg-error-utils.ts` — PRESENT (exports `PG_INVALID_TEXT_REPRESENTATION = '22P02'` + `isInvalidTextRepresentation`)
- `apps/api/src/auth/auth.exception.filter.ts` — PRESENT (22P02→400 branch present)
- `apps/api/src/auth/auth.exception.filter.spec.ts` — PRESENT
- `apps/api/test/integration/malformed-uuid-params.spec.ts` — PRESENT

### Claim 2 — `.cause.code` walk is real + correct; zero TypeORM survives · HOLDS
- `pg-error-utils.ts:isInvalidTextRepresentation` walks `e.code === '22P02'` → `e.cause.code` (one level) → `e.cause.cause.code` (two levels), each `typeof === 'object' && !== null` guarded. Structurally identical to the shipped `isUniqueViolation` (23505) at `users.service.ts:23-38` — confirmed by reading both objects at `e1a64f6`.
- `git grep -E "QueryFailedError|typeorm|@Catch\(QueryFailedError" e1a64f6 -- apps/api` → **NONE FOUND**. The reverted attempt-1 TypeORM `@Catch(QueryFailedError)` decorator leaves zero residue. This is the real fix path (Drizzle wraps PG error at `.cause`), not the never-firing TypeORM class.

### Claim 3 — Filter ordering + single catch-all · HOLDS
`auth.exception.filter.ts` (`@Catch()`, one decorator, no class-specific filter):
1. `if (res.headersSent) return;` (SuperTokens SDK already sent 401/403)
2. `if (err instanceof HttpException)` → forward `getStatus()`/`getResponse()` (BadRequest/Forbidden/NotFound pass through unchanged) — **BEFORE** 22P02
3. `if (isInvalidTextRepresentation(err))` → 400 `{statusCode:400, message:'Bad Request'}` — **BEFORE** generic
4. else → 500
`main.ts:120` — single `app.useGlobalFilters(new SupertokensExceptionFilter())`; grep for `useGlobalFilters`/`ExceptionFilter` shows exactly one registration. No second catch-all → SuperTokens auth path not shadowed.

### Claim 4 — Deploy hash real (not fabricated) · HOLDS
`railway deployment list --service api --json` (independent call, project-scoped token):
- deployment `d69feba2-7076-4955-82d3-ccd467d9f619` — `status: SUCCESS`, `imageDigest: sha256:4fec6143ff568db628e0c2cace6d240674faace9e3c70539b4f4a187e2c51fd4`, `createdAt: 2026-07-02T01:34:30Z`, `cliCaller: claude_code`, `reason: deploy`, `builder: DOCKERFILE (apps/api/Dockerfile)`.
- Matches C-2 deliverable exactly (id + digest). Prior revision `750f1b10` now `status: REMOVED` → the new revision is the one serving; no stale-revision passive re-serve.

### Claim 5 — Route LIVE on prod (deploy serves the fix) · HOLDS
Independent live curls against `https://api-production-b93e.up.railway.app`:
- `GET /channels/not-a-uuid/voice/participants` (unauth) → **HTTP 401** `{"message":"unauthorised"}` — guard-first, route registered on new revision, NOT 500, NOT 404. This is the load-bearing route-flip.
- `GET /health` → **HTTP 200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` — clean boot on the extended filter.
- Control `GET /this-route-does-not-exist-xyz` → **HTTP 404** (Nest `Cannot GET`) — proves the 401 is route-specific, not a blanket catch-all.
- Note: `GET /servers/not-a-uuid/channels` returned 404 (that exact literal path is not a registered route shape) — not a concern; the load-bearing voice-participants route-flip is 401 as required.

### Claim 6 — CI integration tests genuinely RAN (not skipped) · HOLDS
`gh pr checks 46` → all 7 checks pass (run `28559053549`), `test` job 1m10s green.
Independent `gh run view 28559053549 --job 84672724963 --log` grep:
- `test/integration/malformed-uuid-params.spec.ts` — **all 10 ✓** (Part A 6 + Part B 4), each with real DB timings **41–47ms** (not ~0ms → genuine Postgres round-trips, not stubbed).
- Integration config tally: `Test Files 9 passed (9)` — **zero skipped**. `describe.skipIf(SKIP)` with `SKIP = !process.env.DATABASE_URL_TEST` evaluated FALSE (postgres:16 service + job-scoped `DATABASE_URL_TEST` wired), so the suite executed.
- Unit run: `Tests 467 passed (467)`, incl. 6 filter unit tests firing on real 22P02 shapes.

### Claim 7 — Fix genuinely fires; tests real; no deferred-undocumented work · HOLDS
- **Fires (not decorative):** attempt-1's defect was a `@Catch(QueryFailedError)` that never matched the Drizzle error shape. The shipped filter dispatches on `isInvalidTextRepresentation`, which the integration Part B tests prove maps a **real** Postgres 22P02 (from `RbacService.canViewChannelById`) → HTTP 400 with `statusFn` called with `BAD_REQUEST`. Non-decorative — proven end-to-end against a real DB.
- **Real tests, no theater:** `grep -c 'expect(true)'` = **0** in both spec files. Integration assertions are substantive: `isInvalidTextRepresentation(caught).toBe(true)` on real caught errors, `toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)`, body-sanitization (`not.toContain('22P02'|'invalid input syntax'|'stack'|'channels')`), and a valid-UUID no-false-positive regression (`toBe(false)`).
- **No deferred-undocumented work:** the C-2/C-1 notes carry an explicit, documented N-block park-or-key for task `a2dd9f3d`. That is documented, not silently dropped.

---

## Reality notes (non-blocking)
- Authed-malformed → 400 is CI-proven (integration Part B), not reproduced live (no session cookie in the probe). The live 401 route-flip + the real-DB CI 22P02→400 proof together fully cover the behavior; acceptable — the guard-first 401 correctly demonstrates the malformed param does not 500 pre-auth, and CI proves the post-auth 400.
- `web` service intentionally not redeployed (api-only diff) — correct, not a gap.
- Three pre-existing dirty working-tree files (`.gitignore`, `claudomat-brain/VERSION`, onboarding stage) are out-of-wave and were not committed to the fix — confirmed not part of the diff.

```yaml
karen_verdict: APPROVE
claims_verified: 7
claims_failed: 0
deployed_state_confirmed: true
evidence:
  - "files@e1a64f6: all 4 present (git cat-file -e)"
  - "cause-walk mirrors users.service.ts:23-38; zero QueryFailedError/typeorm in apps/api@e1a64f6"
  - "filter: single @Catch(), order headersSent→HttpException→22P02→500; main.ts:120 single registration"
  - "railway d69feba2 SUCCESS digest sha256:4fec6143… reason=deploy; prior 750f1b10 REMOVED (new rev serving)"
  - "live prod: /channels/not-a-uuid/voice/participants unauth→401; /health→200; nonexistent→404"
  - "CI run 28559053549 job test: 467 unit + 10 integration (41-47ms real-DB) passed; 9/9 files, zero skipped"
  - "expect(true) count = 0 in both spec files; assertions substantive; N-block park-or-key documented"
blocking_findings: []
```
