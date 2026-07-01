# Wave 26 — T-6 Layout (Pattern B: active)

## Scope
wave_type=[ui]; the wave introduces a NEW visual primitive (`PresenceDot`) rendered on message-row author avatars + refactored into the member panel. No new page/route; the dot attaches to existing avatar surfaces (design ref: server-channel-view.html author-avatar + presence-dot pattern).

## Action 1/2 — Rendered-state verification (via T-5 live evidence)
T-5 captured the PresenceDot rendered LIVE on prod (deploy 4a703d92), both message-row author avatars AND the member panel:
- Dot renders as a small absolutely-positioned element (`-bottom-0.5 -right-0.5`) on the `rounded-full` avatar corner, flowing correctly (no layout break, no avatar displacement).
- Online = emerald `var(--color-accent-emerald)` = `rgb(16,185,129)`; offline = muted `var(--color-surface-500)` = `rgb(82,82,91)` — both from design-system tokens (NO hard-coded hexes; the member-panel inline-hex duplication was removed).
- Consistent across 23-27 rows/members; no visual regression in the member panel refactor.

## Action 4 — Token compliance
`PresenceDot` uses `var(--color-accent-emerald)` (styles/globals.css:18) + `var(--color-surface-500)` (globals.css:15) + `#121214` ring mask (matches pre-refactor). No invented hex / off-token. Compliant (also confirmed by karen at P-4 + head-builder at B-6).

```yaml
test_pattern: active
skipped: false
surfaces_audited: [message-row author avatar (PresenceDot), member-list panel (PresenceDot refactor)]
diffs: []                             # no layout regression; on-token
token_violations: []
findings: []
```
## Exit
PresenceDot renders on-token, correctly positioned, no layout regression (live-verified via T-5). → T-7.
