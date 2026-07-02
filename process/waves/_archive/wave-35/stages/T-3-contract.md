# Wave 35 — T-3 Contract (Pattern A — ci-verified)
New API contracts this wave: GET/PUT /profile/privacy, GET /profile/data + /export. Shared Zod contracts (PrivacySettingsResponseSchema, UpdatePrivacySchema, AccountDataResponseSchema) typecheck-green in CI + consumed by both api + web (single source of truth). **No dedicated contract tests added** for the new endpoints (request/response schema round-trip, 400-on-invalid-enum). Live contract behavior confirmed at C-2 (401 on unauth, routes registered) + will be probed at T-8. Finding (coverage-gap) recorded.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["shared Zod typecheck green", "C-2 route smoke: /profile/privacy + /profile/data 401 (registered)"]
findings: [{severity: MEDIUM, location: "/profile/privacy + /profile/data contracts", description: "no automated contract test; enum-400 path untested by CI"}]
