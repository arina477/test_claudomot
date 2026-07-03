# Wave 39 — B-6 Review output (Phase 2, post head-builder-APPROVED)

**Reviewer:** code-reviewer (production-bug focus) · **Branch:** `wave-39-settings-menu`
**Diff base:** `66a29e3` (merge-base origin/main) · **Scope:** UserMenu popover wiring
**Files reviewed:** `apps/web/src/shell/UserMenu.tsx` (new), `apps/web/src/shell/ChannelSidebar.tsx` (mod), `apps/web/src/shell/UserMenu.test.tsx` (new)
**Reference pattern:** `apps/web/src/shell/MessageList.tsx` AddReactionPopover (L605-636)

---

## Verdict summary

| Severity | Count |
|---|---|
| CRITICAL | 1 |
| HIGH | 1 |
| MEDIUM | 2 |
| LOW / NIT | 3 |

The change is well-structured and faithfully reuses the proven AddReactionPopover pattern. Typecheck + 340 tests pass because the defects live in **runtime failure paths and race conditions** that neither static types nor the current (happy-path, mocked) tests exercise.

---

## CRITICAL

### C1 — Log out has no error handling: a rejected `signOut()` strands the user in a half-open, half-authenticated state

`UserMenu.tsx` L86-91:
```ts
action: async () => {
  await Session.signOut();
  navigate('/login');
},
```
invoked via `handleSelect` (L54-59):
```ts
function handleSelect(action) {
  return async () => {
    onClose();          // menu unmounts immediately
    await action();     // signOut() may reject
  };
}
```

Failure sequence when `Session.signOut()` rejects (offline, backend 5xx, CSRF/session-revoke race — all real in production):

1. `onClose()` already ran → menu is unmounted, the popover is gone.
2. `await Session.signOut()` **throws** → `navigate('/login')` never runs.
3. The rejection propagates out of the async click handler as an **unhandled promise rejection** (React does not catch it; it hits `window.onunhandledrejection` → Sentry noise, and in strict setups a console error).
4. User is left sitting on the authenticated app with the menu closed, **no error surfaced, no retry affordance**. Depending on how far `signOut()` got before rejecting, the local session token may already be cleared client-side while the UI still shows authenticated state — the classic "half-logged-out" limbo. Their next action 401s with no explanation.

There is no `try/catch` anywhere in the path. This is the single worst production outcome in the diff: the primary purpose of the feature (logging out) silently fails and abandons the user.

**Spec note:** P-2 spec item 5 says "Log out → SuperTokens signOut → redirect to login." The failure branch is unspecified, but "silently do nothing and emit an unhandled rejection" is not an acceptable interpretation of a logout control — CRITICAL stands.

**Fix (minimum):** wrap the logout action so a rejection still lands the user somewhere sane and is not unhandled:
```ts
action: async () => {
  try {
    await Session.signOut();
  } catch {
    // fall through — still bounce to /login; the ProtectedRoute guard
    // will re-challenge, and a stale local session is the safer default
    // than stranding the user in half-authenticated UI.
  }
  navigate('/login');
},
```
Better still, surface a toast on failure. At absolute minimum the `navigate('/login')` must be reachable on the reject path and the rejection must not escape unhandled.

---

## HIGH

### H1 — `onClose()` fires *before* the async action, so any post-close failure has already destroyed the only UI that could report it

Related to C1 but a distinct structural bug affecting **all three** items. `handleSelect` calls `onClose()` first, which sets `menuOpen=false` in the parent and **unmounts `UserMenu` this render** (ChannelSidebar L406 gates the whole component on `menuOpen`). The `await action()` then runs inside a callback whose owning component is already gone.

Consequences:
- For Log out (C1): no component remains to catch/display the error.
- The `useEffect` cleanup has run, so the document listeners are correctly removed — that part is fine — but it means the action completes "orphaned." If `navigate` were ever to depend on menu-scoped state it would be stale. Today only `navigate` (stable) and `Session` (module) are used, so it does not *currently* crash, which is why tests pass. It is nonetheless a fragile ordering: **close-then-act** should be **act-then-close** for the async item, or the async work should be owned by the parent, not the soon-to-unmount child.

For Profile/Privacy the actions are synchronous `navigate()` calls, so ordering is benign there. The risk is concentrated in the async logout path and compounds C1. Recommend the fix in C1 plus, defensively, not tearing down the menu until the async action settles (or hoisting the logout handler to ChannelSidebar which survives the navigate).

---

## MEDIUM

### M2 — Focus is lost after menu-item navigation (accessibility regression for keyboard/screen-reader users)

On Escape the code correctly returns focus to the trigger (`anchorRef.current?.focus()`, L48). But on **item selection** (`handleSelect`), focus is never managed: `onClose()` unmounts the menu — including the currently-focused `<button role="menuitem">` — and nothing restores focus. When a focused element is removed from the DOM, the browser resets focus to `<body>`. Keyboard and screen-reader users who arrow into the menu and press Enter on "Profile" are dropped to document-body focus after navigation, losing their place. WAI-ARIA menu-button pattern expects focus to move deliberately (to the trigger, or to the destination). The test suite does not assert focus after item-select, so this is invisible to the 340 green tests. Not a crash, but a real a11y defect on a control whose whole job is navigation. Recommend `anchorRef.current?.focus()` (or focus the nav target) after synchronous item selection.

### M3 — No opening focus / no arrow-key roving: `role="menu"` is only partially implemented

The container is `role="menu"` with three `role="menuitem"` buttons, and `aria-haspopup="menu"` / `aria-expanded` on the trigger are correct (good). But the ARIA menu pattern also implies: focus moves *into* the menu on open (first item focused), and Up/Down arrows rove between items with Home/End support. None of that is present — the menu opens with focus still on the trigger, and there is no keydown handler on the menu for arrow navigation. A screen-reader user is told "menu, expanded" but then has no items focused and Tab (not arrows) is the only way in. This is a partial/inconsistent implementation of the announced role. Given the reference AddReactionPopover has the same limitation and the spec only asked to "reuse the pattern," grading MEDIUM rather than HIGH — but it should be a follow-up, because announcing `role=menu` while behaving like a plain popover is worse for AT users than announcing nothing.

---

## LOW / NIT

### L4 — `handleSelect` returns `async () => { onClose(); await action(); }`; the returned promise is fed straight to `onClick`, so React discards it — fine today, but means any thrown error from a *sync* action (e.g. if `navigate` ever threw) is also unhandled. Belt-and-suspenders `try/catch` inside `handleSelect` would cover all three items uniformly and subsumes the C1 fix.

### L5 — Icon choice: "Profile" uses `GearIcon` (a settings/cog glyph), which visually reads as "Settings," not "Profile." Minor UX/label-icon mismatch; the row navigates to `/settings/profile` so it is defensible, but a person/avatar icon would be clearer. Cosmetic.

### L6 — Positioning is hard-coded (`bottom: '68px'`, `left: '8px'`, `minWidth: 180`). If the footer height (`h-[60px]`) ever changes, the `68px` (documented as "60px footer + 8px gap") silently drifts. Not a bug today; flagging the magic-number coupling. A comment already notes the derivation, which mitigates.

---

## Explicitly checked — NO issue found (the scrutinize list)

- **Popover lifecycle / listener leak:** `useEffect` adds `mousedown` + `keydown` on mount and removes both in cleanup, with `[onClose, anchorRef]` deps. Both handlers are re-created each render and the effect re-subscribes, so no stale closure over `onClose`. **No leak, no stale closure.** ✅
- **Toggle flicker (anchor mousedown → immediate close):** The document `mousedown` handler guards with `!anchorRef.current.contains(e.target)`. A mousedown *on the settings button* is inside the anchor → `onClose()` is skipped; the subsequent `click` then toggles via `setMenuOpen(prev => !prev)`. **No close-then-reopen flicker; open/close toggles cleanly.** ✅ (This matches the reference pattern exactly.)
- **Escape returns focus to trigger:** `handleKeyDown` calls `onClose()` then `anchorRef.current?.focus()` synchronously. Confirmed and unit-tested. ✅
- **aria-expanded / aria-haspopup:** `aria-haspopup="menu"` static, `aria-expanded={menuOpen}` reactive. Correct. `role="menu"` + `role="menuitem"` are valid roles (completeness caveat in M3). ✅
- **setState-after-unmount / navigate-during-render:** Item click calls `onClose()` (parent setState — parent is *not* unmounting, only the child is) then `navigate()` from an event handler (not during render). React 19 tolerates this; no "setState on unmounted component" warning because the setter target (ChannelSidebar) stays mounted. `navigate` is a router side-effect in a handler, which is legal. **No warning.** ✅
- **ChannelSidebar button regression:** Diff adds only `ref`, `aria-haspopup`, `aria-expanded`, and `onClick` to the existing `<button>`. Avatar, presence dot, name/username, and hover `onMouseEnter/Leave` + `group-hover` action icons are **untouched**. The wrapper `div` gained `relative` (needed to anchor the absolutely-positioned popover) with no layout impact on the flex row. **No regression.** ✅

---

## Test-gap note (does not gate, but flag for T-block)

The 340 passing tests mock `signOut` as `() => Promise.resolve()` — the reject path (C1) is **never tested**, which is precisely why the CRITICAL is invisible to the suite. Recommend adding a test where `mockSignOut` rejects and asserting the user still reaches `/login` and no unhandled rejection escapes. Also missing: a focus-after-item-select assertion (M2).

---

## Recommendation

**REWORK** — C1 (logout error path) must be fixed before merge: a logout control that silently fails on network error and emits an unhandled rejection is a production defect on the feature's core purpose. H1/M2 should be addressed in the same pass (all three are one small refactor of `handleSelect` + the logout action). M3 and the LOW items can be follow-ups.
