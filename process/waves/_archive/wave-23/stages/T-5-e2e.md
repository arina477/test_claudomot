# Wave 23 — T-5 E2E

**Pattern:** B (active). 2 ui-comprehensive-tester instances against LIVE prod (web-production-bce1a8, api-production-b93e). No browser_close called.

## Scenario verdicts
| # | Criterion (spec) | Verdict | Evidence |
|---|---|---|---|
| A3 | GET /servers/:serverId/me/permissions live (edbdea8f) | **PASS** (2x identical) | Tester A via real SuperTokens signin: owner→200 `{owner:true,...,manage_assignments:true}`; **IDOR-safe** (`?userId=<other>` ignored, returns caller's own); unauth→401; non-member→403; member-non-owner→200 all-false (CTA correctly hidden). evidence-T5-A/ |
| A1 | Owner sees New Assignment CTA (edbdea8f) | BLOCKED (infra) | Playwright chrome-absent; indirect: live prod bundle `/assets/index-CjCuO_OW.js` contains `me/permissions` + `New Assignment` + `manage_assignments` → B-3 gate code deployed + current |
| A2 | CTA opens create form | BLOCKED (infra) | same |
| B1 | Role editor shows "Manage Assignments" checkbox (8aa67564) | BLOCKED (infra) | same chrome-absent; app healthy (/login 200) |
| B2 | Checkbox toggleable + role create round-trips | BLOCKED (infra) | same |

## The blocker (recurring known infra, NOT an app defect)
Every Playwright MCP instance (playwright-1..10) is pinned to the branded Google Chrome channel (`/opt/google/chrome/chrome`), which is not installed + cannot be installed (no root). The Playwright-bundled chromium-1228 IS present but the MCP fleet was started without `--browser chromium`. **This is task `67881a58` (Playwright chrome-absent) — a documented cross-wave carry (w16 M-1, w22 F22-T-5, now w23).** Not a wave-23 regression; blocks the entire visual E2E layer project-wide. Per T-5 discipline: BLOCKED ≠ FAIL.

## Assessment
The wave's CORE behavior — the /me/permissions authz boundary (the whole point of edbdea8f) — is **live-verified against prod via HTTP** (all 5 authz edges correct incl IDOR-safety + the new manage_assignments flag on the wire). The visual CTA/role-editor render is unverified by browser but: (a) the gate code is confirmed in the deployed bundle, (b) it's unit-tested (web 216 incl the non-owner-with-manage_assignments-sees-CTA test), (c) B-6 /review adversarially traced it. The BLOCKED visual scenarios are an infra gap, not an app risk.

## Findings (→ V-2)
- **F23-T-5 (Low, non-blocking, recurring):** Playwright chrome-absent blocks visual E2E (task 67881a58; 3rd+ wave). Host-side fix: `npx playwright install chrome` OR start the MCP fleet with `--browser chromium` (bundled chromium-1228 is present). Escalate to founder digest — this now recurs every UI wave and blocks the visual test layer.

```yaml
test_pattern: active
skipped: false
testers_spawned: 2
scenarios:
  - {id: A3, criterion_ref: "edbdea8f /me/permissions", verdict: PASS, evidence_path: process/waves/wave-23/stages/evidence-T5-A/}
  - {id: A1, criterion_ref: "edbdea8f CTA visible", verdict: BLOCKED, evidence_path: "deployed-bundle-string-match (indirect)"}
  - {id: A2, criterion_ref: "edbdea8f CTA opens form", verdict: BLOCKED, evidence_path: n/a}
  - {id: B1, criterion_ref: "8aa67564 role-editor checkbox", verdict: BLOCKED, evidence_path: n/a}
  - {id: B2, criterion_ref: "8aa67564 checkbox toggle", verdict: BLOCKED, evidence_path: n/a}
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: Low, scenario: "visual E2E (A1/A2/B1/B2)", description: "BLOCKED by Playwright chrome-absent infra (task 67881a58, recurring w16/w22/w23). Core authz behavior live-verified via HTTP (A3 PASS). Host-side harness fix needed; founder-digest escalation."}
```

## Exit
Core authz boundary LIVE-verified (A3 PASS); visual scenarios BLOCKED by known chrome-absent infra (67881a58, non-blocking, escalated). No FAIL. → T-6.
