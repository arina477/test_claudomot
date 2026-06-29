# Wave 5 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn)
**Reviewed against:** process/waves/wave-5/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
Every claimed closure was independently re-verified live, not taken on assertion. The headline security AC (839af17f) is real: my own burst of 14 rapid `POST /auth/signin` returned `400×10` (under-limit, processed) then `429×4` — the ~10/min limit fires exactly at the boundary — while a 12-request `/health` control stayed `200×12` (unthrottled), confirming the in-memory sliding-window keys on the real client IP behind Railway's proxy (the wave-2/wave-4 launch-blocker is genuinely CLOSED). `/health` live reports `version: 0.0.1`, the real package version (e38c306e closed; not the stale `0.1.0` literal). The CI Playwright chromium job (c51589cd) is an honest closure of the waves-1/3/4 browser-E2E gap, not theater: `gh run view` shows the `e2e` job concluded `success` alongside all 5 other jobs in the live CI run; the smoke spec installs chromium and drives the live Railway web URL, asserting `status<400` plus visible DOM on `/` and `/login` using role/label/type queries (no `getByTestId`) — shallow-but-real coverage that would fail on a broken shell. T-1/T-2/T-3 are CI-verified (94 tests incl. rate-limit sliding-window, version, avatar-size; PRs #12-14 green, 5 required checks). T-6/T-7 skips are justified (hardening wave, no UI/perf surface). The avatar live-upload deferral (84e09891) is acceptable: server-side 2MB (confirm-time HEAD→413), MIME allowlist, and caller-scoped key are code+unit verified and secrets-clean; only the live PUT is founder-credential-gated, with graceful 503 until creds arrive. T-8 (mandatory, security-tightened) is adequate: rate-limit live, avatar secured, secret-grep clean, no critical/high. One test-honesty gap to record for L: the version-path outage (PR#13) was a dist-vs-src `package.json` resolution failure that the src-run unit test did NOT catch — only live `/health` exposed it; the regression is now guarded live, but the unit layer has a blind spot for compiled-dist runtime behavior worth a BUILD/test-principle note. This does not block the gate (the behavior is now live-verified and guarded) but must reach L-2.

## Phase 2 — Journey-regen skip evaluation
**journey_regen_skipped: true.** All three Action-2 skip conditions hold: `wave_type: multi-spec` (no `ui`/`heavy`); `design_gap_flag: false` and D-block did not fire (no `design/<feature>.html` canonicalized); no B-3 Frontend stage ran and the only `apps/web/` diff touches are the Playwright test harness + config (smoke.spec.ts, playwright.config.ts, vite/tsconfig, package.json) — zero frontend feature/route change. The wave's new live behavior is server-side only (rate-limit 429, version field); no new routes or screens. Prior wave-4 `command-center/artifacts/user-journey-map.md` remains canonical. No `user-scenarios/` directory → scenario smoke n/a. Cross-wave regression check skipped per Action 2.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
