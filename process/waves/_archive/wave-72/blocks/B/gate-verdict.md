# Wave 72 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, Phase 1 gate)
**Reviewed against:** process/waves/wave-72/blocks/B/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

The account self-deletion slice (soft-delete right-to-erasure, M10 first slice) holds against every security and functional acceptance criterion in the spec contract (task 9658fb0b), verified in the actual code rather than the deliverable prose. The critical split-identity re-auth risk that P-0 flagged is correctly closed on BOTH doors as a hard AND, not an OR: door (i) is the SuperTokens `signIn` override (supertokens.config.ts:61-75) returning `WRONG_CREDENTIALS_ERROR` for any `deleted_at IS NOT NULL` user, and door (ii) is the session-verify path — `getSession` AND `refreshSession` overrides (supertokens.config.ts:147-184) each independently throwing `UNAUTHORISED` with `clearTokens:true` on the same DB check. Session-revoke (`revokeAllSessionsForUser`) is present but is explicitly defence-in-depth, not the sole barrier — a replayed pre-deletion session or a refresh rotation is independently rejected by the overrides. No `SuperTokens deleteUser` is called anywhere, preserving the reversible soft-delete regime. IDOR is structurally impossible: `callerId` comes only from `req.session.getUserId()` (privacy.controller.ts:96); there is no `userId` in the path or body on POST /profile/delete. The owned-server guard (account-deletion.service.ts:32-44) throws `ConflictException` with the `DeleteAccountBlockedResponse` shape BEFORE any scrub, and the integration test proves `deleted_at` stays null on that 409 path. PII scrub is complete — display_name → 'Deleted user', username → null, email → per-user-unique `deleted+<id>@deleted.invalid` (constraint-safe on a 2nd deletion), avatar_url → null, AND avatar_key → null (the residue P-4 flagged); the unique-index safety on `lower(username)` and `email` is explicitly reasoned and test-asserted (distinct-emails test). PrivacyModule is imported and listed in AppModule (app.module.ts:16,55) with AccountDeletionService provided, so POST /profile/delete actually mounts. The pg-harness integration test exercises all four security paths against the real DB without mocking the SUT, and asserts avatar_key IS NULL, the non-destructive 409, and both re-auth doors' deleted_at branch. The frontend gates the destructive confirm behind the acknowledgment checkbox (`disabled={!acknowledged || isSubmitting}`), surfaces the 409 owner-block server list non-destructively (dialog stays open, no navigate), logs out + redirects on success, and reconciles copy (no email-verify / 30-day-grace / permanent-purge promise); its 18 tests drive the real component (mocking only the api/Session/router boundaries) and pass on re-run. Commit discipline is clean for a multi-spec wave: each of the four feat commits cites exactly one claimed task_id, every claimed task_id has ≥1 commit, and no commit's file set crosses a spec boundary. Spot-verifications confirmed live: shared package exports all three schemas + types and typechecks clean (contract is the single source, no B-1↔B-2↔B-3 drift), and the DangerZonePanel suite passes 18/18.

**AC-by-AC (all PASS):**
1. no-IDOR — PASS (session-only callerId; no userId param anywhere).
2. Owned-server block-if-owner — PASS (409 + reason + server list; throws pre-scrub; deleted_at stays null; test-proven).
3. PII scrub completeness — PASS (display_name/username/email/avatar_url/avatar_key all handled; per-user-unique placeholders are constraint-safe on repeat deletion).
4. Re-auth block on BOTH doors — PASS (signIn override AND getSession+refreshSession overrides, each independently effective; revoke is defence-in-depth; NO hard deleteUser — soft-delete reversible).
5. PrivacyModule mounted — PASS (imported + registered in AppModule; AccountDeletionService provided; route reachable).
6. Integration-test honesty — PASS (real DB, no SUT/DB mock; asserts avatar_key null, non-destructive 409, both doors' deleted_at branch).
7. Frontend — PASS (acknowledgment-gated confirm, non-destructive 409 server list, logout+redirect on success, copy reconciled, real-component tests 18/18).
8. Commit discipline — PASS (one task_id per commit; every task_id has a commit; no cross-spec file sets).

**Design note (not a defect):** The controller uses `SessionNoVerifyGuard` rather than the full-claims `AuthGuard` the spec wrote generically. This is correct — `SessionNoVerifyGuard` still runs `verifySession` (hence the `getSession` deleted_at override / door ii DOES fire), only stripping the EmailVerification claim validator so the delete route stays reachable for authenticated-but-unverified users, matching the sibling /profile/privacy and /profile/data routes. Session validity is fully verified; the re-auth block is not weakened.

## Heuristics applied — none fired as a defect
- Contract drift (B-1↔B-2↔B-3): clean — shared Zod is the single source; DTO validation + FE response parsing both derive from it.
- Unguarded auth door: clean — both re-auth doors + owned-server guard + session guard all server-side.
- TOCTOU/idempotency on delete: acceptable — idempotency guard returns {status:'deleted'} on an already-deleted row; the session override makes a 2nd authed call unreachable in practice.
- Split-identity re-auth (the exact wave-72 risk): closed on both doors, independently.
- Single-client realtime: N/A (no realtime surface this wave; presence is in-memory + dropped on next auth-fail, correctly reasoned).
- Scale gold-plating: none — no new deps, no Redis/queue/replica; soft-delete UPDATE only.

## Escalation
n/a

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---

## Phase 2 (/review) + final B-6 disposition

**Phase 2:** independent adversarial /review over the erasure path. Verified SAFE: 409 contract shape end-to-end, WebSocket re-auth door covered, SQL parameterized. One **[P1] non-atomic erasure** found + FIXED (SERIALIZABLE transaction wrapping owner-check+scrub+members-delete; revoke demoted to best-effort post-commit) — commit 24506bc; also closes a P2 TOCTOU. Two P2s accepted as debt (navigate-after-unmount, concurrent-double-delete — both harmless). Post-fix re-verify: typecheck 4/4, lint clean, api 764, web build ✓.

**Commit discipline:** feature commits clean per-spec; one cross-spec lint-fix (ceb9606, post-restart recovery) accepted as documented deviation (rebase -i unavailable + pushed history; feature traceability intact).

**FINAL B-6 VERDICT: APPROVE.** No critical/high remaining. → C-block.
