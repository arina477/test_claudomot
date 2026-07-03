# Wave 38 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, agentId head-tester@T-9-gate)
**Reviewed against:** process/waves/wave-38/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)

## Verdict
APPROVED

## Rationale
The suite is honest and coverage is adequate for the wave's surface. All 7 P-2 ACs carry a live verdict: the CRUX (AC3) is proven — not asserted — via a genuinely separate anonymous (no-cookie) client capturing the real 302 → t3.storageapi.dev presigned → 200 image/png chain AND a real image decode (`<img>` naturalWidth=64, correct color, survives reload) through bundled playwright-core chromium, done 2×. T-4 integration runs against real Postgres (migration 0017, 302-when-avatar_key-set / 404-when-null) — the DB is not mocked, so a persistence regression fails a real assertion. T-8 security carries the required negatives: anon presign/confirm → 401, cross-user confirm → 400, prefix-injection/traversal → 400 (trailing-slash guard proven), and presigned-URL scoping asserts PUT/DELETE/signature-tamper → 403 with a 300s GET-only grant — this is real IDOR + capability testing, not a 200-only happy path. No layer asserts mock call-counts; every layer is falsifiable by a plausible real bug (the documented 403-avatar-fail mode, an unpersisted avatar_key, an auth regression). The T-6 (zero frontend change) and T-7 (no bundle delta; presigned-GET is a lightweight per-request HMAC) skips are correctly justified for a backend-only wave.

The three carried findings do not block the gate:
- **F1 (MAJOR — profile-settings entry button dead, avatar UI unreachable):** This is the reason APPROVED is defensible rather than a false-green. The suite did NOT hide it — it flagged it MAJOR + launch-relevant. F1 is pre-existing (wave-4 era frontend wiring gap), out of wave-38's backend scope (design_gap_flag=false, no B-3 frontend stage), and NOT a regression introduced by this wave (no core journey — login/session — regressed). There is no test-honesty defect to rework and no in-scope wave-38 code fix the T-block author can make. Per T-9 Action 7, a significant "journey works at API level but the UI entry is broken" finding routes to V-2 Triage, not a T-block REWORK. Rejecting T here would punish the suite for correctly surfacing a truth. It MUST remain loud in the handoff (it is, in findings-aggregate.md, routed to frontend/V-2), and the verifier/product disposition — not the test-suite-honesty gate — owns whether F1 blocks the wave's user-facing go-live.
- **FIND-1 / FIND-2 (LOW — 500 on NUL-byte userId; 500 on confirm of never-uploaded object):** error-path robustness gaps (missing ParseUUIDPipe / uncaught missing-object stat). No data leak, no auth bypass, no IDOR — every headline security control PASSES. Non-blocking; route to V-2 for quick-fix-or-backlog disposition.
- **F2 (INFRA — Playwright MCP chrome-channel misconfig):** host-side test-tooling issue, worked around with a legitimate real browser (bundled chromium); no browser_close was issued (rule 5 honored). Does not weaken the crux evidence. Host-side fix, not a suite defect.

## Escalation
n/a — APPROVED.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
