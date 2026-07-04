# Wave 43 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, agentId head-tester-wave43-T9)
**Reviewed against:** process/waves/wave-43/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)

## Verdict
APPROVED

## Rationale
The authz-critical surface is genuinely proven, not asserted: T-4 executed 22/22 scheduling cases against real Postgres and I independently confirmed CI run 28693093402 conclusion=`success` at headSha e7f1f7a (== the fix commit == deployed artifact == verified main), so the DB is the system under test rather than a mock. Two-user authz separation is honest — non-organizer create/edit/delete→403, serverId derived from the row (never a client param), softDelete-excludes, member 200 / non-member 403 / unknown 404 — and T-8 live probes corroborate IDOR (random valid-UUID→404 no leak), serverId-smuggle stripped by Zod whitelist with the org gate reading row.server_id (source-confirmed), recurrence 90d cap bounding the response under a 5-year window (no DoS), bad-UUID→400, and rate-limit→429. Assertions are user-observable outcomes (status codes, occurrence counts, stripped fields, capped series), not mock call counts — no coverage theater. Mutation-sanity is demonstrably live: T-4's direct-service test exposed a REAL defense-in-depth gap (createSession lacked the weekly-recurrenceUntil guard the HTTP Zod path had), which was fixed (e7f1f7a, +7 lines), redeployed, and re-verified green — a test that failed on a real bug, exactly the honesty bar. T-5 E2E is honest about its BLOCK: the student read-only view was marked unproven (broken fixture B), not silently passed, and the RBAC it would have shown is authoritatively enforced+proven at T-4 real-PG (the UI affordance-hiding is cosmetic over an already-enforced backend 403). T-6's MAJOR responsive defect (T6-F1) is compressed-not-broken (no overflow), manifests only at the 1024 min breakpoint with detail drawer + members panel both open, primary 1280/1440 clean — a genuine DS §9 gap the layer honestly caught and correctly routes to V-2, not a hidden product break and not a falsified test. Skips are correct: T-7 perf legitimately N/A (recurrence bounded to 90d, and T-8 already stress-exercised that cap under abuse with no DoS). The two LOW disclosures (T2-F1/T3-F1: no dedicated service/contract unit tests) are honestly flagged and genuinely covered downstream — the recurrence transition logic (7-day cursor, 90d cap) IS asserted at T-4 real-PG, just not as isolated T-1 tables; acceptable for this wave's risk budget. No coverage theater, no mock-the-SUT, no single-client realtime (no realtime surface this wave), no flaky-retry masking (T-5 ran each scenario twice, zero flake), no untestable-surface scope creep. The suite is honest; it does not hide a broken product.

## Rework instructions  (only if REWORK)
n/a — APPROVED.

## Escalation  (only if ESCALATE)
n/a — APPROVED.

## Findings carried to V-2 (non-blocking, informational)
- [MAJOR] T6-F1 — members panel not collapsing at ≤1024 when detail drawer open → agenda card crushed to 28px (no overflow; 1280/1440 clean). Bug-vs-design responsive gap → V-2 classifies.
- [LOW] T5-F1 — Esc restores focus to BODY not the "New session" trigger (WCAG 2.4.3). B-3 minor.
- [LOW] T5-F2 — detail side-panel not live-refreshed after edit (cosmetic state-sync).
- [LOW] T6-F3 — modal CTA copy "Create Session" vs design "Save".
- [INFO] T6-F2 — amber today/soon state not exercisable (far-future fixtures); recommend a today-dated spot-check.
- [LOW] T2-F1 — no dedicated unit tests for scheduling service methods (covered T-4/T-8).
- [LOW] T3-F1 — Create/Update negative cases asserted at T-4, not standalone contract tests.
- [LOW→resolved] T4-F1 — createSession service-level weekly-recurrenceUntil guard was missing; caught by T-4, fixed e7f1f7a, integration-verified. Resolved this wave.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
