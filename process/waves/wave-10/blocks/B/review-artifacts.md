# Wave 10 — B-block review artifacts (multi-spec, commit-per-spec; order RbacModule→overrides+guard∥owner-lockout→UI)
**Block:** B · **Wave topic:** M2 RBAC capstone · **Gate:** B-6 · **Status:** in-progress
| Stage | Status | Notes |
|---|---|---|
| B-0 | done | branch wave-10-m2-rbac; claimed 4 |
| B-0..B-2 | done | RBAC backend (173 tests); 6 security conditions |
| B-3 | done | roles UI (97 web) c258d49 |
| B-5 | done | full green ~270; pushed |
| B-6 | pending | gate |
## SECURITY CARRY (P-4, all server-side, T-8 heavy): RbacService.can() SERVER-SIDE everywhere (owner_id=superuser; default-DENY; userId from session no-IDOR); role/member mgmt permission-gated (NO self-promote — Member lacks manage_members); ChannelPermissionGuard reads ROUTE PARAMS only (no body-spoof); findServerDetail FILTERS channels server-side (no enumeration); private channel default-DENY; owner-lockout TRANSACTIONAL (concurrent demote+leave→owner remains). single-role-per-member #6; SMALL fixed flags (manage_server/roles/channels/members) NO matrix/builder. Table=channel_permission_overrides UNIQUE(channel_id,role_id)+INDEX(channel_id). Backfill app-side (NOT pgcrypto). RbacModule (decomposer-named) imported by/alongside ServersModule. Design: design/server-roles.html (NOT the old matrix tab). 5 B-3 a11y carry-forwards. Verified-prod-fixture 4a2ad286 critical for C-2/T-8 live-verify. PUSH after each stage.
