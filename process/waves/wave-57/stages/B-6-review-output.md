# B-6 Phase 2 — Production-bug review: wave-57 DM→server nav fix

**Branch:** `wave-57-dm-server-nav-fix` @ `6e0d803`
**Diff:** `git diff main...HEAD` — 3 files, +100/-2 (2 production lines in ServerRail.tsx + 1 wiring line in AppShell.tsx; 4 tests; 3 api mock stubs)
**Verdict: CLEAN — APPROVED. No Critical / High / Medium issues. 2 Low observations (non-blocking, no action required this wave).**

---

## Change summary

- `AppShell.tsx` — passes new prop `onExitDmHome={() => setDmHomeActive(false)}` to `ServerRail`.
- `ServerRail.tsx` — adds optional `onExitDmHome?: () => void` prop; wires it to (a) the Home button `onClick`, and (b) each server-icon `onClick` (after `selectServer(s.id)`, optional-chained).
- `AppShell.test.tsx` — 4 new tests + 3 api mock stubs (`getMyPermissions`, `getStudyTimer`, `getServerMembers`).

---

## Hunt findings

### 1. Correctness — PASS
- **Server-select ordering/closure:** `onClick={() => { selectServer(s.id); onExitDmHome?.(); }}`. `s.id` is captured per-iteration in the `.map` callback — no stale-closure/loop-variable bug (arrow closes over the map param, not a shared `let`). Order is harmless: `selectServer` sets context selectedId, `onExitDmHome` sets local `dmHomeActive=false`; both are independent React setState calls, batched in the same event, no read-after-write dependency between them.
- **Home button:** `onClick={onExitDmHome}` — correct. Passing the handler by reference is fine (no args needed). Prior state: Home button had no `onClick` at all (the reported no-op); now wired.
- **Optional-chaining safety:** `onExitDmHome` is declared optional (`onExitDmHome?`). Server-icon path guards with `onExitDmHome?.()` — safe if prop undefined. Home path uses bare `onClick={onExitDmHome}` — also safe: React accepts `onClick={undefined}` (renders no handler). No crash on either path when the prop is omitted. Consistent-enough; see Low-1.

### 2. Regression — PASS
- **DM-home entry unchanged:** `onDmHome={() => { setDmHomeActive((v) => !v); setSidebarOpen(false); }}` is byte-identical to pre-fix. Entry still toggles. Test 3 (`DM-rail button still enters DmHome`) covers this and passes both with and without the fix (correctly, since it doesn't exercise the new code).
- **No spurious fire / no re-render loop:** `onExitDmHome` fires only inside `onClick` handlers (Home / server icons) — never on mount, never in an effect, never in render. `setDmHomeActive(false)` while already `false` is a no-op in React (bail-out on identical primitive state) — no wasted re-render, no loop. Clicking Home / a server while already on the server surface is harmless.
- **`dmActive` indicator unaffected:** the green DM-rail active bar is still driven purely by `dmActive` prop; unchanged.

### 3. Test honesty — PASS (verified by mutation test)
- Reverted the 2 production wirings and re-ran: **3 of the 4 new tests FAIL** (`server icon click exits DmHome`, `Home button click exits DmHome`, `re-selecting already-selected server still exits`). They are genuinely load-bearing — assertions depend on the fix, not vacuous. Restored production files after.
- The 4th test (`DM-rail button still enters DmHome`) stays green with the fix reverted — correct, it's the regression guard for the *unchanged* entry path, not the new code.
- Tests assert the real user-visible outcome: after the click, ChannelSidebar (`role=complementary`) is back in the DOM (server surface restored) and `selectServer` was called with the right id. First-click semantics are proven — a single `user.click` produces the exit; no second click needed.
- **3 added api mocks are legit harness stubs, not error-suppression:** these tests set `selectedId: 'srv-1'`, which mounts `MemberListPanel` / `MainColumn` children that call `getMyPermissions` / `getStudyTimer` / `getServerMembers`. The stubs return `new Promise(() => {})` (never-resolving) — the same idle-pending pattern used throughout this file for fetch-on-mount endpoints. They prevent "not a function" on real methods that genuinely get called; they do not swallow or mask a production error. All 20 tests in the file pass.

### 4. Scope — PASS
- No backend, schema, migration, or route changes. No nav refactor. `onDmHome` toggle untouched. Diff is confined to the two shell files + their test. Change is minimal and surgical, matching the P-block spec (papercut fix).

### Tooling
- `tsc --noEmit`: no errors on the changed files.
- `biome check` (project's linter — not ESLint): clean, no fixes needed.
- `vitest run AppShell.test.tsx`: 20/20 pass.

---

## Low observations (non-blocking — no rework required)

- **Low-1 (style consistency):** the two call sites optional-chain differently — server icon uses `onExitDmHome?.()`, Home uses bare `onClick={onExitDmHome}`. Both are safe (see §1). Harmonizing is cosmetic; not worth a churn.
- **Low-2 (latent, out of scope):** `onExitDmHome` is prop-drilled but not defaulted inside `ServerRail`; every current caller (`AppShell`) supplies it, so this is theoretical. No action.

**Recommendation: APPROVE for merge.** Correct, non-regressive, honestly tested, in-scope.
