# Wave 26 — B-5 Verify

## Action 1 — Lint (biome check)
`pnpm lint` (= `biome ci .`): **0 errors, 7 warnings, exit 0** (after the B-4 `process/**` ignore fix). The 7 warnings are pre-existing noNonNullAssertion (`warn` severity — useTyping.ts / multiPageCatchup.test.ts), unrelated to this wave. `biome check --write` applied by specialists on touched files.

## Action 2 — Unit tests
- **WEB** (`pnpm --filter @studyhall/web test`): **249 passed / 16 files** (216 baseline + 15 presence-dots + assignments.test now 22 after clock-mock fix). One pre-existing timing flake fired once (`assignments.test "reverts optimistic update if PUT fails"` console-noise / a timing-sensitive case) → re-ran, 16/16 files green → documented flake, proceed (B-5 protocol).
- **API** (`pnpm --filter @studyhall/api test`): **395 passed / 395** (no api change this wave).

## Action 3 — Build
`pnpm -w turbo run build` → **3/3 successful** (@studyhall/shared, @studyhall/api, @studyhall/web). Web bundle builds with the new PresenceDot.

## Action 4 — Dev-server smoke
Headless equivalent: the presence-dots.test.tsx renders MessageList + MemberListPanel with the live-store presence flip (online→offline), unknown-author degrade, and the member-panel regression — the exact user-visible behavior. No new route/page. Live E2E deferred to T-5 (the T-5 bundled-chromium rule makes it verifiable on prod post-deploy).

```yaml
lint_passed: true                     # biome ci 0 errors
unit_tests_passed: true               # web 249, api 395
build_passed: true                    # turbo 3/3
dev_smoke_passed: true                # component-test equivalent (no new route)
flakes_documented:
  - {file: apps/web/src/shell/assignments.test.tsx, note: "one timing-sensitive optimistic-toggle case flaked once, green on re-run; NOT the clock-mock (that's deterministic now)"}
pre_existing_repairs_verified: [biome process/** ignore, assignments clock-mock fa6c9e6]
last_commit_sha: fa6c9e6
```

## Exit
Lint 0 errors, web+api unit green, build 3/3, smoke covered. Two pre-existing main-CI-red defects repaired + verified. → B-6 Review.
