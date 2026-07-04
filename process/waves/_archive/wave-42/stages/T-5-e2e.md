# Wave 42 — T-5 E2E (active — direct-playwright vs deployed prod)

**Infra note:** the Playwright MCP is channel-pinned to a missing /opt chrome; bypassed via a direct playwright-core Node script with explicit executablePath to bundled chromium-1208 (the non-privileged path). `.mcp.json` also patched with `--browser chromium` for future sessions (takes effect on next MCP spawn).

## Scenario verdicts (fixture A, deployed https://web-production-bce1a8.up.railway.app)
| # | Scenario | Verdict | Evidence |
|---|---|---|---|
| S1 | Sign in as A → /app | PASS | /login rendered, creds accepted, redirect /app, no console errors |
| S2 | Student submit + own-card + edit-resubmit (UI) | **BLOCKED (single-account)** / backend PASS live | A owns all 376 servers → student "Your Work" form never renders for A; fixture B broken. Backend verified LIVE via API: POST /assignments/:id/submit → 200 real record; resubmit kept SAME submission id (in-place), refreshed submittedAt, reset returnedAt→null + cleared organizerComment (resubmit-clears-return LIVE) |
| S3 | Educator roster + Return dialog a11y | PASS | empty state ("No submissions yet") + populated roster ("Awaiting Return") render; Return dialog role=dialog aria-modal aria-labelledby, focus moves in, **Esc closes + restores focus to trigger**; Mark Returned → emerald "RETURNED" badge; acknowledgement note only, no grade |
| S4 | No grade/score/rubric anywhere | PASS | zero matches grade/score/rubric/points/marks across create/card/roster/own-card/return dialog; model = submittedAt/returnedAt/organizerComment only |
| S5 | Panel renders | PASS | via S3/S4 |

## Health
No JS console errors in authed flows. One transient 429 from a diagnostic loop over 376 servers (rate-limiter working as intended, no user-flow impact). Pre-auth 401 /auth/session/refresh expected.

## Findings
- **T5-F1 (LOW):** student-side "Your Work" submit + "Edit submission" BUTTON rendering is UI-uncovered — strictly the single-account/organizer-everywhere + broken-fixture-B constraint, NOT an app defect. Backend submit + resubmit-clears-return proven LIVE (API) + at T-4 (integration). Compensating: restore a non-organizer fixture (tracked: task c50f3040).
- **T5-F2 (infra, LOW → L-2):** Playwright MCP channel-pinned to missing chrome; direct-playwright executablePath bypass is the working non-privileged path. `.mcp.json` patched for future.

```yaml
test_pattern: active
skipped: false
testers_spawned: 3
scenarios:
  - {id: S1, criterion_ref: "signin", verdict: PASS, evidence_path: process/waves/wave-42/stages/T-5-tester-direct.md}
  - {id: S2, criterion_ref: "student submit+edit (seed AC1-4)", verdict: BLOCKED-UI-backend-PASS, evidence_path: process/waves/wave-42/stages/T-5-tester-direct.md}
  - {id: S3, criterion_ref: "roster+return (roster AC + return AC)", verdict: PASS, evidence_path: process/waves/wave-42/stages/T-5-tester-direct.md}
  - {id: S4, criterion_ref: "no grading (seed AC6, return AC5)", verdict: PASS, evidence_path: process/waves/wave-42/stages/T-5-tester-direct.md}
  - {id: S5, criterion_ref: "panel render", verdict: PASS, evidence_path: process/waves/wave-42/stages/T-5-tester-direct.md}
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: low, scenario: S2, description: "student submit-button UI uncovered (single-account/broken-fixture-B); backend proven live+T-4"}
  - {severity: low, scenario: infra, description: "Playwright MCP chrome-channel broken; direct-playwright bypass used; .mcp.json patched"}
```
