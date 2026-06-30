# T-1 — Static (wave-18 M3 threads)

**Pattern:** A — Verified-via-CI.

## Action 1 — CI evidence
C-1 `verdict_evidence` confirms both static jobs ran green on the merged head SHA `308ece2`:
- **lint** — success (18s), CI run `28451953162`.
- **typecheck** — success (40s), same run.

Both jobs ran on the single commit CI evaluated; merge commit `16c72b6`.

## Action 2 — Coverage audit (static-analysis bypass grep)
Ran the bypass grep on the wave diff (`main~1..main`, the squash-merged thread work):

```
git diff main~1..main -- '*.ts' '*.tsx' | grep -cE '@ts-expect-error|@ts-ignore|: any|as any|as unknown as'
→ 0
```

Zero NEW `@ts-expect-error` / `@ts-ignore` / `: any` / `as any` / `as unknown as` introduced by the wave. The pre-existing `as any` casts in `messaging.gateway.spec.ts` / `messages.service.spec.ts` are test-only server/emitter mocks with `biome-ignore` annotations (untouched by this wave's logic — they predate it).

The wave added `.ts` files the linter/typechecker cover (`ThreadPanel.tsx`, `useThread.ts`, thread routes, gateway thread handlers, `packages/shared/src/messaging.ts` thread schemas) — all type-checked green, no new generic-constraint escapes.

## Action 3 — Discipline note
- 9 pre-existing biome warnings (wave-14 origin) remain — NOT introduced by this wave; carried (see findings F-CARRY-1).
- New `ThreadReplyEvent` / `ThreadReplyDeletedEvent` shared types are exported from `packages/shared` and consumed type-safely on both api (gateway) and web (handlers) — contract surface is fully typed end-to-end (no `any` at the event boundary).

## Action 4 — Mask-mode self-check
- C-1 evidence cites both lint + typecheck jobs on merge commit. ✓
- Bypass grep ran (0 new). ✓
- Findings concrete with severity. ✓

```yaml
mask_mode_signoff: PASS
signoff_note: ""
test_pattern: ci-verified
evidence:
  - "C-1 lint job: run 28451953162 green (18s) on head 308ece2"
  - "C-1 typecheck job: run 28451953162 green (40s) on head 308ece2"
findings:
  - {severity: low, location: "repo-wide (wave-14 origin)", description: "9 pre-existing biome warnings carried; not introduced by wave-18"}
ts_bypasses_in_wave_diff: 0
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Both static jobs (lint, typecheck) ran green on the single merged head SHA per C-1 evidence, and the
    wave diff introduced zero new typechecker bypasses (0 @ts-expect-error/@ts-ignore/any-casts). The new
    thread event contract is fully typed end-to-end across the api/web boundary. Only carry is the 9
    pre-existing wave-14 biome warnings, untouched by this wave.
  next_action: PROCEED_TO_T-3
```
