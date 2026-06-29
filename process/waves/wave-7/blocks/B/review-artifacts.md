# Wave 7 — B-block review artifacts (multi-spec, commit-per-spec) [REBUILD post-restart]
**Block:** B · **Wave topic:** M2 servers/channels/membership · **Gate:** B-6 · **Status:** in-progress
| Stage | Status | Notes |
|---|---|---|
| B-0..B-2 | done | backend rebuilt+pushed (79 api tests) |
| B-3 | done | frontend (54 web tests) 9e94819 |
| B-5 | done | full suite green; pushed |
| B-6 | pending | gate |
| B-3 | pending | frontend (after D-block redo) |
## CARRY (P-4): build shared BEFORE api; AuthGuard for create; channels.is_private in migration; atomic create-server txn; member-scoping server-side; NO real-time; owner-only. /api/v1 NOT applied (existing /me+/profile bare paths — match them, don't break live routes). Designs: design/create-server.html (re-scope to single-step) + server-rail-sidebar.html (regen).
