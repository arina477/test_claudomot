# Wave 87 — B-5 Verify

- **Lint (Action 1):** `biome check --write` on both changed files → clean, no fixes applied.
- **Unit tests (Action 2):** `pnpm --filter @studyhall/api test` → **828/828 pass** (48 files). Includes 7 new servers.service.spec.ts cases (73→80 in that file) covering the 5 ACs across both join paths + both invite branches. node-specialist ran a **load-bearing check**: reverting the production role_id stamp turned AC1/AC2/AC3 red (5 failures) while AC4 (re-join, behavior unchanged) stayed green — confirming the assertions are real regression tripwires, not coverage theater (addresses the wave-86 not-a-real-tripwire lesson).
- **Build (Action 3):** `pnpm --filter @studyhall/api build` (nest build) → exit 0.
- **Dev-server smoke (Action 4):** service-internal change, no new route/UI. Endpoint-level join smoke (authenticated join against a live server/invite) deferred to the T-block (T-3 integration / T-4 E2E) which exercises the real endpoint authoritatively. Pre-push signal (unit + typecheck + build) all green.

```yaml
lint_passed: true
unit_tests_passed: true      # 828/828
build_passed: true
dev_smoke_passed: deferred-to-T-block   # service-internal; no new route/UI
flakes_documented: []
```
