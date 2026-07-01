# Wave 25 — B-4 Wiring

**Stage:** B-4 (Wiring) — B-2 ↔ B-3 integration gate.
**Branch:** wave-25-mention-parity @ `2a1f2dd`.

## Action 1 — Repo-wide typecheck
`pnpm -w turbo run typecheck` → **4/4 packages successful** (@studyhall/shared, @studyhall/api, @studyhall/web). Zero errors. The shared-slug extraction (packages/shared → apps/api + apps/web) type-checks end-to-end; no contract drift between the server import (`MENTION_TOKEN_SLUG_SRC`) and the client import (`extractMentionSlug`).

## Action 2 — Route registration
No new API or frontend routes this wave. `editMessage` is an existing service method (mention-diff now transaction-wrapped); the client MessageList tokenizer is an existing render path. Nothing to register. N/A.

## Action 3 — Env wiring
No new env vars in production code. The integration tier's `DATABASE_URL_TEST` (consumed by the rollback spec via pg-harness CF-2) is pre-existing (wave-17), already declared in `turbo.json` passthrough and CI. No `.env.example` delta.

## Action 4 — Import sanity
Collapsed into Action 1 (tsc catches orphan imports). Additionally the lint gate (`biome ci`) organizeImports pass is now clean.

## Action 5 — Adjudicate technical errors — DRIFT DEFECT FOUND + RESOLVED
`pnpm lint` (= `biome ci .`, the CI merge gate) reported **1 error**: `organizeImports` in `apps/api/test/integration/edit-message-mentions-rollback.spec.ts` (B-2-authored) — named `./pg-harness` imports out of biome sort order (`insertFixtureMessage` before `insertFixtureMention`).
- **Classification:** B-2 defect. Root cause: `biome format --write` (run by the B-2 specialist per BUILD rule 6) does NOT run organizeImports; the `biome ci` gate does. Format-only local verify masked a lint-gate failure.
- **Iron Law routing:** re-entered B-2 (backend-developer) rather than orchestrator-fixing. Specialist ran `biome check --write` across all B-2 files, verified the CF-2 side-effect `import './pg-harness'` stayed pinned first, re-ran lint/typecheck/mentions.spec. Committed `2a1f2dd`, pushed.
- **Distinguished from pre-existing state:** main's green CI (run 28505376042 @ 7045550) had 7 warnings / 0 errors across 184 files. The 7 warnings (useTyping.ts, multiPageCatchup.test.ts — noNonNullAssertion) are unchanged/identical between main and this branch (`git diff origin/main..HEAD` empty for both, biome.json unchanged) → pre-existing, NOT this wave's responsibility. The +1 error was solely the new spec's import order.

## Post-fix verification (orchestrator, repo-level)
- `pnpm lint` → **Checked 187 files, Found 7 warnings, 0 errors, exit 0** → passes CI lint gate.
- `pnpm -w turbo run typecheck` → 4/4 clean.
- New integration spec picked up by the tier glob (`test/integration/**/*.spec.ts`): `edit-message-mentions-rollback.spec.ts` present alongside the 4 wave-17/24 specs.
- Remote `origin/wave-25-mention-parity` synced @ `2a1f2dd`.

## L-block observation candidate
Local B-block verify for any NEW file must run `biome check` (format + organizeImports + lint), not `biome format` alone — `biome format` passes while `biome ci` (the CI gate) rejects on import order. Refines/extends BUILD rule 6. Log at L-1.

```yaml
typecheck_passed: true
routes_registered: []                 # no new routes
env_vars_wired: []                    # no new env vars (DATABASE_URL_TEST pre-existing)
drift_defects:
  - stage: B-2
    file: apps/api/test/integration/edit-message-mentions-rollback.spec.ts
    kind: organizeImports lint-gate failure (biome ci error)
    resolution: re-entered B-2; fixed via biome check --write; committed 2a1f2dd; lint now 0 errors
lint_gate_passed: true                # biome ci: 0 errors, 7 pre-existing warnings
last_commit_sha: 2a1f2dd
```

## Exit
Repo typecheck clean, lint gate green, no route/env deltas, one B-2 drift defect caught + resolved via stage re-entry. → B-5 Verify.
