# Wave 59 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn)
**Reviewed against:** process/waves/wave-59/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
The wave's sole deliverable — `apps/web/src/shell/useTyping.test.ts` — is load-bearing, not
theater. It asserts `buildTypingLabel(typers).toBe(expected)` (a return-value contract, not a
mock-call count) across all five branches of the shipped formatter with VERBATIM display-name
strings: 0→`''`, 1→`'Alice is typing'`, 2→`'Alice and Bob are typing'`, 3→`'Alice, Bob and Carol
are typing'`, 4→`'Several people are typing'`, plus a 5-typer row that makes the 4+ bucket a TRUE
fallthrough (a `length === 4` special-case would pass the 4-row but fail the 5-row). Mutation
sanity holds: dropping the 2-typer `and`, the 3-typer comma/`and`, or altering the fallthrough
copy each fails a specific row deterministically. T-1/T-2 (static + unit) ran green on CI; every
other layer is defensibly skipped because the corresponding surface is genuinely absent, not
evaded — the only production change is adding `export` (visibility) to a function already invoked
in the shipped hook, so there is no new Zod/contract surface (T-3), no service/schema change (T-4),
no user-visible behavior/route/DOM (T-5 e2e), no UI/layout (T-6), no perf-relevant path — a pure
synchronous string formatter (T-7), and no auth/session/RBAC/rate-limit surface (T-8). Crucially
the suite is HONEST about scope: it feeds fixture arrays directly and never exercises the socket
fan-out path, so it neither closes nor falsely implies resolution of the still-open F-4 defect
(task 58633934 — co-members see empty typers, a server-side fan-out issue UPSTREAM of
buildTypingLabel). The findings-aggregate correctly carries F-4 forward as SEPARATE and still open.
This is contract-correct tail-drainage; scope size is not a rework reason. Journey regen is a no-op
per Action 2 (non-UI wave: no routes/screens/frontend-behavior touched).

## Rework instructions  (not applicable — APPROVED)

## Escalation  (not applicable — APPROVED)

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
