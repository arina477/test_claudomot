# Design Brief — server-rail-sidebar (app-shell rail + channel sidebar, real data)

**Wave:** 7
**Parent stage invoking:** P-2 / B-block (task d62d6ce3 + e32b50dd reads)
**Blocking current wave:** yes
**Mode:** automatic (inherited from `process/session/.autonomous-session`)

> RECOVERY brief — `design/server-rail-sidebar.html` was lost in a worker restart. Regenerate.
> Target known from the prior APPROVED run.

## 1. What we need

The app shell's two left panes wired to REAL server/channel data:
1. **Server rail** (72px left strip) — lists my servers (rounded-square avatars/initials), home
   button at top, **+ create** button at the bottom (opens the create-server modal).
2. **Channel sidebar** (260px, next to the rail) — the selected server's categories + channels.

## 2. Where it lives

- **Route / file path:** persistent app-shell chrome; design at `design/server-rail-sidebar.html`.
- **Navigation entry:** always present after auth. Rail selects the active server; sidebar lists
  that server's channels; + create button opens `create-server.html`.

## 3. Audience + state

- **Who sees it:** authenticated student (member of ≥0 servers).
- **States to design (all in-scope):**
  - **Rail:** loading (skeleton icons) / empty (no servers yet — just home + create) / loaded (server list).
  - **Channel sidebar:** no-server-selected (placeholder prompt) / loading (skeleton rows) / loaded (category headers + channel rows, `#general` visible) / error (load failed + retry).

## 4. DESIGN-SYSTEM.md references (REQUIRED)

- **Colors:** `--surface-950` (rail bg + app frame), `--surface-900` (channel sidebar bg), `--surface-800` (rail icon fill, hover), `--surface-700` (active channel fill, borders, skeleton base), `--surface-600` (initials fill, skeleton highlight), `--accent-emerald` (active server indicator bar, active channel text, + create accent), text `--text-primary` (active) / `--text-secondary` (channel names, category headers — AA) / `--text-muted` (placeholders only), borders `--border-hairline` / `--border-hover`.
- **Typography:** Geist. `text-sm` (channel names), `text-xs` 11–12px (category headers, server header). Weights 400/500/600.
- **Spacing / radius:** sidebar item padding 8px×12px (§3); `--radius-full`→`--radius-lg` server-rail icon morph (§4); `--radius-md` (channel rows). Section gaps 24px between categories.
- **Shadows:** `--shadow-sm` (server header), `--glow-subtle` (active server icon), `--glow-focus` (focus rings).
- **Icons (Phosphor §7):** `ph-books`/`ph-house` (home), `ph-plus` (create), `ph-hash` (text channel), `ph-caret-down` (category collapse / server header), `ph-warning-circle` (error), `ph-arrow-clockwise` (retry).
- **Components to reuse:** ServerRail icon primitive (§8), ChannelSidebar item primitive (§8), Empty/Error/Loading states (§8 — skeletons not spinners for lists).

## 5. Responsive contract

- **Desktop full (2xl) / compact (xl):** rail 72px + sidebar 260px both visible.
- **Tablet (lg):** rail + sidebar persist (≥1024 keeps both per §Responsive).
- **Mobile (degraded):** sidebar becomes overlay drawer; rail persists. Out of primary scope.

## 6. Interaction patterns

- Rail icons: `rounded-lg` default → `rounded-md` + emerald left-edge indicator bar on active; hover tooltip = server name. Arrow-key navigable list (`aria-label` = server name).
- Channel rows: secondary text → primary on hover/active; active row = `--surface-700` fill + emerald text + `aria-current`. Category headers collapsible (caret).
- + create button: focus-visible emerald ring; `aria-label="Create a server"`.
- All interactive elements keyboard-reachable with visible focus-visible rings.
- Error states: inline message + Retry button (real `<button>`).

## 7. Data shape

- `GET /servers` → `[{ id, name, ownerId }]` (empty array → rail empty state).
- `GET /servers/:id` → `{ server, categories: [{ id, name, position, channels: [{ id, name, type, position }] }] }` (drives sidebar loaded state; `403` non-member / `404` missing / network → sidebar error state).
- No avatars in data model → rail icons render initials (or first letter) on `--surface-600`.

## 8. Prior art (match this visual language)

- Server rail structure (home icon, divider, server icons, active pill, + button) → match `direction.html:162-203`.
- Channel sidebar (server header + categories + channel rows + `#general`) → match `direction.html:207-239` — BUT category headers must use `--text-secondary` (0.60), not `text-zinc-500` (too faint, AA fail).
- Rail + create button styling → match `app-home.html:206-235`.

## 9. Success criteria (APPROVE checklist)

- [ ] Rail renders loading / empty / loaded; sidebar renders no-server / loading / loaded / error (all visible in mockup).
- [ ] `#general` visible under a "General" category in the loaded sidebar.
- [ ] Uses only DESIGN-SYSTEM.md tokens from §4 (every hex maps to a token).
- [ ] Category headers use `--text-secondary` (≥4.5:1 on `--surface-900`), NOT `--text-muted` / faint zinc.
- [ ] + create button present at rail bottom; active-server indicator + emerald active channel.
- [ ] Keyboard-reachable rail + channel list; focus-visible rings; `aria-current` on active channel; `aria-label` on rail icons.
- [ ] NO M3 chrome — no message composer, no message list, no voice controls, no presence dots/member list.
- [ ] All icon references are real Phosphor names; Geist font; emerald accent.

## 10. Non-goals

- No message canvas / composer (M3).
- No voice/video, no presence indicators, no member list (M3 / later).
- No right-hand academics/assignments pane.
- No RBAC/admin/settings UI; no invite UI.

## 11. Reviewer briefing (D-3 review & adopt)

`/plan-design-review` — score visual hierarchy, spacing rhythm, brand coherence, edge-case (all rail + sidebar states) handling, dark-theme contrast.
`/ui-ux-pro-max` — verify state coverage + `#general`, token audit (esp. category-header contrast), no-M3-chrome scope, Phosphor icon validity, keyboard/ARIA minimums.
