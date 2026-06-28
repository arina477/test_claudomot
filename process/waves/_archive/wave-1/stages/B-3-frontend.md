# Wave 1 — B-3 Frontend

Specialist: react-specialist. Implemented the dark app shell per DESIGN-SYSTEM.md + mockups.
- `styles/globals.css` (Tailwind v4 @theme tokens: surfaces/accents/Geist/shadows/radii), `index.html` (dark class + Geist fonts).
- `shell/AppShell.tsx` (3-column flex; <1024 sidebar→overlay drawer), `ServerRail.tsx`, `ChannelSidebar.tsx`, `MainColumn.tsx`, `ConnectionStateIndicator.tsx` (prop-driven online/reconnecting/offline, role=status aria-live), `icons.tsx` (inline SVGs).
- `App.tsx`, `main.tsx`, `test-setup.ts`, `shell/AppShell.test.tsx` (10 RTL tests).
typecheck + build (215KB JS, PWA) + test (10/10) all PASS. Member-list column correctly OUT of scope.

Designs consumed: design/DESIGN-SYSTEM.md, design/server-channel-view.html, design/app-home.html.

---
```yaml
skipped: false
fast_path_active: false
specialists_spawned: [react-specialist]
files_implemented: [apps/web/src/styles/globals.css, apps/web/index.html, apps/web/src/shell/AppShell.tsx, apps/web/src/shell/ServerRail.tsx, apps/web/src/shell/ChannelSidebar.tsx, apps/web/src/shell/MainColumn.tsx, apps/web/src/shell/ConnectionStateIndicator.tsx, apps/web/src/shell/icons.tsx, apps/web/src/App.tsx, apps/web/src/main.tsx, apps/web/src/test-setup.ts, apps/web/src/shell/AppShell.test.tsx, apps/web/vite.config.ts]
designs_consumed: [design/DESIGN-SYSTEM.md, design/server-channel-view.html, design/app-home.html]
deviations: [{specialist: react-specialist, change: "NODE_ENV=test in vite.config test.env", plan_said: "n/a", why: "worker shell exports NODE_ENV=production; React 19 prod build breaks RTL act()", adjudication: accepted}, {specialist: react-specialist, change: "inline SVG icons instead of Phosphor CDN", plan_said: "Phosphor line icons", why: "no external icon dep; matches aesthetic", adjudication: accepted}]
simplify_applied: deferred-to-B-5
```
