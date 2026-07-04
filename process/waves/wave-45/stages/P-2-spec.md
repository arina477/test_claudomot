# Wave 45 — P-2 Spec (pointer)

**Spec contract lives in** `tasks.description` of primary task `67881a58-aceb-4ccb-95e7-772e8f306dd4` (YAML head + `---` + prose). Sibling `4e994e96` links via parent_task_id FK.

wave_type: **multi-spec** · claimed_task_ids: [67881a58, 4e994e96] · design_gap_flag: false

## Spec 1 — 67881a58 Playwright bundled-chromium (test-runner half)
ACs (falsifiable):
1. playwright.config.ts launches bundled chromium across all 3 projects; no `channel: 'chrome'` pin → absent system Chrome.
2. `pnpm --filter @studyhall/web exec playwright test` launches + runs without channel/executable launch error and without inline bypass.
3. No committed e2e spec needs an inline executablePath/channel workaround.
4. No hardcoded versioned cache path (survives Playwright version bump).
Root cause CONFIRMED at P-2: devices['Desktop Chrome'] spread pins the chrome channel. .mcp.json already `--browser chromium` (unchanged).

## Spec 2 — 4e994e96 biome hygiene
ACs (falsifiable):
1. `biome ci useTyping.ts ServerRolesPage.tsx` → 0 warnings (currently 6, all useTyping noNonNullAssertion).
2. 6 `!` in buildTypingLabel → behavior-preserving safe access; label output byte-identical for 0/1/2/3/4+; NOT `?.`.
3. ServerRolesPage 4 suppressions verified LIVE (biome reports 0 there) → retained unless biome confirms unused; "x3 unused" claim STALE.
4. No new biome warnings introduced.
Reframed: lint-hygiene not crash-fix (`!` sites length-guarded).

```yaml
p_stage_verdict: COMPLETE
spec_location: "tasks.description of 67881a58"
wave_type: multi-spec
claimed_task_ids: [67881a58-aceb-4ccb-95e7-772e8f306dd4, 4e994e96-7935-4ebf-95ad-1551a087b6c6]
design_gap_flag: false
```
