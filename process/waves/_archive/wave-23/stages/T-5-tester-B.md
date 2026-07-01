# T-5 E2E — Tester B — wave-23 (delegated assignment-organizer authz)

**Target:** LIVE prod web = https://web-production-bce1a8.up.railway.app
**Spec:** 8aa67564 — role-editor grantability of the `manage_assignments` permission (end-to-end capability)
**Fixture:** `studyhall-e2e-fixture@example.com` (verified prod fixture, server owner of "Fixture Proof Server" ad62cd12)
**Date:** 2026-07-01
**Browser harness:** Playwright MCP (attempted instances: playwright-1, -2, -3, -5, -7, -10)

---

## OUTCOME: BLOCKED (all scenarios) — browser harness unavailable, NOT an app defect

Every Playwright MCP instance in this environment fails to launch a browser. All six probed instances return the identical error on the very first `browser_navigate` call:

```
Error: async initializeServer: Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome
Run "npx playwright install chrome"
```

No browser context ever opened, so no UI scenario could be exercised. Per T-5 discipline (broken fixture/harness → BLOCKED, not FAIL) this is reported as BLOCKED. I did NOT attempt to fix the infra (installing Chrome / reconfiguring the MCP is out of scope and would be a discipline violation). No `browser_close` was ever called (no context existed).

### Root cause (diagnostic only — not a fix)
- The Playwright MCP servers are configured to launch the **branded Google Chrome channel** (`channel: "chrome"`), which resolves to `/opt/google/chrome/chrome`. That binary is **not installed** in this environment (`ls /opt/google/chrome/chrome` → No such file or directory; `which chromium chromium-browser google-chrome` → all absent).
- The Playwright-**bundled** Chromium IS present and valid: `~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome` (and chromium-1208). The MCP config ignores it because it pins the `chrome` channel rather than the default bundled chromium.
- Fix path is upstream (host-side): either `npx playwright install chrome`, install Google Chrome at `/opt/google/chrome/chrome`, or reconfigure the MCP servers to use bundled chromium (drop `--channel chrome` / set `channel: chromium`). This is a shared-tooling change, not an app change — owned by whoever provisions the tester-swarm MCP fleet.

### App is healthy at the HTTP layer (blocker is the harness, not the deploy)
Verified via curl so BLOCKED is unambiguously "harness down," not "app down":
- `GET /login` → **HTTP 200**, 888 bytes, 0.13s; HTML shell `<title>StudyHall</title>`
- `GET /` → **HTTP 200**
The prod SPA shell is being served correctly. The app was NOT reachable for interactive testing only because no browser could be launched.

---

## Per-scenario verdict table

| # | Scenario | Verdict | Evidence |
|---|----------|---------|----------|
| 1 | Role editor exposes "Manage Assignments" permission (Server settings → Roles → create/edit role form; assert 5th checkbox alongside Manage Server/Roles/Channels/Members) | **BLOCKED** | No browser context could open; identical Chrome-not-found error on first navigate across all instances. UI never rendered — permission list could not be inspected. |
| 2 | "Manage Assignments" checkbox is toggleable; create throwaway role `wave23-e2e-check` with manage_assignments ON, confirm round-trip | **BLOCKED** | Same — no UI reachable. Throwaway role was NOT created (see cleanup note). |
| 3 | (if feasible) Grant reflects in effective permissions | **BLOCKED** | Not reached — depends on scenarios 1-2. |
| 4 | Run scenarios 1-2 at least twice (flake detection) | **BLOCKED** | Not runnable. Flake status is N/A — the failure is a deterministic harness config error (identical across 6 instances, first call), not app flake. |

---

## Answers to the required questions

- **Does "Manage Assignments" appear in the role permission list?** — **UNDETERMINED.** Could not be verified through the UI because the browser harness never launched. The wave's backend/frontend commits (B-1..B-3 on this branch) suggest the label should be present, but this tester provides NO UI evidence either way. Requires a re-run once the harness is fixed.
- **Console errors?** — **N/A.** No page ever loaded; `browser_console_messages` was never reachable.
- **Network evidence per scenario?** — **N/A** for the app UI. The only network evidence gathered is the out-of-band curl HTTP-layer health check above (200 on `/` and `/login`).
- **Screenshots?** — **None captured.** `browser_take_screenshot` requires an open context, which never existed.

---

## Throwaway test data created (cleanup)
**None.** No role, server, or other data was created in prod. The intended throwaway role `wave23-e2e-check` was NOT created because scenario 2 could not run. Nothing to clean up.

---

## Recommendation to the T-block head (head-tester)
1. **Do not read this as a manage_assignments PASS or FAIL** — it is a harness BLOCKED with zero UI coverage of spec 8aa67564.
2. **Fix the tester-swarm browser harness** (host-side, one of): `npx playwright install chrome`, or point the Playwright MCP fleet at the already-installed bundled chromium at `~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`. This blocks ALL Playwright-based T-5 testers, not just this one — treat as an infra blocker affecting the whole E2E layer.
3. **Re-run scenarios 1-4 after the fix.** Prod app is up (HTTP 200), fixture creds are valid on file, so a re-run should proceed cleanly once a browser can launch.
