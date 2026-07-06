# V-1 Karen — Source-Claim Verification (wave-57: DM→server nav fix)

**Verdict: APPROVE**
**Scope:** V-1 source-claim verification against merge tree + deployed state. Merge `1361c49` on `main` (PR #72), LIVE.
**Mode:** automatic. Reference format `file:line`.

---

## Claim-by-claim ledger — all 5 TRUE

### Claim 1 — AppShell passes `onExitDmHome`; `onDmHome` toggle unchanged — TRUE
`apps/web/src/shell/AppShell.tsx:59` passes `onExitDmHome={() => setDmHomeActive(false)}` to `<ServerRail>`.
`AppShell.tsx:54-58` — `dmActive={dmHomeActive}` and `onDmHome` still the toggle `setDmHomeActive((v) => !v)` + `setSidebarOpen(false)` (entry path preserved, not disturbed by this wave).
The ternary at `AppShell.tsx:119-123` (`dmHomeActive ? <DmHome/> : <MainColumn/>`) is what the cleared flag now flips on the first click — correct root-cause target.

### Claim 2 — server-select onClick calls `selectServer` + `onExitDmHome` (unconditional); Home button now has `onClick={onExitDmHome}` (was no-op) — TRUE
`apps/web/src/shell/ServerRail.tsx:240-243` — server icon `onClick={() => { selectServer(s.id); onExitDmHome?.(); }}`. Called **unconditionally** (not gated on `selectedId` changing), so re-selecting the already-selected server also exits. Matches the fix intent.
`ServerRail.tsx:125` — Home button now `onClick={onExitDmHome}`. Confirmed previously decorative: the DM-Home rail button (`onClick={onDmHome}`, `ServerRail.tsx:161`) is the only other handler and is unchanged; the Home button's wiring is net-new this wave.
Prop declared `ServerRail.tsx:97` + destructured `ServerRail.tsx:100`.

### Claim 3 — 4 tests (server exits first-click, Home exits, DM-entry regression, re-select-same-server exits), green on CI run 28764778640 — TRUE
`apps/web/src/shell/AppShell.test.tsx:252` `describe('AppShell — server-select + Home clear DM surface (wave-57)')` contains exactly 4 `it()`:
- `:253` server icon click exits DmHome on first click — asserts sidebar reappears + `selectServerMock` called with `'srv-1'`.
- `:278` Home button click exits DmHome on first click.
- `:294` DM-rail button still enters DmHome (entry regression).
- `:306` re-selecting already-selected server (`selectedId: 'srv-1'`, click same) still exits + `selectServer` called.
Assertions are behavioral (ChannelSidebar present/absent via `queryAllByRole('complementary')`), not tautological.
CI run **28764778640**: `conclusion: success`, `status: completed`, title = the #72 fix commit. Green confirmed.

### Claim 4 — no backend/schema (3 web files); deploy serves 1361c49 (web 200); react-specialist in AGENTS.md — TRUE (with a benign note)
`git show 1361c49 --stat` code changes = exactly the 3 web files (`AppShell.tsx`, `ServerRail.tsx`, `AppShell.test.tsx`). No `apps/api`, no migration, no `packages/*` contract. (The commit additionally carries wave-56 archive + wave-57 process `.md` files — expected process bookkeeping from the squash-merge, zero product-code impact.) Frontend-only claim holds.
Deploy: LIVE, web serves 1361c49 per wave note (`3c5cd53` C+T closeout confirms api+web SUCCESS @ 1361c49). react-specialist present in the agent catalog (correct owner for this shell-nav domain).

### Claim 5 — journey-map annotates wave-51 F-1 (DM→server double-click) FIXED for wave-57 — TRUE
`command-center/artifacts/user-journey-map.md:17` (`last_updated_wave57`) documents the exact bug (component-state `dmHomeActive`, first-click swallowed), the exact root cause (`setDmHomeActive(false)` lived only on `onDmHome`; Home had no `onClick`), the exact fix (`onExitDmHome` callback, unconditional server-select call, Home wired), and states **"F-1 (wave-51) now FIXED."** Cross-references the wave-51 origin at `:19`. Mutation-verified note (reverting fails 3/4 tests) is consistent with the B-6 record.

---

## Reality check — no bullshit found

- **Not acceptance-by-assertion.** The 4 tests render the real `AppShell` + real `ServerRail` in jsdom and assert the DOM actually swaps `DmHome`→`MainColumn` on the first click. `selectServerMock` call-args verified. Mutation evidence (revert fails 3/4) cited independently at B-6 — this is a genuine regression net, not a green-by-tautology.
- **Root cause addressed, not symptom.** The fix clears the state variable that the render ternary keys on, rather than patching a downstream view. The "unconditional call" detail correctly closes the re-select-same-server edge (a `selectedId`-gated fix would have left that hole).
- **Scope discipline.** Frontend-only, no over-engineering; no schema/contract churn to chase a nav papercut. Correct minimal footprint.
- **No spec drift.** Deployed SHA matches the verified merge; journey-map FIXED annotation matches the shipped code.

## Severity ledger
- Critical: none
- High: none
- Medium: none
- Low: none (the extra process `.md` files inside the merge are expected squash bookkeeping, not a defect)

## Prevention note (forward)
The Home button was decorative (no `onClick`) from a prior wave and only surfaced as a papercut later. Recommend a lightweight lint/test convention flagging interactive rail buttons that render with no handler, so "decorative-looking but should-be-live" controls are caught at B-6 rather than a follow-up wave.

**All five claims TRUE against the merge tree, CI, and deployed state. APPROVE.**
