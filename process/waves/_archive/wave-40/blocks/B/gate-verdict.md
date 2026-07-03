# Wave 40 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, agentId head-builder-wave40-b6)
**Reviewed against:** process/waves/wave-40/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)

## Verdict
APPROVED

## Rationale
Both hardening fixes are correct, minimal, and faithful to the locked spec contract (task 7525b759), and every acceptance criterion is satisfied with load-bearing tests. Fix#1 places the boundary guard `/[\x00-\x1f\x7f]/` in `users.controller.ts:78` BEFORE the DB query at line 82 — it rejects NUL, all C0 control bytes, and DEL to a generic 400, and imposes no UUID shape, so valid opaque non-UUID SuperTokens ids pass straight through (the ParseUUIDPipe trap the P-0 REFRAME was designed to avoid). The regression tests exercise `st-user-abc123`, `abc123`, and a real UUID and each asserts both `toThrow(NotFoundException)` AND `not.toThrow(BadRequestException)`, genuinely proving legit ids are never 400'd. Fix#2 in `files.service.ts:190-198` wraps only the HeadObject send in try/catch, maps NoSuchKey/NotFound/`$metadata.httpStatusCode===404` to a generic `NotFoundException`, and re-throws every other error unchanged via `throw err` (raw error preserved, real S3 500s stay 500) — the 503 storage-unconfigured path is guarded at lines 177-184 ahead of the try block so it can never be swallowed. The never-uploaded-key 404 lands before any persist: `files.controller.ts` calls `checkAvatarSize` (line 105) before `setAvatar` (line 128), and a controller test asserts `setAvatar` is not called on the NotFound path, satisfying the "no avatar_url/avatar_key persisted" AC. Happy paths (302 with avatar, 404 no avatar, 503 unconfigured, 413 >2MB) are preserved and covered. Error bodies are generic ("Bad Request" / "Avatar object not found") with no bucket/key/internal leak, appropriate for the LOW security-probe origin. Scope is held to exactly the two endpoints (ceo HOLD-SCOPE) with no input-validation sweep, no schema change, no frontend, no scale infra; B-1/B-3 legitimately SKIP (no contract, no client). 543 tests green, typecheck 0, biome ci 0.

## Rework instructions  (only if REWORK)
n/a — APPROVED.

## Escalation  (only if ESCALATE)
n/a — APPROVED.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---
## Phase 2 — code-reviewer
NO critical/high findings. Guard catches %00 (decoded to literal NUL pre-handler) before DB; fix#2 branches complete for aws-sdk-client-s3 ^3.1075, re-throws non-404 (503/outage preserved); happy paths intact; filter forwards 400/404 as HttpException. 4 LOW accepted (incl. out-of-scope NUL class on other endpoints — deferred per ceo HOLD-SCOPE). No fix-up.
## B-6 verdict: APPROVE → B-block EXIT → C-block
