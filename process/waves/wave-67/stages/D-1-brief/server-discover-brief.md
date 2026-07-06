# D-1 Brief — /discover (public study-server directory)

## §1 What we need
A browsable, searchable directory page where a logged-in student discovers PUBLIC study servers they're not already in, sees each community's info (name, description, topic, member count), and joins in one click.

## §2 Where it lives
- Route: `/discover` (React Router v7, apps/web/src/router.tsx). Full-page surface within the authed app shell.
- Entry point: a "Discover" / compass affordance on the ServerRail (apps/web/src/shell/ServerRail.tsx), near the existing "+" create-server button (mirror that entry pattern).

## §3 Audience + states
- Audience: a logged-in student looking for new study communities.
- States: **loading** (skeleton cards), **loaded** (grid/list of server cards), **empty — no public servers yet** (honest cold-start: "No public communities yet — check back soon" — NOT an error), **empty — no search matches** ("No communities match '<q>'"), **error** (retryable), **joining** (per-card button spinner), **already-a-member** (button reads "Joined"/"Open").

## §4 DESIGN-SYSTEM.md references (≥6 primitives)
- Surfaces: `--surface-950` (app frame) / `--surface-900` (rail) / `--surface-800` (main canvas, page bg) / `--surface-700` (card border/hover fill).
- Text: `--text-primary` (server name), `--text-secondary` (description, topic, member count), `--text-muted` (placeholder/empty-state).
- Accent: `--accent-emerald` (`--primary`) for the Join button + focus ring (matches active-channel/primary-button usage); `--accent-amber` reserved (not used here).
- Border: `--border-hairline` (card default), `--border-hover` (card hover).
- Icons: Phosphor — compass/magnifying-glass (search), users (member count), plus/sign-in (join). (Match icon set used across shipped mockups.)
- Components: card container + search input (reuse the input styling from create-server.html / invite-join.html); server card avatar/monogram (reuse server-rail-sidebar.html server tile).

## §5 Responsive contract
- Desktop (≥1024px): multi-column card grid (2–3 cols) in the main canvas beside the rail; search bar pinned at top.
- Tablet (640–1023px): 1–2 col grid.
- Mobile (<640px): single-column stacked cards; search bar full-width sticky top. (App is desktop-first; keep mobile usable, not pixel-perfect.)

## §6 Interaction patterns
- Search: debounced text input → refetch `GET /servers/discover?q=`. Clear-button resets.
- Pagination: "Load more" button (or infinite scroll) appending results; bounded page size.
- Join: per-card primary button → optimistic spinner → on success button → "Joined"/"Open"; card stays (or shows joined state). Errors surface inline (toast/inline text), non-destructive.
- Keyboard: cards focusable; Enter on a focused card's Join triggers join; search input is the initial focus.

## §7 Data shape
DiscoverServer = { id: string, name: string, description: string|null, topic: string|null, memberCount: number }. Page state: { servers: DiscoverServer[], q: string, loading, error, hasMore, joiningIds: Set<string> }.

## §8 Prior art (match visual language)
- `design/server-rail-sidebar.html` — server tile/monogram + list rhythm.
- `design/invite-join.html` — the join surface (server preview + primary Join affordance + community info framing).
- `design/create-server.html` — input/field styling + modal/form card treatment.

## §9 Success criteria (≥5)
- [ ] Card grid renders public servers with name + description + topic + member count, dark-theme, matching prior-art card rhythm.
- [ ] Search box filters the directory (wired to the endpoint's q param), with a distinct no-match state.
- [ ] Honest cold-start empty-state (no public servers) reads as intentional, not broken/error.
- [ ] Per-card Join uses `--accent-emerald` primary button; joining + joined + error states are visible and non-destructive.
- [ ] "Load more" pagination present (no unbounded fetch); loading skeletons on first load.
- [ ] All colors/spacing/type/icons cited from DESIGN-SYSTEM.md (no invented hex, Phosphor icons only); WCAG AA text contrast.

## §10 Non-goals
Moderation/safety controls, ranking/recommendation, categories, trending, server-owner "publish to directory" toggle UI (that's a server-settings surface — separate), light mode.

## §11 Reviewer briefing
Judge against: honest empty-state (cold-start), Join primary-emerald consistency, card rhythm matching server-rail-sidebar/invite-join, search UX clarity, dark-only + Phosphor + token discipline, AA contrast. This is a browse→see→join directory; the "publish my server to the directory" control is out of scope (server-settings, later).

```yaml
mask_mode_signoff: PASS
signoff_note: "All template fields filled; §4 cites 6+ primitives; §8 names 3 prior-art mockups; §9 has 6 checkboxes."
```
