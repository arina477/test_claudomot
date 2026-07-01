# Wave 32 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn for T-9 gate; did NOT execute these tests — reviewed independently against deliverables)
**Reviewed against:** process/waves/wave-32/blocks/T/review-artifacts.md + findings-aggregate.md + all T-1..T-8 stage deliverables (read directly, not via aggregate summary)
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

Coverage is adequate to what the wave touched (one RBAC-gated GET endpoint + service method + inline DTO contract + React hook/indicator with 4 states + pre-join UI), and the evidence is genuine live proof, not coverage theater. The security surface — the load-bearing concern for a membership-gated cross-server occupancy read — is PROVEN live, not asserted: I read the T-8 matrix rows directly and confirmed the non-member→403 (row 2) is backed by **byte-identical 403 bodies across rows 2/2b/2c** (channel-exists vs nil-UUID vs random-valid-UUID), which is a real enumeration-leak control that would fail if the body differed by a byte — the wave-31 P1 uniform-403 fix holds live. Gate ORDER is proven by construction (403 stops non-members before load; 400 reachable only by members on text channels; 503 reached only after RBAC+type pass), which is exactly why the unset-LiveKit-creds boundary does NOT weaken the security verdict: RBAC + type-check run before RoomServiceClient is ever constructed. Rate-limit is real (1×503→29×429, no state leak). secret_grep_findings is empty of REAL secrets — the 2 matches are confirmed fake 32-char fixtures (`'devkey'`/`'devsecret…'`) assigned to `process.env` inside `it()` blocks, and Railway carries no `LIVEKIT_*` var (nothing to leak). Fail-soft is proven live (T-5 S3: Join CTA visible+enabled while occupancy=error, screenshot-backed; S5 graceful degrade, no white screen). The CI-verified tier (T-1..T-4, merge 45b08c3, run 28554411114: lint+tsc green, api 449 + web 296, controller contract spec asserting 200/401/403/400/503, service spec exercising gate→load→creds→RoomServiceClient(mock)→lookup on Postgres v16 containers) mocks LiveKit only at the outermost SDK boundary — the RBAC/db system-under-test is NOT mocked, and the security gate ORDER is asserted as a real transition (non-member → db.select + RoomServiceClient NOT called), not a call-count trivium. The populated-occupancy deferral (LiveKit creds unset) is an honest, consistently documented limitation with a standing N-1 tripwire, not theater — the full RBAC/type/empty/creds security surface is provable and proven without keys. T-7 perf skip (not heavy) is legitimate. No single-client realtime issue applies (this is a polled read endpoint, correctly tested as such — no fan-out to two-client-verify). Zero flakes, zero fix-up cycles, prod DB fixtures torn down and restored+verified. Every applicable stage-exit check ticks.

## Findings disposition (surfaced-not-fixed, per Iron Law → V-2)

**F-32-T-8-1 (LOW→MEDIUM, input-validation) — NON-BLOCKING for this gate.** Malformed non-UUID `channelId` on the authenticated path returns 500 (`{"statusCode":500,"message":"Internal server error"}`) instead of 400/403; missing `ParseUUIDPipe` (or equivalent) on the `channelId` route param. My severity judgment: NOT gate-blocking. The 500 body is generic — no stack trace, no internal-state leak — so it is a robustness gap, not a security leak; and the unauthenticated malformed path correctly hits 401 (auth guard runs first). Correctly surfaced-not-fixed and routed to V-2 with repro (`GET /channels/not-a-uuid/voice/participants` with a valid bearer). Likely tag: B-2 backend / input-validation.

**V-2 cross-check flag (new, added by this gate):** the wave-31 voice-token endpoint `POST /channels/:channelId/voice/token` shares the identical `:channelId` route-param pattern and almost certainly the same missing UUID-param validation. V-2 should probe BOTH endpoints with a malformed channelId when remediating F-32-T-8-1, so the fix lands on the shared pattern rather than one endpoint. (This is a suggestion for V-2 scope, not a T-block finding requiring rework.)

## Rework instructions
N/A — APPROVED.

## Escalation
N/A — no structural coverage gap, no finding exceeding the wave's risk budget. The standing LiveKit-creds boundary is a documented deferral with an N-1 tripwire, not a gate escalation.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
