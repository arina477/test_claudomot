# P-2 — Spec (wave-53) — POINTER

**Source of truth:** the spec contract lives in `tasks.description` of the primary task `fb1c367a-4f63-47a5-8f35-10a8d0fd492a` (fenced YAML head + `---` + prose). This file is a convenience copy.

- **wave_type:** single-spec
- **claimed_task_ids:** `[fb1c367a-4f63-47a5-8f35-10a8d0fd492a]`
- **design_gap_flag:** false

## Acceptance criteria (copy)

1. A /study-room message (subscribe_server_rooms, create_room, join_room, timer verbs) with a **non-UUID serverId** receives a generic error via `STUDY_ROOM_JOIN_ERROR_EVENT` — message contains **no** Postgres/Drizzle error text, SQL query text, table/column names, or echoed userId.
2. The malformed-serverId request is **still fully denied** — no rooms/roster/timer state returned; **no DB query runs** for it (rejected at parse layer before assertMember).
3. A **valid-UUID serverId** for a server the caller isn't a member of still returns the existing `"You are not a member of this server"` (ForbiddenException path unchanged, not genericized).
4. Any **unexpected/unknown error** (non-Forbidden, non-validation) in a /study-room handler → generic client message + **full detail logged server-side** (never in the client frame).
5. A **reusable UUID-format guard** exists and is applied to serverId at the parse layer for every /study-room verb; malformed serverId rejected before DB access.
6. All legitimate wave-52 focus-room flows unbroken (subscribe/create/join/leave/timer) — wave-52 focus-room E2E stays green.

## Contracts (summary)
- **types:** JOIN_ERROR_EVENT `{ message: string }` unchanged (message now always curated/generic on validation + unknown paths); FocusRoom event shapes unchanged.
- **guard:** new reusable UUID-format validator (home/shape at P-3; candidate shared `isUuid`/zod `.uuid()` in the 4 gateway parsers) — reused by deferred sweep `c52a7a52`.
- **error-mapping:** gateway catch maps non-Forbidden/unknown → generic message + server-side log; ForbiddenException passes through.
- **data:** none (no schema/migration). **sdk:** none.

## Edge cases
non-UUID serverId → generic + denied + no query; valid-UUID non-member → existing 403 message; downstream unexpected error → generic + server log; missing/empty serverId → existing "Invalid payload"; roomId non-UUID → already safe (in-memory Map key, not DB-cast); ForbiddenException never swallowed by the generic mapper.

## Security note
Security-scope wave → **T-8 Security + P-4 security-scope-tightened gate** apply.
