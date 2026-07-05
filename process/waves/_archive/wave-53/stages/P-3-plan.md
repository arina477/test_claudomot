# P-3 — Plan (wave-53)

## Approach section

### Architecture deltas

**`apps/api/src/study-room/study-room.gateway.ts` (the only production file with logic changes)**
Two independent, layered defenses (defense-in-depth; both cheap, both requested by all three P-0 reviewers):

1. **Parse-layer UUID-format guard (primary).** The four hand-written parsers (`parseServerPayload`/`parseRoomPayload`/`parseCreatePayload`/`parseConfigPayload`, gateway:522-562) currently validate `serverId` as `typeof === 'string' && length > 0` but NOT format. Add UUID-format validation on `serverId` so a malformed id returns `null` → the existing generic `"Invalid payload: serverId required"` branch fires **before any DB access** (assertMember's `eq(server_members.server_id, serverId)` cast never runs). This is the real fix: the leak can't happen if the malformed id never reaches the uuid cast.
   - *Alternative considered:* validate only in the catch layer (defense #2 alone). Rejected — it lets the malformed id hit the DB and relies on error-mapping being perfect; validating at the boundary is the cleaner root-cause layer (problem-framer's symptom-vs-cause point).
   - *Alternative considered:* convert the four hand-parsers wholesale to Zod schemas with `.uuid()`. Rejected for this wave — larger diff, and the hand-parsers already work; a targeted `isUuid()` check per parser is minimal and equally correct. (The deferred sweep `c52a7a52` may Zod-ify more broadly.)

2. **Catch-layer generic-error mapping (defense-in-depth).** The 7 catch blocks (gateway:196/220/372/399/421/443/465) do `err instanceof Error ? err.message : '<generic fallback>'` — forwarding raw `err.message` for ANY Error. Flip the logic: forward the message ONLY for `ForbiddenException` (the intended authz denial); for every other/unknown error use the existing generic fallback string AND log full detail server-side via `this.logger`. This also catches any future unexpected DB/runtime error, not just 22P02.

**Reusable guard artifact.** Introduce a small shared `isUuid(value: string): boolean` helper (RFC-4122 / Zod `z.string().uuid()`-backed to match the codebase convention in `packages/shared/src/presence.ts` + `rbac.ts`). This is the durable artifact the deferred app-wide sweep (`c52a7a52`) consumes. Proposed home: `apps/api/src/common/uuid.util.ts` (new, tiny) — head-builder may relocate to an existing common util if one fits; it must be importable by both gateways and controllers for the sweep.

**Prior-art reuse (no reinvention).** `apps/api/src/auth/pg-error-utils.ts::isInvalidTextRepresentation(err)` already detects the wrapped DrizzleQueryError 22P02 and is used by the REST `SupertokensExceptionFilter` to genericize this exact error across ~30 UUID route params. The gateway is a Socket.IO surface that bypasses the HTTP filter — defense #2 may reuse `isInvalidTextRepresentation` as the "known-DB-cast-error → generic" discriminator inside the catch blocks (belt-and-suspenders with defense #1). No new error-detection logic.

### Data model
NONE. No schema change, no migration. `server_members.server_id` stays a uuid column; the fix keeps malformed ids from reaching the cast.

### API contracts (concrete)
- **WS namespace `/study-room`** — verbs unchanged (`subscribe_server_rooms`, `create_room`, `join_room`, `leave_room`, timer start/pause/reset/config). Auth model unchanged (`installWsAuthMiddleware` + `assertMember`/`assertRoomMember`).
- **`STUDY_ROOM_JOIN_ERROR_EVENT` payload** `{ message: string }` — shape unchanged; `message` is now always a curated generic string on the validation + unknown-error paths (never raw `err.message` for unknown errors). ForbiddenException message still passes through.
- No REST endpoints touched.

### New deps
NONE. Zod is already a dependency (used across `packages/shared`). No new package.

### SDK pre-build checklist
N/A — no external SDK.

## Plan section

### File-level steps (grouped by B-stage)

**B-2 Contracts**
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| `apps/api/src/common/uuid.util.ts` | create | tiny reusable `isUuid(value: string): boolean` (Zod `.uuid()`-backed, convention-aligned); the durable artifact the sweep reuses | `websocket-engineer` | first (guard others depend on) |

**B-3 Backend**
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| `apps/api/src/study-room/study-room.gateway.ts` | modify | (1) apply `isUuid(serverId)` in the 4 parsers (522-562) → malformed serverId returns null → existing generic branch; (2) harden the 7 catch blocks (196/220/372/399/421/443/465): forward message only for ForbiddenException, else generic fallback + `this.logger` server-side detail (optionally discriminate via `isInvalidTextRepresentation`) | `websocket-engineer` | after uuid.util |

**B-5 Verify**
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| `apps/api/src/study-room/study-room.gateway.spec.ts` | modify | add unit cases: non-UUID serverId → generic JOIN_ERROR message, no leak (assert message excludes "invalid input syntax"/table/column/query text), denied, `assertMember`/DB not called; valid-UUID non-member → existing 403 message; unknown thrown error → generic message + logger called; legitimate member flows still pass | `websocket-engineer` | after backend |
| `apps/api/src/common/uuid.util.spec.ts` | create | unit-test `isUuid` (valid v4 → true; "abc"/""/"123"/SQL-ish → false) | `websocket-engineer` | with util |
| (typecheck + Biome lint + full api test suite) | run | B-5 runs the exact CI commands, full lint + full test suite (BUILD rule-10) | `websocket-engineer` | last |

### Specialist routing (validated against AGENTS.md)
- **`websocket-engineer`** — "Real-time bidirectional comms — Socket.IO / WebSocket gateways at scale, namespaces, rooms, presence, fan-out scoping" (AGENTS.md:85). Owns the study-room gateway. Handles the whole wave (guard util + gateway hardening + tests) — cohesive, single-file-dominant, small. Exists in AGENTS.md ✓.
- No other specialist needed (no schema → no B-1; no frontend → no B-4; the guard util is trivial + co-owned by the same agent). T-8 Security (penetration-tester) re-verifies at the T-block; the P-4 security-scope-tightened gate applies.

### Parallelization map
Single serial chain (small wave, one dominant file): `uuid.util.ts` (+ its spec) → `study-room.gateway.ts` hardening → `study-room.gateway.spec.ts` cases → B-5 full lint+test. No parallel batches.

### Self-consistency sweep (Action 8)
1. Every P-2 AC maps to ≥1 step: AC1/AC2 (no-leak + denied) → parser guard + catch hardening + gateway spec; AC3 (non-member 403) → catch ForbiddenException-passthrough + spec; AC4 (unknown → generic + log) → catch hardening + spec; AC5 (reusable guard applied all verbs) → uuid.util + 4 parsers; AC6 (no regression) → full test suite + wave-52 focus-room E2E at T-block. ✓
2. Every step has a specialist (websocket-engineer). ✓
3. No file in multiple parallel batches (no parallel batches). ✓
4. `design_gap_flag: false` referenced. ✓
5. Architecture deltas declared with explicit alternative trade-offs (2 alternatives named). ✓
6. Data + API contracts concrete, no TBD (data: none; API: verbs unchanged, envelope hardened). ✓
7. New deps: none justified. ✓
8. SDK pre-build: N/A. ✓

Sweep clean → ready for P-4.
