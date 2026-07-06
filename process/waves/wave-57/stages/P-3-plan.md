# P-3 — Plan (wave-57)
## Approach
Frontend state-reset fix. AppShell owns dmHomeActive; ServerRail triggers server-select + Home. Wire an exit path so both clear dmHomeActive on first click.
- **AppShell.tsx:** define `onExitDmHome = () => setDmHomeActive(false)`; pass it to ServerRail (new prop). (Keep the existing onDmHome toggle for entering DM home.)
- **ServerRail.tsx:** in `selectServer` (:237) + the Home button handler, call `onExitDmHome()` (in addition to the existing select/home nav). Reset is unconditional — does NOT depend on selectedId changing (so re-selecting the current server from the DM surface still exits).
- *Alternative considered:* a useEffect in AppShell on selectedId change — REJECTED (misses re-select-same-server + Home; problem-framer's derive-from-route refactor is disproportionate for a papercut).
## Data/API/deps: NONE.
## File-level steps
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| apps/web/src/shell/AppShell.tsx | modify | add onExitDmHome callback + pass to ServerRail | react-specialist | first |
| apps/web/src/shell/ServerRail.tsx | modify | call onExitDmHome() in selectServer + Home handlers | react-specialist | after AppShell |
| apps/web/src/shell/AppShell.test.tsx (or ServerRail test) | modify/create | component test: DM-active → click server → MainColumn (first click); DM-active → click Home → MainColumn | react-specialist | after |
## Specialist: react-specialist (React 18 shell state). Single serial chain.
## Self-consistency: every AC → steps. design_gap false. No schema/api/deps. Clean.
