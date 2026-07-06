verdict: REFRAME
verdict_source: problem-framer
matched_antipatterns: [1, 2]
symptom_vs_cause_check: |
  MANDATORY CHECK — RUN. Result: the seed conflates a symptom (message-poll 429s)
  with a fabricated cause (a candidates-specific ~4/burst throttle bucket). Code shows
  no such bucket exists. The real cause is a single shared global limiter, too tight for
  the read pattern. Symptom is real; named cause is false. → REFRAME.
reasoning: |
  The seed's central hypothesis — that /dm/candidates carries its own ~4/burst throttle
  bucket which is the root of message-poll 429s, and that /dm/conversations is NOT
  throttled — is factually contradicted by the code. There is exactly ONE throttler:
  the global ThrottlerModule.forRoot in apps/api/src/app.module.ts at 10 req / 60s per IP,
  wired as APP_GUARD across every NestJS route. NEITHER /dm/candidates
  (DmCandidatesController) NOR /dm/conversations (DmController) NOR the DM message-list
  route GET /dm/conversations/:id/messages carries any @Throttle override — all three
  inherit the same global 10/60s per-IP bucket. So (a) there are not two buckets to
  "align" — they already share one; and (b) /dm/candidates is not a distinct cause of the
  message-poll 429s — every DM read consumes the same shared per-IP budget, and a page that
  loads candidates + conversations + polls messages trivially exhausts 10 req/60s. The fix
  "audit the DM controller throttler config and align the candidates + conversations read
  buckets" would fix nothing, because the buckets it names do not exist. This is
  Antipattern #1 (symptom vs cause: real 429 symptom, fabricated candidates-bucket cause)
  and #2/PRODUCT-PRINCIPLES rule #2 (the seed's named entity — a per-route DM throttle
  config — is not the real cost source; the global APP_GUARD limiter is). The underlying
  correctness goal (poller should not trip the shared rate limit; client should back off on
  429) is legitimate and LOW-value drainage — this is a REFRAME of the cause, not a kill.
proposed_reframe: |
  Reframe the problem to the actual limiter and the actual cost path:

  ROOT CAUSE (verified in code): a single global rate limiter — ThrottlerModule.forRoot
  at limit:10 / ttl:60_000 ms per IP, applied as APP_GUARD in
  apps/api/src/app.module.ts — governs ALL DM read endpoints identically. There is no
  per-route @Throttle on any DM controller (dm.controller.ts / DmCandidatesController).
  Under concurrent DM read load (candidates + conversations + message reads sharing one
  IP budget) the 10/60s limit is exhausted, producing read-path 429s. Writes are unaffected
  because a send is a single request, not a poll.

  Drop the false framing entirely:
  - REMOVE "align /dm/candidates + /dm/conversations read buckets" — there are no separate
    buckets; both already share the one global bucket. Nothing to reconcile.
  - REMOVE "audit the throttler guard config ON the DM controller" — no throttler config
    exists on the DM controller; the only config is global in app.module.ts.

  Correct scope for the wave (choose at P-1/P-2 sizing — do NOT expand here):
  1. Right-size or exempt the read path from the too-tight shared limit. Options to spec:
     either raise the global limit (as users.controller.ts already does via a 120/60s
     @Throttle override — an established in-repo pattern), OR add a targeted @Throttle
     override on the read-heavy DM endpoints so polling reads are not starved by the
     10/60s default. Pick ONE consumer-justified value; do not add a new configurable knob
     without a named consumer (guard against Antipattern #6).
  2. Client-side: add exponential backoff + Retry-After handling on 429 for the DM read
     path (this half of the seed is sound and stays).

  Note for P-1/P-2 (informational, not a scope expansion): real-time DM/message delivery is
  already Socket.IO-based (apps/web/src/shell/messagingSocket.ts, with reconnect backoff),
  NOT HTTP long-polling. So the 429s are from burst REST reads (initial loads / refetch /
  fallback), not an aggressive steady-state poll loop. This means the "should it use the
  socket instead of polling" concern does NOT apply — the socket path already exists; the
  429 is a REST-read rate-limit-sizing problem, and backoff is a correct complement, not a
  band-aid over a missing socket. Confirm the exact 429-producing read path at P-2 before
  locking ACs.

  Confirm-in-code AC (per PRODUCT-PRINCIPLES rule #1 + #2): P-2 must verify the exact DM
  read endpoint(s) that emit the observed 429 and confirm they are governed solely by the
  global APP_GUARD limiter, before writing the fix ACs.
escalation_reason: |
  (n/a — not ESCALATE)
sibling_visible: false

---

# Round 2 — post-REFRAME confirmation

verdict: PROCEED
verdict_source: problem-framer
round: 2
matched_antipatterns: []
symptom_vs_cause_check: |
  MANDATORY CHECK — RUN. Result: cause now correctly named. Symptom (read-path 429s
  on legitimate concurrent DM reads) is mapped to its true cause (a single global
  ThrottlerModule limit of 10/60s per IP governing all DM read routes, too tight for
  the burst-read pattern) — NOT to the fabricated candidates bucket of round 1. The
  round-1 REFRAME is fully resolved. → PROCEED.
reasoning: |
  Corrected framing verified against code:
  - app.module.ts:30-35 — exactly ONE global ThrottlerModule.forRoot (ttl:60_000 /
    limit:10), wired as APP_GUARD (providers:60-63). Confirmed single bucket; no
    "two buckets to align."
  - dm.controller.ts — the three DM read routes GET /dm/conversations (l.87),
    GET /dm/conversations/:id/messages (l.130), GET /dm/candidates (l.166) carry
    NO @Throttle / @SkipThrottle. All inherit the global 10/60s bucket. Confirmed
    the cause is shared-bucket exhaustion, not a per-route DM config.
  - users.controller.ts:62 — @Throttle({ default: { limit: 120, ttl: 60_000 } }) is
    the exact bounded, per-route, consumer-justified precedent the corrected framing
    cites. Established in-repo pattern.
  (a) Right-sizing the DM read throttle via a bounded @Throttle override IS the correct
  cause-fix — it operates at the real limiter and the real layer (per-route decorator),
  replacing round-1's nonexistent "align buckets." Antipatterns #1 (symptom-vs-cause)
  and #2 (wrong layer) are both cleared.
  (b) No security concern. The override loosens a READ-ONLY path with a BOUNDED limit
  (not removal); the global 10/60s stays the default for every other route; there is
  direct in-repo precedent (users 120/60s) with identical rationale. No new abuse
  vector — reads only, finite per-IP cap retained. Direction SAFE is correct.
  (c) Backoff scope stays sound: exponential backoff + Retry-After on 429 for the DM
  read path is legitimate defense-in-depth, complementing (not masking) the sizing fix.
  Real-time delivery is already Socket.IO-based, so backoff covers only burst REST reads
  — not a band-aid over a missing socket. This half of the original seed always held.
  One informational note for P-1/P-2 (NOT a scope expansion): keep the chosen limit a
  single consumer-justified value; do not introduce a new configurable knob without a
  named consumer (Antipattern #6). And per PRODUCT-PRINCIPLES confirm-in-code, P-2 should
  verify the exact 429-emitting read endpoint(s) before locking the fix ACs.
proposed_reframe: |
  (n/a — PROCEED; no reframe)
escalation_reason: |
  (n/a — not ESCALATE)
sibling_visible: false
