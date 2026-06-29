# Wave 4 — T-9 Journey

## Phase 1 — head-tester gate verdict
**APPROVED** (fresh spawn). Verdict: `process/waves/wave-4/blocks/T/gate-verdict.md`.
T-block honest: integration runs vs real prod Postgres (not mocked); the dup-username 500→409 mock-the-SUT escape was caught + fix-forwarded (PR#11 + real-drizzle-duplicate test); T-8 asserts unauthorized paths (foreign-key→400, MIME→400, presign→503 graceful, server-controlled user-scoped key). Avatar real-upload E2E deferred — path built + secured + tracked (84e09891), not a hidden break.

## Phase 2 — journey regen (HTTP/code-level; browser crawl deferred c51589cd)
wave_type includes ui → regen REQUIRED. Browser crawl deferred (Playwright chrome-channel absent, tracked c51589cd); recorded at HTTP/code level instead.

### Live HTTP confirmation
- api `/health` → 200
- web `/` → 200
- web `/settings/profile` → 200

### Journey-map diff vs prior (v0.2 → v0.3)
- `/settings/profile`: wave-3 'coming soon' username/avatar/accent stubs → username + accent live (persist + render across shell); avatar presign 503-graceful.
- GET/PATCH /profile: extended to 4 fields, live-verified (set→200, dup→409, bad→400).
- App shell: avatar initials-fallback + accent CSS var render from /profile.
- Avatar real-upload round-trip: 🚫 Deferred (infra-blocked, 84e09891).
- No routes removed. No new top-level routes (settings-profile already inventoried as page #15).

### Coverage gaps / regressions
- No cross-wave regressions: F1 (signup→profile→app) intact; prior wave-3 surfaces (auth, profile display_name) unaffected.
- Avatar real-upload is an infra-blocked unverified link, NOT a regression — declared in spec ACs + tracked.

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
journey_regen_skip_reason: ""
crawl_routes_visited: 3          # HTTP-level (api/health, web /, web /settings/profile); browser crawl deferred c51589cd
regen_diff:
  routes_added: []              # settings-profile pre-existed (page #15); surface graduated stub->live
  routes_removed: []
  coverage_gaps: ["avatar real-upload round-trip — infra-blocked (84e09891), not user-reachable until bucket provisioned"]
scenarios_run: 0                # no user-scenarios/ directory
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: 9212a3e
findings:
  - {severity: info, journey: F1-profile, description: "avatar real-upload S3 round-trip unverified — Railway Bucket creds founder-pending, tracked 84e09891; path built+secured+503-graceful"}
  - {severity: low, journey: cross-cutting, description: "auth/profile endpoints unthrottled — tracked 839af17f (launch-blocker)"}
```
