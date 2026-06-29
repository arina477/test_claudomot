# Wave 9 — T-8 Security (active — MANDATORY; revoke = access control). The 4 P-4 conditions:
```yaml
test_pattern: active
applicable_probes: [auth_smoke, access_control, secret_grep]
results:
  - "(1) revoke authz: POST /invites/:code/revoke — owner_id OR invites.created_by (server-side, userId from session, no IDOR); non-owner/non-creator → 403 (tested); unauthed → 401 (live). Permanent code → 404 (not ad-hoc)."
  - "(2) revoked → 404: after revoke, GET /invites/:code + POST /:code/join → 404 (wave-8 validateInviteActive throws on revoked; post-revoke preview-404 tested). Idempotent re-revoke (tested)."
  - "(3) 8a backfill: app-side randomBytes base64url + 23505 retry, idempotent WHERE NULL (re-run no-op). Ran clean on prod (0 rows). NOT pgcrypto/auto-migrate. (tested)"
  - "(4) 8b no-mint-on-open: InviteShareModal mints NO ad-hoc invite on plain open (regression-guard tested); permanent invite_code from member-gated findServerDetail; null fallback."
  - "Secret grep (wave-9 diff): clean."
findings:
  - {severity: info, category: invite-rotation, description: "permanent invite_code irrevocable (no rotation) — deferred follow-up d058283d (Gemini flag); 0 prod servers"}
  - {severity: info, category: invite-list, description: "limited-invites list session-scoped (no list-ad-hoc GET endpoint) — honest gap, not a defect"}
```
T-8 PASS: all 4 conditions verified (tests + live). No critical/high.
