# Wave 3 — T-9 Journey (gate)
## Phase 1 — head-tester: APPROVED
Honest auth-frontend suite. T-1/2 27/27 (DOM/form asserts, CI-green); T-3 live Zod contract; T-4 live (signup→users row, /me-200-unverified, /profile GET+PATCH against real Postgres); T-8 caught+fixed a real HIGH (PATCH 502→400) + CSRF active + verify-exemption scoped to /me+/profile (global REQUIRED fail-closed intact) + secrets clean. T-5/T-6 browser deferral acceptable (chrome-channel tooling limit; CI chromium c51589cd; covered by RTL + live HTTP). T-7 skip justified. Caught+closed 3 real defects this wave.
## Phase 2 — journey regen (HTTP/code-level; browser crawl deferred)
Updated user-journey-map.md: /login,/signup,/forgot-password(+reset),/verify-email,/settings/profile + verify-banner now LIVE; first-run signup→verify→profile→app-home wired (curl-verified). Live-browser crawl deferred → CI chromium job c51589cd. No user-scenarios/ → scenario smoke n/a.
```yaml
phase1_head_tester_verdict: APPROVED
journey_regen_skipped: false
journey_regen_method: http-code-level (browser crawl deferred to c51589cd)
crawl_routes_visited: 0
scenarios_run: 0
findings:
  - {severity: low, journey: browser-e2e, description: "full click-through E2E deferred to CI chromium job c51589cd"}
process_deviation: "final T-8 fix (eed4c3c) pushed directly to main, bypassing PR gate — flag for L/retro"
```
