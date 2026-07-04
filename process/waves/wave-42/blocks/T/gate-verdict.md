# Wave 42 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, agentId head-tester-wave42-T9)
**Reviewed against:** process/waves/wave-42/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)

## Verdict
APPROVED

## Rationale
The authz-critical surface — the actual risk in this collect/return wave — is genuinely PROVEN, not asserted. I independently confirmed CI run 28689560816 = success on headSha c9860445 with `DATABASE_URL_TEST` set (real Postgres at localhost:5432/studyhall_test), and the CI log prints all 14 submission integration cases individually passing (integration file: `15 passed / 96 passed`), so `describe.skipIf(SKIP)` did NOT silently no-op — this is real-Postgres exercising the real service methods, not mock-the-system-under-test. The assertions are user-observable (row counts, `returned_at`/`organizer_comment` nulling on resubmit, DTO field values, thrown exception types), not mock-call-count trivia; the trickiest state-machine edge (resubmit-clears-return, case 3) is DB-level proven. IDOR is proven at two layers: real-PG two-user 403 negatives (non-member submit, non-organizer list/return — serverId derived from the assignment row, not a client param) plus T-8 live anti-spoof (other-server key / path-traversal / subpath-injection all rejected 400, scope regex built from the assignment's real server_id). T-8 is CLEAN with unauth→401 on all four endpoints, cross-assignment→400, bad-UUID→400, rate-limit→429, cookies HttpOnly+Secure, and a source-grep confirming NO grade/score field anywhere (the wave's explicit non-goal). Coverage is honestly *layered*: the T-2 unit gap on the new service methods is the correct call (mocking the DB for authz/idempotency methods would test the mock; these belong at real-PG T-4 + live T-8), and T-7 perf is correctly skipped (moderate diff, no perf budget at risk, no realtime path added). No coverage theater, no single-client realtime (none in this wave), no flaky-retry masking (fix_up_cycles: 0, zero flakes across all layers), no mock-the-SUT.

The two accepted gaps are correctly scoped and non-blocking: (a) the T-5 student-submit-BUTTON UI is uncovered strictly due to the single-account/broken-fixture-B constraint (fixture A is organizer on all 376 servers, so the student "Your Work" form never renders for A) — this is a fixture limitation, NOT an app defect, and the submit + resubmit-clears-return *behavior* is proven LIVE via API and at real-PG T-4; the uncovered surface is button-render, not authz/delivery/fan-out, so I do not require a 2-user E2E before this gate; it is tracked as task c50f3040. (b) attachment-presign is not integration-covered (no S3 creds in the service-only CI env) but its anti-spoof authz is verified live at T-8. Every other finding (T2-F1, T3-F1, T4-F2 process, T5-F2 infra, T6-F1/F2/F3 cosmetic) is correctly LOW and routed to V-2/L-2. The suite is honest: each layer proves a user-observable outcome, and every green is backed by a run I could point a plausible real bug at and see fail.

## Escalation  (only if ESCALATE)
n/a

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
- carry_to_journey_phase2:
    - "Wave touched UI surface (student submit UI, submissions roster, return dialog) + D-block fired (design_gap_flag: true) → journey regen REQUIRED per T-9 Action 2; do NOT skip."
    - "Tracked follow-up finding for V-2/N: student-submit-button UI E2E coverage blocked on non-organizer fixture (task c50f3040) — restore fixture B, add 2-user student-submit E2E next wave. Non-blocking for this gate."
    - "No critical findings; findings_total across T-block = 8 LOW; findings_critical = 0; ready_for_verify = true."
