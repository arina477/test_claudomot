# Wave 29 — T-8 Security (SKIPPED)

**Skip reason:** NO auth/session/payment/CSRF/rate-limit/user-creation surface touched this wave. displayName resolution is a display-string fallback on an ALREADY-authorized read path (`GET /servers/:id/members` retains its existing AuthGuard + member-gate + 401/403 doors, wire unchanged — nothing in this wave altered the authz boundary). The deleted `ServerMembersResponseSchema` was unused dead code, never wired to any endpoint, so its removal changes no auth/validation surface. No new IDOR vector, no new token/session lifecycle, no new mutating endpoint. (Contrast wave-28, which WAS an auth wave — invite-code rotation authz — and correctly FIRED T-8 with a live authorization matrix.)

The empty-string→userId fallback is not a security concern: it never widens access, never leaks a foreign identity (userId is the caller/member's own id from the joined row), and does not change what data the endpoint returns beyond a non-empty display label.

```yaml
test_pattern: n/a
skipped: true
skip_reason: "No auth/session/payment/CSRF/rate-limit surface; displayName is a display-string fallback on an unchanged-authz read path; deleted schema was unused."
findings: []
```
