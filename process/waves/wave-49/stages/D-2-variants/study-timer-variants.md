# Wave 49 — D-2 Variants — study-timer
- Generator: /aidesigner (aidesigner.ai REST). HTTP 200, 29.9KB. Staging: design/staging/study-timer.html (committed).
- Approach: full brief + DESIGN-SYSTEM.md; explicit output — hero mm:ss countdown (tabular-nums), Work/Break phase pill (emerald/amber), Start/Pause/Reset, ephemeral "N studying" roster (distinct from online-presence), all states as demo blocks.
- Sanity: emerald 14, amber 8, dark surfaces 57, tabular/mono 19; Work/Break/Start/Pause/Reset present; idle/loading/error + roster shown; doctype+inline-style OK. GAPS (for D-3): aria-live=0, prefers-reduced-motion=0 (brief §9 a11y) — expect the review to flag.
