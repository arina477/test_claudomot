verdict: REFRAME
verdict_source: problem-framer
matched_antipatterns: [1, 7]
reasoning: |
  Seed premise about the leak CLASS is wrong. Verified against code: the wave-53 leak
  was NOT "missing uuid validation before a uuid-column query" — it was the catch block
  forwarding raw err.message to the client (git 9c114d0: `err instanceof Error ? err.message`).
  The fix's load-bearing part is `safeErrorMessage`, not `isUuid` (isUuid is defense-in-depth).
  The two seed-named "likely gap" gateways do NOT share this class: study-timer.gateway.ts:189
  and messaging.gateway.ts:133 already emit hard-coded literal strings ('Internal error checking
  membership' / '...channel access') from their catch blocks — they never forwarded err.message,
  so 22P02 cannot reach the client through them. A full grep of all 4 gateways for the actual
  leak signature (err.message emitted to client) returns ONLY the study-room site, already fixed.
  Presence is confirmed safe (Zod uuid safeParse pre-DB). So the sweep's real gap-count is ZERO,
  not "2-3 gateways." Applying per-site isUuid guards to timer/messaging is validation theater
  (#7): it guards against a leak that the existing literal-string catch blocks already prevent.
proposed_reframe: |
  Reframe from "apply the isUuid guard app-wide to close the 22P02 leak class" to a
  narrower, evidence-first task with two honest sub-parts:

  (A) VERIFY-ONLY (primary): The 22P02→client info-disclosure class is ALREADY closed at
      every site. REST: SupertokensExceptionFilter maps 22P02→generic 400 (auth.exception.filter.ts:66).
      WS gateways: study-room fixed (wave-53 safeErrorMessage); study-timer + messaging emit
      hard-coded literal catch strings (never forward err.message); presence rejects malformed ids
      via Zod uuid safeParse before any DB call. Ship a T-8 regression test per WS handler proving a
      non-UUID serverId/channelId yields a generic message + logs server-side + never leaks raw DB
      text. This is the real deliverable: a proof the class is closed, not new guards.

  (B) OPTIONAL consistency hardening (defer/drop unless a reviewer wants it): add isUuid to the
      timer/messaging parsers to (i) skip the wasted DB round-trip on malformed ids and (ii) match
      study-room's parser style. This is style/perf, NOT a security fix — it must not be framed as
      closing a leak, because no leak exists there. If it adds cost, drop it.

  The seed's fear of an "unbounded unknown site count" collapses to zero verified-leaking sites.
  Do NOT re-touch REST controllers (global filter covers them). Consider whether this justifies a
  wave at all vs. folding the T-8 regression tests into the next security-touching wave — but that
  worth-it call is ceo-reviewer's lane, flagged here only for the P-0 merge.

  On the layer question raised in the pressure-test: a single WS-transport error boundary (a
  Socket.IO-level filter mirroring SupertokensExceptionFilter) WOULD be the stronger cause-layer
  fix IF a leak existed — but it does not, and NestJS @Catch() WsException filters do not cleanly
  intercept errors thrown inside @SubscribeMessage handlers that the handler itself catches. Since
  every handler already genericizes in its own catch, a shared WS filter would be net-new
  architecture guarding nothing. Recommend NOT building it now.
escalation_reason: |
  n/a
sibling_visible: false
