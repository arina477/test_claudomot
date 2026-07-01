# Wave 28 — T-4 Integration

**Pattern A (CI-verified).** Real-Postgres integration tier ran in the CI `test` job (postgres:16 service + `DATABASE_URL_TEST` set at job env level).

## Action 1 — Pattern determination
CI `.github/workflows/*.yml` `test` job: `services: postgres:16`, `env: DATABASE_URL_TEST=postgres://test:test@localhost:5432/studyhall_test`, runs `pnpm test:ci` = `vitest run && vitest run --config vitest.integration.config.ts`. -> Pattern A.

## Action 2 — CI-RULE-5 FALSE-GREEN CHECK (the load-bearing audit)
The integration spec `test/integration/invite-code-rotate.spec.ts` is gated `describe.skipIf(SKIP)` where `SKIP = !process.env.DATABASE_URL_TEST`. A green-but-zero-executed suite (DATABASE_URL_TEST unset -> whole describe skipped) would be a FALSE-GREEN. **Verified against the actual CI test-job log (run 28532913181): all 7 rotate integration cases EXECUTED with nonzero real durations — NOT skipped:**

- returns a new invite_code that differs from the initial code (AC1) — 54ms
- old permanent code no longer resolves via getInvitePreview after rotate (AC2) — 44ms
- old permanent code no longer admits members via joinViaInvite after rotate (AC2) — 46ms
- new code resolves getInvitePreview after rotate (AC3) — 57ms
- new code admits a new member via joinViaInvite after rotate (AC3) — 49ms
- throws ForbiddenException (403) when a non-owner member calls rotate (AC4) — 103ms
- throws NotFoundException (404) for a non-existent serverId (AC5) — 43ms

The DB is NOT mocked (real Postgres 16 service; `sut = new ServersService(...)` hits real `db`). These durations confirm real query round-trips, defeating the skip-on-missing-DATABASE_URL_TEST false-green.

## Action 3/4 — Boundary coverage
| Boundary | Integration coverage |
|---|---|
| rotate UPDATE writes servers.invite_code in place | AC1 (new != seeded 'initial-perm-code-aaa') |
| old-code invalidation across BOTH resolution paths | AC2 (getInvitePreview 404 + joinViaInvite NotFoundException) — proves the leaked-link-dead security claim end-to-end via the real resolvers, not a mock |
| new-code admits | AC3 (getInvitePreview 200 + joinViaInvite success -> serverId) |
| owner-ONLY authz at the service boundary | AC4 (non-owner member -> ForbiddenException) — deterministic, DB-seeded owner+member |
| missing server | AC5 (NotFoundException) |

Old-vs-new invalidation is proven against the real join/preview resolvers (T-2's unit test correctly delegates the "differs from old" real contract here rather than asserting a never-persisting mock).

## Deliverable
```yaml
test_pattern: ci-verified
skipped: false
boundaries_audited: [rotate-update-in-place, old-code-invalidation-both-resolvers, new-code-admits, owner-only-authz, missing-server]
ci_evidence:
  - "CI test job run 28532913181: 7 invite-code-rotate.spec.ts cases EXECUTED (54/44/46/57/49/103/43ms) vs real postgres:16 — CI-rule-5 nonzero-count verified, no false-green"
infrastructure_gap_recorded: false
findings: []
```
