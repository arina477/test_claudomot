# T-4 — Integration (wave-14)

**Block:** T · **Stage:** T-4 · **Layer:** DB + service + API integration · **Pattern:** A (partial) + documented infra gap · **Mode:** automatic

## Action 1 — Pattern determination
B-0: NO schema delta (presence is in-memory; no migration). B-2: new service surface = `PresenceService.getServerIdsForUser`/`getCoMemberUserIds` (real `server_members` queries), `ServersService.listServerMembers` (member-gate + roster join), `PresenceGateway.handleConnection` (db users-lookup + room joins).

CI config (`.github/workflows/ci.yml`): provisions `postgres:16` as a service. BUT the project's vitest `test`/`test:ci` job **mocks the DB** (`servers.service.spec.ts` and `messages.service.spec.ts` both `vi.mock('../db/index')`). The real Postgres-16 service in CI is consumed ONLY by the **boot-probe** job (compiled API boot against real DB) and the **e2e** job (Playwright smoke against a real running stack). There is NO vitest integration tier hitting the real test DB with per-test transaction rollback.

→ **Pattern A (partial)** for what the boot-probe/e2e real-stack jobs cover; **missing-infrastructure path** for the dedicated service-boundary integration tier.

## Action 2 — CI evidence (what IS covered against a real stack)
- **boot-probe** PASS (C-1, 58s): compiled-dist DI boot — confirms PresenceModule + PresenceGateway + PresenceService + RbacService wire and boot against real Postgres without a DI/connection crash. This is real-stack evidence the module loads.
- **e2e** PASS (C-1, 57s): Playwright smoke against a running API+DB.
- **test** PASS (251 api): unit-level with mocked db — the new presence service methods' DB queries are mocked-shape-verified at T-2, not real-DB-verified here.

## Action 3 — Boundary coverage audit (Action 4 merged)
| Boundary (B-2) | Unit (mocked, T-2) | Real-DB integration | Carried where |
|---|---|---|---|
| PresenceService.getCoMemberUserIds (server_members dedup, self-exclude, []-on-no-server) | YES (15 tests, mocked db) | NO dedicated vitest int test | **T-8 live two-client** exercises co-member scoping against the DEPLOYED prod DB (real fan-out + no-leak) |
| ServersService.listServerMembers (member-gate 403, roster join) | NO (not in servers.service.spec) | NO | **T-8 live** GET /servers/:id/members 401/403 against prod; controller-level 403-propagation in servers.controller.spec |
| PresenceGateway.handleConnection (db users displayName + room join + snapshot) | partial (test-automator flagged integration-shaped, deferred) | NO vitest int | **T-8 live two-client** (snapshot-on-join + online fan-out against prod DB) |
| RbacService.canViewChannelById (typing gate) | covered in channel-message.guard.spec | NO direct presence-path int | **T-8 live** no-leak typing test |

**F-3 (severity MEDIUM, non-blocking — missing-infra path per T-4 stage):** Project has no real-Postgres vitest integration tier with per-test transaction rollback; service-boundary DB logic (co-member resolution, members member-gate) is verified by (a) mocked-shape unit tests and (b) the live two-client prod probe at T-8 — not by an isolated repeatable integration suite. test-writing-principles §7 ("integration tests don't mock; if it needs a real DB it's T-4") is not satisfied by a dedicated tier. Boot-probe + e2e provide real-stack smoke but not boundary-level integration. Per the T-4 missing-infrastructure path this is forwarded to V-2/L-2, NOT a blocker. The load-bearing scoping proof is delivered live at T-8 against the real deployed DB.

**F-3b (severity LOW):** `ServersService.listServerMembers` has no unit OR integration test for its member-gate (the 403 path). Closest coverage: servers.controller.spec asserts 403 PROPAGATION but with the service mocked. The actual member-gate query is unverified except via T-8 live. Candidate for a future servers.service.spec case.

## Discipline note
- A real-Postgres vitest integration tier (testcontainers or the CI postgres service + transaction rollback) would convert F-3/F-3b from live-probe-only to repeatable. T-4 principles candidate at L-2.

```yaml
test_pattern: mixed   # boot-probe+e2e real-stack (A) + missing dedicated integration tier (deferred)
skipped: false
boundaries_audited: [PresenceService.getCoMemberUserIds, ServersService.listServerMembers, PresenceGateway.handleConnection, RbacService.canViewChannelById]
ci_evidence:
  - "C-1 boot-probe PASS (58s): PresenceModule boots in compiled dist against real Postgres (no DI/connection crash)"
  - "C-1 e2e PASS (57s): Playwright smoke against running API+DB"
active_run_output: "Real-DB boundary proof delivered live at T-8 (two-client fan-out + no-leak + members 401/403 against deployed prod DB)"
infrastructure_gap_recorded: true
findings:
  - {severity: MEDIUM, boundary: presence co-member resolution + members member-gate, description: "No dedicated real-Postgres integration tier; DB boundaries verified via mocked unit + live T-8 prod probe, not repeatable isolated integration. Missing-infra path; non-blocking; live proof at T-8."}
  - {severity: LOW, boundary: ServersService.listServerMembers, description: "Member-gate 403 query untested except live at T-8; controller.spec mocks the service. Candidate servers.service.spec case."}
head_signoff:
  verdict: APPROVED
  stage: T-4
  failed_checks: []
  rationale: "Real-stack boot-probe + e2e green prove the module boots/serves against real Postgres. Dedicated integration tier absent (documented MEDIUM infra gap, non-blocking per stage missing-infra path); co-member scoping + members member-gate carried by the live two-client prod probe at T-8 which is the load-bearing proof. No blocker."
  next_action: PROCEED_TO_T-5
```
