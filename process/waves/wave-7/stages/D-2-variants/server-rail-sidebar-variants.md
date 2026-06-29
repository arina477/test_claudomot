# D-2 Variants — server-rail-sidebar

**Staging file:** `design/staging/server-rail-sidebar.html`
**Generation approach:** Authored directly (RECOVERY — file GONE after worker restart; target known from prior APPROVED run). Visual language drawn from `design/direction.html` (rail + sidebar) and `design/app-home.html` (rail + create button).
**Variant decision encoded:** real-data app-shell chrome (rail + channel sidebar) with explicit state coverage. Primary canonical view (loaded rail + loaded sidebar) plus a state gallery: rail loading/empty/loaded; sidebar no-server/loading/loaded/error. `#general` under a "General" category visible.
**Scope guard (no M3 chrome):** no message canvas, composer, voice controls, presence dots, or member list. The content pane is an inert "out of scope (M3)" placeholder.
**Contrast fix vs. prior art:** category headers use `--text-secondary` (rgba 255,255,255,0.60 ≈ 7:1 on surface-900), NOT `text-zinc-500` as in `direction.html` (the AA failure the brief called out).
**Token discipline:** all hex via Tailwind token config; text/borders via CSS vars. Skeletons (not spinners) for list loading per DESIGN-SYSTEM §8.
**`/aidesigner` warnings:** n/a (authored directly).
