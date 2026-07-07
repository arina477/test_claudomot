# Wave 72 — B-6 /review output (Phase 2 production-bug pass)

Independent adversarial review (fresh-context code-reviewer) over the security-critical erasure path, diff `origin/main..HEAD`.

## Verified SAFE (not blockers)
- **409 contract shape end-to-end:** service throws `ConflictException({status:'blocked', reason, servers})`; Nest `HttpException.createBody` (nestjs/common 10.4.22) passes an OBJECT arg through unwrapped; `SupertokensExceptionFilter` (auth.exception.filter.ts:45-48) forwards `getResponse()` verbatim → wire body is exactly `{status,reason,servers}`; web client (api.ts) `safeParse`s that exact shape. **Agree — no mismatch.**
- **WebSocket door:** `ws-auth.ts:74` uses `getSessionWithoutRequestResponse()` which calls the overridden `getSession` (supertokens-node 24.0.2) → WS upgrade also checks `deleted_at`. All 4 doors (signIn / getSession / refreshSession / WS) covered.
- Missing-users-row in overrides fail-open correctly (`undefined` deleted_at → no throw). signIn override covers all EmailPassword variants. SQL all Drizzle-parameterized. Integration test honestly exercises the 4 paths.

## Findings

### [P1] (confidence 8/10) — FIXABLE — non-atomic erasure sequence
`account-deletion.service.ts:62-85`. The scrub UPDATE (autocommits) → `Session.revokeAllSessionsForUser` (network) → `server_members` DELETE run as 3 separate autocommitted statements (no `db.transaction()`). If revoke throws (core unreachable), PII is already scrubbed + committed but `server_members` is NOT deleted → half-deleted account with live memberships + 500 returned. Retry hits the idempotency guard (deleted_at set) → returns `{status:'deleted'}` **without** revoking sessions or deleting memberships — leftover work silently abandoned.
**Fix:** wrap `owner-check + scrub + deleted_at + server_members delete` in one `db.transaction()` (SERIALIZABLE to also close the TOCTOU below); demote `revokeAllSessionsForUser` to best-effort AFTER commit (log failure, don't throw). Justification: the getSession/refreshSession/signIn overrides read live DB `deleted_at`, so the instant the transaction commits every door rejects the user — revoke is defence-in-depth, not the primary gate. Safe to demote.

### [P2] (confidence 5/10) — INVESTIGATE→folded into P1 — TOCTOU owner-check→scrub
`account-deletion.service.ts:32-35 → 62`. A concurrent `createServer` (session still valid until revoke) could insert a server owned by the caller between the owner-check and the scrub → scrubbed owner on a fresh server. Low probability. Closed by running owner-check + scrub in a single SERIALIZABLE transaction (P1 fix).

### [P2] (confidence 7/10) — ACCEPTED DEBT — navigate-after-unmount
`DangerZonePanel.tsx:210`. On success, `navigate('/login')` fires even if the dialog unmounted mid-await. Harmless. Double-submit already blocked (`isSubmitting` + disabled button). Accept.

### [P2] (confidence 4/10) — ACCEPTED — concurrent double-delete benign
Two simultaneous `deleteAccount(A)` both pass idempotency guard; second scrub idempotent (deterministic email placeholder → no UNIQUE collision); double-revoke/members-delete benign. Accept.

## Disposition
- P1 (+ folded TOCTOU) → re-enter B-2, route to backend-developer. Then re-run B-4 + B-5, then re-review.
- P2s → accepted debt (documented).

**Reviewer recommendation:** fix the P1 non-atomic erasure first; contract concern verified correct, not a blocker.
