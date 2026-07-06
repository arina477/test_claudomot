# T-6 — Layout (live) — wave-68

**Layer:** T-6 Layout · **Head:** head-tester · **Mode:** automatic
**Surfaces:** the NEW Server Settings — Overview surface + the now-populated /discover cards. Design canon: `design/server-settings.html` (Overview shell), `design/server-discover.html`. Viewport 1440×900, dark theme.

## Overview settings surface — `t6-overview-settings-surface.png`
- Full-screen dialog, near-black surface (dark theme), two-column: left nav rail (**Overview** active in emerald, **Roles** below with shield icon) + content column.
- **Public directory** card: heading + honesty helper ("List this server in the public discovery directory… Members already in the server are unaffected."), a `role=switch` "List in public directory" toggle with sub-label ("Private — only invite-link members can join."). Toggle OFF-state grey (the §8 dark-on-emerald applies to the ON state, proven active during T-5 when checked).
- **Server profile** card: DESCRIPTION textarea with live "99 / 500" char counter; TOPIC input with "21 / 100" counter. Proper DS form primitives.
- Save Changes button (disabled-when-no-changes state visible post-save). Owner role badge ("OW · Owner") bottom-left.
- **Verdict:** matches dark-theme design system; spacing/hierarchy/token usage consistent with `design/server-settings.html`. No material divergence.

## /discover populated cards — `t6-discover-card-populated.png`
- "Discover Communities" header (emerald compass icon) + subtitle + search bar ("Search by topic, course, or server name…").
- "Showing 1 community" count. Server card: "FP" rounded avatar, "Fixture Proof Server" title, **"2 members"** with a member icon (the corrected count), description (2-line truncate w/ ellipsis), "Physics · Study Group" topic pill, emerald **"Join"** button (dark-on-emerald DS §8).
- **Verdict:** matches `design/server-discover.html`; the card correctly surfaces the real member count in the DS-styled member row. No material divergence.

## Verdict
```yaml
stage: T-6
layer: layout
verdict: PASS
surfaces: [overview-settings, discover-populated-cards]
divergence: none-material
screenshots: [t6-overview-settings-surface.png, t6-discover-card-populated.png]
dark_theme: consistent
ds_tokens: emerald-accent + surface dark scale consumed; form primitives (switch/textarea/input) per DS
```
