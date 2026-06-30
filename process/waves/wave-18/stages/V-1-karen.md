# V-1 Karen — source-claim verification (wave-18 M3 threads)

Verdict: **APPROVE**

Scope: merged main (16c72b6 merge; HEAD 203b081 adds T-evidence), LIVE (api-production-b93e + web-production-bce1a8). 3 tasks: data plane (497c2ae6), panel (6c008dd6), outbox (0b728319). Verified against merged code + live probes; brain `CLAUDOMAT_DB_URL` is brain-state, NOT app DB, so prod schema verified indirectly (migration file + live 201 POSTs + live route probe).

## Per-claim

**1. Thread data plane REAL — VERIFIED.**
- `createReply` (messages.service.ts:725) genuinely transactional: pre-flight parent load (L733) then `db.transaction` (L769, createServer pattern). All guards present: reply-of-reply→400 (L757), cross-channel→400 (L742), soft-deleted parent→409 (L762), parent-missing→404 (L735).
- Idempotency-no-double-count: INSERT `.onConflictDoNothing({target:[channel_id,idempotency_key]}).returning()` (L785-788); `isNewInsert = insertReturning.length>0` (L790); count++ guarded `if (isNewInsert)` (L819) — reply_count `+1` + last_reply_at in same txn (L820-826). Replay re-fetches by key (L799), no increment. Correct.
- `deleteMessage` thread branch (L586): transactional (L588), ALWAYS-decrement with `GREATEST(reply_count-1,0)` floor (L635/L643), tail-only recompute (`deleted.created_at === parent.last_reply_at`, L611-614) → `MAX()` over remaining live replies excluding self, NULL when none (L617-630); non-tail leaves last_reply_at untouched (L640-644). Correct.
- `listThreadReplies` (L856): `WHERE thread_parent_id=parentId AND is_deleted=false`, ORDER BY `created_at ASC, id ASC`, cursor-paginated (L893/L921). Tombstone-excluded, oldest-first. Correct.

**2. IDOR fixed (load-bearing) — VERIFIED.**
- `createReply` authz on `canViewChannelById(authorId, parent.channel_id)` — parent-DERIVED (L751), after cross-channel mismatch already 400s the forged param (L742). `listThreadReplies` same: `canViewChannelById(viewerUserId, parent.channel_id)` (L877), channel selected FROM parent row (L865-866), never the query param.
- 3 IDOR tests exist (messages.service.spec.ts, `describe ... thread IDOR — wave-18 B-6`, L1370): createReply non-member→Forbidden asserts `toHaveBeenCalledWith(NON_MEMBER_ID, CHANNEL_ID)` (L1396); listThreadReplies non-member→Forbidden asserts same (L1418); listThreadReplies member-allowed asserts `(MEMBER_ID, CHANNEL_ID)` with channel sourced from parent fetch (L1435/L1447). The asserted arg is the parent-channel, not a param. Correct.

**3. Realtime fan-out REAL — VERIFIED.**
- `thread.reply.created` emitted (service L840) → gateway `@OnEvent('thread.reply.created')` → `server.to('channel:'+channelId).emit('thread:reply:created', payload)` (gateway L240-242). `thread.reply.deleted` → `emit('thread:reply:deleted')` (L261-263). DISTINCT event names from `message:new` (L166). Same channel room.
- T-5 (T-5-e2e.md) live two-client probe vs prod: A POST 201 → B (non-author, joined) received `thread:reply:created` payload-match; C (connected, never joined) received nothing (no leak); A delete 204 → B received `thread:reply:deleted {replyCount:0,lastReplyAt:null}`. All PASS. Credible — Playwright MCP host-blocked, canonical socket.io wire path used (consistent with waves 12-15). F-1 closed.

**4. Migration 0008 — VERIFIED (file + indirect prod).**
- 0008_dazzling_bushwacker.sql: additive — ADD `thread_parent_id uuid` (nullable), `reply_count integer DEFAULT 0 NOT NULL`, `last_reply_at timestamptz`, self-FK `messages_thread_parent_id_messages_id_fk`, index `messages_thread_parent_created_idx (thread_parent_id, created_at)`. Matches spec data contract exactly.
- Prod-applied: NOT directly verifiable here (brain DB ≠ app DB; `drizzle` schema permission-denied). Indirect proof is strong: C-block e9ad4f6 "deployed + verified"; T-5 live POST returned 201 (a missing column would 500); live route probe (claim 6) confirms routes serve. Ledger 8→9 asserted by C-block, not independently re-counted.

**5. Frontend — VERIFIED.**
- ThreadPanel.tsx (725 LOC) + useThread.ts present. Affordance hide@0: MessageList.tsx:788-791 renders chip only when `onOpenThread!==null && !msg.threadParentId && (msg.replyCount??0)>0` (excludes reply rows + hides at 0). aria-controls/aria-expanded wired.
- Outbox parity: useThread reuses the SHARED `OptimisticMessage` type (imported from MessageList, same type useMessages uses — useMessages.ts:23) and the identical pending/failed/retry + client `crypto.randomUUID()` idempotency_key + ON CONFLICT contract (useThread sendReply L137, retryReply re-sends SAME key L175). Echo dedup-by-id (L156). Same send model as top-level → M4 inherits one machinery.
- Affordance updates when panel CLOSED: useMessages.ts thread:reply:created handler bumps parent `replyCount+1` + `lastReplyAt` (L193-209); thread:reply:deleted sets server-authoritative post-decrement values (L218-234) — independent of panel open state. Correct.

**6. Antipatterns — none load-bearing.**
- Claimed-but-not-built: none found. Every claim traced to merged code + live behavior.
- Gold-plating: scope held to one-level (reply-of-reply→400); nested threads / notifications / per-user unread NOT built (correctly OUT per spec). No over-engineering.
- LIVE serves thread routes: INDEPENDENTLY PROVEN — unauth `POST /messages/:id/replies?channelId=` → **401**, unauth `GET /messages/:id/replies` → **401**, bogus route → **404**. Routes registered + guarded, NOT 404. T-8 claim ratified.

## Minor observations (non-blocking)
- O-1 (Low): useThread implements a parallel `sendReply`/`retryReply` rather than literally calling useMessages.sendMessage. It reuses the shared type + identical state-machine/idempotency contract, so spec intent ("no separate reply-send path / one consistent send model") is met in substance; the two send functions are duplicated logic that could converge in a future refactor. Not a completion gap.
- O-2 (Info): Prod schema + drizzle ledger (8→9) not independently verifiable from the brain DB connection; relied on migration file correctness + live 201/route probes. If V-block wants hard proof, run against the app DB.

## Bottom line
Load-bearing claims — transactional count, IDOR parent-derived authz, live two-client fan-out — all VERIFIED against merged code and live behavior. Backend, frontend, realtime, and live deploy are functionally real, not claimed-only. **APPROVE.**
