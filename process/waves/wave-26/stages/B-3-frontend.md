# Wave 26 — B-3 Frontend

**Specialist:** react-specialist. **Commit:** `9056900`. **Scope:** shared PresenceDot + author-avatar presence dots + member-panel refactor.

## Delivered
1. **NEW `apps/web/src/shell/PresenceDot.tsx`** — pure presentational `React.memo` component. Props: `online: boolean`, `size?` (default 6). Dot color = `var(--color-accent-emerald)` online / `var(--color-surface-500)` offline (CSS tokens, NO hex literals). `sr-only` accessible label ("Online"/"Offline"). `data-testid` for tests. Single dot-styling source (AC2).
2. **MemberListPanel.tsx refactor** — replaced the inline hard-coded-hex dot block (:92-101) with `<PresenceDot online={…}>`; behavior-preserving, same `getStatus(m.userId)` source (AC5).
3. **MessageList.tsx author-avatar dots** — main `SentRow` (~:958-1020): wrapped the avatar in a `relative` container + `<AuthorPresenceDot authorId={msg.authorId}>` (msg.authorId is a userId). CARRY-1 honored: `AuthorPresenceDot` subscribes via `useEffect [authorId]`, reads `getPresenceStatus(authorId)` (allocation-free Map.get), and `setOnline` only on change — a presence event for user-B does NOT re-render user-A's dot; single `subscribePresence` fan-out shared (AC4, no new socket). CARRY-3: used the `styles/globals.css:18` emerald token.
4. **15 tests** in `presence-dots.test.tsx`: PresenceDot online/offline/size + sr-only labels; MessageList author dots (online/offline/unknown→no-dot/live-flip/pending-no-dot/failed-no-dot); MemberListPanel regression + AC4 (bounded subscribePresence, no extra socket).

## Deviation (CARRY-2 — accepted)
The sibling author-avatar sites `PendingRow` (~:1226) and `FailedRow` (~:1322) key on `msg.authorDisplay` (a STRING) — `OptimisticMessage` (the local user's own outbox messages) has NO `authorId`/userId field. Per CARRY-2's "if genuinely unavailable, render NO dot (safe degrade)": these two sites render no dot. Correct per AC3 (unknown presence → no dot). Documented deviation, adjudicated ACCEPTED (no identity to guess; the local user's own pending message needn't show a self-presence dot).

## /simplify
Component is minimal (memoized dot + scoped-subscription child); no over-abstraction. Skipped a separate /simplify pass (small, clean surface).

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [react-specialist]
files_implemented: [apps/web/src/shell/PresenceDot.tsx, apps/web/src/shell/MemberListPanel.tsx, apps/web/src/shell/MessageList.tsx, apps/web/src/shell/presence-dots.test.tsx]
designs_consumed: [design/server-channel-view.html (author-avatar + presence-dot pattern)]
deviations:
  - {specialist: react-specialist, change: "PendingRow/FailedRow render no dot", plan_said: "apply to sibling variants :1226/:1316", why: "OptimisticMessage has no authorId (userId); CARRY-2 safe-degrade", adjudication: ACCEPTED}
simplify_applied: false
```

## Exit
Shared PresenceDot + author-avatar dots + member-panel refactor delivered (AC1-5), 15 tests, CARRY-1/2/3 honored. → B-4.
