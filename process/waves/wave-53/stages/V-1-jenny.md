# V-1 Semantic-Spec Verification — jenny — Wave-53

- **Wave:** 53 (StudyHall) — study-room + shared-guard info-disclosure hardening
- **Mode:** automatic
- **Primary task:** `fb1c367a-4f63-47a5-8f35-10a8d0fd492a`
- **Spec SoT:** `tasks.description` YAML head (spec-id `wave-53-spec`) — read from DB, not the P-2 convenience copy
- **Deployed:** merge `9c114d0` (#68), Railway api LIVE per `318f37f`; `HEAD` = `d79df6c` (T-block complete). Same gateway content at `9c114d0` and working tree (verified `git show 9c114d0:…gateway.ts` diff of guard/helper lines).
- **Live health:** `GET https://api-production-b93e.up.railway.app/health` → **200**.
- **Evidence sources:** T-8 live pentest report (`process/waves/wave-53/stages/T-8-evidence/pentest-report.md`, 4 probes LIVE prod), deployed gateway code (`apps/api/src/study-room/study-room.gateway.ts`), `apps/api/src/common/uuid.util.ts`, `apps/api/src/auth/pg-error-utils.ts`.

---

## VERDICT: APPROVE

All 6 acceptance criteria are satisfied by deployed behavior. Deployed behavior matches spec **intent**, not merely the literal AC text — the parse-layer relocation makes the fix strictly stronger than the AC minimum (no DB round-trip, no userId echo, on the malformed path). Zero drift, zero gaps. The one wording nuance flagged in the task (AC1's message string) is a **match**, not a drift — analysis below.

---

## Per-AC findings (spec section → deployed evidence)

### AC-1 — Malformed serverId → generic error, no leak — MATCH (satisfied)
- **Spec intent:** non-UUID serverId on any verb returns a generic error via `STUDY_ROOM_JOIN_ERROR_EVENT` with NO Postgres/Drizzle/SQL/table/column text and NO echoed userId.
- **Deployed:** `parseServerPayload` (gateway L564-569) rejects non-UUID via `!isUuid(p.serverId)` → handler emits fixed literal `'Invalid payload: serverId required'` (L351-354) and returns *before* any DB call.
- **Pentest (Probe 1, LIVE):** `"not-a-uuid"`, `"'; DROP TABLE server_members;--"`, `"123"` → all three returned `Invalid payload: serverId required`; asserted absent: `invalid input syntax`, `server_members`, `22P02`, any SQL/column text, caller userId `21984eb2…`. No `study-room:rooms` emitted → DB not reached.
- **Message-string nuance (explicitly raised in the prompt):** spec AC1 says "a generic error … whose message contains NO leak"; the deployed string is the pre-existing `'Invalid payload: serverId required'` branch (the malformed input now routes here rather than to a new dedicated string). This is a **MATCH, not spec drift.** The spec's own edge-case list states the intended target: *"serverId non-UUID string … : generic validation error via JOIN_ERROR_EVENT, denied, no leak, no DB query"* and separately *"serverId missing/empty/non-string: existing 'Invalid payload: serverId required' path (unchanged)."* The AC constrains the message by **property** (generic, no-leak), not by exact string. The literal chosen satisfies every stated property. The mild imprecision — a non-UUID isn't literally "missing" — is cosmetic-only and carries zero security or contract consequence (payload shape `{ message: string }` is preserved per the contracts block). Classify as **acceptable spec-gap (cosmetic)**, not code drift: the spec under-specified the exact string; the code picked the correct-by-property existing generic branch. No rework warranted.

### AC-2 — Malformed request fully denied, no DB query (parse-layer rejection) — MATCH
- **Spec intent:** rejected at parse layer before `assertMember`; no rooms/roster/timer state returned; no DB query runs.
- **Deployed:** all five parsers (`parseServerPayload`/`parseCreatePayload`/`parseRoomPayload`/`parseConfigPayload`) gate `isUuid` and return `null` → handler emits the Invalid-payload literal and `return`s before touching `roomService`. No DB path reachable on the malformed branch.
- **Pentest (Probe 1):** root-cause note confirms "rejected *before* `assertMember` / any DB access"; no `study-room:rooms` emitted for any malformed input — "DB access confirmed not reached." **Satisfied.**

### AC-3 — Valid-UUID non-member → existing not-a-member denial, NOT genericized — MATCH
- **Spec intent:** legitimate 403-class `ForbiddenException` path unchanged; message `"You are not a member of this server"` passes through, not swallowed by the generic mapper.
- **Deployed:** `safeErrorMessage` (L541-543) forwards `err.message` verbatim for **any `HttpException`** (superset of `ForbiddenException`) and only genericizes non-Http errors. As the prompt notes, forwarding all `HttpException` is a **superset** of the AC's `ForbiddenException` requirement — it still satisfies AC3 (the not-a-member denial is a `ForbiddenException`, an `HttpException`, so it passes through). The spec's own contract block already anticipates this: *"ForbiddenException still passes its intended message through"* and edge-case *"ForbiddenException must NOT be swallowed by the generic mapper."* The `HttpException` superset does not weaken the authz message — it preserves it.
- **Pentest (Probe 2, LIVE):** fresh random valid UUID non-member (`1d266fe9…`) → `study-room:join_error` message `"You are not a member of this server"`; explicitly "correctly NOT genericized." **Satisfied.**
- *Note (not a finding):* forwarding **all** `HttpException` messages (not only `ForbiddenException`) is a deliberate, spec-sanctioned superset; the helper docstring names `ConflictException`/`BadRequestException` as intentional author-controlled client-safe messages. This is the SupertokensExceptionFilter convention reused (`auth.exception.filter.ts`). No leak risk: these are curated NestJS messages, never raw `Error`/Drizzle text.

### AC-4 — Unknown/unexpected error → generic client message + full server-side log — MATCH
- **Spec intent:** non-Forbidden/non-validation error mapped to a generic client string while full detail logs server-side; detail never in the client frame.
- **Deployed:** `safeErrorMessage` (L541-557): for non-`HttpException` it returns the caller-supplied `fallback` (e.g. `'Failed to subscribe to server rooms'`, `'Failed to create room'`, etc. — one per verb) to the client, and logs the full error server-side — `logger.warn(... err.stack)` for the 22P02 belt-and-suspenders case, else `logger.error('Unexpected error in study-room gateway (…)', err.stack)`. Client sees only the generic fallback; `err.stack`/raw message go to the server logger only.
- **Evidence:** deployed code path confirmed at `9c114d0`. This branch is not directly exercised by the live pentest (no way to inject a downstream blip on prod), but the code semantics are unambiguous and the T-8 report confirms the helper's discrimination via Probe 2 (Http passthrough) vs Probe 1 (parse-layer, never reaches helper). The unknown-error branch is the residual `else` of a two-way `instanceof HttpException` discrimination — provably generic. **Satisfied by code inspection + contract.**

### AC-5 — Reusable UUID-format guard applied to serverId on EVERY /study-room verb — MATCH
- **Spec intent:** a reusable UUID-format validator exists and is applied to serverId at the parse layer for every verb; malformed rejected before DB.
- **Deployed:** reusable guard `isUuid` in `apps/api/src/common/uuid.util.ts` (Zod `z.string().uuid()`, hoisted schema, pure). Applied to `serverId` in **all five** parsers: `parseServerPayload` L567, `parseCreatePayload` L574, `parseRoomPayload` L582, `parseConfigPayload` L595 — covering subscribe, create, join, leave, and all four timer verbs (start/pause/reset use `parseRoomPayload`; config uses `parseConfigPayload`). `roomId` additionally guarded on room/config parsers (L583, L596) — consistent with the spec's "MAY validate roomId for consistency" allowance. The guard is the durable artifact the deferred app-wide sweep (seed `c52a7a52`) consumes, exactly as the spec's `guard` contract specifies. **Satisfied — every verb covered.**

### AC-6 — All legitimate wave-52 focus-room flows unbroken — MATCH
- **Spec intent:** valid member can subscribe/create/join/leave/control timer as before; wave-52 E2E stays green.
- **Deployed / pentest:** Probe 3 (LIVE) — real member serverId `ad62cd12…` → `study-room:rooms` `{ serverId, rooms: [] }` (valid empty-state, resolves skeleton as designed); "member flow unbroken." Probe 4 (LIVE) — no-session connect → `connect_error: "Unauthorized"`; auth gate intact, not weakened. T-block: head-tester APPROVED, 0 findings (`d79df6c`). The fix only tightens the parse-layer format check and hardens the catch; happy-path member semantics (parsers still accept valid UUIDs, service calls unchanged) are untouched. **Satisfied.**

---

## Drift vs Gap ledger
- **Spec drift (code wrong):** NONE.
- **Spec gap (spec wrong/under-specified):** ONE, cosmetic/non-blocking — AC1 does not pin the exact generic string; deployed reuses the existing `'Invalid payload: serverId required'` literal. Satisfies AC1 by property (generic, no-leak, denied). No contract/security consequence; payload shape preserved. No rework required. Optional future polish (own-string like `'Invalid payload: serverId must be a valid identifier'`) is a nice-to-have, correctly skipped under automatic mode.

## Cross-checks
- Deployed commit `9c114d0` gateway content == working-tree gateway (guard lines L564-611, helper L541-558 identical).
- `isInvalidTextRepresentation` (pg-error-utils L33-48) walks up to two `.cause` levels for SQLSTATE `22P02` — the belt-and-suspenders warn path in `safeErrorMessage` is wired correctly (fires only if a malformed id ever bypasses the parse guard; the parse guard makes this unreachable on the serverId path today).
- No schema/migration (spec `data: NONE`) — confirmed: fix is code-only in the gateway + a pre-existing shared util.
- Contracts preserved: `STUDY_ROOM_JOIN_ERROR_EVENT` shape `{ message: string }` unchanged; `FocusRoomRoomsEvent`/roster/timer shapes untouched; WS verbs unchanged.

## Recommendation
APPROVE — advance to V-2 Triage. The single cosmetic spec-gap (AC1 string) is **non-blocking**: log it as an optional L-1/L-2 nicety or fold into the deferred `c52a7a52` sweep if that task standardizes error strings; do NOT open rework this wave. No @head-verifier escalation needed; no security follow-up (T-8 penetration-tester already CLOSED the wave-52 finding on live prod).
