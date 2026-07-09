# Wave 84 — T-5 E2E (web smoke, live)
```yaml
test_pattern: active
results:
  app_loads_hardened: PASS      # landing, login, /app, server load, #general channel all render; composer works
  console_csp_errors: 0
  api_calls: "all 200 (no 4xx/5xx storm)"
findings:
  - {severity: LOW, category: cosmetic, description: "PWA manifest icon-192.png 404 (pre-existing, ticketed 024a1483)"}
```
Note: C-2 flagged a non-required e2e flake (delete-any-message.spec.ts, two-client realtime/auth-timing) — not wave-caused (Dockerfile change can't regress realtime); carried for next-wave attention.
