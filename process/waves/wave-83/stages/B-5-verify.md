# Wave 83 — B-5 Verify (CI-identical)
- `pnpm --filter @studyhall/api test` (unit): 820/820 pass + security-headers.spec.ts 10/10.
- `tsc --noEmit`: exit 0.
- `pnpm biome ci apps packages`: clean (2 import-order auto-fixes applied by B-2).
- `/simplify`: no changes (already minimal).
- Note: 28 integration specs fail locally on ECONNREFUSED :5433 (no local Postgres) — they skip/pass in CI where the `test` job runs postgres:16 + pg-harness with DATABASE_URL_TEST set. The NEW security-headers spec is DB-free (app.listen(0)+fetch) so it runs everywhere.
verify_status: green (DB-free new spec + unit + typecheck + biome)
flakes_documented: []
