# T-5 — E2E (wave-78)

**Pattern:** B — Active-execution. Playwright tester swarm (`ui-comprehensive-tester`) against deployed prod (merge 855e811). Fixture A (studyhall-e2e-fixture, verified prod account). NEVER browser_close (rule 5) — browser contexts left open.

## Scenarios (1:1 with acceptance criteria)

| id | criterion_ref | scenario | verdict | evidence |
|---|---|---|---|---|
| S1 | 4be3b084 — clear academicRole round-trips | Login → /settings/profile → set concrete role, save → select "Not specified", save → full reload confirms cleared | **PASS** | tester a550c009 |
| S2 | 3b3530d8 — member card renders | Login → open "Fixture Proof Server" → channel → click member row → card renders | **PASS** | tester a9de1356 |

## S1 — Clear academicRole (PASS)
Editor at `/settings/profile`, native `<select id="academic-role">` (label "Academic role"; options "Not specified"[value ""], Student, Educator, Staff; button "Save academic identity").
- Set **Student** → `PATCH /profile {…,academicRole:"student"}` → **200**; full reload confirms "Student" persists (save path live).
- Select **"Not specified"** → `PATCH /profile` body observed: `{…,"academicRole":null}` — a genuine JSON **null** (not `""`, not omitted) → **200**, response echoes `academicRole:null`.
- **Full page reload** (`page.goto`, not in-place): select value `""`, text "Not specified", selectedIndex 0 → genuinely cleared, not stale (test-writing-principles #29 — survives close+reopen).
- Server-side corroboration: `GET /profile` → 200, `academicRole:null`.
- **Restore:** tester set academicRole back to **Educator** + save → 200; reload confirms "Educator". (Double-confirms the API-level restore from T-3.)
- Console: 0 errors from the select/save/reload path.

## S2 — Member card renders (PASS)
Opened "Fixture Proof Server" → channel → member roster `<aside data-testid="member-list-panel">` with 2 rows (Fixture A [online] + studyhall-e2e-fixture-b [offline, userId da74148e-132e-4faf-a526-a34c28e7481b]).
- Clicked Fixture A's row → `[data-testid="member-profile-card"]` role="dialog" rendered in **LOADED** state. Verbatim text: `Fixture A` / `ACADEMIC ROLE` / `Educator`. Not the hidden state.
- `GET /profile/21984eb2-…` fired on open → **200** (consistent with LOADED).
- **Escape** → card `[data-testid="member-profile-card"]` unmounted from DOM cleanly.
- Console: 0 errors (1 benign non-error warning).

## Fix-up cycles
0. Both scenarios passed first successful execution. (S2 required a re-dispatch after an infra block — see findings; that is NOT an app fix-up cycle.)

## Findings
- **INFRA (medium, for V-2 / infra):** The Playwright MCP fleet shares one Chrome-for-testing profile dir (`mcp-chrome-for-testing-51e10da`) across instances without `--isolated`; a parallel 2-instance swarm (playwright-1 ∥ playwright-2) had playwright-2 blocked ("Browser is already in use … use --isolated"). Worked around by running S2 sequentially on playwright-1. Not an app defect. Recommend `--isolated` (or per-instance `--user-data-dir`) so T-5 swarms can run truly parallel.
- **PROD CRUFT (low, observational):** Fixture A's server rail holds ~714 servers, mostly leftover `E2E <timestamp>` / `M3 Verify` test fixtures accumulated across waves. Not a wave-78 defect; the createServer test path (no DELETE on servers) accumulates cruft. Flag for a future cleanup task.

```yaml
test_pattern: active
skipped: false
testers_spawned: 3
scenarios:
  - {id: S1, criterion_ref: 4be3b084, verdict: PASS, evidence_path: "tester a550c009 (inline)"}
  - {id: S2, criterion_ref: 3b3530d8, verdict: PASS, evidence_path: "tester a9de1356 (inline)"}
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: medium, scenario: "T-5 harness", description: "Playwright MCP instances share one Chrome profile without --isolated; parallel swarm partially blocked. Infra, not app. Ran S2 sequentially."}
  - {severity: low, scenario: "prod fixture state", description: "Fixture A server rail ~714 test-fixture servers (E2E/M3 leftovers, no server-DELETE path). Not this wave; cleanup candidate."}
```
