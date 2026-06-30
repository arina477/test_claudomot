verdict: REFRAME
verdict_source: problem-framer
matched_antipatterns: [1]
reasoning: |
  Symptom-vs-cause (mandatory): the offline-first IndexedDB outbox IS the right primitive
  now — M4 is the founder wedge, M3 messaging shipped, success metric is exactly-once
  offline delivery. The SLICE (idempotent-contract + store + outbox-integration + tests)
  is one coherent offline-send spine, correctly sized — PROCEED on the bundle.
  BUT seed 92d85e0e is mis-framed on a STALE PREMISE (antipattern #1, claims-missing-what-
  exists). Its claim "POST /api/messages has NO idempotency guarantee today — a replayed
  queued send would double-post" is FALSE. Verified in apps/api/src/messaging/
  messages.service.ts createMessage (L485-562): the INSERT already uses
  `.onConflictDoNothing({ target: [messages.channel_id, messages.idempotency_key] })`
  with a `isNewInsert` replay-refetch + a skip-double-attach guard (since wave-13, reused
  for threads/attachments). Server idempotency is real and replay-safe. The genuine gaps
  are narrower and different from "build idempotency."
proposed_reframe: |
  Re-scope seed 92d85e0e from "build idempotent message-send (currently missing)" to the
  two real gaps verified against the M3 code:

  (a) BINDING idempotency-key contract for the outbox path. Server dedup EXISTS but
      idempotency_key is OPTIONAL today — controller DTO is `idempotencyKey?: string`
      (messages.controller.ts L257) and the service coalesces `input.idempotencyKey ?? null`
      (messages.service.ts L455); a NULL key means NO dedup (UNIQUE index ignores NULLs,
      and the NULL-key path at L519-535 is a best-effort content/time heuristic, NOT
      exactly-once). Real work: make every outbox-originated send carry a stable,
      client-generated idempotency_key so queued replays dedup deterministically. Decide
      whether the key becomes required for this path (server contract) or guaranteed-supplied
      by the client outbox (client contract) — that is the actual seed decision.

  (b) FORWARD `?after=` keyset catch-up cursor for reconnect history. CONFIRMED ABSENT.
      listMessages (messages.service.ts L1355) and the controller (L88-98, `@Query('cursor')`)
      expose ONLY a backward cursor: DESC `created_at,id` with a `lt(...)` predicate (L1395)
      = scroll-up-into-history. M4 reconnect needs the opposite: fetch messages NEWER than
      the client's last-seen position (forward `gt`, ASC) so a reconnecting client catches up
      on what it missed offline. (Note: a forward ASC pattern already exists for thread
      replies at L1132-1206 — reuse that shape, do not reinvent.) New work: a forward
      `?after=<cursor>` parameter/path on the channel message list.

  NET: keep the 4-task bundle as-is structurally; only the SEED's framing changes — from
  "create idempotency" to "(a) bind the existing idempotency key for offline replays +
  (b) add the forward catch-up cursor." Carry this correction into P-2 spec ACs so the
  build does not rebuild server idempotency that already ships.

  Gold-plating to keep OUT (confirmed scope guardrails, no antipattern fired but flag for
  P-1/P-2): full CRDT/conflict-resolution, background-sync service worker, offline for ALL
  entities (scope = messages + channel read-cache only), and multi-device sync. The
  Dexie/IndexedDB choice (sibling 7332a4b8) is correctly a client-side SDK-research item —
  no founder credential ask, route as P-0 SDK research per external-sdk-integration-rules.
escalation_reason: |
  n/a
sibling_visible: false
