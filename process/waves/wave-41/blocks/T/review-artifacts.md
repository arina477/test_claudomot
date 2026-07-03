# Wave 41 — T-block review artifacts
**Block:** T (Test) · **Wave topic:** Educator role + light moderation · **Block exit gate:** T-9 · **Status:** in-progress
| Stage | Deliverable | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | stages/T-1-static.md | ci-verified | done | biome+tsc green (merge 5a5f79a→c032720) |
| T-2 | stages/T-2-unit.md | ci-verified | done | 551 api + 354 web tests pass in CI |
| T-3 | stages/T-3-contract.md | ci-verified | done | moderation endpoints + rbac contract (controller specs) |
| T-4 | stages/T-4-integration.md | ci-verified | done | moderation.integration real-PG (rank guard, timeout, can()) |
| T-5 | stages/T-5-e2e.md | active | pending | live moderation UI flow |
| T-6 | stages/T-6-layout.md | active | pending | moderation UI layout |
| T-7 | stages/T-7-perf.md | — | SKIP | not heavy |
| T-8 | stages/T-8-security.md | active | pending | CRITICAL: moderation authz live (rank guard, mute-gate, delete-any, non-mod 403) |
| T-9 | stages/T-9-journey.md | active | pending | map moderation surfaces + gate |
## Block-specific context
- **wave_type:** ui, auth (moderation authz)
- **Stages skipped:** T-7 (not heavy)
- **B-6/head-builder carry:** send-gate behavioral tests added at B-6 fix-up (createMessage + createReply mute-gate); T-8 re-verifies live.
## Findings aggregation
process/waves/wave-41/blocks/T/findings-aggregate.md
## Gate verdict log
<appended by head-tester at T-9>
