# Wave 24 — T-8 Security
**SKIPPED (active probes)** — wave_type does not modify production auth/session/RBAC code; it ADDS test coverage of the existing authz boundary (the rbac-assignments-authz integration spec IS the regression coverage). The authz boundary was live-verified at wave-23 T-8 (penetration-tester full truth-table); this wave hardens the regression net, not the surface. No new auth flow/endpoint/secret to probe.
**Action 5 secret-grep (ALWAYS runs):** 0 matches on the diff (test code only; no credentials).
```yaml
test_pattern: skipped-active-probes
skipped: true
skip_reason: "no production auth-code change; wave ADDS authz test coverage (rbac-authz integration spec). authz surface T-8'd live at wave-23."
auto_promoted: false
applicable_probes: [secret_grep]
secret_grep_findings: []
findings: []
```
