# P-3 — Plan (wave-51)

## Approach section

### Architecture deltas
- **App shell layout (apps/web/src/shell/AppShell.tsx):** the server `ChannelSidebar` is currently rendered unconditionally (desktop wrapper lines 64-69; mobile overlay drawer lines 82-106). Gate BOTH on `!dmHomeActive` — mirroring the EXISTING `{!dmHomeActive && <MemberListPanel .../>}` guard at line 122. On the DM surface the ChannelSidebar disappears; the grid collapses to ServerRail + DmConversationList + DmThread; DmThread (flex-1) reflows to full canonical width (632px @1024). *Alternative considered:* CSS `hidden` on the DM state — rejected (still occupies grid/DOM, is a symptom-hide not a not-render; problem-framer flagged wrong-layer). *Alternative:* a router-based layout — rejected (DM is a component state toggle, not a route; would add non-existent plumbing). Failure-domain: none — pure client render conditional, no service/permission/transaction impact.

### Data model / API / deps
None. No schema, no migration, no API, no contract, no new deps, no SDK.

## Plan section

### File-level steps
**B-3 (frontend):**
- `apps/web/src/shell/AppShell.tsx` — modify: wrap the ChannelSidebar desktop wrapper (64-69) + mobile overlay drawer (82-106) in `{!dmHomeActive && ( ... )}`, mirroring MemberListPanel:122. **react-specialist.**
- `apps/web/src/shell/AppShell.test.tsx` (or the nearest shell layout test) — modify/create: assert ChannelSidebar is ABSENT when dmHomeActive=true (both desktop + mobile), PRESENT when false (server view, no regression); DmThread gets full width on the DM surface. **react-specialist.**

(No B-0 schema, no B-1 contracts, no B-2 backend — frontend-only single-file layout fix. B-0 runs branch/env only; B-1/B-2 skip.)

### Specialist routing (AGENTS.md)
- **react-specialist** — in AGENTS.md ✓. No missing specialists.

### Parallelization
Single file (AppShell.tsx) + its test — serial, one specialist. No parallelism.

### design_gap_flag
**false** — restores the already-canonical 3-panel DM layout; no new mockup. D-block SKIPS → B-block.

### Self-consistency sweep
1. Every AC maps to a step: 3-panel/no-ChannelSidebar + full-width thread + no-wrap-1024/1280 + mobile-drawer-gated + server-view-no-regression → all covered by the AppShell guard + the test. ✓
2. Every step has a specialist (react-specialist). ✓
3. No file in multiple batches. ✓
4. design_gap_flag referenced (false). ✓
5. Architecture delta has alternatives (CSS-hide, router). ✓
6. No API/data/contract — N/A, no TBD. ✓
7. No new deps. ✓
8. SDK: N/A. ✓
Sweep clean.
