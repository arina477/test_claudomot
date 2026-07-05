# V-1 — Karen source-claim verification (wave-51)

**Wave:** 51 — StudyHall DM canonical 3-panel layout fix (gate ChannelSidebar off the DM surface).
**Merge under test:** `01399a54990397b9c9e8fa6a3786b34112a4c7c7` on `main` (checked out).
**LIVE verified against:** web `https://web-production-bce1a8.up.railway.app` (api unchanged this wave).
**Mode:** read-only, no fixes attempted.

## VERDICT: APPROVE

Every source claim in P-3, B-0/B-3/B-6, C-1/C-2 is substantiated against the merge tree AND the deployed production bundle. The fix is real, right-layer, gates the column (not a CSS hack), the tests are non-decorative, the deploy hash matches the merge SHA, and the B-6 High (mobile-backdrop strand) fix is genuinely present in the live-served bundle — proven at the minified-JS level, not just the source tree.

---

## Findings (enumerated)

### 1. File existence + diff scope — CONFIRMED
- `apps/web/src/shell/AppShell.tsx` and `apps/web/src/shell/AppShell.test.tsx` both exist on the merge tree.
- `git show --stat 01399a5` code-file grep returns EXACTLY those two files: `apps/web/src/shell/AppShell.tsx` (+67 region) and `apps/web/src/shell/AppShell.test.tsx` (+117). All other diff entries are wave-51 process transcripts under `process/waves/wave-51/`.
- **No** `apps/api/`, no `drizzle/`, no `*.sql`, no schema/migration file. The only `drizzle|migration|sql|schema` match in the name-only diff is the process transcript filename `process/waves/wave-51/stages/B-0-branch-and-schema.md` — a doc, not code. Matches the C-1/C-2 "frontend-only, ledger untouched at 0023" claim.
- **Severity: none** — claim accurate.

### 2. The fix is real (source tree) — CONFIRMED
All at `apps/web/src/shell/AppShell.tsx`:
- Desktop ChannelSidebar wrapper gated: `{!dmHomeActive && (` at **line 68**, wrapping `<ChannelSidebar />` at **line 73** inside `className="hidden lg:flex"` (68–75).
- Mobile overlay drawer gated: `{!dmHomeActive && (` at **line 90**, wrapping the drawer `<div ... aria-label="Channel sidebar drawer">` + inner `<ChannelSidebar />` at **line 99** (90–115).
- Mobile backdrop gated on BOTH conditions: `{sidebarOpen && !dmHomeActive && (` at **line 78**, wrapping the `data-testid="mobile-sidebar-backdrop"` button (78–87).
- `onDmHome` resets sidebar: **lines 55–58** — `onDmHome={() => { setDmHomeActive((v) => !v); setSidebarOpen(false); }}`. The `setSidebarOpen(false)` is the B-6 High root-cause reset.
- Mirrors the pre-existing MemberListPanel guard: `{!dmHomeActive && (` at **line 131** wrapping `<MemberListPanel serverId={selectedId} />` at **line 133**. Same component-state-conditional pattern — NOT CSS `display:none`/`hidden`-class hide of a still-mounted node, NOT routing, NOT a new framework. Right-layer.
- **Severity: none** — claim accurate.

### 3. Tests real (non-decorative) — CONFIRMED
`apps/web/src/shell/AppShell.test.tsx`, `describe('AppShell — DM surface ChannelSidebar gating')` (lines 153–237) — 5 gating tests, real assertions (not `expect(true)`):
- **line 165** — `expect(sidebars).toHaveLength(0)` after clicking `dm-home-rail-button`: ChannelSidebar absent (BOTH desktop + mobile — `queryAllByRole('complementary', {name:/channel sidebar/i})`).
- **lines 174 + 181** — mobile drawer present-before (`toBeInTheDocument`) / absent-after (`not.toBeInTheDocument`) via `[aria-label="Channel sidebar drawer"]` — proves the drawer unmounts, not merely hidden.
- **lines 194 + 197** — DM body present (`main` in document) + ChannelSidebar length 0 on DM surface.
- **lines 205 + 208** — server-view no-regression: sidebar length `>= 1` AND `main` present when `dmHomeActive=false`.
- **Backdrop-strand regression test (lines 211–236)** — the B-6 High regression guard: open drawer (`toggle channel sidebar` menu), assert backdrop present (line 223) + drawer present (226), switch to DM, then assert backdrop `not.toBeInTheDocument()` (line 232) AND drawer absent (235). This is precisely the "sidebarOpen already true before switching" sequence the code-reviewer flagged — a genuine regression test, not decorative.
- Assertion count in the gating block: **11 `expect(...)` assertions** across the 5 tests. All map to a real DOM query.
- **Severity: none** — tests are real and cover both desktop+mobile gating and the backdrop-strand regression.

### 4. Deploy hash match — CONFIRMED (substantiated beyond the claim)
- `git log 01399a5` merge SHA = `01399a54990397b9c9e8fa6a3786b34112a4c7c7`, matching C-2's `web SUCCESS @ 01399a549903` and `api SUCCESS @ 01399a549903`.
- Live web `/` returns **HTTP 200** (curl).
- **Deployed-bundle proof (stronger than a hash claim):** deployed `index.html` references `/assets/index-BG7ZwKMj.js` (1,827,314 bytes). Downloaded and inspected the live minified bundle:
  - Contains `"data-testid":"mobile-sidebar-backdrop"` — a string that exists ONLY after the B-6 fix commit `c0b6f07` (it did not exist pre-fix). This proves production is serving the POST-B-6-fix code, not a stale revision.
  - Contains `"aria-label":"Channel sidebar drawer"` (1 occurrence) and `Direct Messages` (3) — the shell is the wave-51 shell.
- Migration ledger untouched (finding 1); C-2's "no migration, frontend-only" is accurate.
- **Severity: none** — deploy claim substantiated at the served-artifact level.

### 5. Antipattern sweep — CLEAN
- **Claimed-but-fake:** rejected. Source + deployed bundle both carry the gate.
- **Decorative test:** rejected — 11 real DOM-query assertions incl. the backdrop-strand regression.
- **CSS-hack vs real gate:** rejected. Both source and the minified bundle show conditional-render gates, not `display:none`. In the live bundle:
  - `!r&&l.jsx("div",{...className:"hidden lg:flex",children:l.jsx(pE,{})})` — desktop ChannelSidebar wrapper gated on `!r` (`!dmHomeActive`); the node is NOT emitted when `r` is true (true unmount, not CSS-hide).
  - `e&&!r&&l.jsx("button",{...,"data-testid":"mobile-sidebar-backdrop",...})` — backdrop gated on `e&&!r` = `sidebarOpen && !dmHomeActive`. **The B-6 backdrop `!dmHomeActive` guard is genuinely present in production.**
  - `onDmHome:()=>{i(g=>!g),n(!1)}` — `n(!1)` is `setSidebarOpen(false)`. **The B-6 onDmHome reset is genuinely present in production.**
- **Both B-6 High remedies confirmed present** (source lines 55–58 + 78, and in the live minified bundle): the onDmHome `setSidebarOpen(false)` reset AND the backdrop `!dmHomeActive` guard. Belt-and-suspenders, as B-6 claimed.
- **T-block F-1 (DM→server return race via ServerRail):** not part of this AppShell gating change. The AppShell diff touches only the render-gating conditionals + `onDmHome` toggle; the DM→server return path lives in ServerRail/server-select (already routed to V-2). Confirmed it is NOT in the wave-51 AppShell gating change — no need to re-find.

---

## Evidence summary
| Claim | Source cite | Live/deploy evidence | Result |
|---|---|---|---|
| Only 2 code files, no api/schema/migration | `git show --stat 01399a5` | ledger untouched (0023) | PASS |
| Desktop wrapper gated `!dmHomeActive` | AppShell.tsx:68–75 | bundle `!r&&...hidden lg:flex` | PASS |
| Mobile drawer gated `!dmHomeActive` | AppShell.tsx:90–115 | bundle `Channel sidebar drawer` present | PASS |
| Backdrop gated `sidebarOpen && !dmHomeActive` | AppShell.tsx:78 | bundle `e&&!r&&...mobile-sidebar-backdrop` | PASS |
| onDmHome resets setSidebarOpen(false) | AppShell.tsx:55–58 | bundle `onDmHome:()=>{i(g=>!g),n(!1)}` | PASS |
| Mirrors MemberListPanel guard | AppShell.tsx:131 | — | PASS |
| Gating tests (both surfaces) + backdrop regression | AppShell.test.tsx:153–237 (11 assertions) | — | PASS |
| web+api deploy SUCCESS @ 01399a5, no migration | C-2 lines 6–13 | web / 200; bundle carries post-fix testid | PASS |

**FINAL: APPROVE.** No REJECT findings. No fixes needed. The DM 3-panel gate and the B-6 backdrop-strand fix are real, right-layer, tested, and live in production.
