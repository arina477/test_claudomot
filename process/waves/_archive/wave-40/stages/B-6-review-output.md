# Wave 40 — B-6 Review (Phase 2, production-bug pass)

**Reviewer:** code-reviewer (post head-builder APPROVED)
**Scope:** wave-40 avatar-hardening diff — 2 endpoint 500→4xx fixes
**Diff base:** `merge-base origin/main HEAD` (469505a)
**Verdict:** **PASS — no CRITICAL or HIGH findings.** Both fixes are correct, null-safe in practice, and scoped. Four LOW / informational notes below; none block the gate.

---

## Files reviewed
- `apps/api/src/users/users.controller.ts` (Fix#1 — NUL/control-byte guard)
- `apps/api/src/files/files.service.ts` (Fix#2 — HeadObject not-found → 404)
- `apps/api/src/auth/auth.exception.filter.ts` (surfacing path — unchanged, confirmed compatible)
- `apps/api/src/auth/pg-error-utils.ts` (22P02 rationale — confirmed)
- `apps/api/src/files/files.controller.ts` (confirm flow caller — confirmed)
- Test additions: `users.controller.spec.ts` (new, 13), `files.service.spec.ts` (+4), `files.controller.spec.ts` (+2)
- Installed SDK: `@aws-sdk/client-s3` `^3.1075.0`

---

## 1. Guard correctness (Fix#1) — CORRECT

`/[\x00-\x1f\x7f]/.test(userId)` matches U+0000–U+001F plus U+007F (DEL). This includes the NUL byte (`\x00`) that produced the original 500.

- **NUL coverage:** `\x00` is the low bound of the class — matched. Confirmed.
- **`%00` URL-encoding bypass:** Express/NestJS decodes route params (`decodeURIComponent`) before the handler binds `@Param('userId')`. `%00` decodes to a literal `\x00`, which the regex sees and rejects. No bypass. (The spec's inline test at `users.controller.spec.ts` exercises the decoded form directly, which is the correct post-decode assertion.)
- **Pre-service ordering:** the guard throws before `usersService.findAvatarKey(userId)`, so no control byte reaches the parameterised DB query on this route. The `does NOT call findAvatarKey` test asserts this. Correct — this is exactly why the untranslatable-pg-error 500 no longer fires (the string never reaches PG; the 22P02 filter branch was never going to catch it because `users.id` is `text`, not `uuid`).
- **No UUID-shape imposition:** verified — the regex is a control-char denylist only; opaque SuperTokens ids (`st-user-abc123`, `abc123`, UUID-shaped) all pass. Regression guard tests cover all three. No false-positive 400 on legitimate ids.

## 2. Fix#2 error-shape robustness — CORRECT for this SDK/store

For `@aws-sdk/client-s3` v3, a HeadObject against a missing key deserializes to an error with **`name === 'NotFound'`** (HEAD has no response body, so the SDK synthesizes `NotFound` rather than `NoSuchKey`; `NoSuchKey` is the GetObject shape). Both names are handled, plus the `$metadata.httpStatusCode === 404` catch-all covers any store that labels the error differently but preserves the 404 status. This is the correct and defensively-complete set for the confirm-time HeadObject.

- **`err: unknown` narrowing:** `const e = err as {...}` then `e.name === ...`. Safe for every realistic rejection — the AWS SDK always rejects with an `Error` (object) instance, never `null`/`undefined`/primitive. See LOW-1 for the purely-theoretical null case.
- **NoSuchKey slip-through:** not possible — both `NoSuchKey` and the 404 status are matched.

## 3. 503 / genuine-outage preservation — CORRECT (not swallowed)

- The `STORAGE_NOT_CONFIGURED` 503 is thrown **before** the try/catch (client-null and bucket-null checks at lines 176–184). It cannot be reclassified as 404.
- A real S3 outage (500/503) or network error carries a non-404 `name` and a non-404 (or absent) `httpStatusCode` → falls through to `throw err` → surfaces as 500 via the filter. A genuine failure stays a 5xx, as required. The `re-throws non-404 S3 errors unchanged` test locks this in.

## 4. Happy-path regressions — NONE

- `redirectToAvatar`: 302 (has avatar), 404 (no avatar), 503 (storage unset) all preserved — the guard is a pre-check that only fires on control bytes. Covered by the three retained happy-path tests.
- `confirm`: 413 (oversize) path unchanged (HeadObject still succeeds then size-compares); 401 (SessionNoVerifyGuard) unchanged; 400 (bad key prefix) unchanged. The only new terminal status is 404 for a never-uploaded key — the intended fix, and it correctly short-circuits **before** `usersService.setAvatar`, so no partial persist (asserted by the `does NOT persist avatar` test).

## 5. Filter surfacing — CORRECT (not re-wrapped to 500)

`BadRequestException` and `NotFoundException` are `HttpException` instances. `SupertokensExceptionFilter.catch` forwards any `HttpException` via its first branch (`err instanceof HttpException → res.status(err.getStatus()).json(...)`), which runs **before** the 22P02 branch and before the generic 500. So 400 and 404 reach the client with the right status. The `headersSent` guard is upstream and unaffected. Confirmed end-to-end.

---

## LOW / informational (non-blocking)

- **LOW-1 (defensive-consistency):** In `checkAvatarSize`, `e.name === 'NotFound'` accesses `.name` without a null guard. If `client.send()` ever rejected with `null`/`undefined` (it does not — AWS SDK always rejects with an Error), this line would throw a TypeError. Note that the sibling `isInvalidTextRepresentation` helper *does* null-guard (`err === null → false`). Worst case here is a degrade to the pre-fix 500, never worse. Optional hardening: `const e = (err ?? {}) as {...}`. Not required for merge.
- **LOW-2 (store-dependent):** S3-compatible stores that return **403 for a missing object** (when the caller lacks `s3:ListBucket`) would bypass the 404 mapping and re-throw → 500. Not applicable to the owned Tigris bucket used by confirm (the caller just presigned a PUT to it and holds full access → S3 returns 404 for missing keys). Informational only.
- **LOW-3 (out-of-scope, not a regression):** The NUL→500 class exists structurally on any other endpoint that passes a client-controlled string into a `text`-column query (the 22P02 filter only catches `uuid`-cast failures). This wave correctly scopes to the two avatar endpoints; the guard is not generalised. No regression introduced. Candidate for a future cross-cutting guard/interceptor if the pattern recurs.
- **LOW-4 (pre-existing noise):** `@SentryExceptionCaptured()` on the filter reports forwarded 4xx `HttpException`s (including the new 400/404) to Sentry as captured exceptions. Pre-existing behavior, not introduced by this diff; may add avatar-probe noise to Sentry. Cosmetic.

---

## Test coverage assessment
The additions directly exercise every changed branch: NUL/control/DEL → 400, non-UUID regression → 404, guard-is-pre-service, NoSuchKey/NotFound/`$metadata` 404 → 404, non-404 re-throw, and no-persist-on-404. Coverage matches the fix surface. Nothing a typecheck + 543 passing tests would miss remains uncovered by this review.

**Gate: B-6 PASS.**
