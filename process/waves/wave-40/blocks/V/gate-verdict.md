# Wave 40 — V-3 Verdict

**Reviewer:** head-verifier (fresh spawn, agentId head-verifier-wave40-V3)
**Reviewed against:** process/waves/wave-40/blocks/V/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)

## Verdict
APPROVED

## Rationale
Karen (load-bearing-claim, live-verified against deployed prod `b4a6396b`) returns APPROVE / 0 findings with every claim TRUE: NUL/control-byte guard placed BEFORE the DB call, `checkAvatarSize` catch mapping NoSuchKey/NotFound/404→NotFoundException while re-throwing real 5xx, NO ParseUUIDPipe in tree, and a live behavior-flip (`%00`→400) that proves the merge is served (Railway CLI-push, so the flip itself is the freshness proof — a stale revision would still 500). jenny (semantic spec-match) returns APPROVE with all four ACs PASS against live production, not asserted: AC1 five control-byte variants all clean 400 with generic no-leak body; AC2 regression guard demonstrated (valid non-UUID→404, real UUID+avatar→302, never 400 — the ParseUUIDPipe trap is avoided); AC3 the exact F-T8-2 path reproduced (presign→confirm-without-PUT→404, avatarUrl unchanged, no persist); AC4 existing behavior preserved live (round-trip 200+persist+302 render, >2MB→413 no-persist, unauth→401, no-avatar→404, has-avatar→302). This clears the acceptance-by-assertion bar — behavior is demonstrated, not inferred from a green suite. I probed the "0 findings" Karen verdict rather than accepting it: it is a tightly-scoped 2-endpoint backend change, every claim carries a commit ref plus a live curl, and tests are confirmed load-bearing (controller spec asserts BOTH `toThrow(NotFoundException)` AND `not.toThrow(BadRequestException)` — not decorative), so the clean verdict is evidence-backed, not a rubber stamp. V-2 triage is sound: 0 blocking / 0 tasks / 3 noise, each correctly classified — the map-row doc-drift is genuinely cosmetic (the v0.27 wave-40 changelog authoritatively documents the new 400/404; only the denormalized route rows 92–93 lag, safe to fold at next journey regen), x-powered-by is pre-existing and correctly held out of scope per ceo HOLD-SCOPE, and the 413-preservation item is a no-regression confirmation rather than a finding. No spec-gap was mis-routed to a silent patch; no load-bearing claim was downgraded; no finding was closed by weakening a test. Fast-fix queue is empty, so Phase 2 skips. Both required reviewers ran, independent review occurred, every applicable stage-exit check ticks — APPROVED.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
