# Wave 37 — T-block review artifacts
**Block:** T · **Wave topic:** persistent in-app notifications (model + owner-404 API + web bell/panel) · **Gate:** T-9 · **Status:** in-progress
| Stage | Pattern | Status | Notes |
|---|---|---|---|
| T-1 | ci-verified | done | lint+typecheck green |
| T-2 | ci-verified | done | api 521 + web 333 units green in CI |
| T-3 | ci-verified | done | controller.spec method-drift + contract tests ran |
| T-4 | ci-verified | done | **notifications-authz integration RAN in CI (6 tests, 0 skipped, real-DB latencies) — owner-404 + dedup** |
| T-5 | active | pending | bell/panel e2e |
| T-6 | active | pending | bell + panel layout |
| T-7 | — | skipped | not heavy |
| T-8 | active | pending | owner-404 IDOR (CI-proven + live 401) |
| T-9 | active | pending | gate + journey regen (add /me/notifications + bell/panel) |
- live: web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app
