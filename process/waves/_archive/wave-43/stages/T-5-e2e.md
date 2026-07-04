# Wave 43 — T-5 E2E (active — direct-playwright vs deployed prod)

Direct playwright-core (chromium-1208, MCP bypassed) as fixture A (organizer). Each key scenario run twice, zero flake.

## Scenario verdicts (deployed web)
| # | Scenario | Verdict | Evidence |
|---|---|---|---|
| S1 | Sign in → Schedule surface | PASS | /login→/app; Schedule tab in sidebar; date-grouped agenda + New-session |
| S2 | Create single session (recurrence None) | PASS | role=dialog aria-modal modal; session appears in agenda; no console/500 |
| S3 | Weekly recurrence | PASS | Weekly reveals "Repeat Until"; renders 5 occurrences across days, each Weekly chip |
| S4 | Detail + edit + delete | PASS | detail side-panel (organizer Edit/Delete); edit prefilled→save reflected; Delete→confirm dialog→removed |
| S5 | Validation (end before start) | PASS | calm inline "End time must be after start time" + aria-live, modal stays, no crash |
| S6 | No non-goals | PASS | zero reminders/RSVP/attendance/timezone/ICS/month-grid; recurrence One-off/Weekly only |

## Findings (non-blocking → V-2)
- **T5-F1 (LOW, a11y):** Esc closes the authoring modal but restores focus to BODY, not the "New session" trigger (WCAG 2.4.3, reproducible 3×). The mockup specced focus-restore; the impl misses it. B-3 minor fix.
- **T5-F2 (LOW cosmetic):** the SESSION DETAILS side panel isn't live-refreshed after an edit (agenda list IS correct; the open panel shows the pre-edit title until reopened). State-sync.
- **BLOCKED (not a defect):** student read-only view untestable (fixture A organizer everywhere, fixture B broken) → member-vs-organizer RBAC proven at T-4 real-PG.

## Health
CONSOLE_ERRORS [] + NET_FAILURES [] across all flows both runs. Only 4xx = pre-auth 401 /auth/session/refresh (expected).

```yaml
test_pattern: active
skipped: false
testers_spawned: 1
scenarios:
  - {id: S1, verdict: PASS}
  - {id: S2, verdict: PASS}
  - {id: S3, verdict: PASS}
  - {id: S4, verdict: PASS}
  - {id: S5, verdict: PASS}
  - {id: S6, verdict: PASS}
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: low, scenario: S4, description: "Esc restores focus to BODY not the trigger (WCAG 2.4.3)"}
  - {severity: low, scenario: S4, description: "detail panel not live-refreshed after edit (cosmetic state-sync)"}
```
