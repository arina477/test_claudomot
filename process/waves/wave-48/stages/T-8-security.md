# T-8 — Security (wave-48) — CI-verified / light

**Skip rule (dispatcher):** T-8 skips on non-auth/non-payments/non-session waves. This wave adds no NEW auth/session/payment surface, BUT its deliverable is itself a security-hardening artifact (negative-case coverage of a privacy fence), so it is recorded light rather than a bare skip.

## Rationale — no NEW security surface to actively test
- The DM privacy fence (`who_can_dm` gate on `getDmCandidates`) was ACTIVELY pen-tested LIVE at **wave-47 T-8** and held. That is the security verification of record for the fence itself.
- This wave adds no new endpoint, guard, JWT/session lifecycle, RBAC rule, or rate-limit — nothing new to exploit. It adds NEGATIVE-CASE TEST COVERAGE of the already-verified fence, which HARDENS the security posture (a future regression that unhides a nobody-user or a disjoint user would now fail CI).
- IDOR/authz angle: `getDmCandidates` is scoped to the caller's own servers via `inArray(callerServerIds)`; test (b) is effectively an IDOR-style negative control (a user in a server the caller cannot see is NOT exposed) — asserted green. This is the "unauthorized principal does NOT get the resource" discipline, applied at the candidate-listing boundary.

No active pen-test spawned: there is no new attack surface and re-testing the wave-47-verified fence would be redundant. The regression coverage this wave adds is exactly what keeps that pen-test result durable.

```yaml
test_pattern: ci-verified
skipped_light: true
skip_reason: "no NEW auth/session/RBAC/rate-limit surface; privacy fence pen-tested live wave-47 T-8 (held). This wave adds negative-case regression coverage of that fence (security-hardening), CI-proven green."
prior_pentest_ref: "wave-47 T-8 — DM who_can_dm privacy fence actively pen-tested, held"
idor_negative_control: "test (b) — disjoint-server user NOT exposed to caller (inArray scope), green in CI"
findings: []
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-8
  reviewers: {}
  failed_checks: []
  rationale: >
    No new security surface — no new guard, session/JWT lifecycle, RBAC rule, or
    rate-limit. The privacy fence itself was actively pen-tested at wave-47 T-8
    and held; re-testing would be redundant. What this wave adds is negative-case
    regression coverage of that fence, including an IDOR-style control (a user in
    an unshared server is NOT exposed), CI-proven green. Recorded CI-verified/light
    with the wave-47 pen-test reference rather than a bare skip. No applicable
    check fails.
  next_action: PROCEED_TO_T-9
```
