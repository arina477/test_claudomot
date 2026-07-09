# Wave 87 — T-8 Security (SKIPPED — with reason)
Skipped: this is NOT an auth/payments/sessions/CSRF/rate-limit change. The wave stamps the server's existing all-permission-flags-false default 'Member' role onto new members. Verified at P-0/P-4 (problem-framer + karen + jenny) and B-6 (head-builder): a member with the all-false default role has the IDENTICAL permission surface as a former NULL-role member — RBAC resolves both to implicit base member. No privilege escalation is possible (the default role grants nothing NULL didn't); management/moderation routes still default-deny. wave_touches ∩ {auth, payments, sessions, csrf, rate-limit, user-creation} = ∅, so the P-4 security-scope-tightened gate did not fire either. No new attack surface.
```yaml
skipped: true
reason: not-a-security-change (behavior-preserving; all-false default role == NULL at RBAC layer; no privilege delta); verified P-0/P-4/B-6
privilege_escalation_check: "default 'Member' role has all flags false — cannot grant more than NULL; confirmed no escalation"
findings: []
```
