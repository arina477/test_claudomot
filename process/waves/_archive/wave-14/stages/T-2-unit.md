# T-2 — Unit (wave-14)

**Block:** T · **Stage:** T-2 · **Layer:** Pure-function + module unit tests · **Pattern:** A (CI-verified) + GAP-fill · **Mode:** automatic

## Purpose
Confirm unit tests green on merge commit; audit unit coverage of the new presence surface. GAP FOUND + CLOSED this stage.

## Action 1 — CI evidence
C-1 `verdict_evidence`: **test** job PASS, 50s, run 28423127013 (Vitest unit + integration). Baseline was 351 tests across the suite at B-5 (per C-1 note). The presence modules' own unit coverage, however, was ZERO at merge (see Action 2).

## Action 2 — Coverage audit (the gap)
Modules touched (from B-2 backend): `apps/api/src/presence/presence.service.ts`, `apps/api/src/presence/presence.gateway.ts`, `packages/shared/src/presence.ts`.

**GAP (F-1, severity HIGH→closed):** The 351-test baseline PREDATES presence. `presence.service.ts` and `presence.gateway.ts` shipped with ZERO co-located unit tests (`find … -name '*.spec.ts' | grep presence` returned empty pre-wave). The ref-count multi-tab logic, typing TTL/throttle, and co-member scoping — the wave's load-bearing pure logic — had no isolated unit coverage. Per test-writing-principles §11 (every new service method needs happy + error path), this is a coverage gap.

**Closure:** Spawned test-automator to ADD unit tests mirroring `messaging.gateway.spec.ts` / `messages.service.spec.ts` style. Added **31 tests** (15 service + 16 gateway):
- presence.service.spec.ts: ref-count 0→1 online, →0 offline, 2-tabs-no-flap, close-1-of-2-stays-online, disconnect-unknown-user guard, isOnline-never-connected; typing TTL auto-expire (fake timers), self-excluded from getTypers, throttle/timer-reset (one entry, callback fires exactly once), stopTyping cancels timer (no double-fire), no-op on empty channel; co-member resolution (others sharing ≥1 server, self-excluded, de-duplicated, []-on-no-servers, distinct server_ids).
- presence.gateway.spec.ts: afterInit installs WS-auth middleware; join_channel/typing:start canViewChannelById gate; leave_channel; typing:stop; the H-1 disconnect-clears-typing path.

`db` (drizzle) mocked at the module boundary only; PresenceService never mocked (not the SUT-mock anti-pattern). Mocks/timers reset in afterEach.

**handleConnection deliberately NOT unit-tested** (test-automator flagged it integration-shaped: direct db users-lookup + async socket.join loop + snapshot emit). Honest scope boundary — covered at T-4 integration / T-8 two-client instead, NOT faked green with mock-call asserts.

**Result:** `pnpm --filter @studyhall/api test -- presence` → 251 passed, 0 failed (17 files).

## Action 2b — Mutation sanity (head-tester gate check: "can a test fail on a real bug?")
Mutated `connect()` to `wentOnline = true` (breaks no-flap invariant). presence.service.spec.ts case 2 (2-tabs-no-flap) FAILED exactly as expected:
```
expect(wentOnline).toBe(false)  →  Received: true  (presence.service.spec.ts:101)
```
Source restored; re-ran clean → 251 passed. The suite proves a real invariant, not coverage trivia.

## Action 3 — Flake observation
C-1: `fix_up_cycles: 0`, `rebase_cycles: 0`, no flake re-runs. New presence unit tests use fake timers (deterministic) — no real-clock flake surface. **0 new flakes.**

## Action 4 — Discipline note
- Unit tests for in-memory realtime state MUST use `vi.useFakeTimers()` for TTL paths — real timers make TTL tests flaky/slow. Candidate T-2 principle if it recurs.
- Pattern: gateways with direct `db` access in lifecycle hooks (handleConnection) are integration-shaped; unit-test the message handlers + delegate lifecycle coverage to integration. Recurring across messaging + presence gateways.

```yaml
test_pattern: ci-verified
skipped: false
evidence:
  - "C-1 test job: run 28423127013 PASS (50s)"
  - "Added presence unit suite: pnpm --filter @studyhall/api test -- presence → 251 passed, 0 failed"
  - "Mutation sanity: connect() mutant caught by no-flap test (presence.service.spec.ts:101)"
modules_audited: [presence.service, presence.gateway, packages/shared/presence]
tests_added: 31
new_flakes: []
findings:
  - {severity: HIGH-CLOSED, module: presence.service/gateway, description: "ZERO unit tests at merge for ref-count/typing-TTL/co-member-scoping; closed by adding 31 mutation-survivable unit tests this stage"}
head_signoff:
  verdict: APPROVED
  stage: T-2
  failed_checks: []
  rationale: "Coverage gap (zero presence unit tests) found and closed with 31 value/state-asserting tests; mutation-sanity confirms a real bug fails a test; handleConnection honestly deferred to integration not faked. All 251 green."
  next_action: PROCEED_TO_T-3
```
