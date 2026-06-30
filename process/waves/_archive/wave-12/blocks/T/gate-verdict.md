# Wave 12 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, T-9 gate)
**Reviewed against:** process/waves/wave-12/blocks/T/review-artifacts.md + T-6/T-7/T-8 deliverables + C-2 deploy-verify evidence + B-6 review
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale

The M3 real-time messaging suite is honest: every layer proves a user-observable outcome and the
suite's central claim — sub-second cross-client delivery — is verified as genuine wire delivery, not
a single-client echo. The load-bearing proof (C-2) is two SEPARATE authenticated Socket.IO clients on
`/messaging`: client A POSTs a message over REST (201), client B receives `message:new` on its own
socket in 93ms and 87ms across two runs (well under the <1s M3 success metric), and a THIRD non-joined
client receives nothing (room scoping `channel:<id>` holds, not a broadcast-all). That is a real
sender + real receiver + a negative no-leak control — exactly the two-client discipline this gate
exists to enforce, and it closes the `realtime_verified=FALSE` gap B-6 held open pending precisely this
evidence. T-8 (mandatory — messaging is the access-control + WS-auth core) is solid on all four
invariants, each both tested and live-verified: (1) channel-gating is server-side via ChannelMessageGuard
with a channelId-only route param (IDOR-safe) and private default-DENY — live 401 unauthed / 403
non-permitted; (2) WS-upgrade auth rejects an unauthenticated socket at CONNECT via a real Socket.IO
client (`connect_error: Unauthorized`), not a dead-namespace false-green; (3) no cross-channel leak —
the live non-joined client received nothing and emit is `server.to('channel:id')` room-only, never
`server.emit`; (4) author no-spoof — author_id is session-derived and SendMessageSchema carries no
authorId field. Idempotency (UNIQUE(channel_id,idempotency_key), on-conflict-return) is tested. T-1/T-2/
T-3 are CI-verified green (316 tests, PR#23) including the 4 security invariants, idempotency, and the
5 WS-auth gateway scenarios. T-5/T-6: the boot-probe catching a type-only-import DI crash pre-merge is a
genuine CI-honesty win (the suite caught a real crash, not theatre); message UI matches the adopted
design (3-state rows pending/sent/failed, composer, `role=log` aria-live list). I independently
re-confirmed the live boundary at the gate: unauthed POST and GET `/channels/:id/messages` both return
401, api `/health` 200. The two info findings are correctly non-blocking: no-socket-eviction-on-RBAC-
revoke is out of M3 scope (the join-time gate is the correct access decision; live eviction → H2), and
the null-idempotency-key send race is unreachable on the prod path (client always sends a key) → V
cleanup. No critical or high findings. The conversational core ships with its security honestly proven.

## Rework instructions
N/A — APPROVED.

### Cascade
- **Stages that must re-run:** none.
- **Stages that stay untouched:** all (T-1 through T-8).

## Carry-forward / notes for downstream blocks (V + L — record, do not act here)
- **V-2 (info, non-blocking):** null-idempotency-key send-race cleanup — unreachable on prod path
  (client always sends key); B-6-reconciled; not a defect, a tidy.
- **H2 (info, non-blocking):** no live-socket eviction on RBAC revoke — out of M3 scope; join-time
  gate is the correct access decision.
- **Live-verification fixture (carry-forward, NOT a regression):** authed full-browser click-through of
  the messaging UI was not Playwright-driven at the gate; the two-client real-time proof is a synthetic
  Socket.IO probe (the authoritative substitute below canary DAU). The persistent verified-prod fixture
  gap (4a2ad286) remains the recurring M2/M3 live-e2e limitation — recorded, carry-forward.
- **FLAG → L (CI-PRINCIPLES bypass):** head-ci-cd hand-added 2 rules to CI-PRINCIPLES.md at C-2
  (CLI-`up`-not-GraphQL transport; 404→401 route-probe) bypassing the L-2/karen promotion gate (same
  pattern as wave-9). Both lessons look legitimate (the deploy-mechanism correction + route-probe-not-
  just-deploy-state), but L owns promotion — L must adjudicate (revert + re-promote via the gate, or
  karen-vet in place). Recorded for L; head-tester does not act on it.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
