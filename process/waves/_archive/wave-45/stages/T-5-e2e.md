# T-5 — E2E (wave-45) — ACCEPTANCE PROOF for 67881a58

**Block:** T (Test) · **Stage:** T-5 · **Pattern:** B (active-execution) · **Mode:** automatic
**Wave:** 45 — M8 tech-debt HYGIENE. Primary claimed: 67881a58 (Playwright runner → bundled chromium).

## Acceptance criterion (from spec 67881a58)
The E2E runner must launch on the BUNDLED Playwright chromium via the canonical entry (`pnpm --filter @studyhall/web e2e` / bare `npx playwright test`) WITHOUT the old manual `executablePath` bypass and WITHOUT a "channel chrome / executable doesn't exist" error — including when a broken ambient `PLAYWRIGHT_BROWSERS_PATH` is present. The suite must then actually run.

## Test-execution method (why direct runner, not MCP tester swarm)
The deliverable under test is the **test runner's browser-resolution config** (`playwright.config.ts` `channel: undefined` x3 + config-level `PLAYWRIGHT_BROWSERS_PATH` override). The only faithful acceptance test is to invoke the FIXED runner itself and observe the launch — a `ui-comprehensive-tester` MCP swarm exercises the SEPARATE `.mcp.json --browser chromium` path and would NOT prove the `pnpm e2e` / `playwright test` config-resolution fix. Head-tester therefore ran the canonical runner directly against the live Railway deploy. No `browser_close` on any MCP instance (none used).

## Test conditions (the exact broken state the fix targets)
- Ambient `PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright` was SET in the shell (the broken value the fix must neutralise).
- Bundled chromium present at `~/.cache/ms-playwright/chromium-1208` + `chromium-1228`.
- NO `executablePath` anywhere in the repo (`grep -rn executablePath` → 0 non-node_modules matches).
- Live deploy: https://web-production-bce1a8.up.railway.app (C-2 verified SUCCESS, health 200).

## Runs

### Run 1 — chromium-smoke (unauthenticated)
`pnpm --filter @studyhall/web e2e --project=chromium-smoke` → **exit 0**, 2 passed (1.7s):
- ✓ `/` landing page renders (500ms)
- ✓ `/login` login form renders with email field (775ms)
Browser LAUNCHED on bundled chromium despite ambient broken PLAYWRIGHT_BROWSERS_PATH. No channel/executable error, no bypass. **Fix confirmed working.**

### Run 2 — full suite (setup + smoke + authed, Fixture-A + Fixture-B)
`pnpm --filter @studyhall/web e2e` (all 3 projects) → **exit 0**, 5 passed (14.8s):
- ✓ [setup] authenticate fixture via /login (1.5s)
- ✓ [chromium-smoke] `/` landing renders (520ms)
- ✓ [chromium-smoke] `/login` form renders (742ms)
- ✓ [chromium-authed] create-server: authenticated user creates a server and sees #general (1.3s)
- ✓ [chromium-authed] delete-any-message: moderator (A) can delete any message; non-moderator (B) cannot delete A's message; B sees fan-out tombstone (12.4s)

All 5 launched + ran on bundled chromium. `retries: 1` configured; no rerun needed (no flakes this run).

## Scenario verdict table
| id | criterion_ref | verdict | evidence |
|---|---|---|---|
| S1 | 67881a58 runner-launches-bundled-chromium | PASS | Run 1+2 exit 0, browser launched with broken ambient env, no bypass |
| S2 | smoke: landing + login render | PASS | 2/2 smoke green |
| S3 | authed: create-server → #general | PASS | create-server.spec green |
| S4 | authed RBAC: mod-delete affordance visible to A (moderator) | PASS | delete-any spec step 6 hard-assert toBeVisible |
| S5 | authed IDOR: mod-delete affordance HIDDEN from non-mod B | PASS | delete-any spec step 8 hard-assert toBeHidden |
| S6 | 2-client fan-out: B sees message:deleted tombstone | SOFT/UNPROVEN | Run 2 logged NOT_DELIVERED_IN_WINDOW; spec passes regardless → F2 (pre-existing wave-44 debt, out of wave-45 scope) |
| S7 | useTyping typing-label renders behavior-identical | NOT REACHED | No typing scenario in the existing spec set; biome change is byte-identical (T-1/T-2 review + CI green cover it). Not a wave-45 blocker. |

## Findings
- **F2 (medium, test-honesty debt, carried):** delete-any-message.spec.ts step 7 two-client fan-out is a soft-check (logs + passes regardless of delivery; observed NOT_DELIVERED_IN_WINDOW this run). This is the single-client-realtime anti-pattern for the delete fan-out path specifically. PRE-EXISTING wave-44 code, OUT OF wave-45 scope (wave-45 = runner fix). RBAC/IDOR portions of the same spec are hard-asserted and green. Backend fan-out proven at wave-41 T-4/T-8. Surfaced to V-2; recommend deterministic fan-out assertion (await joinChannel ack) in a future test-hardening wave. Head-tester does NOT block wave-45 on it.

## Footer

```yaml
test_pattern: active
skipped: false
testers_spawned: 0
test_execution: "canonical fixed runner (pnpm --filter @studyhall/web e2e) run directly by head-tester against live deploy — MCP swarm would test the wrong browser path"
scenarios:
  - {id: S1, criterion_ref: "67881a58 runner-launches-bundled-chromium", verdict: PASS, evidence_path: "T-5 Run1+Run2 exit 0 (this file)"}
  - {id: S2, criterion_ref: "smoke landing+login", verdict: PASS, evidence_path: "Run1 chromium-smoke 2 passed"}
  - {id: S3, criterion_ref: "authed create-server", verdict: PASS, evidence_path: "Run2 create-server.spec green"}
  - {id: S4, criterion_ref: "RBAC mod-delete visible to A", verdict: PASS, evidence_path: "delete-any step6 hard-assert"}
  - {id: S5, criterion_ref: "IDOR mod-delete hidden from B", verdict: PASS, evidence_path: "delete-any step8 hard-assert"}
  - {id: S6, criterion_ref: "2-client delete fan-out", verdict: SOFT-UNPROVEN, evidence_path: "Run2 log NOT_DELIVERED_IN_WINDOW → F2"}
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: medium, scenario: S6, description: "F2 — 2-client fan-out soft-check (pre-existing wave-44 debt, out of wave-45 scope); RBAC/IDOR portions hard-asserted green; backend proven wave-41."}
```

head_signoff:
  verdict: APPROVED
  stage: T-5
  reviewers: {}
  failed_checks: []
  rationale: "ACCEPTANCE PROOF MET. The fixed canonical runner (pnpm --filter @studyhall/web e2e) launched bundled chromium and ran the full suite 5/5 green against the live deploy — WITH the broken ambient PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright present, NO executablePath bypass anywhere, NO channel/executable-not-found error. The config-level override + channel:undefined neutralised the broken ambient var exactly as designed. Two runs (smoke-only + full-authed) both exit 0. One carried finding (F2, medium): the delete-any spec's 2-client fan-out step is a soft-check that logged NOT_DELIVERED — genuine test-honesty debt, but PRE-EXISTING wave-44 code outside wave-45's runner-fix scope; the spec's RBAC/IDOR assertions are hard and green. Surfaced to V-2, not a wave-45 blocker. No flakes, 0 fix-up cycles."
  next_action: PROCEED_TO_T-6
