# Wave 9 — T-block review artifacts
**Block:** T · **Wave topic:** M2 invite-completion (revoke+8a+8b, LIVE) · **Gate:** T-9 · **Status:** in-progress
| Stage | Status | Notes |
|---|---|---|
| T-1 Static | done | CI lint/typecheck green (PR#19) |
| T-2 Unit | done | 196 tests (123 api: revoke-authz/revoked-404/8a-idempotent/8b-no-mint; 73 web) |
| T-3 Contract | done | POST /invites/:code/revoke; server.inviteCode in detail; shared types |
| T-4 Integration | done | revoke 401/preview 404 live (C-2); 8a backfill ran clean (0 rows) |
| T-5 E2E | done | CI playwright green (PR#19) |
| T-6 Layout | active | share modal permanent-default + revoke UI (per design) |
| T-7 Perf | skip | not heavy |
| T-8 Security | active | MANDATORY — the 4 P-4 conditions (revoke authz/revoked-404/8a-idempotent/8b-no-mint) |
| T-9 Journey | active | gate + minor journey update (revoke + permanent-default; same /invite surface) |
## Context: security gate APPLIES. Live: revoke 401, preview 404, server-detail 401 (invite_code member-gated). 4 T-8 conditions tested. FLAG→L: head-ci-cd added 4 CI-PRINCIPLES rules at C bypassing L-2/karen gate.
