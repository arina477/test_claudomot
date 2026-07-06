# V-1 Semantic-Spec Verification — jenny (wave-54)

- **Wave:** 54 — WS-gateway info-disclosure regression-lock + canonical error string (verify-and-harden)
- **Spec SoT:** `tasks.description` YAML head, task `c52a7a52-c2da-48d7-ac08-a8d849e9f429`
- **Deployed commit:** `97c8e99` (api `https://api-production-b93e.up.railway.app`) — confirmed `git merge-base --is-ancestor 97c8e99 HEAD` = YES, and `git diff 97c8e99 HEAD` on all four target files (ws-errors.ts + 3 gateways) is **empty** → no drift between deployed and current tree.
- **Cross-ref:** T-8 live pentest `process/waves/wave-54/stages/T-8-evidence/pentest-report.md` (5 live prod probes, no findings).
- **Method:** Independent read of deployed source at `97c8e99` (not trusting the pentest report's code-path claims) + regression-test inspection + Zod schema confirmation + cross-check against the 5 live probes.

## Verdict: APPROVE

All 6 acceptance criteria are satisfied on deployed behavior. The one flagged deviation (AC5 scope) is a **match given the plan's scope-guard**, not spec-drift and not spec-gap. Reasoning below.

---

## Per-AC verification

### AC1 — study-timer malformed non-UUID → generic non-leaking + denied + per-handler regression test — MET
- **Code (`study-timer.gateway.ts:handleJoinTimerRoom`):** the `server_members` membership `db.select` is wrapped in `try/catch`; the `catch {}` emits `{ message: WS_GENERIC_ERROR }` on `STUDY_TIMER_JOIN_ERROR_EVENT` and `return`s (no `socket.join`, no timer DTO) → denied. Constant imported from `../common/ws-errors`.
- **Test:** `study-timer.gateway.spec.ts` LEAK-1a — injects a real pg `22P02` error carrying `table: 'server_members'` / `detail: '... user_id column'`, asserts `msg === WS_GENERIC_ERROR`, iterates `SQL_LEAK_TOKENS` (`invalid input syntax`, `server_members`, `user_id`, …) with `not.toContain`, and asserts `svc.getTimerForRoom` `not.toHaveBeenCalled` (denied). LEAK-1b covers a generic non-pg error in the same catch.
- **Live:** pentest probe 1 — verbatim `Something went wrong`, NONE leak tokens, no timer state → PASS.

### AC2 — messaging malformed → generic + denied + per-handler regression test — MET
- **Code (`messaging.gateway.ts:handleJoinChannel`):** `canViewChannelById` wrapped in `try/catch`; `catch {}` emits `socket.emit('error', { message: WS_GENERIC_ERROR })` and returns (no join) → denied.
- **Test:** `messaging.gateway.spec.ts` LOCK-MSG-1 (malformed DB error → `WS_GENERIC_ERROR`, SQL tokens absent), and the join-denied assertions (`socket.join` `not.toHaveBeenCalled`).
- **Live:** pentest probe 3 — verbatim `Something went wrong`, no leak, denied → PASS.

### AC3 — presence confirmed (Zod `.uuid()` safe) with an EXPLICIT regression assertion so it is TESTED — MET
- **Code:** `packages/shared/src/presence.ts` — `TypingStartSchema`/`TypingStopSchema` = `z.object({ channelId: z.string().uuid() })`. `presence.gateway.ts` `safeParse`s before any RBAC/DB call; on failure emits a literal `'Invalid payload: channelId (UUID) required'` and returns.
- **Test:** `presence.gateway.spec.ts` LOCK-PRES-1 — non-UUID channelId, asserts `rbac.canViewChannelById` `not.toHaveBeenCalled` (Zod fires pre-DB), `socket.join` `not.toHaveBeenCalled` (denied), error `msg` `not.toContain` `['invalid input syntax','22P02','uuid_cast', USER_ID]`, and `msg` truthy. The class is now explicitly TESTED (was previously untested per the spec's framing).
- **Live:** presence namespace was not probed live (spec/pentest scoped live probes to timer+messaging), but AC3's requirement is an *explicit regression assertion* — satisfied at unit level, which is exactly what the AC asks for. The Zod-before-DB ordering makes a live DB-cast leak structurally impossible here.

### AC4 — each test asserts ABSENCE of leak tokens AND still-denied — MET
- study-timer LEAK-1a: `not.toContain` over `SQL_LEAK_TOKENS` **AND** `getTimerForRoom` not called + no room join.
- messaging LOCK-MSG-1: `WS_GENERIC_ERROR` exact + join not called.
- presence LOCK-PRES-1: leak-token `not.toContain` **AND** rbac/join not called.
- Both halves of the "lock the class closed vs a future refactor" requirement are present in all three specs.

### AC5 — ONE canonical generic error-string constant in a shared location + used across WS gateway rejection catches — MET (see deviation ruling)
- `apps/api/src/common/ws-errors.ts` defines the single authoritative `WS_GENERIC_ERROR = 'Something went wrong'` with doc-comment forbidding its use for authz/validation strings.
- Imported and used in the two gateways whose rejection catches previously held **ad-hoc generic literals**: study-timer (membership catch) and messaging (channel-access catch).

### AC6 — no production regression; authz denials PRESERVED — MET (critical semantic check)
- **Authz literals preserved (NOT genericized):** study-timer `!isMember` branch emits literal `'Forbidden: not a member of this server'`; messaging `!allowed` branch emits `'Forbidden: cannot view channel'`; presence `!allowed` emits `'Forbidden: cannot view channel'`. All three verified in deployed source.
- **Tests lock preservation:** LOCK-1 / LOCK-MSG-2 / LOCK-PRES-2 each assert the exact Forbidden string **AND** `not.toBe(WS_GENERIC_ERROR)` — the distinct-from-generic assertion is the regression lock.
- **Live:** pentest probes 2 & 4 — valid-UUID non-member/non-viewer returned the SPECIFIC `Forbidden: ...` strings (not genericized) on prod. Probe 5 happy-path member join intact. 729 unit tests green (T-2).

---

## Deviation ruling (the AC5 scope question)

**Observation:** study-timer + messaging swapped their in-catch **ad-hoc generic literals** to `WS_GENERIC_ERROR`. The presence gateway's catch literals (`'Internal error checking channel access'`) and validation literals were **NOT** swapped to the constant.

**Ruling: MATCH — not spec-drift, not spec-gap.** Rationale:
1. The spec's `edge-cases` and reframe prose scope the constant to the paths that "hit uuid-cast, catch genericizes" — i.e. the two gateways that forward an unexpected error through a bare catch to the client. Presence is explicitly characterized in the spec as "Zod `.uuid()` pre-DB" — it **never reaches a DB-cast catch on the malformed-input path**, so there is no rejection-catch on the leak-relevant path to route through the constant. Its `'Internal error checking channel access'` literal sits behind a *valid-UUID* RBAC call, a different path the spec does not target.
2. AC5's phrase "across WS gateway rejection catches" is satisfied by covering the catches that actually genericize an unexpected error to the client — the two ad-hoc-literal gateways. Applying it to presence would be scope the spec deliberately did not ask for; the reframe prose ("class ALREADY CLOSED … presence Zod `.uuid()`") is the scope-guard.
3. This is neither drift (nothing was built that contradicts the spec) nor gap (nothing the spec required is missing) — presence's leak-safety is delivered by the Zod guard, which AC3 verifies independently, and AC5's "one canonical string" is honored (single definition, no second literal introduced, no duplication).

**Residual note (informational, non-blocking):** presence still carries two distinct ad-hoc non-authz literals (`'Internal error checking channel access'`, `'Invalid payload: channelId (UUID) required'`). These are leak-safe (contain no SQL/DB internals) and out of AC5's scope. If a future wave wants a single generic-error vocabulary project-wide, folding these would be a *nice-to-have hardening* — not required by wave-54's contract. Flag for L-2 consideration only; does not affect this verdict.

---

## Evidence integrity
- Deployed-vs-tree drift check run directly (`git merge-base --is-ancestor` + empty `git diff`), so the T-8 report's "code-path corroboration" section was independently re-derived from `git show 97c8e99:<path>` rather than trusted.
- Zod `.uuid()` confirmed in `packages/shared/src/presence.ts` source at the deployed commit.
- All three regression-lock spec files (`study-timer` 378 lines, `messaging` 97, `presence` 83) present in `97c8e99` (#69) and inspected for both leak-absence and still-denied assertions.
