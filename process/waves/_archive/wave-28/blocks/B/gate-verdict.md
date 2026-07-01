# Wave 28 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, B-6 Phase 1)
**Reviewed against:** process/waves/wave-28/blocks/B/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

This single-spec backend security wave adds `POST /servers/:id/invite-code/rotate` to make a leaked permanent invite link revocable, and it faithfully meets the spec contract and all seven acceptance criteria with no security or production-bug defect. I verified every gate item against the actual source, not the deliverable prose:

1. **Owner-ONLY authz (load-bearing) — PASS.** `rotateInviteCode` (servers.service.ts:379) gates on `server.owner_id !== callerId` ALONE. It does NOT carry `revokeInvite`'s `|| invite.created_by` creator path (which lives distinctly at servers.service.ts:354). The permanent code has no creator concept, so owner-ONLY is correct and the spec's "drop the creator path" nuance is honored exactly. The unit test additionally asserts `mockUpdate` is NOT called on the 403 branch (servers.service.spec.ts) — no partial write on rejection.

2. **CSPRNG + 23505-retry — PASS.** Reuses the existing `generateCode()` (servers.service.ts:35 — `randomBytes(16).toString('base64url')`, ~128-bit), not a hand-rolled variant. Mirrors the createInvite MAX_RETRIES=5 loop (servers.service.ts:288-316) structurally; the write targets `servers.invite_code` via `db.update(servers)`, and retry-exhaustion throws `ConflictException` (409). The 22-char base64url shape is asserted by regex in the unit test, and the retry loop is exercised (a 23505 on attempt 1, success on attempt 2, `updateAttempt === 2`).

3. **Old-link invalidation — PASS, and the integration test proves it against the real resolution path.** The permanent code resolves via `WHERE servers.invite_code = code` (getInvitePreview servers.service.ts:442; joinViaInvite shares the same resolution). Overwriting the UNIQUE column means the old code stops matching → `NotFoundException`. The integration test (invite-code-rotate.spec.ts) exercises the REAL `getInvitePreview` AND `joinViaInvite` methods to assert old-code → 404 for both preview and join (AC2), and new-code → 200 preview + admits a new member (AC3) — not merely "a new code is returned."

4. **Controller wiring — PASS.** Route `@Post(':id/invite-code/rotate')` with `@UseGuards(AuthGuard)`, reads caller from `req.session.getUserId()`, passes `(id, callerId)` to the service, returns `{ invite_code }`. No request body. Inline response shape (not added to packages/shared) is correct per spec — no client consumer this wave.

5. **Test honesty — PASS.** Unit tests mock the Drizzle DB layer while the SUT method itself runs real (correct target of mocking, not mock-the-SUT). Integration test uses the real pg-harness with `describe.skipIf(!process.env.DATABASE_URL_TEST)` and emits an explicit `it.skip` message when unset (no silent pass). Covers AC4 (non-owner member → 403) and AC5 (non-existent server → 404) against live Postgres. I ran the two unit spec files locally: 82/82 pass.

6. **Scope discipline — PASS.** No rate-limit, no audit-log, no client "regenerate link" UI added (all documented keep-OUT at 0 users). No RBAC `manage_server` gate added — owner-ONLY is the consciously-recorded posture for this wave (jenny RBAC drift resolved-in-record; flip-trigger documented in product-decisions). Diff is 5 files / +321 lines, exactly the rotate surface. No scale gold-plating.

7. **AuthGuard posture — PASS.** `AuthGuard` (auth.guard.ts) is SuperTokens `verifySession()` — verify-only, delegating 401 unauth / 403 unverified to the session layer, consistent with the sibling `/servers` routes. Ownership is enforced server-side in the service, not the guard. This is the correct door composition (server-side-at-every-door): auth at the guard, RBAC/ownership in the service.

**B-2 formatter miss (item 7, hygiene, non-blocking):** B-2 committed 2 unformatted spec files (BUILD rule 7 — local verify must use `biome check`, not `biome format` alone), remediated deterministically at f78552c via `biome --write`. Both commits touch only wave-28 rotate files (no cross-scope bleed). This is the pattern's carry into BUILD-PRINCIPLES already (`CARRY (BUILD rule 7)` in the review-artifacts) — it recurred this wave despite being a known carry, which is worth noting for L-2: if it fires a third time, promote a hard pre-commit `biome check` gate rather than relying on the carry note. For this gate it is accepted hygiene debt, deterministically remediated, non-blocking. It does not affect the shipped endpoint behavior.

No contract drift (no shared-type surface this wave; inline DTO justified). No schema/migration gap (writes an existing UNIQUE column in place — no delta, correctly no migration). No unguarded door. No idempotency/pagination/realtime surface in scope. Proceed to Phase 2 (/review).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

## B-6 Phase 2 — /review (appended)
2 parallel adversarial passes (security specialist + red-team). **No P0/P1 code bugs.**
- 2× P1 INVESTIGATE (rotate-vs-join race; cross-namespace 23505 scope) — accepted-if-documented → **documented** in rotateInviteCode JSDoc (42636bc).
- 2× P2 test-honesty (23505 test asserts mock; trivial old-vs-new assertion) → **fixed** (42636bc): retry test now proves regeneration; assertion downgraded to shape-check, real coverage in integration test.
- 1× P2 existence oracle (403 vs 404) → **accepted-debt** (403 matches spec AC4 + findServerDetail precedent; server ids non-secret).
Fix-up commits: f78552c (formatter), 42636bc (docs + test). Re-verify: typecheck 4/4, lint 0-err, 402 unit pass.
**B-6 final: APPROVE.**
