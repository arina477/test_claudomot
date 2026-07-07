# Wave 77 — B-2 Backend
Specialist: backend-developer. 2 per-spec commits.
- **10a68f9e (dfd2a87):** self-API academic fields — UsersService.updateProfile persists them (partial-PATCH); GET/PATCH /profile return/validate via UpdateProfileSchema; SessionNoVerifyGuard + 409 preserved; controller specs (round-trip + enum-reject 400).
- **bf0ad2a8 (a01253d):** cross-server profile-view — `ProfileVisibilityService.resolve` FAIL-CLOSED (missing/deleted_at/isBlockedBetween-bidirectional→hidden; self→visible; PROFILE_VISIBILITY branch [everyone→visible / server-members→shared-server-EXISTS mirroring dm.service NOT listServerMembers / nobody→hidden]; unknown→hidden). GET /profile/:userId (SessionNoVerifyGuard) → PublicProfile (NO email) on visible, uniform 404 on all hidden (no info-leak); viewer-id from session (no IDOR). BlocksModule imported. Integration matrix (13 cases) authored.

## Verify
- **Unit 811/811 green (47 files).** Biome clean. /simplify: no changes (crown-jewel resolver is lean + correct; explicit gate order + comments load-bearing). karen P-4 nits honored (PROFILE_VISIBILITY imported not re-declared; dm.service idiom mirrored). PublicProfile excludes email (confirmed + asserted).
```yaml
skipped: false
specialists_spawned: [backend-developer]
files_implemented: [users.service.ts, profile.controller.ts, profile-visibility.service.ts, profile.module.ts, +profile.controller.spec, +profile-visibility.integration.spec]
deviations:
  - {change: "integration matrix authored but NOT run locally (no Postgres server, only client binaries; install needs root — correctly NOT routed to founder)", adjudication: "ACCEPTED — the 13-case security matrix RUNS in CI (postgres:16) in THIS wave's PR (authoritative validation before merge); carry to C-1"}
  - {change: "rebuilt @studyhall/shared dist (stale)", adjudication: "ACCEPTED — carry to C-1 (turbo orders shared first)"}
  - {change: "commit-2 supersedes commit-1's profile.controller (2-arg ctor); each commit compiles+tests-pass at its revision", adjudication: "ACCEPTED — interleaved-file per-spec split"}
simplify_applied: true
