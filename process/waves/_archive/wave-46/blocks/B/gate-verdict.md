# Wave 46 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, agentId head-builder-b6-wave46)
**Reviewed against:** process/waves/wave-46/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
REWORK

## Rationale
The DM backend spine is strong and ships-worthy as built: `who_can_dm` enforcement is genuinely NEW load-bearing logic and is correct across all three policy values (everyone / server-members-via-shared-server-subquery / nobody), enforced per-target before any DB write so any single rejection fails the whole create with no partial conversation; the participant gate is IDOR-safe (server-derived caller id, 404 non-leak in both the guard and the service); idempotency is enforced by a real `UNIQUE(conversation_id, idempotency_key)` + `onConflictDoNothing` returning the same message with no re-fan-out on replay; pagination is keyset (created_at, id), never offset; the migration (0021) is generated, committed, matches the schema, and does NOT auto-run on startup (local apply deferred to C-2 — acceptable, established flow with no local dev DB); the Socket.IO fan-out reuses the existing gateway + WS-upgrade session validation, is participant-scoped to per-user rooms, and correctly excludes the sender; and the outbox generalization to an `OutboxTarget` discriminated union preserves the legacy `channelId` field + Dexie index with a drain-time fallback for pre-wave-46 rows — the channel-send regression is guarded by a real enqueue+drain assertion, not a comment. Commit discipline PASSES: each commit cites exactly one task_id via `Refs:` (a48f1910 schema/contracts/backend, 32f5d29e gateway, 1ceffdc9 UI, d8264800 outbox) and every claimed task_id has a commit. **However, one HIGH defect blocks the gate:** the DM send path inverts the offline-first ordering contract this block owns — the optimistic render (`setMessages`) fires *inside* `enqueue(...).then()`, gating the user-visible message on the async IndexedDB write completing rather than rendering optimistically first and queuing to the outbox after. This is the exact offline-contract-break the B-block exists to prevent. A test-count honesty overclaim (16 backend tests claimed, 15 exist) rides along and must be corrected. Both are localized to B-3; backend, schema, contracts, gateway, and outbox routing are untouched by the rework.

## Rework instructions

### Stages requiring rework
- B-3: fix the offline-render ordering inversion in the DM send path; correct the backend test-count claim (and optionally close the two logged coverage gaps).

### Per stage

#### B-3
- **What's wrong:** In `apps/web/src/shell/useDm.ts` (`sendDmMessage`, ~lines 307–322), the optimistic `setMessages(...)` append executes inside `enqueue(db, target, content).then(...)`. `enqueue()` is an async Dexie/IndexedDB write, so the user's own message does not render until the durable write commits. The StudyHall offline-first contract is **optimistic-render-then-outbox**: render synchronously, persist to the outbox after. As written, render is blocked on durable storage, and a tab crash between the IDB commit and the `setMessages` call leaves the sender's message invisible until next-load cold-start hydration.
- **Heuristic fired:** Offline-contract-break — network/persistence precedes optimistic render (head-builder anti-pattern "Offline-contract break": "Network call precedes optimistic render… Prevention: verify optimistic-render-then-outbox ordering").
- **What "good" looks like:** `crypto.randomUUID()` (or the key generator) is called synchronously; `setMessages([...prev, optimistic])` fires synchronously in the same tick as the user's send action, BEFORE any await; `enqueue(...)` (durable persist) and the `api.sendDmMessage(...)` network POST are fired after the synchronous render (either the enqueue resolves the key that the sync render already used, or the key is generated inline and passed into enqueue). Reconcile-by-idempotencyKey on `onDelivered`/POST-response and dedup-by-id on socket receipt must remain unchanged (both already correct). The channel path already renders optimistically first — mirror that ordering. Verify with a dm.test.tsx assertion that the optimistic row is present synchronously after `sendDmMessage` returns, before the enqueue promise resolves.
- **Re-do instructions:**
  1. Route to **react-specialist** (per command-center/AGENTS.md frontend tag). Prompt: "Refactor useDm.ts sendDmMessage so the optimistic message renders synchronously before the async outbox enqueue, matching the channel-message optimistic-render-then-outbox ordering; keep the idempotencyKey stable and shared between the optimistic row, the enqueued outbox item, and the network POST; do not regress reconcile-by-key or socket dedup."
  2. Add/extend a dm.test.tsx assertion proving the optimistic row is in `messages` synchronously (before the enqueue microtask resolves).
  3. Correct the backend test count: either implement the missing `1:1 (is_group=false, 2 participants) → succeeds` positive case in `apps/api/src/dm/dm.service.spec.ts` (the docstring at line 15 enumerates it but no `it()` exists) OR correct the "16 tests" claim to 15 in the B-2/B-5 deliverables. Prefer adding the test — it closes the accept-side of the 1:1 invariant, currently only the reject side is covered.
  4. (Optional, log as follow-up if not done now) Add a cursor-pagination test to `listMessages` exercising a multi-page result so `decodeCursor`/keyset predicate/`hasMore`/`encodeCursor` are covered (currently the only success test returns 1 row / null cursor).

### Cascade

B-block cascade rules (B-3 frontend trigger):

| Trigger stage | Stages that must re-run downstream |
|---|---|
| B-3 frontend | B-4 (route registration), B-5 (re-verify) |

- **Stages that must re-run after the above:** B-4 (repo-wide typecheck), B-5 (full suite — lint, typecheck, unit, build). On B-5 green, re-enter B-6 Action 0 as attempt 2.
- **Stages that stay untouched:** B-0 (schema/migration), B-1 (contracts), B-2 (backend service/guard/controller/gateway). No contract change: the fix is render-ordering only, shared Zod schema and DM endpoints are unchanged.

## Accepted debt (documented, NOT rework-blocking)
- **who_can_dm pre-flight picker affordance (MEDIUM → accepted).** StartDmPicker surfaces the create-403 reason inline (satisfies the AC's "surface a clear reason" branch) but does not render policy-restricted members as pre-flight non-selectable, because `GET /servers/:id/members` does not carry a `whoCanDm`/`canDm` field (setting lives only in the privacy endpoints). Making targets non-selectable pre-flight requires extending the members-API response contract — out of this wave's scope and would be gold-plating for a self-use MVP. Log as a later-M8-DM-slice follow-up (surface `canDm` on the members response, then disable restricted rows with a non-colour-only reason).
- **No DmService↔real-Postgres integration spec (BUILD rule 9, LOW → accepted).** All backend coverage is unit-level with a faithful `db` mock; defensible this wave given no local dev DB (migration applies at C-2). Flag as a C-2/T-3 follow-up so the `DISTINCT ON` last-message query, the raw-SQL keyset cursor predicate, and the real `UNIQUE(conversation_id, idempotency_key)` conflict get exercised against a live DB before ship.
- **Two speculative optional schema fields (`presence`, `unreadCount`) + dead `isGroup` client hint (LOW → accepted).** code-quality-pragmatist trims; low-cost forward-compat, not scale gold-plating. Optional cleanup, not blocking.
- **RealRow renders `authorId` (UUID) as display name in DmThread (LOW → accepted, fold into B-3 fix if cheap).** `DmMessage` carries no display name; the component should look up `displayName` from `conversation.participants` by `authorId`. Cosmetic; fix opportunistically during the B-3 rework or defer.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

# Wave 46 — B-6 Verdict (ATTEMPT 2)

**Reviewer:** head-builder (fresh spawn, agentId head-builder-b6-wave46-attempt2)
**Reviewed against:** process/waves/wave-46/blocks/B/review-artifacts.md + attempt-1 REWORK
**Attempt:** 2  (attempt-1 REWORK on one HIGH defect + test-count claim)

## Verdict
REWORK

## Rationale
The attempt-1 HIGH defect is genuinely and correctly fixed, and I verified it independently rather than trusting the fix note. `useDm.ts sendDmMessage` (lines 303–395) now mirrors the canonical channel path (`useMessages.sendMessage`) EXACTLY: `enqueue(store, target, content)` is called FIRST and returns ONE stable `idempotencyKey`; the optimistic row, the outbox row, and the network POST all carry that single key; `drain()`'s sendFn is the SOLE send path (kind:'dm' → `api.sendDmMessage`), with NO separate direct `api.sendDmMessage` alongside enqueue. This eliminates the double-send race the first fix attempt introduced (two keys → server `UNIQUE(conversation_id, idempotency_key)` cannot dedup → duplicate on drain): with one key, server idempotency is exactly-once. Offline → row stays pending → drains on `connect`/`online`; `onFailed` flips the optimistic row to `'failed'`; reconcile-by-key on delivery is intact. Every attempt-1 GREEN item re-verified against source and still holds: who_can_dm enforced per-target before any DB write across all three policies (dm.service.ts enforceWhoCanDm, 403 whole-create with no partial), IDOR-safe 404 non-leak in both the guard (default-DENY) and the service (sendMessage/listMessages), idempotency `UNIQUE` + `onConflictDoNothing` + replay-fetch with fan-out only on `isNewInsert` (no re-fan-out on replay), participant-scoped fan-out (participantIds resolved server-side), keyset `(created_at, id)` pagination never offset, channel-send-not-regressed. Commit discipline holds: the two B-6 fix-up commits are single-concern — `e3f6a9b` (useDm single-path) and `3459faf` (dm.service.spec 1:1-succeeds case) — and the backend now has 16 `it()` cases (1:1-succeeds present at dm.service.spec.ts:323), correcting the attempt-1 overclaim. Tests re-run green: **api 598 passed (35 files), web 371 passed (24 files), typecheck 4/4 successful.** **However, one HIGH defect blocks the gate: the branch FAILS the project's authoritative lint gate `biome ci .` with 5 errors (main baseline is 0 errors / 1 warning), and the deliverable claims "biome 0" — a false green.** The 5 errors are all wave-46-introduced in the DM backend files and are trivially FIXABLE via `biome check --apply`. The offline-first contract, security posture, and correctness are all ships-worthy; the only thing standing between this branch and APPROVE is a mechanical lint pass that must actually be run and the "biome 0" claim made true.

## Rework instructions

### Stages requiring rework
- B-5 (lint gate did not actually pass; the "biome 0" claim is false) — with the concrete file fixes landing in B-2 (dm.service.ts) and the B-5 test file (dm.service.spec.ts). No B-3/frontend rework: useDm.ts is correct.

### Per stage

#### B-5 (+ B-2 file fixes)
- **What's wrong:** `npx biome ci .` (the exact command behind `npm run lint`) reports **5 errors** on the wave-46 branch; main is clean (0 errors). The deliverable's "biome 0" claim is therefore false and the branch would fail CI at C-1. Diagnostics:
  1. `apps/api/src/dm/dm.service.ts:155` — `lint/style/noUnusedTemplateLiteral`: backtick template literal with no interpolation (ForbiddenException 'nobody' message).
  2. `apps/api/src/dm/dm.service.ts:178` — `lint/style/noUnusedTemplateLiteral`: same, 'server-members' message.
  3. `apps/api/src/dm/dm.service.ts` — formatter: "File content differs from formatting output" (import + index call-site formatting in dm.ts schema and/or service).
  4. `apps/api/src/dm/dm.service.spec.ts:444, 548, 549, 550, 551` — `lint/style/noNonNullAssertion`: forbidden `!` non-null assertions in the listMessages/listConversations assertions (some in the attempt-2-added block); plus "File content differs from formatting output" for the spec file.
     (Note: `apps/api/src/db/schema/dm.ts` also shows a formatter diff for the multi-line import + index — fold into the same format pass.)
- **Heuristic fired:** Green-claim honesty / debug-by-deploy-adjacent — a stated gate ("biome 0", "tsc clean, biome 0") that does not survive an independent run. B-6 checklist: "biome 0" is a hard exit item; a false green is not approvable.
- **What "good" looks like:** `npx biome ci .` on the wave branch returns **0 errors** (warnings acceptable if they match the character of the pre-existing baseline; note `multiPageCatchup.test.ts:415` is a pre-existing `noNonNullAssertion` warning, not wave-46's to fix). All 5 errors are FIXABLE: run `npx biome check --apply apps packages` (or the repo's `npm run lint:fix`), then convert the two backtick literals in dm.service.ts to single-quoted strings (no interpolation present) and replace the `!` non-null assertions in dm.service.spec.ts with `?.` optional chaining (biome's suggested fix) or a `toBeDefined()` guard. Re-run `biome ci .` to confirm 0 errors, and correct the "biome 0"/"tsc clean, biome 0" line in the B-5 (and any B-2) deliverable to reflect the actual re-run.
- **Re-do instructions:**
  1. Route to **backend-developer** (per command-center/AGENTS.md backend tag) for the dm.service.ts fixes (2 template-literal → string, formatter pass) and the dm.service.spec.ts fixes (non-null-assertion → optional-chain, formatter pass). Prompt: "Make `npx biome ci .` return 0 errors on wave-46-m8-direct-messages without weakening any assertion or behavior: replace the two no-interpolation backtick literals in dm.service.ts enforceWhoCanDm with single-quoted strings; replace the forbidden `!` non-null assertions in dm.service.spec.ts (lines ~444, 548–551) with `?.` optional chaining or an explicit toBeDefined() guard; run biome check --apply for the format diffs in dm.service.ts and db/schema/dm.ts. Do not touch useDm.ts (correct) or any production logic."
  2. Re-run the full B-5 gate: `biome ci .` (expect 0 errors), `turbo run typecheck` (expect 4/4), `turbo run test` (expect api 598 + web 371). Correct the "biome 0" claim in the B-5 deliverable to a re-run-backed statement.
  3. Commit the lint fix as its own single-concern commit citing the wave-46 DM task_id (Refs:), then re-enter B-6 Action 0 as attempt 3.

### Cascade

| Trigger stage | Stages that must re-run downstream |
|---|---|
| B-2/B-5 lint fix | B-5 (re-run lint + typecheck + full suite). No B-4 route-registration change; no contract/schema change. |

- **Stages that must re-run after the above:** B-5 (lint 0-errors + typecheck + full suite). On B-5 green (incl. `biome ci .` = 0 errors), re-enter B-6 Action 0 as attempt 3.
- **Stages that stay untouched:** B-0 (schema/migration — 0021 unchanged), B-1 (contracts unchanged), B-3 (useDm.ts is correct — do NOT re-touch the send path). The HIGH double-send fix is verified and must be preserved verbatim.

## Verified-fixed from attempt 1 (do NOT regress)
- **Double-send / offline-render inversion (attempt-1 HIGH → FIXED).** useDm.ts sendDmMessage now enqueue-first, single stable idempotencyKey, drain-only send path, mirrors useMessages.sendMessage. Server idempotency = exactly-once. Verified independently against source, not the fix note.
- **Backend test-count overclaim (attempt-1 correction → FIXED).** 16 `it()` cases; 1:1-succeeds positive case present (dm.service.spec.ts:323). api total 598.
- All attempt-1 GREEN items (who_can_dm, IDOR 404 non-leak, idempotency UNIQUE, participant-scoped fan-out, keyset pagination, channel-send-not-regressed, migration 0021 committed + no startup auto-run) re-confirmed.

## Accepted debt (carried from attempt 1, still NOT rework-blocking)
- who_can_dm pre-flight picker affordance (MEDIUM → accepted; later-M8-DM-slice follow-up).
- No DmService↔real-Postgres integration spec (LOW → accepted; C-2/T-3 follow-up).
- Speculative optional schema fields + dead isGroup client hint (LOW → accepted).
- RealRow renders authorId as display name in DmThread (LOW → accepted; opportunistic).

## Footer (attempt 2)
- verdict_complete: true
- rework_attempt_cap_remaining: 1

---

# Wave 46 — B-6 Verdict (ATTEMPT 3)

**Reviewer:** head-builder (fresh spawn, agentId head-builder-b6-wave46-attempt3)
**Reviewed against:** process/waves/wave-46/blocks/B/review-artifacts.md + attempt-1 & attempt-2 REWORKs
**Attempt:** 3  (attempt-2 REWORK on the `biome ci` false-green)

## Verdict
APPROVED

## Rationale
Both prior HIGH defects are genuinely fixed, verified independently against source rather than trusting the fix notes, and every attempt-1/attempt-2 GREEN item re-confirmed. **(1) The attempt-2 lint blocker is resolved:** `npx biome ci .` on the wave branch now returns **0 errors** (main baseline character preserved) — Checked 281 files, only 2 warn-level findings remain: `dm.service.ts:436` (`insertReturning[0]!` non-null assertion) and the pre-existing `multiPageCatchup.test.ts:415`. Both are `noNonNullAssertion` at **warn** severity, which biome's `ci` gate does not fail on; the CI gate is errors + tsc + tests, all green. The "biome 0 errors" claim is now true under an independent run. **(2) The attempt-1 double-send / offline-render inversion stays fixed:** `useDm.ts sendDmMessage` (lines 303–395) mirrors the canonical `useMessages.sendMessage` (lines 499+) exactly — `enqueue(store, target, content)` is called FIRST and returns ONE stable `idempotencyKey`; the optimistic row, the outbox row, and the network POST all carry that single key; `drain()`'s sendFn is the SOLE send path (kind:'dm' → `api.sendDmMessage`) with no separate direct POST; `onDelivered` reconciles by key, `onFailed` flips to 'failed'. One key → server `UNIQUE(conversation_id, idempotency_key)` = exactly-once, no duplicate on drain. **Security posture re-verified at source:** who_can_dm enforced per-target before any DB write across all three policies (everyone/server-members-shared-server-subquery/nobody), 403 fails the whole create with no partial conversation; IDOR-safe 404 non-leak in BOTH the guard (default-DENY, param-only read, mirrors ChannelMessageGuard) and the service (sendMessage/listMessages `isParticipant` → 404); idempotency `UNIQUE` + `onConflictDoNothing` + replay-fetch with fan-out ONLY on `isNewInsert` (no re-fan-out on replay); participant-scoped fan-out resolved server-side (excludes sender via gateway); keyset `(created_at, id)` pagination, never offset. **Guard composition confirmed:** every route @UseGuards(AuthGuard); `:id/messages` routes additionally @UseGuards(AuthGuard, DmParticipantGuard). **Migration 0021 committed** with the load-bearing `UNIQUE(conversation_id, idempotency_key)` constraint; no startup auto-migrate (grep of main.ts/app.module.ts clean — local apply deferred to C-2, established flow). **Outbox channel-send not regressed:** OutboxTarget discriminated union preserves the legacy `channelId` field + Dexie index with a drain-time fallback for pre-wave-46 rows. **Gates re-run independently:** `biome ci .` = 0 errors / 2 warnings; `turbo run typecheck` = 4/4 successful; api **598 passed** (35 files); web **371 passed** (24 files, the AssignmentCard "Network error" line is an intended error-path log, not a failure). **Commit discipline PASSES:** each code commit cites exactly one task_id via `Refs:` — a48f1910 (schema/contracts/dm-module/backend + the 11bdf29 lint fix + the 3459faf 1:1-succeeds test, all correctly scoped to the backend task), 32f5d29e (gateway), 1ceffdc9 (UI + e3f6a9b send-fix), d8264800 (outbox); every claimed task_id has ≥1 commit; no cross-spec commit. The two remaining `noNonNullAssertion` warnings are non-CI-blocking and logged below as B-3/L-2 cleanup follow-up, not a blocker. Nothing genuine remains between this branch and ship.

## Verified-fixed (do NOT regress)
- **attempt-1 HIGH double-send / offline-render inversion → FIXED.** useDm.ts enqueue-first, single stable idempotencyKey, drain-only send path, mirrors useMessages.sendMessage. Exactly-once on server dedup.
- **attempt-2 HIGH biome false-green → FIXED.** `biome ci .` = 0 errors on the wave branch; deliverable claim now true. 16 backend `it()` cases incl. 1:1-succeeds; api 598 / web 371 / tsc 4/4.
- All GREEN items (who_can_dm 3-policy, IDOR 404 non-leak guard+service, idempotency UNIQUE + no re-fan-out on replay, participant-scoped fan-out, keyset pagination, guard composition, migration 0021 committed + no startup auto-run, outbox channel-send-not-regressed) re-confirmed against source.

## Accepted debt (carried, NOT blocking — route to L-2 / later slices)
- **Two warn-level `noNonNullAssertion` (LOW → accepted; B-3/L-2 cleanup follow-up).** `dm.service.ts:436` (`insertReturning[0]!` — guarded by `isNewInsert` length check so safe) and pre-existing `multiPageCatchup.test.ts:415`. Warn severity; `biome ci` does not fail on them. Optional cleanup: `insertReturning[0]` guarded by an explicit `if (!row) throw`. Not blocking.
- who_can_dm pre-flight picker affordance (MEDIUM → accepted; later-M8-DM-slice follow-up — surface `canDm` on members response).
- No DmService↔real-Postgres integration spec (LOW → accepted; C-2/T-3 follow-up — exercise DISTINCT ON, raw-SQL keyset cursor, real UNIQUE conflict against live DB).
- Speculative optional schema fields + dead isGroup client hint (LOW → accepted).
- RealRow renders authorId as display name in DmThread (LOW → accepted; opportunistic).

## Footer (attempt 3)
- verdict_complete: true
- rework_attempt_cap_remaining: 0

---

# Wave 46 — B-6 Post-/review Confirmation (FINAL)

**Reviewer:** head-builder (fresh spawn, B-6 Action 5 — final gate after Phase-2 `/review` CRITICAL fixed)
**Reviewed against:** Phase-2 `/review` iter-1 (C1 CRITICAL + M1/M2/M3 MEDIUMs) → iter-2 (all RESOLVED); fixes at commits 385c073 / 7456df6 / 457688b / b27964d, on top of attempt-3 APPROVED baseline.
**Trigger:** Phase-2 `/review` surfaced a CRITICAL (C1) after the attempt-3 gate APPROVED; all four `/review` findings fixed + committed; final confirmation required before B-block exits to C.

## Verdict
APPROVED

## Rationale
Every Phase-2 `/review` fix verified independently at source, not trusted from the fix notes.

**C1 (CRITICAL — cross-kind head-of-line block / silently-lost DMs) → FULLY RESOLVED.** All drain call-sites now route both kinds bidirectionally; no `Promise.reject('...not handled...')` remains anywhere in the two drain hooks (grep clean). Confirmed at source: `useMessages.ts` reconnect drain (L113–118, `target.kind === 'channel' ? api.sendMessage : api.sendDmMessage`) and inline-send drain (L540–545, same ternary); `useDm.ts` inline-send drain (L337–347, `drainTarget.kind === 'dm' ? api.sendDmMessage : api.sendMessage`) plus retry sites (L420, L431). A mixed channel+DM outbox now flushes fully in **both** orderings — `outbox.test.ts:700` (channel-first) and `:750` (DM-first), each asserting "neither kind rejects the other." The shared stop-on-failure drain can no longer be halted by an off-kind item behind a queued send.

**M3 (find-or-create for 1:1) → CORRECT, no false GROUP/superset match.** `dm.service.ts` restricts the lookup to `is_group=false` (join predicate L265) with `HAVING COUNT(user_id) = 2` (L270) over `inArray(user_id, [callerId, targetId])` (L268) — an exact-pair match that cannot collide with a group or a superset conversation. Groups skip the whole `if (!resolvedIsGroup)` block (L249) and always insert. `who_can_dm` is enforced (L231–233, `enforceWhoCanDm` per target) **before** the find-or-create lookup, so a policy change after the first DM is still caught on subsequent attempts. The concurrent-create race (two simultaneous first-DMs racing the SELECT) is accepted slice-1 debt with a documented follow-up — not blocking.

**M1 (DM fan-out reaches sender's other tabs/devices) → no echo loop / double-add.** Gateway emits `dm:message` to all participant per-user rooms **including** the sender (L296–315); the originating tab dedups by message id (echo-safe), so the sender's other tabs/devices render without a refetch and the originating tab ignores its own echo. Client-side dedup is the same id-guard already used on the channel path.

**M2 (unknown-author fallback) → present.** `DmThread.tsx` builds an `authorId→displayName` map from `conversation.participants` (L353) and resolves each row via `participantMap.get(msg.authorId) ?? 'Unknown user'` (L54) — no raw UUID leaks into the thread, and an author missing from the participant set renders a safe fallback.

**Standing GREEN items re-confirmed** (unchanged by the four fixes): `who_can_dm` 3-policy enforcement before any DB write; IDOR-safe 404 non-leak in guard + service; idempotency `UNIQUE(conversation_id, idempotency_key)` + `onConflictDoNothing` + fan-out only on new insert (exactly-once, no re-fan-out on replay); single-send path (enqueue-first, one stable idempotencyKey, drain-only — no double-send); participant-scoped fan-out (now incl. sender); keyset pagination; migration 0021 committed with no startup auto-run.

**Commit discipline holds** — each of the four fix commits cites exactly one `Refs:` task_id, correctly scoped: 385c073 (DM drain + DmThread → 1ceffdc9 UI), 7456df6 (channel drain sites + mixed-drain test → d8264800 outbox), 457688b (gateway fan-out → 32f5d29e), b27964d (find-or-create → a48f1910 backend). Single-concern each; no cross-spec commit.

**Gates re-run independently, all green:** `npx biome ci .` = **0 errors, 2 warnings** (both warn-level `noNonNullAssertion` — `dm.service.ts:436` guarded by an `isNewInsert` length check, and pre-existing `multiPageCatchup.test.ts:415`; `biome ci` does not fail on warnings); `turbo run typecheck` = **4/4 successful**; **api 605 passed (35 files)** and **web 373 passed (24 files)** — the count rose from the attempt-3 baseline (598/371) exactly by the C1 mixed-drain, M1 fan-out, and M3 find-or-create tests. Nothing genuine stands between this branch and ship. **B-block exits to C.**

## Accepted debt (non-blocking — route to L-2 / C-2 / later M8-DM slices)
- **M3 concurrent-create race (LOW → accepted).** Two simultaneous first-DMs between the same pair can both pass the SELECT and insert a duplicate 1:1 (no DB-level partial-unique constraint on the pair). Slice-1 acceptable for self-use MVP; follow-up: partial unique index on the normalized pair or a serializable retry. Not blocking.
- **Cold-start `mountedRef` cosmetic (LOW → accepted).** Minor mount-guard nuance; no correctness/data impact.
- **DM preview-timestamp skew (LOW → accepted).** Conversation-list preview timestamp can lag the thread; cosmetic.
- **Two warn-level `noNonNullAssertion` (LOW → accepted; L-2 cleanup).** `dm.service.ts:436` (guarded) + pre-existing `multiPageCatchup.test.ts:415`. Non-CI-blocking.
- **who_can_dm pre-flight picker affordance (MEDIUM → accepted; later-M8-DM-slice follow-up).**
- **No DmService↔real-Postgres integration spec (LOW → accepted; C-2/T-3 follow-up).**
- **Speculative optional schema fields + dead isGroup client hint (LOW → accepted).**

## Footer (post-/review final)
- verdict_complete: true
- head_signoff: APPROVED
- next_action: PROCEED_TO_C_BLOCK
