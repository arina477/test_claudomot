# Wave 18 — B-3 Frontend
```yaml
files_new: [apps/web/src/shell/ThreadPanel.tsx, apps/web/src/shell/useThread.ts]
files_mod: [MessageList.tsx (affordance chip, hide@0), MainColumn.tsx (ThreadPanel mount + open state), messagingSocket.ts (onThreadReplyCreated, type-only ThreadReplyEvent + local event literal), useMessages.ts (parent replyCount/lastReplyAt live-update), auth/api.ts (postReply/getThreadReplies), messaging.test.tsx]
outbox_parity: "useThread.sendReply reuses useMessages.sendMessage outbox EXACTLY — client idempotency_key, optimistic pending → confirm/dedup-by-id → failed → retry same key (server ON CONFLICT dedupes); socket echo reconciles by idempotency_key. No separate send path."
a11y_carries: ["1 focus-trap @≤1024 overlay", "2 Esc closes + focus restore to affordance", "3 affordance hidden when replyCount===0", "4 replies in <ol>/<li>", "5 aria-live=polite on replies container"]
thread_event: "useMessages subscribes onThreadReplyCreated for active channel → parent replyCount++/lastReplyAt updates → affordance live-updates even when panel CLOSED; useThread appends to open panel + reconciles optimistic"
cjs_trap: "avoided — type-only ThreadReplyEvent import + local 'thread:reply:created' literal; vite build passes"
verify: "web typecheck+build 0 errors; biome 0; web tests 142/142"
```
