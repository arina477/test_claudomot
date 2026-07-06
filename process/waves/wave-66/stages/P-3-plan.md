# P-3 Plan — wave-66 (single-spec; offline empty-state copy polish)

## Approach
### Architecture deltas
- **ChannelSidebar (apps/web/src/shell/ChannelSidebar.tsx:335-341)** — the `detailStatus==='error'` render branch gains a connection-state condition: read `useConnectionState()`; when offline/reconnecting show a neutral offline empty-state message, when online keep the existing error copy. Alternative considered: extract a shared `OfflineEmptyState` component vs inline conditional — INLINE wins (single call site, ~a few lines; a shared component is speculative abstraction for one use). Failure-domain: presentation-only; no service boundary, no state-machine change, no permission change.
### Data model: none. ### API contracts: none (reuses GET /servers/:id detail path). ### New deps: none. ### SDK: N/A.

## Plan (file-level)
**B-0 Schema:** SKIP (no schema). **B-1 Contracts:** SKIP (no shared/Zod/API/SDK change). **B-2 Backend:** SKIP (no server change).
**B-3 Frontend:**
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| apps/web/src/shell/ChannelSidebar.tsx | modify | split the detailStatus==='error' render by useConnectionState — offline/reconnecting → neutral offline copy, online → existing error copy | react-specialist | 1st |
**B-5 Verify (test):**
| apps/web/src/shell/shell-components.test.tsx | modify | update the /couldn't load channels/i assertion into two cases: neutral offline copy (offline/reconnecting) + error copy (online) | react-specialist | after B-3 |

## Specialist routing: react-specialist (owns apps/web shell; validated in AGENTS.md).
## Parallelization: serial (ChannelSidebar → test). Single specialist.
## Self-consistency sweep: AC1/AC2 → ChannelSidebar branch; AC3 presentation-only (no other files); AC4 → shell-components.test.tsx. design_gap_flag false referenced. No deps, no TBD, no SDK. Clean.
