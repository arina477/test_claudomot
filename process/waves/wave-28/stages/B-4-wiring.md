# Wave 28 — B-4 Wiring

## Actions
- **Action 1 — Repo typecheck:** `pnpm typecheck` → 4/4 successful, 0 errors. No contract drift (single-spec, no cross-boundary type).
- **Action 2 — Route registration:** the new `POST /servers/:id/invite-code/rotate` is a method on `ServersController`, which is already registered in `ServersModule` (NestJS auto-registers controller route methods). No new module/provider. No client caller (backend-only; no SDK/query-hook). Verified route present at `servers.controller.ts:95`.
- **Action 3 — Env wiring:** no new env vars (B-0 added none). Skip.
- **Action 4 — Import sanity:** covered by typecheck (0 errors); no orphan imports.
- **Build:** `pnpm build` → 3/3 successful.
- **Lint (BUILD rule 7):** `pnpm lint` (`biome ci .`) initially surfaced **3 errors** — pure formatter/import-sort drift in 2 wave-28 files (`test/integration/invite-code-rotate.spec.ts`, `servers.controller.spec.ts`). Classified as a **B-2 BUILD-rule-7 miss** (node-specialist did not run `biome check --write` before commit). Remediated with the deterministic `biome check --write` on those 2 files only (no logic change), commit `f78552c`. Re-run → **0 errors**, exit 0. The 7 remaining warnings are pre-existing non-wave-28 files (`useTyping.ts`, `multiPageCatchup.test.ts`) — non-fatal for `biome ci` (warnings ≠ errors), not a wave-28 regression.

```yaml
typecheck_passed: true
routes_registered: ["POST /servers/:id/invite-code/rotate (ServersController, auto-registered)"]
env_vars_wired: []
drift_defects: []   # no type drift; the format miss was a mechanical B-2 hygiene defect, remediated by deterministic formatter (flagged for B-6)
build_passed: true
lint_passed: true   # after formatter fixup f78552c
```

## Flag for B-6 head-builder
B-2 (node-specialist) committed 2 unformatted spec files → BUILD rule 7 (local `biome check` before commit) was not applied. Remediated deterministically at B-4. Recurrence of the wave-25/26 formatter-drift pattern (already promoted as BUILD rule 7 + CI rule 4); no re-promotion needed. head-builder to note the hygiene miss in the B-6 verdict.

## Exit
Typecheck + build + lint all green (after formatter fixup). Route registered. → B-5 Verify.
