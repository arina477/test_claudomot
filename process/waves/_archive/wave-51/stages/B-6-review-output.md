# B-6 Phase 2 — Production-bug review — wave-51 (StudyHall DM 3-panel layout fix)

Branch: `wave-51-dm-3panel` · Diff base: `main...wave-51-dm-3panel`
Scope: `apps/web/src/shell/AppShell.tsx` (source) + `apps/web/src/shell/AppShell.test.tsx` (tests). Frontend-only, no API/schema/contract change.
Reviewer: code-reviewer · Read-only (no edits/commits).

---

## Finding 1 — Orphaned mobile backdrop persists on DM surface — HIGH

**File:** `apps/web/src/shell/AppShell.tsx:74-83` (backdrop) in relation to the new gate at `:86` (drawer) and the DM toggle at `:55`.

**What's wrong:** The mobile overlay backdrop (lines 75-83) is gated ONLY on `sidebarOpen`. The new fix gates the drawer (`:86`) on `!dmHomeActive`, but leaves the backdrop's guard unchanged. `sidebarOpen` is NOT reset when the DM surface is activated: the DM toggle `onDmHome={() => setDmHomeActive((v) => !v)}` (`:55`) touches only `dmHomeActive`, and the DM button lives in `ServerRail`, which is always mounted and reachable while the mobile drawer is open.

Reachable sequence (mobile viewport, `<lg`):
1. Server view — user opens the mobile channel drawer → `sidebarOpen=true`. Drawer + backdrop visible.
2. User clicks the always-visible "Direct Messages" button in the ServerRail → `dmHomeActive=true`; `sidebarOpen` stays `true`.
3. The drawer (86-111) now unmounts (correctly, `!dmHomeActive`). But the backdrop (75-83) still renders — a full-screen `fixed inset-0 z-40 lg:hidden` semi-transparent black (`rgba(0,0,0,0.50)`) button laid over the DM surface.

**Why it matters:** DmHome's inner panel is `z-10` (`DmHome.tsx:72`); the orphaned backdrop is `z-40`, so it sits ABOVE the DM content — a dim scrim covering the DM UI and swallowing the first tap. It IS recoverable (one tap on the backdrop calls `closeSidebar` → `sidebarOpen=false` → it disappears), and it is mobile-only (`lg:hidden`), which is why it is HIGH not Critical — but it is a visible broken state on the exact surface this wave exists to fix, and the fix's own gating pattern (`!dmHomeActive`) was applied to the drawer but not to its paired backdrop. This is the same class of "stale mobile chrome bleeds into DM view" bug the wave is closing.

**Fix (pick one):**
- Add the same guard to the backdrop: `{sidebarOpen && !dmHomeActive && (...)}` at `:75`. Minimal, matches the drawer's pattern. (Preferred.)
- Or reset drawer state on DM activation: `onDmHome={() => { setDmHomeActive((v) => !v); setSidebarOpen(false); }}` at `:55` — also closes the drawer symmetrically and defends any future backdrop consumer.

Either resolves it; the first is the tightest match to the diff's existing style. The new test suite does not exercise this path (no test sets `sidebarOpen=true` before switching to DM), so a regression test setting the drawer open then activating DM and asserting the backdrop is absent should accompany the fix.

---

## Re-run (post-fix-up)

Fix commit: `c0b6f07` (`fix: B-6 review finding mobile-backdrop-strand for wave-51`) · Re-run diff base: `main...wave-51-dm-3panel` at `c0b6f07`. Reviewer: code-reviewer · Read-only (no edits/commits).

**Finding 1 (orphaned mobile backdrop on DM surface — HIGH) → CONFIRMED-RESOLVED.**

The fix applied BOTH remedies the original review offered — belt-and-suspenders, exactly as intended:

1. **Root fix — `onDmHome` resets `sidebarOpen` (`AppShell.tsx:55-58`).** The DM rail handler is now `() => { setDmHomeActive((v) => !v); setSidebarOpen(false); }`. Switching onto the DM surface clears the transient drawer state, so `sidebarOpen` can no longer carry over as `true` into DM view. This eliminates the *cause*.
2. **Guard — backdrop render condition narrowed to `sidebarOpen && !dmHomeActive` (`AppShell.tsx:78`).** Even if `sidebarOpen` were somehow true while `dmHomeActive`, the backdrop no longer renders. This closes the *symptom* independently, and now matches the drawer's paired guard (`:90`) — the pattern asymmetry the original finding flagged is gone.

Traced the reported sequence: server view → open mobile drawer (`sidebarOpen=true`, backdrop present) → click Direct Messages in ServerRail. `onDmHome` fires `dmHomeActive=true` + `sidebarOpen=false`; the `z-40` backdrop unmounts on both counts. No scrim over DmHome's `z-10` panel, no swallowed first tap. Resolved.

**No new Critical/High introduced.** Side-effect analysis of the two changes:

- **Server→DM→server toggle path — CLEAN.** `onDmHome` is a single-button toggle (`ServerRail.tsx:158`, its only caller). DM→server now also fires `setSidebarOpen(false)`, returning the user to server view with the drawer closed — the correct default (drawer's initial state is closed; user re-opens via the MainColumn menu button). Setting `sidebarOpen=false` when it is already `false` is a no-op. No adverse effect.
- **Desktop path — CLEAN.** Both backdrop (`:83`) and drawer (`:92`) are `lg:hidden`; `sidebarOpen` has no visual effect at `lg+`. The added reset and narrowed guard are inert on desktop. The desktop `ChannelSidebar` wrapper (`:68`, `hidden lg:flex`) is unchanged.
- **Existing drawer behaviour — CLEAN.** `toggleSidebar` / `closeSidebar` are untouched. The `!dmHomeActive` addition to the backdrop is a strictly narrowing conjunct — it can only *remove* a render, never add one; in server view (`dmHomeActive=false`) it evaluates identically to the old `sidebarOpen`-only guard, so normal open/close of the drawer + backdrop in server view is byte-for-byte equivalent.
- **`setSidebarOpen` / `setDmHomeActive` scope — CLEAN.** Both setters are contained entirely within `AppShell`; grep confirms no external consumer of `onDmHome` beyond the one rail button. No hidden second caller to regress.
- **4 prior gating tests — CLEAN, all pass.** Re-ran the file: 16/16 pass (the 4 original DM-gating tests + 3 unchanged ConnectionStateIndicator + the new regression + others). No behavioural drift.

**Test quality — GOOD, genuinely covers the finding.** The new test `does not render the mobile backdrop after opening drawer then switching to DM surface` drives the exact reported path via real `userEvent.click`: (1) clicks the MainColumn "Toggle channel sidebar" button → asserts `mobile-sidebar-backdrop` IS in the document AND the drawer (`[aria-label="Channel sidebar drawer"]`) IS present (establishes the pre-condition is real, not vacuously passing); (2) clicks `dm-home-rail-button` → asserts the backdrop is `not.toBeInTheDocument()` AND the drawer is gone. It is a true unmount assertion on the precise strand path, with a positive pre-state check guarding against a false-green — not a weak or tautological test. New `data-testid="mobile-sidebar-backdrop"` (`:82`) is test-infra only, no behavioural impact.

**Gate signals (re-verified locally at `c0b6f07`):**
- `vitest run` (apps/web): **422 passed / 422** (26 files). ✓
- `tsc --noEmit` (apps/web): clean, exit 0. ✓
- `biome ci` on the two changed files: clean, no fixes applied, exit 0. ✓

### Updated severity count

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |

**B-6 Phase-2 exit: CLEAN.** The one prior High (Finding 1) is CONFIRMED-RESOLVED with no new Critical/High introduced. The branch `wave-51-dm-3panel` at `c0b6f07` now has **0 Critical / 0 High**. Cleared for B-6 Phase-2 exit.

---

## Category assessments

**Conditional-render correctness** — CLEAN. `dmHomeActive` is `useState(false)` (`:37`), never undefined; first render is server view, no mis-eval on mount. The `{!dmHomeActive && (...)}` guards on the desktop wrapper (`:65`) and mobile drawer (`:86`) fully unmount the `ChannelSidebar` on the DM surface and render it in server view. The Pane-3 ternary (`:114`) and MemberListPanel guard (`:127`) are consistent with the same flag. Correct.

**Layout / geometry side-effects** — CLEAN. Parent row is `flex h-full w-full overflow-hidden` with NO `gap-*` utility (`:50`), so unmounting the desktop `ChannelSidebar` wrapper reflows `DmHome` (`flex-1` region) to full width with no orphaned gap or broken flex. The mobile drawer is `fixed` (out of flow), so gating it has no reflow effect. No key/reconciliation concern — these are static sibling conditionals, not list items, so React unmounts/mounts cleanly with no stale DOM.

**Mobile drawer** — see Finding 1 (HIGH). The drawer itself is correctly gated; the paired backdrop is not. `sidebarOpen` cannot become true *while already on* the DM surface (its only setter, `onToggleSidebar`→`toggleSidebar`, is passed to `MainColumn`, which is unmounted when `dmHomeActive` — `:117`), but it CAN carry over as `true` *into* the DM surface when the drawer was open at switch time. head-builder + karen judged this safe; that holds for the drawer but misses the backdrop.

**Regression (server view, `dmHomeActive=false`)** — CLEAN. All four panes render as before: ServerRail (`:52`), ChannelSidebar desktop+mobile (`:65`,`:86`), MainColumn (`:117`), MemberListPanel (`:127`). No structural change to the false-branch. The renamed test "renders the channel sidebar … on server view" confirms presence in the default state.

**Test quality** — GOOD. The 4 new tests are genuine, not brittle:
- "hides ChannelSidebar (desktop + mobile)" asserts `queryAllByRole('complementary', … channel sidebar)` `toHaveLength(0)` after clicking the real DM rail button — covers BOTH wrappers via the count.
- "hides the mobile overlay drawer" asserts the drawer wrapper is in DOM before and `not.toBeInTheDocument()` after — a true unmount check, not visual hiding.
- "shows the DM body (DmHome) and no ChannelSidebar" asserts zero sidebars + `main` present.
- "shows ChannelSidebar (server view) — no regression" guards the false branch.
They drive state through the real `userEvent.click` on `dm-home-rail-button` rather than poking internals. Gap: none exercises the orphaned-backdrop path (Finding 1). All 15 tests in the file pass (`vitest run` — 15 passed).

**Mock-export additions** — CLEAN, legit test-infra. The `../auth/api` additions (`listDmConversations`/`listDmMessages`/`sendDmMessage`/`createDmConversation`) and `./messagingSocket` additions (`onMessageUpdated`/`onMessageDeleted`/`onReactionAdded`/`onReactionRemoved`/`onThreadReplyCreated`/`onThreadReplyDeleted`/`applyReactionEvent`/`onDmMessage`) are required because `DmHome`/`DmThread` now actually mount under these tests. Pending promises (`new Promise(() => {})`) correctly keep async surfaces in loading state. No source impact — mocks only.

**Null / undefined, structural** — CLEAN. No null access; `dmHomeActive` and `sidebarOpen` are boolean state with defined defaults. No React key/list issue (no arrays introduced). `selectedId` passed to `MemberListPanel` is unchanged from `main`.

---

## Severity count

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 1 |
| Medium | 0 |
| Low | 0 |

**B-6 Phase-2 exit:** NOT clean — 1 High (Finding 1, orphaned mobile backdrop on DM surface). The branch does NOT have 0 Critical/High. Recommend REWORK: apply the one-line backdrop guard (`sidebarOpen && !dmHomeActive`) or reset `sidebarOpen` on DM activation, plus a regression test for the open-drawer→switch-to-DM path. Everything else on the diff is clean and well-tested.
