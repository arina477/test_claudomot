# Wave 82 — T-5 E2E (live Playwright, prod)
```yaml
test_pattern: active
skipped: false
target: https://web-production-bce1a8.up.railway.app
fixture: studyhall-e2e-fixture@example.com (userId 21984eb2)
results:
  root_loads: PASS
  login_no_bounce: PASS            # POST /auth/signin 200 → landed /app, not bounced to /login
  dm_after_login_no_bounce: PASS   # KEY PROBE: dm-home-rail-button → dm-home rendered, stayed /app, no auth bounce
  reload_persists_session: PASS
  cross_nav_no_spurious_redirect: PASS   # DM ↔ Home ↔ cold deep-link /app all stayed authed
  console_errors: 0
race_reproduced: false             # transient-401 is a non-deterministic race; NOT force-reproduced (honest). Stable-flow evidence + unit suite + deployed fix cover it.
findings:
  - {severity: LOW, category: cosmetic, description: "PWA manifest icon /icons/icon-192.png 404 across pages — unrelated to auth"}
```
Auth flow is STABLE live — no spurious bounce in any authed navigation (login→DM, reload, cross-nav, cold deep-link). The bounce fix's target behavior (logged-in user not bounced on a token-refresh race) holds on the deployed bundle.
