# Wave 10 — T-8 Security (active — MANDATORY; RBAC = access-control CORE). The 6 conditions:
```yaml
test_pattern: active
applicable_probes: [access_control, auth_smoke, secret_grep]
results:
  - "(1) can() SERVER-SIDE + default-DENY: owner_id superuser; else role flag; no role/membership/flag → false; userId from session (no IDOR). Gates all role/channel/member mgmt. Tested (rbac.service.spec)."
  - "(2) no self-promote: assignRole requires can(manage_members); Member → 403 (controller+service). Live: 401 unauthed. Tested."
  - "(3) ChannelPermissionGuard ROUTE-PARAMS only: reads req.params (channel/server), NOT body → body-spoof rejected (test proves route-param wins). Live: 401 unauthed."
  - "(4) channel-list SERVER-side filter: findServerDetail → getVisibleChannelIds → non-visible channels ABSENT (no enumeration). Tested (not.toContain hidden/private)."
  - "(5) private channel DEFAULT-DENY: canViewChannel denies private unless override can_view=true. Tested both directions."
  - "(6) owner-lockout TRANSACTIONAL: demote/remove/leave SELECT FOR UPDATE + last-owner 409; concurrent-demote race serialized. Tested (race modelled)."
  - "Secret grep (wave-10 diff): clean."
findings:
  - {severity: info, category: test-fixture, description: "403-non-permitted not live-probed (no verified prod fixture; 0 prod servers) → ESCALATION-CRITICAL 4a2ad286 (4 waves running); covered by 270 tests + 6 conditions"}
```
T-8 PASS: the access-control core — all 6 conditions tested + 401 boundary live. No critical/high. (403-path live-verify gated on the verified-fixture.)
