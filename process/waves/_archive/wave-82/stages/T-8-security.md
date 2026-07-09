# Wave 82 — T-8 Security (live Playwright, prod)
```yaml
test_pattern: active
skipped: false
auto_promoted: false               # wave_type includes auth
applicable_probes: [auth_smoke, session, secret_grep]   # no new state-changing endpoint (CSRF n/a), no rate-limit change
auth_smoke:
  negative_wrong_password: PASS     # stayed /login, role=alert generic msg (no user-enumeration), NO session cookie granted
session_results:
  genuine_logout_redirects: PASS    # CRITICAL — logout → /login, sFrontToken cleared; post-logout /app → bounced to landing, STAYED OUT after 3s settle (fix does NOT strand logged-out user)
  httponly_confirmed: PASS          # sAccessToken/sRefreshToken absent from document.cookie → HttpOnly proven; only sFrontToken + st-last-access-token-update JS-visible
  secure_samesite: inferred         # HTTPS + SuperTokens defaults; raw Set-Cookie not readable via MCP (forbidden header)
secret_grep_findings: []            # clean — all "token" matches are docstring/identifier prose, no credential values
secret_exposure_live: none          # no password/token/api-key in DOM or console
fix_up_cycles: 0
findings:
  - {severity: LOW, category: housekeeping, description: "Fixture A account carries pre-existing test-data cruft (junk servers from prior runs); not created this wave; worth a cleanup pass"}
```
The genuine-logout guard — the one behavior the settle-then-recheck fix must NOT weaken — is verified LIVE: a real logout redirects and stays redirected. No auth-bypass, no session leak, no secret exposure.
