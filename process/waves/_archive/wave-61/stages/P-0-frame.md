# P-0 Frame — wave-61

## Discover
- wave_db_id: 32cd63cc-9d20-4014-b686-f67058e0717f (wave_number 61, running)
- Prior-work: wave-47 V-2 (T-8 rate_limit + T-5 poll-429, both LOW) — origin of this seed. No prior wave touched the throttle config.
- Roadmap milestone: M8 (84e17739, in_progress, Class=product-feature) — LAST drainable tail item. Wave milestone backfilled.
- Spec short-circuit: no-prior-spec (prose) → full P-1..P-3.
- Security surface: touches RATE-LIMITS → T-8 Security applies; P-4 security-scope-tightened gate in effect.

## Reframe
- Original (seed) framing was FACTUALLY WRONG (problem-framer round-1 REFRAME): claimed two throttle buckets
  (/dm/candidates throttled ~4/burst, /dm/conversations not) to "align". Code shows ONE global throttler
  (ThrottlerModule.forRoot limit:10/ttl:60s per IP, APP_GUARD; app.module.ts:30-35,60-63); all 3 DM read routes
  (dm.controller.ts:87 conversations, :130 messages, :166 candidates) inherit it with NO @Throttle override.
- **CORRECTED framing (problem-framer round-2 PROCEED):** the DM read path shares the one global 10/60s bucket,
  which a page loading candidates + conversations + message reads trivially exhausts → 429 on legitimate DM reads.
  FIX: (1) right-size the DM read path with a BOUNDED @Throttle override (precedent: users.controller.ts:62
  @Throttle(120/60s)) so concurrent DM reads don't hit the global ceiling; (2) client exponential backoff (+Retry-After
  honoring) on 429 for the DM read path (defense-in-depth). NOT "align two buckets". Real-time delivery is already
  Socket.IO — backoff covers burst REST reads only, not a missing-socket band-aid. Direction SAFE (loosening an
  over-tight read limit; bounded, not removed; global default retained for other routes → no abuse vector).
- **ceo-reviewer: PROCEED (HOLD-SCOPE)** — build not defer. 874bd233 is read-path correctness/config-consistency
  (wrong regardless of user count), NOT premature-scaling like the deferred 999a14d1 (wave-56 "keep the correctness
  cap, fence the scaling remainder" precedent). ~2/10 value, single-module, safe. Carried forward (framing-independent).
- **mvp-thinner: OK** — one coherent AC (throttle right-size + backoff both fix the same 429-under-load problem);
  not splittable. Carried forward (framing-independent).
- Mediation: none.
- **Disposition: PROCEED (corrected framing).** design_gap_flag expected FALSE (backend throttle config, no UI).

## Carry-forward for P-1/P-2/P-3
- Pick ONE consumer-justified @Throttle limit value (no new configurable knob without a named consumer — antipattern #6).
- Confirm-in-code the exact 429-emitting endpoint(s) before locking ACs.
- Standing: M9/M12 founder decision foregrounded; after this (last drainable) wave, M8 stockout → N-1 daily-checkpoint → founder.
