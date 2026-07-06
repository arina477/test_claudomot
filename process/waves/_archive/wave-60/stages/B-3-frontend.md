# B-3 Frontend — wave-60
Specialist: react-specialist (a80b43760a4e8d9b5). 3 surgical token conversions:
- ServerRail.tsx:111 rail bg #0a0a0b → var(--color-surface-900)
- StartDmPicker.tsx:176 modal card #1c1c1f → var(--color-surface-900)
- StartDmPicker.tsx:432 disabled confirm/send bg #27272a → color-mix(in srgb, var(--color-accent-emerald) 40%, transparent); enabled → var(--color-accent-emerald); cursor:not-allowed already present.
AC4 satisfied (all var()-derived, no re-hardcoded hex). SURGICAL: only these 3 (36 other files with same hex untouched).
Results: tsc clean; biome clean; vitest 467/467 pass. Deviation: none.
```yaml
specialists: [react-specialist]
files: [apps/web/src/shell/ServerRail.tsx, apps/web/src/shell/StartDmPicker.tsx]
deviations: []
```
