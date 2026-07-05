# T-6 — Layout (wave-52)
**Pattern:** B (active). Focus-room panel (design/focus-room-panel.html, D-3 adopted). Evidence from the T-5 live run (S5) at desktop + <1024.
- Deployed panel matches the canonical design: open-rooms list ("N focusing"), create affordance, joined roster + leave, distinct room-timer; dark (rgb(10,10,11) = --surface-950); reuses study-timer card/.btn/roster chrome + emerald.
- <1024 compact: collapses to a single non-crowding bar (doesn't crowd the study-timer/channel/message) — confirmed live.
- a11y (D-3 carries) live: roster role=list + aria-live=polite + self aria-current=true "(You)"; room-card focusable. NO voice/video controls.
- No layout diffs / token violations. F-none.
```yaml
test_pattern: active
skipped: false
surfaces_audited: [focus-room-panel]
breakpoints: [1440, 900]
diffs: [{surface: focus-room-panel, breakpoint: 1440, diff_pct: "matches design", verdict: PASS}, {surface: focus-room-panel, breakpoint: 900, diff_pct: "compact non-crowding", verdict: PASS}]
token_violations: []
findings: []
```
