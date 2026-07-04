# Wave 47 — T-5 E2E (HEADLINE: DMs startable via picker UI)

**Block:** T · **Stage:** T-5 · **Pattern:** B (active — live Playwright against prod) · **Mode:** automatic
**Target:** web https://web-production-bce1a8.up.railway.app (merge 4db10675). Drove the ACTUAL Start-DM picker UI (NOT an API shortcut — the wave-46 lesson).

## HEADLINE VERDICT: DMs are STARTABLE end-to-end through the real UI = YES. The wave-46 unstartable dead-end is GONE.

## Testers
- Tester A (playwright-1, Fixture A) — headline startable flow + search/empty-state gap. 2 runs each. PASS.
- Tester B#1 (playwright-2, Fixture B) — BLOCKED by MCP profile-lock contention (shared Chrome-for-testing profile held by tester A's still-open session — correct per no-browser_close rule). Proved nothing.
- Tester B#2 (playwright-3, Fixture B) — BLOCKED, same profile-lock contention. Proved nothing.
- B-side "picker lists fixture A" gap closed at T-4 integration layer (B's GET /dm/candidates returned exactly A, self-excluded) rather than re-contending the MCP.

## Scenario verdict table (traces to seed 10967558 ACs)
| id | criterion | verdict | evidence |
|---|---|---|---|
| S1 | A logs in, reaches DM home (data-testid=dm-home) | PASS | dm-home rendered; profile @studyhallfixturea |
| S2 | A opens Start-DM picker via real affordance (start-dm-button) | PASS | modal role=dialog "Start a new direct message" opened |
| S3 | picker LISTS a real candidate (co-member B) — NOT an empty dead-end | PASS | 1 role=option "studyhall-e2e-fixture-b"; both runs |
| S4 | select candidate → chip + confirm enables | PASS | chip added; "Open DM" enabled |
| S5 | confirm → DM thread opens | PASS | modal closed; dm-thread rendered; POST /dm/conversations 200 (both runs, idempotent → same conv 5f62052f) |
| S6 | send message → appears with CORRECT author (F7: NOT "Unknown user") | PASS | message row author = studyhallfixturea; POST .../messages 200; "Unknown user" ABSENT page-wide both runs |
| S7 | search filter: matching query keeps candidate; nonsense query → "No people match" empty state | PASS | typing "studyhall" keeps B; "zzzznobody" → `No people match "zzzznobody"` |
| S8 | Escape closes picker (focus-trap) | PASS | picker removed from DOM on Esc |

All PASS across 2 runs — no FLAKE observed.

## F7 regression check: "Unknown user" NOT present anywhere (sent-message author resolves to fixture A). CLEAN.

## Findings (non-blocking, for V-2)
- 401 on GET /auth/session/refresh (background token-refresh probe; session stayed valid). Cosmetic/noise.
- 429 (rate-limited) on GET /dm/conversations/:id/messages polling reads under concurrent tester load. Send/create POSTs never rate-limited; user-visible flow unaffected. Worth a poll-cadence/backoff look. Read-path only.

```yaml
test_pattern: active
skipped: false
testers_spawned: 4
startable_via_ui: true
wave46_deadend_gone: true
f7_unknown_user_regression: false
scenarios:
  - {id: S1, criterion_ref: "reach DM home", verdict: PASS}
  - {id: S2, criterion_ref: "open picker via real UI affordance", verdict: PASS}
  - {id: S3, criterion_ref: "picker lists real candidate (AC-startable core)", verdict: PASS}
  - {id: S4, criterion_ref: "select candidate", verdict: PASS}
  - {id: S5, criterion_ref: "confirm opens thread (AC3)", verdict: PASS}
  - {id: S6, criterion_ref: "send msg correct author (F7)", verdict: PASS}
  - {id: S7, criterion_ref: "search filter + empty state (AC4)", verdict: PASS}
  - {id: S8, criterion_ref: "Esc closes picker", verdict: PASS}
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: low, scenario: "message polling", description: "429 rate-limit on GET messages polling under concurrent load; read-path only, send/create unaffected. Poll cadence/backoff worth review."}
  - {severity: info, scenario: "session refresh", description: "background 401 on /auth/session/refresh; session remained valid. Cosmetic."}
tester_contention_note: "playwright-2/3 BLOCKED on shared Chrome profile lock (harness contention, NOT a product defect). Coverage completed via playwright-1 + T-4 integration layer."
```
