# V-1 Review — jenny (semantic-spec verification)

**Wave:** 18 — M3 thread replies (multi-spec)
**State reviewed:** main @ 16c72b6 (MERGED + LIVE per C-block e9ad4f6)
**Verdict:** **APPROVE**

Spec ↔ build ↔ roadmap match 1:1. No drift, creep, or cut. Every AC across the three
specs maps to live code. Findings per AC below.

---

## Spec 497c2ae6 — Thread-reply data plane + realtime fan-out

| AC | Result | Evidence |
|---|---|---|
| POST reply persists with thread_parent_id, same channel as parent | MATCHES | `messages.service.ts:725` `createReply` inserts `thread_parent_id: parentId`, `channel_id: channelId`; cross-channel validated against parent row (`:742`). |
| ONE-LEVEL: reject reply-of-reply + cross-channel (4xx) | MATCHES | reply-of-reply → `BadRequestException` at `:757` (`parent.thread_parent_id !== null`); cross-channel → `BadRequestException` at `:742`. Both 400. |
| GET replies oldest-first, paginated, tombstone-excluded | MATCHES | `listThreadReplies:856` — `ORDER BY created_at ASC, id ASC`, `is_deleted=false` filter (`:893/921`), cursor pagination (`safeLimit+1` / `encodeCursor`). |
| Parent reply_count + last_reply_at TRANSACTIONAL on create + soft-delete | MATCHES | Create: insert + `reply_count +1` + `last_reply_at` in one `db.transaction` (`:769–830`), increment ONLY on new insert (`isNewInsert` `:819`). Delete: reply soft-delete + `GREATEST(reply_count-1,0)` + tail-aware `last_reply_at` recompute (→ MAX or NULL) in one txn (`:586–648`). |
| Thread-scoped realtime DISTINCT from message.created | MATCHES | Emits `thread.reply.created` → gateway `thread:reply:created` (`gateway:240`), separate event name from `message:new` (`:166`); same `/messaging` room. Client treats distinctly (`messagingSocket.ts`, `useThread`/`useMessages`). |
| Idempotency reuse (ON CONFLICT, no double-insert/double-count) | MATCHES | `onConflictDoNothing(channel_id, idempotency_key)` with RETURNING; replay → empty returning → skip count increment (`:785–827`). |

**Migration 0008 (three-part additive):** MATCHES — `0008_dazzling_bushwacker.sql` adds `thread_parent_id uuid` self-FK → messages.id, `reply_count int NOT NULL default 0`, `last_reply_at timestamptz NULL`, index `(thread_parent_id, created_at)`. Exact to spec `data` contract.

**Edge cases:** soft-deleted parent → 409 (`:762`); concurrent replies safe (atomic `sql\`reply_count + 1\``); reply soft-delete decrements + recomputes tail — all present.

---

## Spec 6c008dd6 — Thread-view panel + in-list affordance

| AC | Result | Evidence |
|---|---|---|
| Affordance (reply count + last-reply) shown ONLY when reply_count>0; click opens panel | MATCHES | `MessageList.tsx:788–790` renders chip gated on `(msg.replyCount ?? 0) > 0` AND `!msg.threadParentId`; `onClick={onOpenThread}`. |
| Panel shows parent pinned + replies (oldest-first) + composer | MATCHES | `ThreadPanel.tsx` — pinned "Thread on:" parent (`:574`), `<ol>` replies oldest-first (`:696`), `ReplyComposer` at foot (`:722`). Consumes GET via `useThread.getThreadReplies`. |
| Sending from panel posts via data plane; appears in panel; affordance updates live | MATCHES | `useThread.sendReply:137` → `api.postReply`; affordance updates in `useMessages:200` on `thread:reply:created`. |
| Open panel appends live (no reload); in-list affordance updates regardless of panel open | MATCHES | `useThread:101` appends on event (dedup by id); affordance update lives in `useMessages` (`:198/216`) independent of panel state — comment `:195` confirms "live-updates even when the thread panel is closed". |
| Responsive/collapsible; closing returns to channel | MATCHES | `MainColumn.tsx:46` `isOverlay` via matchMedia ≤1024px; `ThreadPanel:486` fixed overlay vs sibling column; close restores focus via triggerRef. |

**Edge cases:** replyCount==0 → no affordance (MATCHES); tombstoned reply renders as tombstone (`ReplyRow:69`); narrow viewport overlay/drawer (MATCHES).

---

## Spec 0b728319 — Thread-reply optimistic outbox parity

| AC | Result | Evidence |
|---|---|---|
| Reply uses SAME optimistic outbox (pending→reconcile→failed) as top-level | MATCHES | `useThread.sendReply` reuses the identical `OptimisticMessage` type imported from `MessageList` (`useThread.ts:34`); pending row → `api.postReply` → confirm-remove / failed. Byte-for-byte the same shape as `useMessages.sendMessage:264`. |
| Existing outbox machinery, no separate reply-send path | MATCHES | Same `crypto.randomUUID()` idempotency key, same `state: 'pending'/'failed'` enum, same reconcile-by-id + remove-by-idempotencyKey. No parallel mechanism introduced. |
| Retry re-sends SAME idempotency_key (no double-insert/double-count) | MATCHES | `retryReply:175` re-sends `failed.content` with the original `idempotencyKey`; server `ON CONFLICT DO NOTHING` + skip-count guarantees single row. |

**Edge cases:** failed → red row + Retry (`FailedReplyRow:189`); optimistic reconciles on echo via dedup-by-id (`useThread:114`). MATCHES.

---

## Scope / roadmap fidelity

- **ONE-LEVEL only:** MATCHES — enforced server-side (`createReply:757`); no nested thread code anywhere.
- **OUT-of-scope correctly absent:** nested threads, thread-following/notifications, per-user unread-in-thread — none present. No creep.
- **M3 NOT closed:** correct — attachments remain the next M3 feature wave (milestone `## Success metric` still lists attachments). Wave ships only "thread replies (thread_parent_id)".
- **M3 success-metric 1:1:** matches "threads working" — send reply, see it real-time, affordance + panel. No more, no less.
- **BOARD threads-first decision:** honored (this is the threads feature, attachments deferred).
- **2-namespace lock:** MATCHES — only `/messaging` + `/presence` gateways exist; thread events ride the EXISTING `/messaging` namespace as a distinct event + the per-user `user:<id>` room (no new namespace).

---

## Notes (non-blocking)

- Beyond spec, the team added `thread:reply:deleted` realtime (gateway + both hooks) so an open panel removes a deleted reply and the affordance live-decrements. This is a faithful extension of the AC4 "updates live" intent, not creep — it serves the same ACs.
- LIVE schema columns could not be queried from the brain DB role (`$CLAUDOMAT_DB_URL` → brain Postgres, not the app DB; `drizzle` schema permission-denied). Merge+deploy+verify is attested by C-block commits e9ad4f6/16c72b6; live-behavior proof is the T-5 E2E layer's responsibility, not V-1 semantic review. Migration file 0008 matches the spec contract exactly.

**VERDICT: APPROVE** — all 14 ACs MATCH; spec ↔ build ↔ roadmap aligned with zero drift.
