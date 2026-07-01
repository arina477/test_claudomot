# Wave 26 — P-3 Plan

## Approach section

### Architecture deltas
- **NEW shared `PresenceDot` presentational component** (apps/web/src/shell/PresenceDot.tsx). Single source for the online/offline dot: a small styled span driven by an `online: boolean` (or presence-status) prop + optional `size`, coloured from the `--color-accent-emerald` token (online) / muted token (offline). No data-fetching inside — pure presentational; callers pass the resolved presence state. This is the anti-drift unit AC2 requires.
- **MemberListPanel refactor** — replace the inline hard-coded-hex dot (MemberListPanel.tsx:91-101) with `<PresenceDot online={…}>`, behavior-preserving. Removes the duplicate styling source.
- **MessageList author-avatar dots** — at each author-avatar render site (MessageList.tsx ~:1013-1020 main row, :1226/:1316 sibling variants), render `<PresenceDot>` positioned on the avatar, with the online state read from the EXISTING presence store via `usePresence`/`getPresenceStatus(authorId)` (presenceSocket.ts singleton — no new socket). Degrade: when the store has no entry for `authorId` (non-co-member / unknown), render NO dot.
- **Failure-domain impact:** none — no service boundary crossed, no transaction scope, no permission check. Pure client render change consuming an existing subscription.
- **Alternatives considered:** (a) inline the dot at each new site — REJECTED, reintroduces the exact styling-duplication debt this wave removes (AC2). (b) a hook/render-prop instead of a component — REJECTED, a component is the natural reuse unit for a visual primitive; a hook adds indirection without removing the JSX duplication. (c) a new presence subscription scoped to visible authors — REJECTED, violates AC4 (single store) and the task's whole Why; the existing store already holds co-member presence.

### Data model
None (no schema change; message_mentions/presence tables untouched).

### API contracts
None (reuses the wave-14 /presence namespace + existing presence client; no new/changed endpoint).

### Dependency list
None new.

### SDK pre-build
N/A (no external SDK).

## Plan section

### File-level steps (frontend-only — B-0 schema SKIP, B-1 contracts SKIP [no shared-type change; PresenceDot is web-local], B-2 backend SKIP [presence infra exists])

**B-3 Frontend** (all `react-specialist`; PresenceDot created first, then its two consumers):
| # | Path | Op | What | Order |
|---|---|---|---|---|
| 1 | apps/web/src/shell/PresenceDot.tsx | create | shared dot component (online-state prop + optional size), colored from `--color-accent-emerald` / muted token; a11y label (online/offline) | FIRST (serial) |
| 2 | apps/web/src/shell/MemberListPanel.tsx | modify | replace inline dot (:91-101) with `<PresenceDot online={…}>`; behavior-preserving | after #1 |
| 3 | apps/web/src/shell/MessageList.tsx | modify | render `<PresenceDot>` on author avatars (:1013-1020 + :1226 + :1316), online = `getPresenceStatus(msg.authorId)` via usePresence; NO dot when authorId not in store (degrade) | after #1 (∥ with #2 — independent file) |
| 4 | apps/web/src/shell/*.test.tsx (messaging.test / member-panel test / new PresenceDot test) | create/modify | PresenceDot render (online/offline/size); MessageList author-dot (resolved→dot, unknown authorId→no dot, live online↔offline flip via store update); MemberListPanel regression (still correct dots); assert single presence socket (no new connection) | after #1-3 |

**B-4 Wiring:** repo typecheck (4/4) + **`biome check` (BUILD rule 7 — not just format)** + build (web bundle). orchestrator-verifies; drift → re-enter B-3.
**B-5 Verify:** `pnpm --filter @studyhall/web test` (existing 234 + new PresenceDot/author-dot tests) + build green.
**B-6 Review:** head-builder gate + /review.

### Specialist routing (validated against AGENTS.md)
- `react-specialist` — frontend component extraction + consumer refactor + tests. In AGENTS.md (used wave-25 B-3). ✓
No backend/contract specialist needed (no B-1/B-2 surface).

### Parallelization map
- Serial: PresenceDot (#1) → then MemberListPanel (#2) ∥ MessageList (#3) [independent files, both consume #1] → tests (#4).
- Small wave; a single react-specialist may do #1-#4 as one coherent B-3 slice (extract-then-consume is naturally sequential); the ∥ on #2/#3 is available if split.

### Action 8 — Self-consistency sweep
1. AC1 → step #3 (author-avatar dots + live update). AC2 → steps #1+#2+#3 (single PresenceDot + token, both sites). AC3 → step #3 (degrade on unknown). AC4 → step #3 (usePresence existing singleton) + step #4 (assert single socket). AC5 → step #2 (member-panel refactor, no regression). ✓ every AC maps to ≥1 step.
2. Every step has a specialist (react-specialist). ✓
3. No file in multiple parallel batches (#2/#3 distinct files). ✓
4. design_gap_flag: false (referenced). ✓
5. Architecture deltas have explicit alternative trade-offs (a/b/c). ✓
6. Data + API contracts concrete (none — stated, no TBD). ✓
7. No new deps. ✓
8. No SDK. ✓
Sweep clean.

## Exit
Frontend-only plan (extract PresenceDot + apply to author avatars + member-panel refactor + tests), react-specialist, design_gap_flag=false. → P-4 Gate.
