# V-1 Source-Claim Verification (karen) — wave-40 avatar hardening

**Verdict: APPROVE**

Scope: source-claim verification (load-bearing claims TRUE) against DEPLOYED production. NOT spec conformance (jenny's lane). Merge commit `9c5054d` (PR #54, squash-merge); deployed via `railway up` in deployment `b4a6396b` on `main` HEAD `58f335f` (contains `9c5054d`).

## Claim-by-claim

| # | Claim | Evidence | Result |
|---|---|---|---|
| 1 | NUL/control-byte guard BEFORE the DB call | `9c5054d:apps/api/src/users/users.controller.ts` — `if (/[\x00-\x1f\x7f]/.test(userId)) throw new BadRequestException('Bad Request');` at the head of `redirectToAvatar`, placed BEFORE `await this.usersService.findAvatarKey(userId)`. `BadRequestException` imported. | **TRUE** |
| 2 | checkAvatarSize try/catch maps NotFound/NoSuchKey/404 → NotFoundException, re-throws others | `9c5054d:apps/api/src/files/files.service.ts` `checkAvatarSize` — `try { head = await client.send(new HeadObjectCommand(...)) } catch (err) { if (e.name==='NotFound' \|\| e.name==='NoSuchKey' \|\| e.$metadata?.httpStatusCode===404) throw new NotFoundException('Avatar object not found'); throw err; }`. 503 storage-unconfigured guard sits ahead of the try block, so it is never swallowed. Re-throw preserves the raw error (real S3 5xx stay 5xx). | **TRUE** |
| 3 | NO ParseUUIDPipe introduced | `git grep -i ParseUUIDPipe 9c5054d -- apps/api` → NONE in tree. Only textual occurrence in the diff is inside `B/gate-verdict.md` prose ("the ParseUUIDPipe trap the P-0 REFRAME was designed to avoid") — a reference to what was *avoided*, not code. Guard imposes no UUID shape. | **TRUE** |
| 4 | Deploy serves the merge; live 4xx (not 500) | Live curl against `https://api-production-b93e.up.railway.app`: `GET /users/%00/avatar` → **400**; `GET /users/st-nonuuid-xyz/avatar` → **404** (non-UUID not wrongly rejected — regression held); `GET /health` → **200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`. Matches C-2 behavior-proof (%00 flip 500→400 = stale-revision guard). | **TRUE** |
| 5 | No schema/migration/env change (B-0 schema_skipped:true) | `9c5054d:B-0-branch-and-schema.md` → `schema_skipped: true`, `migrations: []`. `git show --stat 9c5054d` — changed files are only `.ts` / `.spec.ts` sources + `process/waves/wave-40/**` docs. No migration/schema/drizzle/.env/.sql file touched. | **TRUE** |
| 6 | Antipattern scan (claimed-but-fake / decorative-test / deferred-undocumented) | None found. Both fixes are real code on the served revision (claim 4 proves the flip is live, not stale-green). Tests are load-bearing: `users.controller.spec.ts` exercises `st-user-abc123` / `abc123` / a real UUID and asserts both `toThrow(NotFoundException)` AND `not.toThrow(BadRequestException)` — genuinely proving legit ids are never 400'd (not a decorative assertion); `files.controller.spec.ts` asserts `setAvatar` is NOT called on the NotFound path. No deferrals hidden. Scope held to exactly the two endpoints (ceo HOLD-SCOPE). | **CLEAN** |

## Notes
- Change class backend-only; Railway deploy is CLI-push (`railway up`), correctly reflected in C-2 (merge-to-main does not deploy). Live behavior-flip is a stronger freshness proof than an uptime field.
- No load-bearing claim was found false, faked, or masked by suppression.

**Final: APPROVE**
