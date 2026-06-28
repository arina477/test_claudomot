# Wave 1 — T-5 E2E (active — partial: browser-blocked, covered by component tests + live serve)

Live-browser Playwright swarm could NOT run: the Playwright MCP requires the Google 'chrome' channel binary (/opt/google/chrome/chrome), absent in this environment (chromium-headless-shell installs but the MCP doesn't use it; Google Chrome can't be installed in the sandbox). Environment/tooling limitation, NOT a product defect.

Acceptance-criteria coverage achieved without the browser swarm:
- AC2 (api GET /health → 200 {status:ok,service,version}): VERIFIED live — curl https://api-production-b93e.up.railway.app/health → 200 exact body.
- AC3 (dark shell: server rail + channel sidebar + main column): VERIFIED by CI RTL test AppShell.test.tsx (renders + asserts the 3 columns) + live SPA serve (web 200, 216KB bundle 200).
- AC4 (ConnectionStateIndicator online/reconnecting/offline): VERIFIED by CI RTL test (all 3 states asserted, role=status/aria-live).
- AC5 (responsive collapse <1024 / all columns ≥1280): code-verified (lg: breakpoint classes) + RTL; live-browser viewport check is the gap.
- Live deployment serves the SPA HTML + hashed JS bundle (both 200) — the app loads.

```yaml
test_pattern: active-partial
skipped: false
testers_spawned: 0
scenarios:
  - {id: ac2-health, criterion_ref: AC2, verdict: PASS, evidence: "curl /health 200"}
  - {id: ac3-shell, criterion_ref: AC3, verdict: PASS, evidence: "RTL AppShell.test.tsx (CI green) + live SPA serve"}
  - {id: ac4-connstate, criterion_ref: AC4, verdict: PASS, evidence: "RTL ConnectionStateIndicator 3-state test (CI green)"}
  - {id: ac5-responsive, criterion_ref: AC5, verdict: PARTIAL, evidence: "code + RTL; live-browser viewport unverified (MCP chrome-channel absent)"}
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: low, scenario: live-browser-e2e, description: "Playwright MCP needs the 'chrome' channel binary (unavailable in sandbox); live-browser E2E/viewport checks could not run. Covered by RTL component tests + live HTTP serve. Forward to V-2/infra — consider a CI-based Playwright job (chromium) for future UI waves."}
```
