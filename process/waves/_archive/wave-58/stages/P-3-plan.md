# P-3 — Plan (wave-58)
## Approach
Test-honesty fix in one E2E block. Convert the soft-check (delete-any-message.spec.ts:153-162) to a deterministic race-free hard assertion.
- **Kill the race:** before A deletes (before step 6/7 ~:130), ensure B's realtime is connected + subscribed to the channel room. Inspect how B's context establishes the socket/channel (the app's connection indicator, or a socket join-ack, or B's message-list populated + a ready signal). Add an await that confirms B is subscribed (a real ready gate, not just page-loaded — edge case).
- **Hard assert:** replace :153-162 with `await expect(pageB.getByText(bMessageMarker)).toBeHidden({ timeout })` (Playwright expect auto-retries within the bounded window) — gates the test. Remove the .catch(false) + console.log.
- Size the timeout so a working fan-out passes reliably but a broken one fails (not tight-flaky, not infinite).
- *Alternative considered:* keep the soft-check + only add logging — REJECTED (that's the anti-pattern; the AC requires a gating assertion).
## Data/API/deps: NONE (test-only).
## File-level steps
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| apps/web/e2e/delete-any-message.spec.ts | modify | add B-subscription ready-gate before A's delete; replace soft-check :153-162 with a bounded-retried hard expect on B's tombstone; remove .catch/console.log | test-automator | only |
## Specialist: test-automator (E2E/Playwright test authoring; AGENTS.md). Single serial edit. Runs on CI e2e job (Playwright bundled chromium).
## Self-consistency: every AC → the step. design_gap false. No production change. Clean.
## Note: the ready-gate is load-bearing (per problem-framer) — a shallow page-loaded wait leaves the race; must confirm B is actually SUBSCRIBED. B-6/head-tester verify the assertion genuinely gates (would fail without the fan-out).
