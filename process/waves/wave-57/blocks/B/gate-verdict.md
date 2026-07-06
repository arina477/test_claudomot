# B-6 Gate Verdict — Wave 57 (DM→server nav papercut fix)

**Gate:** B-6 Review (block-exit) · **Reviewer:** head-builder (independent) · **Mode:** automatic
**Branch:** `wave-57-dm-server-nav-fix` @ `6e0d803` · **Task:** ff09c4c9
**Diff scope:** `apps/web/src/shell/AppShell.tsx`, `ServerRail.tsx`, `AppShell.test.tsx` (+4 tests, +3 api mocks)

## Verdict: APPROVED

The fix is correct and the four tests genuinely prove first-click exit. No scope creep, no backend/schema, no unguarded-door surface (frontend-only nav-state wiring — B-1/B-2 correctly SKIP).

---

## Judgment against the diff

### 1. Fix correct — PASS
- `AppShell.tsx:59` passes `onExitDmHome={() => setDmHomeActive(false)}` to ServerRail.
- `ServerRail.tsx:240-243` server-select `onClick` calls `selectServer(s.id)` **then** `onExitDmHome?.()` — **unconditional**, not gated on `selectedId` change. This is what satisfies the re-select-same-server edge case (the root cause the P-4 carry named: reset must not depend on `selectedId` changing).
- `ServerRail.tsx:125` Home button (previously NO `onClick` — the P-4 carry defect) now has `onClick={onExitDmHome}`.
- `onDmHome` toggle (`AppShell.tsx:55-58`) is UNCHANGED — entering-DM-home preserved.
- Verified the state gate: `dmHomeActive` drives the ChannelSidebar (`:69`), the DmHome/MainColumn ternary (`:119`), and the MemberListPanel (`:132`). Ternary shape unchanged per the spec `ui:` contract.

### 2. Test honesty — PASS (key axis)
The 4 tests assert on the ChannelSidebar's presence (`role=complementary`, name `/channel sidebar/i`, real `<aside aria-label="Channel sidebar">` at `ChannelSidebar.tsx:194`), which is a **direct structural proxy for `dmHomeActive`** — synchronous on render, gated by `!dmHomeActive` at `AppShell.tsx:69`. They prove FIRST-click exit, not a masked double-click:
- **(a) server icon:** enter DM (sidebar absent, len 0) → click server → assert sidebar present (`>=1`) + `selectServer('srv-1')` called. Single click. Would FAIL if `onExitDmHome` weren't wired (sidebar would stay absent). Non-vacuous.
- **(b) Home:** enter DM → click Home (`/^home$/i`) → assert sidebar present on first click. Directly exercises the newly-added Home `onClick`.
- **(c) regression:** DM-rail button still enters DM (sidebar len 0, `<main>` present) — entry path intact.
- **(d) edge:** `selectedId='srv-1'`, click the already-selected server → still exits. This is the unconditional-reset guarantee — the test that a `selectedId`-change-gated fix would fail.

Selectors all resolve to real DOM: `dm-home-rail-button` testid (`:162`), `aria-label="Home"` (`:124`), ServerButton `aria-label={label}` (`:58`).

**3 added api mocks are legit harness fixes, NOT masking.** `getMyPermissions` (MainColumn:61 / MemberListPanel:644), `getStudyTimer` (StudyTimerWidget:674), `getServerMembers` (MemberListPanel:627) all mount ONLY when the non-DM server view renders with a `selectedId` — i.e. precisely when the fix succeeds. They are stubbed to a never-resolving `new Promise(() => {})`, suppressing jsdom network crashes/hangs without resolving into any assertion path. They cannot hide the fix (assertions key on synchronous structure, not async resolution); they are in fact corroborating evidence that the server view now genuinely mounts.

### 3. Deviation sound — PASS
Home wired to `onExitDmHome` only (ServerContext has no `selectHome`). The AC requires only "clicking Home exits DmHome on the FIRST click → renders MainColumn." Exiting-DM-to-last-selected-server satisfies that AC exactly. Not a gap for this scope — Home doing "more" (a distinct home landing) was never in the contract and would be scope creep. Acceptable.

### 4. No scope creep — PASS
No nav-state-model refactor (P-4 / ceo HOLD-SCOPE / mvp OK all held). No backend, no schema, no Drizzle/Dexie migration (none needed — B-1/B-2 SKIP justified). `onDmHome` untouched. Two-line production change (one prop pass-down, one `onClick` add + one composed handler).

---

## Stage-exit checklist (B-6)
- [x] Reviewed by an agent other than the author (head-builder, independent of the react-specialist B-3 implementer).
- [x] No over-engineering / unnecessary abstraction — minimal targeted callback, no premature nav-state model.
- [x] No debug-by-deploy artifacts (no stray `console.log`, no suppression).
- [x] Tests genuinely prove first-click exit (non-vacuous, structural proxy verified).
- [x] No unguarded auth/RBAC door introduced (frontend nav state only).

```yaml
head_signoff:
  verdict: APPROVED
  stage: B-6
  reviewers:
    head-builder: APPROVED
  failed_checks: []
  rationale: >
    Fix is correct (unconditional onExitDmHome on both server-select and the
    previously-no-op Home button; onDmHome entry preserved) and the 4 tests
    genuinely prove FIRST-click exit by asserting on the ChannelSidebar, a
    synchronous structural proxy for dmHomeActive gated at AppShell.tsx:69 —
    they would fail if the callback were unwired. The re-select-same-server edge
    test confirms the reset is not selectedId-gated. The 3 added api mocks are
    legit never-resolving harness stubs for components that mount only when the
    fix succeeds, not assertion-masking. No scope creep, no backend/schema, no
    unguarded door.
  next_action: PROCEED_TO_C-1
```
