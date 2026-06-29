# Wave 10 — B-6 Review (gate) — APPROVE
## Phase 1 — head-builder APPROVED: all 6 RBAC security conditions VERIFIED in code (not prose) + each tested:
1. can() server-side+default-DENY (owner superuser; deny at every branch; userId from session no-IDOR).
2. no-self-promote (manage_members in controller+service; Member→403).
3. ChannelPermissionGuard route-params-only (body-spoof rejected; test proves route-param wins).
4. channel-list server-filter via getVisibleChannelIds (non-visible ABSENT; tested not.toContain).
5. private default-DENY (canViewChannel; tested both directions).
6. owner-lockout transactional (db.transaction + SELECT FOR UPDATE + 409; concurrent-race modelled).
Schema: 4 fixed flags (no matrix), UNIQUE+INDEX, role_id FK; migration 0004 no-auto-migrate; #6 single-role; RbacModule in ServersModule; v6b-thinned scope. de-flake e312ce9 = proper waitFor. 270 tests. Commit-per-spec OK.
## Phase 2 — secret-grep clean.
```yaml
phase1_head_builder_verdict: APPROVED
final_verdict: APPROVE
