# Wave 10 — P-block review artifacts
**Block:** P · **Wave topic:** M2 RBAC/roles (the access-control capstone) · **Gate:** P-4 · **Status:** in-progress
| Stage | Deliverable | Status |
|---|---|---|
| P-0 | stages/P-0-frame.md | done (PROCEED; heavy T-8 access-control flags; design TRUE; verified-fixture critical) |
| P-1 | done (multi-spec, whole chain; security→P-2) |
| P-2 | done (4-block; RBAC data model + 6 access-control ACs) |
| P-3 | done (RbacModule + can() + guard + owner-lockout-txn + UI; D-delta) |
| P-4 | pending | |
## Context
- wave_db_id abe06365 (wave 10); M2 41e61975. claimed [35f191f4 RbacModule(seed), 2c927c44 channel-perm-overrides, 7a10f13d owner-lockout, 0b9bcf35 role-mgmt-UI]. multi-spec (~3000-3800 LOC). UI wave → D-block. Closes M2 success metric "see the right channels PER ROLE".
- SECURITY-CRITICAL: RBAC is the access-control core. role_id already a nullable scaffold on server_members (wave-7). RbacService.can() gates actions; ChannelPermissionGuard gates channel access. Owner-lockout: last-owner invariant (can't demote/remove/leave the last owner).
- BOARD-bound: this was wave-10's mandated seed. CARRY (wave-9 L obs-3): verified-prod-fixture 4a2ad286 ESCALATION-CRITICAL for B-block (3rd+ authed wave w/o live-verify fixture; RBAC authed paths need live verification). Autonomous mode: automatic. PUSH after each B/D stage.
