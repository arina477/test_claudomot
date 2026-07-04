# T-1 — Static (wave-45)

**Block:** T (Test) · **Stage:** T-1 · **Pattern:** A (verified-via-CI) · **Mode:** automatic
**Wave:** 45 — M8 tech-debt HYGIENE (Playwright bundled-chromium 67881a58 + biome useTyping cleanup 4e994e96)

## Action 0 — Block entry
- Seeded `process/waves/wave-45/blocks/T/review-artifacts.md` (manifest).
- Seeded `process/waves/wave-45/blocks/T/findings-aggregate.md` (empty at start; F1 appended by T-2 audit).

## Action 1 — Confirm CI evidence
C-1 `verdict_evidence` (SHA 8bb4e5140b039c0f964b8db714106f49c9e9197c, CI run 28698042797):
- **lint** job: green (31s) — biome lint. This is the load-bearing check for 4e994e96 (the 6 noNonNullAssertion warnings that were cleaned).
- **typecheck** job: green (38s) — element-type casts compile; no `any` widening.
Both jobs present and green on the single merge-candidate commit. No C-1 defect.

## Action 2 — Coverage audit (static-analysis bypass grep)
`git diff ae22380^..ae22380 -- '*.ts' '*.tsx' | grep -nE '@ts-expect-error|@ts-ignore|: any|as any|as unknown as'` → **0 matches**.

Wave-diff static surface:
- `apps/web/playwright.config.ts` — `channel: undefined` x3 + config-level `PLAYWRIGHT_BROWSERS_PATH`. No bypasses; typed config.
- `apps/web/src/shell/useTyping.ts` — the biome change REMOVED 6 non-null assertions (`typers[N]!`) and replaced them with `typers[N] as Typer` casts bound AFTER each `length ===` guard. Net effect TIGHTENS the type surface vs a non-null assertion (a length-guarded index access is provably in-bounds; the cast narrows to the array element type, not `any`). No new `any`/`ts-ignore`.
- `apps/web/package.json` — script env only (`PLAYWRIGHT_BROWSERS_PATH` prefix on e2e scripts). No type surface.

## Action 3 — Discipline note
- The biome refactor is a model behavior-preserving cleanup: casts scoped inside proven-safe branches rather than a blanket `!`. Candidate canonical pattern for T-1.md at L-2.
- `buildTypingLabel` is a pure transition table (0/1/2/3/4+ branches) with no unit test — surfaced as F1 by T-2 (the ideal moment to lock a transition table is a behavior-preserving refactor; it was missed). Static analysis alone cannot prove the byte-identical-output claim — only a transition-table unit test can. Noted, non-blocking.

## Action 4 — Mask-mode self-check
- [x] C-1 evidence cites BOTH lint + typecheck on merge commit (8bb4e51).
- [x] Bypass grep ran → 0 matches, recorded.
- [x] Findings concrete (F1 cites useTyping.ts:65 + severity low).

## Footer

```yaml
mask_mode_signoff: PASS
signoff_note: "Backend-free hygiene wave; lint+typecheck green on merge SHA; biome change tightens (not loosens) the type surface; 0 bypasses in wave diff."
test_pattern: ci-verified
evidence:
  - "C-1 lint job: CI run 28698042797 green (31s) on SHA 8bb4e51"
  - "C-1 typecheck job: CI run 28698042797 green (38s) on SHA 8bb4e51"
  - "git diff ae22380^..ae22380 static-bypass grep: 0 matches"
findings:
  - {severity: low, location: "apps/web/src/shell/useTyping.ts:65 buildTypingLabel", description: "F1 — pure transition-table fn (0/1/2/3/4+) has no dedicated unit test; byte-identical-output claim unlocked. Pre-existing, non-blocking."}
ts_bypasses_in_wave_diff: 0
```

head_signoff:
  verdict: APPROVED
  stage: T-1
  reviewers: {}
  failed_checks: []
  rationale: "Pattern-A CI-verified. lint + typecheck both green on merge SHA 8bb4e51 (CI run 28698042797). Wave-diff bypass grep = 0. The biome change REMOVES non-null assertions and replaces them with length-guard-scoped element-type casts — a net type-surface tightening, not a loosening. One low-severity coverage-gap finding (F1, buildTypingLabel transition table has no unit test) surfaced for V-2/L-2, non-blocking. Every applicable T-1 checkbox ticked."
  next_action: PROCEED_TO_T-3
