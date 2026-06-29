# Wave 8 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn)
**Reviewed against:** process/waves/wave-8/blocks/B/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
REWORK

## Rationale
Almost everything in this wave is build-ready and clean: 178 tests green (110 API + 68 web), typecheck passes across all three workspaces, both carry-forwards land (A — invites live inside ServersModule with no standalone InvitesModule; B — re-join does not double-increment `uses`, with a dedicated passing test), CSPRNG codes are real (`randomBytes(16).toString('base64url')`, ~128-bit, asserted by regex), the public preview leaks nothing beyond `{server:{id,name,memberCount}}` (a test even asserts `Object.keys` exactly), and join is correctly gated by the verify-required `AuthGuard` against a global `EmailVerification.init({mode:'REQUIRED'})`. The frontend public route, `?next=` login-return, and join→redirect are all present. **However, one load-bearing security AC is not met: max_uses enforcement is not atomic.** `joinViaInvite` runs `SELECT invite → validateInviteActive (uses >= max_uses)` then, after inserting the member, runs an unconditional `UPDATE invites SET uses = uses + 1`. Under Postgres default READ COMMITTED isolation (no `isolationLevel` is set on the transaction), two distinct users racing a `max_uses=1` invite both read `uses=0`, both pass the pre-check, both insert distinct `(server_id,user_id)` member rows (no ON CONFLICT because they are different users), and both increment — ending at `uses=2` with two members admitted past a cap of one. The P-4 carry-forward explicitly required the atomic pattern (`conditional UPDATE … WHERE uses < max_uses RETURNING`); the implementation does not use it, and the test named "rejects second distinct user on max_uses=1" only feeds a pre-maxed (`uses:1`) invite to a single sequential call — it proves the sequential reject, not the concurrent race. For an access-control wave this is a real overshoot of the invite cap, which is firing-grade for this gate.

## Rework instructions

### Stages requiring rework
- B-2: make max_uses enforcement atomic in `joinViaInvite`; add a concurrency-modeling test.

### Per stage

#### B-2
- **What's wrong:** `joinViaInvite` (apps/api/src/servers/servers.service.ts, ~lines 313-366) enforces `max_uses` with a check-then-increment (TOCTOU) instead of an atomic conditional update. Under READ COMMITTED, concurrent distinct-user joins on `max_uses=1` both pass `validateInviteActive` (both read `uses=0`) and both succeed, overshooting the cap. The non-`max_uses` validity checks (revoked / expired) are fine; only the count bound is racy.
- **Heuristic fired:** Atomic-max_uses TOCTOU — count bound checked in app memory then incremented unconditionally; the guarantee must live in a single conditional SQL write (or a row lock), not in a pre-read. (Anti-pattern: "Idempotency/atomicity omission" applied to the invite-cap door.)
- **What "good" looks like:** For ad-hoc invites with a non-null `max_uses`, the use is consumed by a single atomic statement whose effect is the gate. Concretely, one of:
  - `UPDATE invites SET uses = uses + 1 WHERE id = $id AND revoked = false AND (expires_at IS NULL OR expires_at > now()) AND (max_uses IS NULL OR uses < max_uses) RETURNING uses` — if zero rows return, the invite is exhausted/invalid: throw `NotFoundException('Invite not found or invalid')` and let the transaction roll back the member insert; OR
  - `SELECT … FROM invites WHERE id = $id FOR UPDATE` at the top of the txn before validate+increment, serializing concurrent joiners on the same invite row.
  Ordering must keep carry-forward B intact: still increment `uses` ONLY when a genuinely-new `server_members` row was inserted (existing-member re-join stays a no-increment 200), and never increment for permanent (`servers.invite_code`) joins. If you adopt the conditional-UPDATE approach, run the atomic UPDATE only when `newMemberJoined && isAdHoc`, and if it returns zero rows, throw to roll back the just-inserted membership (so a capacity loser is not silently admitted).
- **Re-do instructions:**
  1. Route to **backend-developer** (per command-center/AGENTS.md) — do not fix from the orchestrator (Iron Law).
  2. Replace the unconditional increment in `joinViaInvite` with the atomic conditional `UPDATE … WHERE … (max_uses IS NULL OR uses < max_uses) … RETURNING`, throwing `NotFoundException` on zero rows so the member insert rolls back. Preserve the ad-hoc-only + new-row-only conditions (carry-forward B) and the permanent-invite no-increment path.
  3. Keep the in-txn `validateInviteActive` pre-check for fast-path revoked/expired rejection, but treat the conditional UPDATE as the authoritative cap gate.
  4. Add a service test that models concurrency for `max_uses=1`: assert that across two distinct-user joins exactly one increment lands and the second join is rejected with `NotFoundException` — driven by the mock returning zero rows from the conditional UPDATE on the second call (i.e., the gate is the UPDATE result, not a pre-read). The existing sequential-reject test stays.
  5. Re-run B-4 (repo-wide typecheck) and B-5 (full suite) before returning to B-6 Action 0.

### Cascade

| Trigger stage | Stages that must re-run downstream |
|---|---|
| B-2 backend | B-4 (typecheck), B-5 (full verify) |

- **Stages that must re-run after the above:** B-4, B-5, then re-enter B-6 Action 0 (fresh head-builder, attempt 2).
- **Stages that stay untouched:** B-0 (schema unchanged — `invites` table + `servers.invite_code` + migration 0004 are correct), B-1 (contracts unchanged — Zod shapes are fine), B-3 (frontend unchanged — no contract or behavior change to the client).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

# Wave 8 — B-6 Verdict (Attempt 2)

**Reviewer:** head-builder (fresh spawn)
**Reviewed against:** attempt-1 REWORK instructions (max_uses TOCTOU) + carry-forward PASSes
**Fix commit:** 92cc0f3 — `fix(api): atomic conditional max_uses consume in join (prevent TOCTOU overshoot)`
**Attempt:** 2

## Verdict
APPROVED

## Rationale
The single attempt-1 defect — non-atomic max_uses enforcement (SELECT-validate-then-unconditional-increment, racy under READ COMMITTED) — is genuinely fixed. `joinViaInvite` (apps/api/src/servers/servers.service.ts:364-392) now consumes a capped invite with a single atomic conditional `UPDATE invites SET uses=uses+1 WHERE id=$id AND NOT revoked AND (expires_at IS NULL OR expires_at>now()) AND uses<max_uses RETURNING`, and throws `NotFoundException` on zero rows — which rolls back the member INSERT performed earlier in the same transaction. This is race-safe: the conditional UPDATE acquires a per-row write lock on the invite, so concurrent joiners on `max_uses=1` serialize on that row; exactly one observes `uses<1` and wins, the loser re-evaluates its WHERE against the committed `uses=1`, matches zero rows, and is rejected with the membership rolled back. The cap guarantee now lives in the locking SQL write, not in an app-memory pre-read — the TOCTOU window is closed. The fast-path `validateInviteActive` pre-check is retained for revoked/expired rejection but is no longer the authoritative cap gate. Carry-forward B is intact (increment only when `newMemberJoined && isAdHoc`; re-join is a no-increment 200; permanent `servers.invite_code` joins never increment); the unlimited path (`max_uses=null`) increments unconditionally as specified. The new test "atomic: concurrent join on max_uses=1 admits exactly one (conditional UPDATE returns 0 rows → txn rolls back)" (servers.service.spec.ts:705) correctly models the losing concurrent joiner — invite read passes the pre-check, member INSERT returns a row, the conditional UPDATE returns `[]`, and the test asserts `NotFoundException` propagates — proving the gate is the UPDATE result, not the pre-read. The pre-existing sequential-reject test stays. All other attempt-1 PASSes (carry-forward A ServersModule, CSPRNG 128-bit codes, minimal public preview, verify-required join, member-gated createInvite, frontend public route + `?next=` login-return, migration 0004, commit-per-spec) are unchanged. Gate suite re-run green: `@studyhall/api typecheck` clean, `pnpm build` FULL TURBO, `pnpm lint` clean (104 files), 111 API + 68 web = 179 tests passing. Nothing regressed; the access-control cap door is now correctly guarded.

## Stage-exit checklist (B-2/B-3 security door re-check)
- [x] Message/invite creates enforce atomicity via a single conditional SQL write (idempotency/atomicity-omission anti-pattern cleared for the invite-cap door)
- [x] No new scale infrastructure introduced by the fix (single conditional UPDATE; no Redis/lock-table/queue)
- [x] Reviewed by an agent other than the author (head-builder gate, fix authored by backend-developer)
- [x] Failure root-cause classified and routed (TOCTOU → backend-developer; no debug-by-deploy)
- [x] Full suite + typecheck + lint + build green

## Next action
PROCEED to B-6 Phase 2 (secret-grep) → on clean, hand off to C-block (head-ci-cd) for PR + CI.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 1
- head_signoff:
    verdict: APPROVED
    stage: B-6
    failed_checks: []
    next_action: PROCEED_TO_C_BLOCK
