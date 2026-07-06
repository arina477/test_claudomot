# P-3 Plan — wave-61

## Approach
- **Architecture deltas:** minimal. Reuse the EXISTING global ThrottlerModule (app.module.ts) — add bounded
  per-route @Throttle overrides on the 3 DM read routes. No new throttler, no new module, no config knob.
  Client: a bounded retry/backoff wrapper around the DM read fetches. Alternative considered: raise the GLOBAL
  limit — rejected (would loosen every route, an abuse-surface widening; the per-route override is the precedent
  pattern (users.controller.ts:62) and scopes the change to the read path only).
- **Data/API contract:** NO shape change (same routes, same DTOs). **New deps:** none.
- **Value:** @Throttle({ default: { limit: 60, ttl: 60_000 } }) — single hardcoded constant, justified by the DM
  burst-read pattern (candidates + conversations + messages on load); 6x global default, bounded, reads-only. No env knob.
- **Security (T-8):** rate-limit surface. Direction SAFE (loosening an over-tight READ limit; writes + other routes
  keep global 10/60s; finite per-IP cap retained). T-8 must verify: writes still 10/60s; DM reads 60/60s; no route
  unintentionally un-throttled.

## Plan (file-level steps)

### B-2 Backend (executor: backend-developer)
1. `apps/api/src/dm/dm.controller.ts` — add `@Throttle({ default: { limit: 60, ttl: 60_000 } })` to the 3 DM READ handlers:
   GET /dm/conversations (~:87), GET /dm/conversations/:id/messages (~:130), GET /dm/candidates (~:166, DmCandidatesController).
   Import `Throttle` from '@nestjs/throttler' (same import users.controller.ts uses). Do NOT touch the POST/write handlers.
   Mirror the users.controller.ts:62 comment style (justify the override).

### B-3 Frontend (executor: react-specialist)
2. Client DM read fetches — add a bounded 429-aware retry (exponential backoff + Retry-After honoring, fixed max attempts)
   around the DM read calls: the conversations list fetch (useDm.ts), the candidates fetch (StartDmPicker.tsx), and the
   DM messages fetch. Prefer a single small shared helper (e.g. fetchWithBackoffOn429) reused by all 3 read call sites,
   rather than duplicating logic. Do NOT wrap DM WRITE/POST calls (outbox path, unchanged). Bounded retries only.

### Specialist routing (AGENTS.md validated)
- backend-developer — B-2 NestJS controller decorator (per AGENTS.md).
- react-specialist — B-3 client fetch-retry (per AGENTS.md).
Order: B-2 then B-3 (backend first per B-block sequence; but no contract dependency — the client change is independent).

## Parallelization map
B-2 (dm.controller.ts) and B-3 (client fetches) touch disjoint files with no contract dependency → could parallelize,
but per B-block default sequence run B-2 → B-3. 2 specialists, 1 file each (backend) + a few client files.

## Self-consistency sweep
1. Every AC → step: AC1/2/3/4 (throttle) → step1; AC5 (client backoff) → step2. ✓
2. Every step has specialist. ✓  3. No file in 2 batches. ✓  4. design_gap_flag false. ✓
5. Arch delta named (per-route override vs raise-global trade-off). ✓  6. No data/API shape change (no TBD). ✓
7. No deps. ✓  8. SDK n/a. ✓  Sweep clean.
