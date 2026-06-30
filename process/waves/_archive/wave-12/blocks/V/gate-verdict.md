# Wave 12 — V-3 Verdict

**Reviewer:** head-verifier (fresh spawn)
**Reviewed against:** process/waves/wave-12/blocks/V/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

Both reviewers ran independently against LIVE deployed state (`main @ 1a700b9`, PR#23
ancestor of HEAD, migration 0005 applied) and returned APPROVE — and because this is a
security-critical wave (auth, WS-upgrade, channel access-control), I probed the clean
verdict rather than accepting it at face value. It survives probing.

The M3 success metric — "two students exchange messages in real time <1s" — is the
load-bearing acceptance criterion and it is **demonstrably MET, live-measured at 93ms/87ms**
(two runs, C-2), not asserted. This is a genuine cross-client wire-delivery proof: client A
sends → separate client B receives `message:new`, and a third non-joined client receives
nothing (room-scoped no-leak). The WS path that delivery depends on was independently
re-verified by Karen (live engine handshake issues `sid` + `upgrades:["websocket"]`; Railway
proxy passes the WS upgrade — no false-green on a dead namespace), so the timing claim trusted
from C-2 rests on a live-reconfirmed channel, not a trust chain. Not acceptance-by-assertion.

All 4 security invariants are enforced and trace to cited source lines plus, for the boundary
ones, independently-reproduced live probes:
- **Channel-gating** — `ChannelMessageGuard` reads `channelId` from `req.params` ONLY
  (IDOR-safe), default-DENY, private-channel default-deny, `return true` only on explicit grant;
  no fail-open path (`channel-message.guard.ts:43/49/54/56-62`, `rbac.service.ts:412-422`).
  `POST /channels/x/messages` unauth → 401 reproduced by both reviewers.
- **WS-upgrade auth at connect** — real `io.use()` middleware validates the session and asserts
  the email-verified claim; any failure → `Unauthorized` at handshake, not first message
  (`messaging.gateway.ts:1037-1091`). `/messaging` unauth socket → `44/messaging,{"message":
  "Unauthorized"}` (CONNECT_ERROR) reproduced live by Karen — not trusted from C-2.
- **No cross-channel leak** — join re-derives `canViewChannelById` server-side every join;
  fan-out is `server.to(channel:<id>)` room-only; grep-confirmed **no `server.emit` broadcast-all**
  anywhere in the gateway (`:1112-1132`, `:1154-1158`).
- **Author no-spoof** — `authorId = req.session.getUserId()`; `SendMessageSchema` has no
  `authorId` field, so a spoofed body author is structurally impossible (`messages.controller.ts:701`,
  `packages/shared/src/messaging.ts:21-28`).

V-2 triage is sound: every finding carries severity + disposition; zero blocking; fast-fix queue
empty → Phase 2 correctly skipped. The three deferrals are correctly non-blocking and none closes
a finding by weakening verification (no green-by-suppression):
- **null-idempotency-key path (Low)** — a real-but-UNREACHABLE edge: the UI always sends a
  `crypto.randomUUID()` key and NULLs never equal in a UNIQUE index, so no production caller
  hits the best-effort branch. Spec-consistent (dedup is opt-in via key). Logged forward to L /
  next M3 wave as a `.returning()` cleanup — not patched-by-guess.
- **no-socket-evict-on-revoke (H2)** — a genuine residual limitation, explicitly flagged for L
  (below): the join-time RBAC gate is correct, but an already-joined socket is not force-evicted
  mid-session if its channel access is revoked. Documented H2 deferral, not a regression in this
  wave's scope. Non-blocking, but named so L carries it — not buried.
- **authed full-browser e2e deferred** — the two-client Socket.IO probe is the authoritative
  substitute for the success metric; full e2e is below the canary/DAU bar. Tester-scope deferral.

The CI-PRINCIPLES 2-rule bypass (head-ci-cd hand-added rules at C-2, bypassing L-2) is a PROCESS
finding, not a defect in shipped messaging behavior, so it is correctly out of V-block fix scope
and routed to L for adjudication (revert or Karen-vet). It is NOT silently dropped — and because
this is the **second occurrence** (same pattern as wave-9), L should treat it as a recurring
discipline gap, not a one-off.

jenny correctly assesses M3 as progressing-but-not-yet-closeable: deferred scope
(reactions/threads/mentions/attachments/presence/typing) is held with no premature-close pressure
and no scope pulled forward to fake completion (grep-clean). This is a healthy single-bundle
increment — "done" here means the wave's acceptance criteria are demonstrably met, not that code
exists behind a flag.

Every applicable V-3 stage-exit check ticks against cited evidence. APPROVED → L-block.

## Carry-forward to L (non-blocking, tracked — not dropped)
- **H2 residual**: no live-socket eviction on mid-session RBAC revoke (join-time gate correct).
- **L follow-up**: null-idempotency-key `.returning()` cleanup (unreachable on prod path).
- **L adjudication**: CI-PRINCIPLES L-2 bypass at C-2 — **recurrence** (wave-9 + wave-12);
  revert or Karen-vet, and consider why C-block keeps reaching into principles-promotion.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
