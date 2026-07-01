# Wave 25 — T-1 Static (Pattern A: CI-verified)

## Action 1 — CI evidence (merge commit / C-1 final_commit_sha a730caf)
C-1 run **28512345221** — `lint` job SUCCESS + `typecheck` job SUCCESS on the green commit `a730caf` (squash-merged as dbe55a2). Both jobs present. `pnpm lint` (biome ci) 0 errors / 7 pre-existing warnings; `pnpm -w turbo run typecheck` 4/4 packages.

## Action 2 — Coverage / bypass audit
- New `.ts`/`.tsx` surface (packages/shared/src/mentions.ts, apps/api mentions.ts + messages.service.ts, apps/web MessageList.tsx + mentionSlug.ts) is all lint- + typecheck-covered.
- Bypass grep on the wave diff: **0 production-code bypasses.** 4 `any` casts, all in TEST fault-injection/mock code (edit-message-mentions-rollback.spec.ts:370/377/381 — pg-pool client patch; mentions.spec.ts:132 — drizzle tx mock). Acceptable: intercepting pg-pool internals + mocking a drizzle transaction callback legitimately require `any`. Not blocking.

## Action 3 — Discipline note
- The shared slug regexes now derive from `MENTION_TOKEN_SLUG_SRC` (B-6 tightening) — a good "single-constant-drives-all-derivations" pattern; the parity contract test enforces it. → T-1.md candidate.

## Action 4 — Self-check
C-1 cites both lint + typecheck on the merge commit ✓; bypass grep ran ✓; findings cite file:line ✓.

```yaml
mask_mode_signoff: PASS
signoff_note: ""
test_pattern: ci-verified
evidence:
  - "C-1 lint job: run 28512345221 (a730caf) SUCCESS — biome ci 0 errors"
  - "C-1 typecheck job: run 28512345221 (a730caf) SUCCESS — turbo typecheck 4/4"
findings:
  - {severity: INFO, location: "test files (fault-injection/mocks)", description: "4 any casts in pg-pool patch + tx mock; acceptable, 0 in prod code"}
ts_bypasses_in_wave_diff: 0
```

## Exit
CI static evidence confirmed, 0 prod bypasses. → T-3/T-4 band (after T-2).
