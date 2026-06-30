# Wave 13 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn)
**Reviewed against:** process/waves/wave-13/blocks/B/review-artifacts.md
**Branch:** wave-13-m3-lifecycle
**Attempt:** 1

## Verdict
APPROVED

## Rationale

M3 message lifecycle (edit/delete + reactions) is built correctly against the locked contract, with the load-bearing authz and realtime invariants verified against the code — not just claimed. Edit is author-only server-side (`editMessage`: `message.author_id !== userId` → 403, deleted-message edit → 409), delete is author-OR-moderator with the **serverId resolved from `channels.server_id` before** the `rbacService.can(userId, serverId, 'manage_channels')` call (never trusted from the request), and the spec asserts `can` was called with that resolved `SERVER_ID`. Soft-delete tombstones correctly (`is_deleted`/`deleted_at` set, `content` cleared to `''`, `rowToDto` returns `content: null`) and is idempotent (double-delete returns without error). Reactions are idempotent via `UNIQUE(message_id, user_id, emoji)` toggle with `userId` always from session; aggregation is single-query (no N+1) and per-caller (`reactedByMe`). Every gateway fan-out (`message.updated`/`deleted`, `reaction.added`/`removed`) emits via `server.to('channel:<id>')` only, and each gateway test explicitly asserts `server.emit` (broadcast-all) was NOT called. The WS-upgrade auth boundary is unchanged and validated in `io.use()` middleware (verified at handshake, not first message). Data model is sound (migration 0006 committed + journaled, no auto-migrate anywhere in `src/`; cascade + UNIQUE + index on `message_reactions`). Frontend renders optimistically with inflight-keyed dedup and reconcile, tombstone rollback on failure, and consumes bare-path APIs. Build health is green: typecheck (FULL TURBO), biome lint clean (133 files), full suite green (API 219, web 131 incl. 34 messaging tests), and `nest build` succeeds — confirming the gateway + new providers wire (value imports on injected deps; boot-proxy passes). No secrets in the diff. **No load-bearing security defect found.**

One discipline miss is recorded (does not block Phase 1, fixable same-branch before C): the reactions code (task `d78df376` — `toggleReaction`, `reaction.added/removed` handlers, `message_reactions` aggregation, `ReactionToggleSchema`) is co-located in commit `d1dd407`, whose body cites only `e12886d7`. Task `d78df376` is never cited in any commit body, breaking the per-spec audit trail (Action 6: "every task_id has at least one commit citing it"). The co-location itself is acceptable — edit/delete and reactions share the same physically-inseparable MessagingModule files (`messages.service.ts`, `messaging.gateway.ts`, `messages.controller.ts`), and the dispatcher's commit-hygiene carve-out permits a tightly-scoped set when implementation can't be split without cutting files mid-function. The defect is the **missing citation**, not the bundling. This is a metadata/traceability fix, not a code or security defect, so it is logged as a required Phase-2 same-branch fix-up rather than a code-rework REWORK.

## Phase 1 checklist (load-bearing)

| Check | Result |
|---|---|
| Edit author-only server-side (403 non-author) | PASS — `editMessage` line 245; spec test "non-author cannot edit → Forbidden" |
| Cannot edit deleted message (409) | PASS — line 250; spec test "edit deleted → Conflict" |
| Delete author-OR-moderator | PASS — `deleteMessage` lines 330–339 |
| serverId resolved from channel.server_id before can() | PASS — lines 317–336; spec asserts `can(MODERATOR_ID, SERVER_ID, 'manage_channels')` |
| Soft-delete tombstone (content null in DTO) | PASS — lines 343–355 + `rowToDto` line 107; spec "tombstone content null" |
| Delete idempotent | PASS — line 312 early-return; spec "double-delete idempotent" |
| Reactions idempotent via UNIQUE toggle, user from session | PASS — `toggleReaction`; spec "double-toggle → off" |
| Reactions aggregated per-caller (reactedByMe) | PASS — `rowToDto` lines 79–100, single query line 539 |
| Realtime room-only fan-out (never broadcast-all) | PASS — gateway `server.to('channel:<id>')`; spec asserts `server.emit` NOT called for all 5 events |
| WS auth on upgrade | PASS — `io.use()` in `afterInit`, unchanged |
| Migration 0006 committed + journaled, no auto-migrate | PASS — `_journal.json` idx 6; no `migrate(` in `src/` |
| message_reactions UNIQUE + cascade + index | PASS — schema + 0006 SQL |
| Frontend optimistic + reconcile + inflight dedup + tombstone rollback | PASS — `useMessages.ts` |
| Bare-path API consumption | PASS — `api.ts` `/channels/:channelId/messages...` |
| typecheck / lint / build / suite green | PASS — all green; `nest build` OK |
| Secrets in diff | PASS — none |

## Required same-branch fix-up (Phase 2, before C-block handoff)

- **Finding (Action 6 citation gap):** commit `d1dd407` cites only `e12886d7`; task `d78df376` (reactions) has no citing commit.
- **Severity:** Medium (traceability / audit-trail; no code or security impact).
- **Fix:** amend the body of `d1dd407` to cite both task IDs (e.g., `tasks e12886d7 + d78df376`). Do NOT split the commit — the files are physically inseparable and the bundling is permitted by the dispatcher carve-out. A `git commit --amend` to the message only (no file changes) clears the gap and keeps the suite untouched (no B-4/B-5 re-run needed since no code changes).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
- phase2_required: true (Action 6 citation amend only; then /review skill)
