# B-2 — Backend (wave-53)

## Specialist
`websocket-engineer` (AGENTS.md:85) — owns the study-room Socket.IO gateway.

## Files implemented
- `apps/api/src/common/uuid.util.ts` (new) — `isUuid(value): boolean` backed by `z.string().uuid().safeParse().success` (codebase convention). Durable reusable artifact for the deferred sweep c52a7a52.
- `apps/api/src/common/uuid.util.spec.ts` (new) — 8 cases.
- `apps/api/src/study-room/study-room.gateway.ts` (modified) — imports `ForbiddenException` + `isInvalidTextRepresentation` + `isUuid`; parse-layer `isUuid` guard on serverId in all 4 parsers (+ roomId in 2); all 7 catch blocks now route through a DRY private `safeErrorMessage(err, fallback, logger)` helper (forwards only ForbiddenException message; genericizes + server-side-logs everything else).
- `apps/api/src/study-room/study-room.gateway.spec.ts` (modified) — +8 wave-53 cases (non-UUID serverId → generic no-leak + denied + DB-not-called; valid-UUID non-member → exact 403 message; unknown error → generic + logger called; member regression).

## Deviations from plan — adjudicated
1. **roomId UUID validation added** (parseRoomPayload/parseConfigPayload) — plan said "your call." ALLOWED: hygienic, roomIds are always server-generated `crypto.randomUUID()`, zero false-positive risk, keeps the guard uniform. Not the leak source.
2. **`ForbiddenException` value import** (not `import type`) — ALLOWED: required for `instanceof` in `safeErrorMessage`.
3. **`VALID_SERVER_ID` folded into shared `SERVER_ID`** test constant (updated to a valid UUID so existing cases pass the new guard) — ALLOWED: test housekeeping, no production impact.

All deviations are minor implementation choices within plan scope; none contradict plan file targets, method names, architecture, or a P-4 gate finding.

**P-4 carry verified:** `isUuid` applied to serverId (parsers 556/563/571/584) + roomId (572/585) only — NEVER userId (session-derived opaque text, not parsed). wave-40:510 precedent not re-tripped. `ForbiddenException` import added (head-product carry).

## /simplify
Applied inline by the implementer — DRY `safeErrorMessage` helper unifies the 7 catch blocks; redundant test constant consolidated. Diff is minimal (+304/-15, mostly tests). No further simplification pass warranted.

## Local verification (implementer-run)
- `tsc --noEmit`: PASS
- `biome ci` (4 changed files): PASS (no fixes)
- `vitest run` study-room gateway + uuid.util: **26/26 PASS** (uuid.util 8/8; gateway 18/18 = 8 original + 8 new + 2 re-subscribe idempotency)

Commit: `a188168` `fix(study-room): B-2 UUID-format guard + generic error mapping (wave-53)`.

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [websocket-engineer]
files_implemented:
  - apps/api/src/common/uuid.util.ts
  - apps/api/src/common/uuid.util.spec.ts
  - apps/api/src/study-room/study-room.gateway.ts
  - apps/api/src/study-room/study-room.gateway.spec.ts
deviations:
  - {specialist: websocket-engineer, change: "roomId UUID validation added", plan_said: "your call", why: "hygienic, server-generated uuids, zero FP risk", adjudication: allowed}
  - {specialist: websocket-engineer, change: "ForbiddenException value import", plan_said: "add import", why: "instanceof needs value import", adjudication: allowed}
  - {specialist: websocket-engineer, change: "folded VALID_SERVER_ID into SERVER_ID", plan_said: "n/a", why: "test constant now valid UUID, dedup", adjudication: allowed}
simplify_applied: true
```
