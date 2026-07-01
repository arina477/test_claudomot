# Wave 25 — T-6 Layout (Pattern B: active)

## Scope
wave_type includes `ui` so T-6 fires, but the wave introduced **no new UI surface**: D-block was skipped (design_gap_flag=false, no `design/<feature>.html` canonicalized), and the `MentionPill` component is UNCHANGED. The only change is which token the tokenizer turns into a pill (render logic), not the pill's visual/layout.

## Action 1/2 — Screenshot + diff
No D-3 surface to diff (D skipped). No layout target. The pill's rendered appearance was captured live at T-5 (both runs, 4 scenarios, 8 screenshots at `stages/t5-evidence/`): the mention pill renders as an inline emerald chip flowing correctly with surrounding text; trailing text (`.done`) flows inline after the pill without layout break; multiple pills in one message wrap normally. No layout regression.

## Action 4 — Token compliance (existing MentionPill component)
T-5 captured the live computed style of the rendered pill: background `rgba(16,185,129,0.1)`, text `rgb(110,231,183)`, outline — the design-system **emerald** mention tokens (unchanged from prior waves). `mentionSlug.ts` is a pure util (no selector, skipped per Action 4). No invented hex / off-token spacing / fabricated shadow. Compliant.

```yaml
test_pattern: active
skipped: false
surfaces_audited: [MessageList mention render (existing MentionPill component)]
breakpoints: [captured via T-5 live DOM]
diffs: []                             # no D-3 surface; pill component unchanged
token_violations: []
fix_up_cycles: 0
findings: []
```

## Exit
No layout delta — MentionPill component unchanged, renders on-token live (T-5 evidence). No new surface to diff. → T-7.
