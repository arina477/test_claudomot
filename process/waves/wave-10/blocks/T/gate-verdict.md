# Wave 10 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, T-9 gate)
**Reviewed against:** process/waves/wave-10/blocks/T/review-artifacts.md + T-8 security deliverable (no separate findings-aggregate file — findings carried in T-8 deliverable + C-2; recorded as a hygiene note below)
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
The RBAC access-control core is sound and the suite is honest — not coverage theater. I verified the load-bearing assertions exist in the merged spec files (PR#20 / 3cf63bf), not just claimed: (4) channel-list filter asserts BOTH directions — `expect(channelIds).not.toContain('ch-2')` / `not.toContain('ch-private')` for absence (no enumeration) AND `toContain('ch-private')` when an override grants view (servers.service.spec.ts:441-504); (3) the guard test proves route-param-wins-over-body by asserting `canViewChannel` is invoked with `'real-server'`/`'real-channel'` from params while the attacker's body holds different IDs (channel-permission.guard.spec.ts:75-91); (6) last-owner-409 is asserted via `rejects.toThrow(ConflictException)` for demote/remove/leave (owner-lockout.service.spec.ts:136/189/223) AND the prod code genuinely runs `db.transaction(...)` with a documented `SELECT FOR UPDATE` row-lock (owner-lockout.service.ts:48/95/132/179) — the transactional invariant lives in the system under test, not in a mock; (1) can() default-deny asserts `toBe(false)` across server-not-exist / non-member / null role_id / role-flag-false, with userId taken from session (no IDOR), and owner-superuser tested positively; (2) self-promote blocked at both controller and service layers (defence-in-depth). The 270-test `test:ci` job ran against a real Postgres 16 service in CI (C-1), so integration suites hit a real DB. Live, the 401 unauthed boundary is verified across every new RBAC endpoint family (C-2 lines 34-39), and I independently re-confirmed it at the gate: live `POST /servers/spotcheck-x/roles → 401`, `GET → 401`, health 200. T-6 layout passes (roles UI per design/server-roles.html; the spec-violating matrix-tab was caught and replaced at D-3; 5 a11y fixes, 97 web tests). T-7 perf skip is justified (not a heavy wave; no perf budget at risk). Two honest limits — neither a false-green: (a) the concurrent demote+leave RACE is *modelled* as two sequential mocked-tx calls, not executed against two real Postgres connections — the FOR UPDATE lock is correctly present in prod code and the last-owner invariant is asserted, but serialization-under-true-concurrency is not directly proven in headless CI (acceptable boundary, recorded); (b) the 403-non-permitted path is NOT live-probed because no persistent verified-prod-session fixture exists and prod has 0 servers — this is the recurring task 4a2ad286 gap (now 4 waves running) and is flagged below as ESCALATION-CRITICAL for the L-block. Both gaps are disclosed in the deliverables, not hidden; the access-control invariants they relate to are covered by the 270 CI tests + 6 conditions + the live 401 boundary. The suite is fast-weighted, deterministic, and free of flaky-retry masking.

## Findings carried to V-2 / L
- **ESCALATION-CRITICAL (carry to L):** verified-prod-session fixture (task 4a2ad286) absent for 4 consecutive waves. Consequence: the 403-non-permitted access-control path and authed browser journeys are repeatedly trusted to CI rather than live-probed. This is the single recurring live-verification gap across M2 and should be resolved before further access-control surface ships. Severity: significant (not blocking this gate — the invariant is CI-tested + the 401 door is live-verified).
- **Info (hygiene):** the concurrent-demote race is unit-modelled, not run against two real Postgres connections. Prod code has the correct FOR UPDATE lock; if a future wave adds a multi-connection integration harness, this race belongs in it.
- **Info (hygiene):** `process/waves/wave-10/blocks/T/findings-aggregate.md` was not created as a standalone file this block; findings were recorded inline in the T-8 deliverable + C-2. Non-blocking for the gate; note for L on findings-pipeline discipline.

## Rework instructions
(none — APPROVED)

## Cascade
- **Stages that must re-run:** none
- **Stages that stay untouched:** all

## Escalation
(none for the gate; the 4a2ad286 fixture gap is a finding routed to L, not a gate escalation — it does not block V)

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
