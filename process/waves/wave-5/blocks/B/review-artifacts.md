# Wave 5 — B-block review artifacts (multi-spec, commit-per-spec)
**Block:** B · **Wave topic:** M1 hardening (rate-limit/avatar/version/node20/branch-protect/CI-E2E) · **Gate:** B-6 · **Status:** in-progress
| Stage | Status | Notes |
|---|---|---|
| B-0 | in-progress | branch+deps+claim 6; branch-protection ops; avatar creds when founder provides |
| B-1..B-6 | pending | per-spec; rate-limit middleware-ordering load-bearing; avatar cred-gated |
## Context
- claimed [839af17f, 84e09891, e38c306e, a7667fb7, 478e9d43, c51589cd]. commit-per-spec.
- CARRY (P-4): rate-limit must front SuperTokens /auth (global guard/Express limiter before ST middleware); test-automator→ui-comprehensive-tester+devops; ci.yml node-20+E2E coordinate; avatar needs founder Railway Bucket creds (pending); branch-protection via gh API.
