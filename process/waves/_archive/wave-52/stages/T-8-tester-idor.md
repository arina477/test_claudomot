# T-8 Security — /study-room Socket.IO namespace (IDOR / auth-gate probe)

**Wave:** 52 (M8 — joinable focus rooms: `d123d9e0` rooms+presence, `ef84b378` room-timer)
**Target:** LIVE prod `https://api-production-b93e.up.railway.app` → `/study-room` Socket.IO namespace
**Fixture:** Fixture A `studyhall-e2e-fixture@example.com` (SuperTokens `21984eb2-8029-4c1b-9e73-bc586a0be4d2`), member of proof server `ad62cd12-b78e-4a85-a214-042cf176b16c`
**Tooling:** `socket.io-client@4.8.3` (pnpm store) over raw WS; SuperTokens header-mode signin → access token passed via `handshake.auth.accessToken`. No MCP browsers, no DoS, no infra attack.
**Authorization:** StudyHall's own deploy + our own fixture. No code fixed (Iron Law respected).

## Headline verdict

**Is the /study-room namespace session-gated + membership-gated (non-members denied) + IDOR-safe in production? YES.**

- Session gate: unauthenticated and bogus-token connects are REJECTED at the WS-upgrade `io.use()` middleware (`CONNECT_ERROR "Unauthorized"`) — no handler reachable.
- Membership gate: every member-scoped verb (`subscribe_server_rooms`, `create_focus_room`, `join_focus_room`) runs `assertMember(userId, serverId)` server-side; a foreign server is denied with `study-room:join_error` and **zero rooms leaked**.
- IDOR-safe: `userId` is taken from the verified session, `serverId`/`roomId` from the client payload; an injected `userId` in the payload is **ignored** (no mass-assignment). Room-timer control additionally requires being JOINED to the room (`assertRoomMember`).

One **LOW** information-disclosure finding (verbose DB error string surfaced to client on malformed `serverId`) — authorization is NOT affected. Details below.

---

## Per-probe results

### Probe 1 — WS session gate (unauth) — PASS
| Case | connected | connect_error |
|---|---|---|
| No session (empty auth) | `false` | `"Unauthorized"` |
| Bogus token (`accessToken:"not-a-real-token"`) | `false` | `"Unauthorized"` |

Namespace connection rejected before any `@SubscribeMessage` handler is reachable. The `installWsAuthMiddleware` `io.use()` guard (SuperTokens `getSessionWithoutRequestResponse` + `EmailVerificationClaim` assert) fires on upgrade. Confirmed: no study-room handler is reachable unauthenticated.

### Probe 3 — Own-server positive control — PASS
`subscribe_server_rooms { ad62cd12-... }` (A's server) →
`study-room:rooms` = `{"serverId":"ad62cd12-...","rooms":[]}`, no `join_error`.
Confirms the 403s below are genuine authorization decisions, not a blanket break — a legit member gets the (empty) open-rooms list.

### Probe 2 — Authenticated non-member IDOR (the crux) — PASS
Fixture A holds a valid session but is NOT a member of any of the target servers. Every foreign attempt was denied with `study-room:join_error` and **no rooms list / room created / room joined**:

| Verb | Foreign serverId | rooms leaked | join_error message |
|---|---|---|---|
| `subscribe_server_rooms` | `00000000-0000-0000-0000-000000000000` | none (`[]`) | `You are not a member of this server` |
| `subscribe_server_rooms` | `a1b2c3d4-0000-4000-8000-000000000001` | none | `You are not a member of this server` |
| `subscribe_server_rooms` | `deadbeef-dead-4bad-8bad-deaddeaddead` | none | `You are not a member of this server` |
| `create_focus_room` | `00000000-...-000000000000` | none; no presence | `You are not a member of this server` |
| `join_focus_room` | `00000000-...` + random roomId | none; no presence | `You are not a member of this server` |

No leak of another server's rooms, no room created in a foreign server, no join into a foreign room. Membership guard (`assertMember` → `ForbiddenException`) holds for all three member-scoped verbs.

### Probe 4 — Room-membership gate + mass-assignment — PASS
1. Created a real room in A's OWN server with an **injected `userId`** (`da74148e-...`, Fixture B's id) in the `create_focus_room` payload. Resulting roster:
   `viewers=[{"userId":"21984eb2-...","displayName":"studyhall-e2e-fixture"}]`, `count:1`.
   → The injected `userId` was **ignored**; the roster reflects the session user only. Also confirms `displayName`/`avatarUrl` are resolved server-side (no fake-name injection). **No mass-assignment.**
2. Timer control on a room A is NOT joined to (`study_room_timer_start` for a random roomId) → `join_error: "You must be in the focus room to control its timer"`, **no `study-room:timer_update` emitted**. (`assertRoomMember` gate holds.)
3. Timer control on the room A DID join → one `study-room:timer_update` (`runState:"running"`, `updatedBy:"21984eb2-..."`), no error. Confirms the 403 above is authorization, not a break.

### Probe 5 — Ephemeral / no-persistence — PASS
`leave_focus_room` on the created room → `study-room:rooms` broadcast `rooms:[]`. Re-`subscribe_server_rooms` immediately after → `rooms:[]`. The room vanished on last-member-leave (in-memory, no lingering state). Post-run re-subscribe confirmed server `ad62cd12` is **clean** (`rooms:[]`). No DB persistence implied.

---

## Finding — LOW: verbose DB error string disclosed to client on malformed serverId

**Severity:** LOW (information disclosure; authorization NOT bypassed).

Emitting `subscribe_server_rooms { serverId: "not-a-uuid" }` (a non-UUID string) returns:

```
study-room:join_error → { "message": "Failed query: select \"id\" from \"server_members\"
where (\"server_members\".\"server_id\" = $1 and \"server_members\".\"user_id\" = $2)
limit $3\nparams: not-a-uuid,21984eb2-8029-4c1b-9e73-bc586a0be4d2,1" }
```

**Root cause (no fix applied):** `assertMember` (study-room.service.ts:169) issues the Drizzle query with the raw client `serverId`; Postgres rejects the non-UUID cast; the thrown `Error.message` is a full Drizzle "Failed query" string. Each gateway handler's `catch (err)` forwards `err instanceof Error ? err.message` verbatim into `STUDY_ROOM_JOIN_ERROR_EVENT` (e.g. gateway.ts:372). This leaks the table name (`server_members`), column names (`server_id`, `user_id`), the query shape, and echoes the caller's own `userId` back in `params`.

**Why it matters (and why only LOW):** No authorization is bypassed — the request is still denied, no rooms are returned, and the leaked `userId` is the caller's own session id (not another user's). The exposure is internal schema/query detail that aids reconnaissance only. Contrast: the empty-`serverId` case is handled cleanly by the payload parser (`Invalid payload: serverId required`), and every well-formed foreign UUID returns the clean `You are not a member of this server`. The gap is only the malformed (cast-failing) input path.

**Suggested remediation (for security-engineer / owning dev — not applied here):** validate `serverId` as a UUID at the payload-parse layer (the `parseServerPayload`/`parseRoomPayload`/`parseCreatePayload` functions already gate on `typeof string` + non-empty — add a UUID-format check, mirroring the Zod `FocusRoom*` schemas), OR map non-`ForbiddenException` errors in the gateway catch blocks to a generic client message ("Could not process request") while logging the detail server-side. Preference: parse-layer UUID validation, so cast-failing input never reaches the DB.

---

## Secret-leak sanity

Grepped the wave-52 code diff (`b43e66b..HEAD`, `apps/` + `packages/`) for credential patterns (api-key / secret / password / bearer / private-key / PEM headers / `xoxb-` / `sk_live` / `AKIA…` / `ghp_…`). **Clean — zero matches.** Auth-related tokens present in the diff are SuperTokens session-token *field names* (`sAccessToken` cookie read, `handshake.auth.accessToken` fallback), not embedded secret values. Consistent with the orchestrator's independent clean grep. Test-account passwords live only in the gitignored `command-center/testing/test-accounts.md`.

---

## Summary table

| Probe | Result | Evidence |
|---|---|---|
| 1 — WS session gate (unauth + bogus) | PASS | `CONNECT_ERROR "Unauthorized"`, no handler reachable |
| 2 — Non-member IDOR (subscribe/create/join, 3 foreign UUIDs) | PASS | `join_error "You are not a member of this server"`, zero rooms/rooms-created/joins |
| 3 — Own-server positive control | PASS | `rooms:[]` returned to member, no error |
| 4 — Room-membership gate + userId mass-assign | PASS | timer denied when not joined; injected `userId` ignored; server-side displayName |
| 5 — Ephemeral / no persistence | PASS | room gone on leave; server left clean |
| Malformed-serverId error verbosity | LOW finding | raw Drizzle query string echoed to client |

**Overall:** `/study-room` is session-gated, membership-gated, and IDOR-safe in production. One LOW info-disclosure to remediate at the payload-validation layer. No CRITICAL/HIGH/MEDIUM findings. Server `ad62cd12` left clean; no code modified; temp harness + captured access token wiped post-run.
