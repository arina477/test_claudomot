# Wave 45 — P-3 Plan

## Approach section

### Architecture deltas
- **E2E test-runner browser resolution (67881a58).** Change: `apps/web/playwright.config.ts` stops resolving the Google Chrome *channel* and defaults to Playwright's bundled chromium across all 3 projects (setup / chromium-smoke / chromium-authed). Current failure domain: `devices['Desktop Chrome']` spreads `channel: 'chrome'`, which points at the absent `/opt/google/chrome/chrome`; the swarm has manually bypassed via a bundled-chromium executablePath every UI wave. **Approach chosen:** drop the channel pin so Playwright's managed bundled chromium (present: `~/.cache/ms-playwright/chromium-1208`+`1228`) is used. **Alternative considered:** hardcode `launchOptions.executablePath` to the versioned cache path — REJECTED (brittle; breaks on Playwright version bump when the cache dir rev changes; risk-officer flagged pin-staleness). **Alternative:** keep `channel: 'chrome'` and install system Chrome — REJECTED (env-managed, not repo-controllable; heavier + not reproducible). No service boundary / transaction / permission impact — test-infra only.
- **Typing-label lint hygiene (4e994e96).** Change: `buildTypingLabel` in `apps/web/src/shell/useTyping.ts` replaces 6 non-null assertions with behavior-preserving guarded access. Failure domain: none — pure render-string builder; the `!` sites are already length-guarded so output is unchanged. **Approach:** early-return/destructure or explicit index guard. **Alternative:** biome's autofix `?.` — REJECTED (changes output to literal 'undefined' text if an index were ever absent; not behavior-preserving). `ServerRolesPage.tsx`: verify-only (its 4 suppressions are live per biome; remove only if biome reports unused).

### Data model
None. No schema change.

### API contracts
None. No endpoint added/modified.

### Dependency list
None. No new third-party dep. (Playwright + Biome already installed; versions unchanged.)

### SDK pre-build checklist
N/A — no new external SDK.

## Plan section

### File-level steps (grouped by B-stage)
B-1 Schema: none. B-2 Contracts: none. B-3 Backend: none.

**B-4 Frontend / config** (two independent parallel batches):
| # | Path | Op | Change | Specialist | Order |
|---|---|---|---|---|---|
| 1 | apps/web/playwright.config.ts | modify | Drop Chrome-channel pin from all 3 projects' `use`; default to bundled chromium via Playwright's managed resolution (no hardcoded versioned path). Update the config header comment. | devops-engineer | batch A (independent) |
| 2 | apps/web/src/shell/useTyping.ts | modify | Replace the 6 `typers[N]!.displayName` non-null assertions in `buildTypingLabel` (lines ~67/69/71) with behavior-preserving guarded access; output byte-identical for 0/1/2/3/4+ typers. | react-specialist | batch B (independent) |
| 3 | apps/web/src/shell/ServerRolesPage.tsx | verify/modify | Run biome; confirm the 4 `useKeyWithClickEvents` suppressions (~215/354/517/628) are LIVE (biome reports 0 → still needed). Remove ONLY any biome confirms unused. Likely no-op. | react-specialist | batch B (after #2, same agent) |

**B-5 Wiring / verify:**
| # | Action | Change | Specialist | Order |
|---|---|---|---|---|
| 4 | `biome ci` on the two changed src files → 0 warnings; `tsc`/typecheck clean | verify | head-builder / orchestrator | after batch B |
| 5 | Run `pnpm --filter @studyhall/web exec playwright test` → browser launches on bundled chromium, specs run without channel/executable error or inline bypass | verify | devops-engineer | after batch A |

### Specialist routing (validated against AGENTS.md)
- `devops-engineer` ✓ (monorepo tooling / Biome / CI / test-infra) — playwright.config.ts + E2E launch verify.
- `react-specialist` ✓ (React 19 + Vite hooks/components) — useTyping.ts + ServerRolesPage.tsx.

### Parallelization map
- **Batch A** (devops-engineer): playwright.config.ts — independent.
- **Batch B** (react-specialist): useTyping.ts → ServerRolesPage.tsx (serial within one agent; same src/shell concern).
- A ∥ B (no shared files). Verify steps 4/5 after their respective batches.

### Self-consistency sweep
1. Every P-2 AC → ≥1 step: 67881a58 ACs → steps 1,5; 4e994e96 ACs → steps 2,3,4. ✓
2. Every step has a specialist. ✓
3. No file in multiple parallel batches (A={config}, B={useTyping,ServerRolesPage} disjoint). ✓
4. design_gap_flag referenced: false (no UI surface). ✓
5. Architecture deltas have explicit alternative trade-offs. ✓
6. Data + API contracts concrete (none — declared). ✓
7. New deps: none. ✓
8. SDK checklist: N/A. ✓

```yaml
p_stage_verdict: COMPLETE
design_gap_flag: false
specialists: [devops-engineer, react-specialist]
files_touched: 3
new_deps: 0
schema_change: false
next: P-4
```
