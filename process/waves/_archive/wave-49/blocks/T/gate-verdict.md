# Wave 49 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, agentId head-tester-t9-wave49-attempt1)
**Reviewed against:** process/waves/wave-49/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

Coverage is honest and the load-bearing carries are genuinely evidenced, not asserted. The Pattern-A stages (T-1 static, T-2 unit, T-3 contract, T-4 integration) legitimately lean on CI: CI genuinely ran lint (`biome ci .`), typecheck (tsc project refs), 638 api + 397 web unit suites, and the 12-case real-Postgres integration suite against a provisioned PG16 service on the merge commit b2f2bec — and the integration layer earned its keep by surfacing the pause `ends_at` prod bug that units alone missed (real-DB, not mocked — the mock-the-SUT trap is avoided). The single-client-realtime trap — the whole feature's central risk — is explicitly recognized and avoided: T-5-tester-1 noted the shared Playwright-MCP Chromium profile = one cookie jar = one identity, and instead drove two ISOLATED browser contexts (Fixture A `21984eb2…` and Fixture B `da74148e…`) over two real WebSocket connections, capturing BOTH distinct userIds in the `/study-timer` presence payloads and ~253ms cross-user fan-out — genuine two-distinct-user delivery, not one client's own echo. The P-4 jenny carries both hold: (a) roster non-persistence is evidenced at T-4 (integration confirms zero rows written for join/leave — in-memory gateway Map) and re-confirmed live at T-5 (reload → roster reflects live viewers only while the timer resurrects from the server-anchored endsAt); (b) phase transition is a one-shot idempotent broadcast (T-2: `armAutoAdvance` one-shot + `doPhaseAdvance` guarded `WHERE ends_at=$expected`; T-4: guarded transition exercised), NOT a per-server loop — and deferring the wall-clock 25/5-min auto-advance to unit+integration is correct because it is not E2E-observable at fixed durations (the transport phase field was confirmed live). The IDOR carry is proven by a live pen-test that constructed the strongest case available: a genuine distinct non-member (B) reading A's REAL existing server with a live running timer → 403 with no payload leaked, all four mutations → 403, WS sessionless handshake → Unauthorized, WS non-member join → `join_error` with no state leak, all against positive controls that return 200 (proving the denials are authorization, not a blanket break), plus an empirically-verified anti-CSRF gate (cookie-only forged POST → 401, bearer isolation control → 200). Both findings are correctly non-blocking: F-1 (slim-bar phase indicator absent <1024px) is a real D-3-carry regression but narrow-viewport-only, deterministic, one-line CSS fix, with the core timer fully functional and every core AC PASS; F-2 (anti-CSRF implicit not explicit) is pre-existing project-wide, not wave-introduced, and non-exploitable (live behavior blocks forged POSTs). The T-7 perf skip is defensible for a modest diff adding a 1s widget interval and one socket namespace with no bundle or hot-path concern. No coverage/evidence gap exceeds the wave's risk budget.

## Rework instructions
(none — APPROVED)

### Cascade
- **Stages that must re-run:** none
- **Stages that stay untouched:** T-1, T-2, T-3, T-4, T-5, T-6, T-8 (T-7 skipped, defensible)

## Escalation
(none)

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
```
