# Wave 5 — T-block review artifacts
**Block:** T · **Wave topic:** M1 hardening (rate-limit/avatar/version/node20/CI-E2E/branch-protect), live · **Gate:** T-9 · **Status:** in-progress
| Stage | Pattern | Status | Notes |
|---|---|---|---|
| T-1 Static | ci-verified | done | PR#12/#13/#14 lint+typecheck green (5 required checks) |
| T-2 Unit | ci-verified | done | 94 tests (57 api incl. rate-limit/version/avatar-size; 37 web) |
| T-3 Contract | ci+live | done | /health version (now 0.0.1 real); no new contracts |
| T-4 Integration | active(live) | done | rate-limit + version live; avatar code (pending bucket) |
| T-5 E2E | active | done | **the new CI Playwright chromium job (c51589cd) ran + PASSED in PR#12 CI — closes the waves-1/3/4 browser-E2E gap.** Smoke: / + /login render. |
| T-6 Layout | n/a | skipped | no UI change (hardening) |
| T-7 Perf | n/a | skipped | not heavy |
| T-8 Security | active | pending | MANDATORY — rate-limit (429 LIVE-verified) + avatar upload surface |
| T-9 Journey | active | pending | gate |
## Context
- Security-tightened gate APPLIES (rate-limit) → T-8 mandatory. Rate-limit 429 LIVE-verified (200×10→429). Avatar real-upload pending founder creds (84e09891). Branch-protection active. 3 C-block fix-forwards (version-path outage recovered, rate-limit trust-proxy).
