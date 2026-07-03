# Wave 39 — P-3 Plan

## Approach section

### Architecture deltas
**Shell settings entry → stateful user-menu popover (frontend-only).**
- `ChannelSidebar` currently renders the "Your profile and settings" button with `onMouseEnter/Leave` inline bg styling and **no onClick** (dead). Add local open/close state; the button becomes the menu trigger (`aria-haspopup="menu"`, `aria-expanded={open}`), rendering a new `<UserMenu>` popover anchored to it.
- **New `UserMenu` component** — a small popover (`role="menu"`) reusing the shipped `MessageList` reaction-popover pattern (`apps/web/src/shell/MessageList.tsx` — ref-based outside-click close via `popoverRef`+`anchorRef`, `role=menu`, absolute positioning, `#27272a` surface + border/shadow tokens). Positioned to open UPWARD from the bottom-left sidebar button (the button sits at the sidebar footer). Three `role="menuitem"` items: **Profile** (`navigate('/settings/profile')`), **Privacy** (`navigate('/settings/privacy')`), **Log out** (`Session.signOut()` then `navigate('/login')`).
- **Why a menu over a hardcoded navigate:** the button is the single doorway to all settings + logout (P-0 SELECTIVE-EXPANSION). Alternative considered: direct `navigate('/settings/profile')` — rejected because it leaves `/settings/privacy` (M7 differentiator) + logout unreachable (ships a second dead-end). Alternative considered: a full new settings-nav layout — rejected as gold-plating (guardrail: existing routes only).
- **Failure-domain impact:** none cross-service. Log out mutates session (SuperTokens signOut) — client-side session clear + redirect; the standard SDK path.

### Data model
None (frontend-only; no schema/migration).

### API contracts (concrete)
- No new API. Navigation to existing routes `/settings/profile`, `/settings/privacy` (routed in `apps/web/src/router.tsx:86,94`).
- Log out: `Session.signOut()` from `supertokens-auth-react/recipe/session` (SDK v0.51.2, already installed — same package used across LoginPage/SignupPage/EmailVerify) → then client redirect to `/login`.

### Dependency list
None new. `supertokens-auth-react` (0.51.2) + `react-router` already installed.

### SDK pre-build checklist
Not a new SDK. `Session.signOut()` is a documented supertokens-auth-react session-recipe method; the recipe is already initialized in the app (session context used in InviteJoinPage). Verify the exact export at B-3 (`import Session from 'supertokens-auth-react/recipe/session'` → `Session.signOut()`), match how the app already imports session utilities.

## Plan section

### File-level steps (grouped by B-stage)

**B-3 Frontend** (this is a frontend-only wave — B-0 branch/env only, B-1/B-2 skip)
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| apps/web/src/shell/UserMenu.tsx | create | popover menu (role=menu, outside-click+Esc close, focus mgmt, 3 menuitems: Profile/Privacy/Logout) reusing MessageList popover pattern + tokens | react-specialist | first |
| apps/web/src/shell/ChannelSidebar.tsx | modify | add open state; wire settings button onClick to toggle; aria-haspopup/expanded; render <UserMenu> when open; keep hover styling | react-specialist | after UserMenu |
| apps/web/src/shell/UserMenu.test.tsx (or .spec.tsx) | create | unit: renders 3 items; Profile/Privacy call navigate with right route; Logout calls signOut+redirect; Esc closes+refocuses; outside-click closes; close-on-select | react-specialist | with impl |

**B-0** — branch + env (no schema, no deps). **B-1/B-2** — skip (no contract/backend surface). **B-4** — typecheck + confirm route/nav wiring. **B-5** — typecheck+lint+unit+dev-smoke.

### Specialist routing (validated against AGENTS.md)
- **react-specialist** — all frontend work (React 18 + react-router + supertokens-auth-react). Confirm present in AGENTS.md at B-0.
- No backend specialist (zero backend change).

### Parallelization map
- B-3: serial single-specialist chain — UserMenu.tsx → ChannelSidebar.tsx (depends on UserMenu) → test. One react-specialist, no parallel batches.

### Self-consistency sweep
1. Every AC → step: AC1/AC2 menu opens+items→ChannelSidebar+UserMenu; AC3 Profile nav→UserMenu; AC4 Privacy nav→UserMenu; AC5 Logout→UserMenu signOut; AC6 keyboard/close→UserMenu; **AC7 crux reachability→ChannelSidebar+UserMenu wiring, verified live at T-5**. ✅
2. Every step has a specialist (react-specialist). ✅
3. No file in multiple parallel batches. ✅
4. design_gap_flag=false referenced. ✅
5. Architecture deltas name alternatives (direct-navigate, full settings-nav) + trade-offs. ✅
6. No new API/data contracts; nav to existing routes. ✅
7. No new deps. ✅
8. No new SDK (signOut is existing supertokens-auth-react). ✅

Sweep clean.
