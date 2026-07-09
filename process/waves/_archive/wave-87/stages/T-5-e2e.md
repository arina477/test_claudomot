# Wave 87 — T-5 E2E (SKIPPED)
No user-visible behavior change. A member joining a server sees identical behavior whether their role_id is NULL or the all-false default 'Member' role (RBAC resolves both to base-member; verified at P-0/P-4). Nothing new renders or flows differently, so there is no E2E surface to exercise for this wave.

Note (carried to findings-aggregate for V-2): the pre-existing non-required `e2e` CI check failed on both #107 and #108 — `delete-any-message.spec.ts:53` Server-rail sign-in visibility timeout (25s), CI-PRINCIPLES rule-11 prod-baseURL sign-in flake class. Non-blocking (e2e is not branch-protection-required) and unrelated to wave-87. Surfaced for V-2 triage.
```yaml
skipped: true
reason: no user-visible behavior change (behavior-preserving data-hygiene)
findings:
  - {severity: low, boundary: "e2e/delete-any-message.spec.ts:53", description: "pre-existing non-required e2e sign-in visibility timeout flake (rule-11 class); unrelated to wave-87; non-blocking"}
```
