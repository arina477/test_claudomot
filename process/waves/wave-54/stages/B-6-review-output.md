# B-6 Phase 2 — Production-bug review: wave-54 WS error regression-lock

**Branch:** `wave-54-ws-error-regression-lock` @ `d382aae`
**Scope:** `git diff main...HEAD` — 6 files, +577/-2. New `WS_GENERIC_ERROR` constant + 2 in-`catch` literal swaps + regression-lock tests across 3 gateways.

## Verdict: CLEAN — 0 Critical / 0 High

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High     | 0 |
| Medium   | 0 |
| Low      | 2 (advisory only) |

---

## Hunt findings

### 1. Did the swap genericize an AUTHZ denial? — NO (verified safe)
Both swaps hit ONLY the unknown-error `catch{}` path:

- **study-timer.gateway.ts:189-191** — swap is inside the `try/catch` around the `server_members` membership `db.select()`. The authz-denial (`if (!isMember)` → `'Forbidden: not a member of this server'`, line 195-199) is a *separate downstream branch* reached only when the query resolves cleanly with an empty result. Untouched. Confirmed: valid-UUID-non-member takes the `Forbidden` path, not `WS_GENERIC_ERROR`.
- **messaging.gateway.ts:133-135** — swap is inside the `catch` around `rbacService.canViewChannelById()`. The authz-denial (`if (!allowed)` → `'Forbidden: cannot view channel'`, line 138-140) is the separate resolved-false branch. Untouched.

The two `Forbidden:` literals and the `'Invalid payload:'` literals were correctly left as distinct strings. The constant's own doc-comment explicitly forbids using it for authz/validation strings — the code matches the contract.

### 2. New null/undefined access or control-flow bug — NONE
The change is a pure string-literal-to-imported-const substitution. No new branches, no new dereferences, no altered control flow. `WS_GENERIC_ERROR` is a non-null string constant; every emit site already destructured `{ message }`. No regression surface.

### 3. Test quality — REAL, not vacuous
Assertions are substantive across all three specs:
- **study-timer** (LEAK-1a/1b, LOCK-1, FLOW-1): asserts exact `msg === WS_GENERIC_ERROR`, iterates an 8-token `SQL_LEAK_TOKENS` list with `.not.toContain` (incl. `22P02`, `server_members`, `user_id`, the raw pg message, and the userId), asserts room NOT joined, and asserts `getTimerForRoom` NOT called (early-return proven). LOCK-1 asserts the specific `Forbidden` string AND `!== WS_GENERIC_ERROR` — authz preservation is genuinely locked. FLOW-1 proves the happy path still joins + reconciles.
- **messaging** (LOCK-MSG-1/2/3): simulates a real `22P02` error object on `canViewChannelById`, asserts generic constant + leak-token absence + join denied; LOCK-MSG-2 locks the `Forbidden: cannot view channel` string against genericization; LOCK-MSG-3 proves happy-path join.
- **presence** (LOCK-PRES-1/2/3): correctly models presence's *different* architecture — `handleJoinChannel` uses `TypingStartSchema.safeParse` (Zod `z.string().uuid()`) which rejects non-UUID BEFORE any RBAC/DB call (verified against presence.gateway.ts:241). Test asserts RBAC NOT called + leak-tokens absent + `Forbidden` preserved on valid-UUID-non-member. This is why presence needed no production swap — accurate.

The thenable-mock DB chain (`then/from/where/limit`) faithfully reproduces the drizzle query-builder shape; the throwing variant genuinely drives the catch path.

### 4. Leak reintroduced — NO
No `err.message`, `err.code`, `err.detail`, or any caught-error field is forwarded to any client emit anywhere in the diff. All catch paths emit the static constant. The regression class stays closed.

---

## Low (advisory, non-blocking)

- **L1 — presence LOCK-PRES-1 leak-token list is thinner than the others.** It checks `['invalid input syntax', '22P02', 'uuid_cast', USER_ID]`. Because presence rejects at the Zod boundary (message is a static validation string, never a DB error), the risk is nil — but for parity with the study-timer 8-token list it could include `server_id` / `not-a-uuid-at-all` (the raw input) to guard against a future refactor that echoes the offending value. Cosmetic.
- **L2 — messaging.gateway.spec.ts:557-561 (pre-existing LOCK-MSG author-exclusion fixture) omits the `channelName`/`serverId` fields** present in the `MentionEvent` shape used elsewhere; not part of this diff's new tests and not a defect, noted only because it sits adjacent. No action.

## Conclusion
Tiny, correctly-scoped verify-and-harden change. Swaps are surgically confined to the unknown-error catch paths; authz-denial and payload-validation strings preserved and explicitly test-locked; no new null/control-flow risk; tests are real and assert the full leak-absent + still-denied + Forbidden-preserved triad. **APPROVED for B-6 gate.**
