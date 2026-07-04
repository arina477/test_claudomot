# Wave 45 — B-3 Frontend/config

## Specialists
- **devops-engineer** → apps/web/playwright.config.ts (task 67881a58)
- **react-specialist** → apps/web/src/shell/useTyping.ts (task 4e994e96); ServerRolesPage.tsx verify-only

## Implementation
### 67881a58 — Playwright bundled chromium
Added `channel: undefined` to all 3 projects' `use` (setup / chromium-smoke / chromium-authed) after the `...devices['Desktop Chrome']` spread; updated header comment. @playwright/test v1.61.1 has NO `Desktop Chromium` descriptor — the Desktop Chrome descriptor carries `defaultBrowserType:'chromium'` with no channel field, so the spread already resolves bundled chromium; the explicit `channel: undefined` makes it durable/tamper-proof against a future descriptor re-adding `channel:'chrome'`. No hardcoded executablePath (AC4 honored). `.mcp.json` untouched (AC).
Verify: `npx playwright test --list` enumerated 5 tests, no "channel chrome / executable doesn't exist" error; tsc clean for config.

### 4e994e96 — biome hygiene
useTyping.ts buildTypingLabel: 6 `!` → per-branch `const a = typers[0] as Typer` (Typer = element type) bound after each length guard. Plain destructure was tried first but fails under `noUncheckedIndexedAccess:true` (tsconfig.base.json:9) — TS won't narrow destructured elements from a length guard; `as Typer` records the guard's guarantee, biome doesn't flag casts. Output byte-identical for 0/1/2/3/4+. `?.` deliberately avoided (would emit 'undefined').
ServerRolesPage.tsx: `biome ci` → 0 warnings; all 4 `useKeyWithClickEvents` suppressions LIVE → retained, NO change (task's "3 unused" claim was stale, confirmed).
Verify: `biome ci useTyping.ts ServerRolesPage.tsx` → 0 warnings; `tsc --noEmit` clean.

## Deviations
- react-specialist: used `as Typer` casts instead of destructure (destructure fails under noUncheckedIndexedAccess). ADJUDICATED: accepted — behavior-preserving, biome-clean, tsc-clean; the sites were already provably safe (length-guarded) so this is pure lint-hygiene. Flagged for B-6/head-builder: cast-vs-guard is a lint-satisfying swap on already-safe code, acceptable for a hygiene wave.
- devops-engineer: `channel: undefined` override instead of `Desktop Chromium` device (absent in v1.61.1). ADJUDICATED: accepted — idiomatic + durable.

```yaml
skipped: false
fast_path_active: true
specialists_spawned: [devops-engineer, react-specialist]
files_implemented: [apps/web/playwright.config.ts, apps/web/src/shell/useTyping.ts]
files_verified_unchanged: [apps/web/src/shell/ServerRolesPage.tsx]
designs_consumed: []
deviations:
  - {specialist: react-specialist, change: "as Typer cast", plan_said: "guarded/destructure", why: "noUncheckedIndexedAccess blocks destructure narrowing", adjudication: accepted}
  - {specialist: devops-engineer, change: "channel:undefined override", plan_said: "drop channel / Desktop Chromium", why: "Desktop Chromium absent in v1.61.1", adjudication: accepted}
simplify_applied: true
```
