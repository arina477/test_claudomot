# Wave 75 — T-5 E2E

**Pattern B — Active-execution.** Live upgrade flow against LIVE prod (web-production-bce1a8), authenticated as Fixture A (userId 21984eb2-…, owns 646 servers), driven through the REAL UI affordance (not an API shortcut — test-principle #27). Playwright MCP (playwright-1); browser NOT closed (rule 5).

## Test-artifact hygiene
Created two throwaway servers owned by Fixture A for isolation (so the shared proof server ad62cd12, where Fixture B is a co-member, is never mutated):
- `37a55026-1d2d-4d0f-8e3a-466712e2ae2f` (wave75-t5-ui-throwaway) — the UI upgrade flow target.
- `0c8192da-8a78-4c12-9aae-934329b9f8ba` (wave75-t8-throwaway) — API-level matrix + T-8 negative paths.
Both deleted/reverted at block end (see Cleanup, T-8 deliverable).

## Scenarios (1:1 with P-2 acceptance criteria)

| # | Criterion | Route/action | Verdict | Evidence |
|---|---|---|---|---|
| S1 | "Your plan" panel shows current tier + limits | Select throwaway server → Server settings (aria "Server settings — Overview") → panel "Your plan" / "Server plan & limits" | **PASS** | Rendered: CURRENT PLAN "Free", Storage "2 GB", Educator tools; SWITCH PLAN radios Free(current)/Server Pro $8/mo/School $99/mo; brain-set reference prices shown. Screenshot wave75-t5-your-plan-panel-free.png |
| S2 | **M9 SUCCESS METRIC** — upgrade free→server_pro via mock checkout; displayed tier+limits refresh to server_pro IMMEDIATELY | Select "Server Pro" radio → click "Switch plan (test mode — no charge)" | **PASS** | Panel refreshed with NO reload: CURRENT PLAN "Server Pro", Storage "50 GB", Concurrent voice "50", radio now "Server Pro(current)". 0 console errors. Screenshot wave75-t5-your-plan-panel-serverpro-after-upgrade.png |
| S3 | Mock-checkout label visible (no real charge) | Read disclosure | **PASS** | "Switch plan (test mode — no charge)" button label + disclosure "This is a test checkout — StudyHall does not charge your card and no payment is taken. Prices are shown for reference only." |
| S4 | Persistence survives close+reopen (test-principle #29) | Close Settings → reopen Server settings | **PASS** | Reopened panel still shows "Server Pro / 50 GB / voice 50" — reconcile-from-server persisted, no revert to stale free. |
| S5 | Tier change persists at data layer | (API cross-check) re-read GET /billing/plan | **PASS** | Live GET /billing/plan returned tier server_pro after the UI upgrade path (see T-3). |

## Success-metric result (headline)
**free → server_pro took effect IMMEDIATELY in the UI** — the "Your plan" panel's displayed tier flipped Free→Server Pro and limits 2 GB→50 GB / voice→50 in-place after the mock checkout, verified LIVE in prod, and survived a full close+reopen. Mock-checkout disclosure clearly present (no real charge). This is the M9 milestone success metric, met.

## Fix-up cycles
0. No FAIL/BLOCKED scenarios.

## Findings
- none blocking. (Note: single Playwright instance used rather than a 3-5 swarm — the flow is a single linear per-server surface with no partitionable parallel scenarios; full criterion coverage achieved single-instance. Recorded as a methodology note, not a coverage gap.)

```yaml
test_pattern: active
skipped: false
testers_spawned: 1     # single-instance; linear single-surface flow, no partitionable scenarios
scenarios:
  - {id: S1, criterion_ref: "your-plan panel shows tier+limits", verdict: PASS, evidence_path: wave75-t5-your-plan-panel-free.png}
  - {id: S2, criterion_ref: "M9 success metric: free->server_pro immediate refresh", verdict: PASS, evidence_path: wave75-t5-your-plan-panel-serverpro-after-upgrade.png}
  - {id: S3, criterion_ref: "mock-checkout label visible / no real charge", verdict: PASS, evidence_path: "disclosure text captured"}
  - {id: S4, criterion_ref: "persistence survives close+reopen", verdict: PASS, evidence_path: "reopened panel = Server Pro/50GB/voice50"}
  - {id: S5, criterion_ref: "tier persists at data layer", verdict: PASS, evidence_path: "GET /billing/plan = server_pro"}
flakes_observed: []
fix_up_cycles: 0
findings: []
success_metric_immediate_refresh: PASS
```
