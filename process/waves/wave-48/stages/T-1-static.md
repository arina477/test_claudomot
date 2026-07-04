# T-1 — Static (wave-48)

**Pattern:** A — Verified-via-CI. Does NOT re-run lint/typecheck (C-1's job).

## Action 1 — CI evidence confirmed
C-1 run 28710662037 on PR HEAD (final merge commit c79343b7):
- lint (biome ci): pass, 25s
- typecheck (tsc): pass, 41s
Both jobs green on the single merge commit. No missing-job C-1 defect.

## Action 2 — Coverage / bypass audit
`git diff c79343b7~1..c79343b7 -- '*.ts' '*.tsx' | grep -E '@ts-expect-error|@ts-ignore|: any|as any|as unknown as'` → **NO BYPASSES FOUND**.
Wave code surface = 2 files: `apps/api/test/integration/dm-candidates.spec.ts` (+160, fully typed; imports real `DmService`, `EventEmitter2`), `apps/api/test/integration/pg-harness.ts` (+9, typed `whoCanDm: 'everyone'|'server-members'|'nobody'` union param). Both under biome/tsc coverage — the CI lint+typecheck jobs reasoned over them and passed.

## Action 3 — Discipline note
The new harness param uses an explicit string-literal union (not `string`), so the typechecker enforces valid `who_can_dm` values at every call site — good discipline, no tightening needed. No new lint rule warranted.

```yaml
mask_mode_signoff: PASS
signoff_note: ""
test_pattern: ci-verified
evidence:
  - "C-1 lint job (biome ci): run 28710662037 green, 25s"
  - "C-1 typecheck job (tsc): run 28710662037 green, 41s"
  - "bypass grep on c79343b7~1..c79343b7: NO BYPASSES FOUND"
findings: []
ts_bypasses_in_wave_diff: 0
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Lint and typecheck both ran green on the merge commit per C-1 evidence.
    Wave code surface is 2 typed test/harness files; bypass grep clean (0 TS
    escapes). The new harness param uses a string-literal union, keeping
    who_can_dm type-safe at call sites. Every applicable T-1 check ticks.
  next_action: PROCEED_TO_T-3
```
