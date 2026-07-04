# Wave 47 — V-2 Triage

**Block:** V (Verify) · **Stage:** V-2 · **Wave topic:** M8 DM entry-point completion — DMs STARTABLE.

## Action 1 — Aggregated inputs (deduplicated)

Inputs: T-block findings-aggregate (11 raw entries; the 2 HEADLINE PASS lines are results, not findings) + Karen V-1 + jenny V-1.

- **Karen V-1:** APPROVE. 0 net-new findings; her 2 "non-blocking Lows" (rate-limit inconsistency; unit-layer WHERE-clause not directly asserted) are the SAME items already in the T-block aggregate — merged, not double-counted.
- **jenny V-1:** APPROVE. 0 findings, 0 spec-drift, 0 spec-gap. Headline DMs-startable-via-UI CONFIRMED live.

Deduplicated master list = 6 distinct findings (T-2 unit-mock item merged into the coverage-gap item; T-4 and T-8 privacy-coverage items are the same gap merged):

| # | Source | Sev | Summary |
|---|---|---|---|
| 1 | T-8 rate_limit + T-5 poll-429 | LOW | /dm/candidates throttled (~4/burst) vs /dm/conversations not; message-poll hits 429 under concurrent load (read-path only; POSTs 200; session valid) |
| 2 | T-4 + T-8 privacy_coverage + T-2 unit | LOW/INFO | who_can_dm='nobody' exclusion + candidate negative-isolation not live-proven (2-member proof-server fixture gap); fence proven ACTIVE by positive results; unit layer used pre-filtered mocks |
| 3 | T-7 perf | INFO | getDmCandidates no LIMIT/pagination; fine at MVP scale; scope-fenced future slice |
| 4 | T-5 session-refresh | INFO | background 401 on /auth/session/refresh; session stayed valid; cosmetic |
| 5 | T-1 static | INFO | `as any` on mock EventEmitter (biome-ignored, test-only); zero production bypass |

## Action 2 — Classification

Classification authority = orchestrator (Karen/jenny only report). Independent judgment applied — not auto-accepting upstream severity labels.

| # | Bucket | Rationale |
|---|---|---|
| 1 | **Non-blocking** | Not a spec-drift, not an acceptance failure, not a security regression. Throttle direction is SAFE (over-, not under-throttling). jenny drove the full journey clean (0 console errors) — no broken core flow. Tracked as tuning debt. |
| 2 | **Non-blocking** | TEST-COVERAGE gap, NOT a code defect. Karen quoted the live WHERE clauses (`ne(who_can_dm,'nobody')`, `ne(user_id,callerId)`, `selectDistinctOn`); T-8 live-proved the fence ACTIVE via positive results. Only counter-example fixtures (nobody-set co-member; disjoint non-co-member) are missing. Fence is code-correct + live-active → no acceptance criterion unmet → not blocking. Tracked as coverage debt. |
| 3 | **Non-blocking** | INFO. Explicitly EXCLUDED by the wave-47 SCOPE FENCE (mvp-thinner: no ranking/presence/pagination; global directory founder-reserved). Deliberately deferred, not missed. Future large-server scale slice. |
| 4 | **Noise** | Cosmetic; session stayed valid; no user-perceivable effect. Suppressed. |
| 5 | **Noise** | Test-only lint, biome-ignored, zero production bypass (Karen confirmed). Suppressed. |

**Blocking count: 0.** No spec drift (jenny 0 drift/0 gap), no fabricated Karen claim (Karen APPROVE, all F1-F5 confirmed), no unmet acceptance criterion (T-5 + jenny both live-proved DMs startable end-to-end; T-8 proved the privacy fence). The feature works and is secure.

## Action 3 — Route blocking findings

None. Fast-fix queue empty.

**Fast-fix candidacy note (getDmCandidates LIMIT):** the founder brief floated adding a `LIMIT` as a <10min fast-fix. **DECLINED into V-3.** Finding #3 is INFO-level, non-blocking, and explicitly inside the scope fence ("NO ranking/presence/pagination"). Adding a LIMIT touches a shipped, LIVE, user-facing query behind which there is NO defect — that is precisely the unscoped-green-by-addition / loop-bounding risk the V-3 discipline guards against. Routed to a non-blocking task row (#3 below) instead of a fast-fix. This keeps V-3's fast-fix loop at zero in-scope items.

## Action 4 — Non-blocking task rows INSERTed

`wave_id = NULL` on all three (N-2 seedability requirement — a follow-up carrying the producing wave's id strands and can never be picked as an N-2 seed; provenance lives in the prose `description` as "Source: wave-47 V-2"). `milestone_id = 84e17739…` (M8 — DM slices overlap M8 scope). `parent_task_id = NULL` (top-level seed candidate). Confirmed `wave_id IS NULL` post-insert (no stranding).

| Finding | task_id | milestone_id | wave_id |
|---|---|---|---|
| #1 throttle/poll-429 | `874bd233-e5fc-4c29-a851-4474b330c0e6` | M8 (84e17739…) | NULL |
| #2 nobody-exclusion + negative-isolation coverage | `03ccf636-ceb2-4ebc-aff7-6c55e8283521` | M8 (84e17739…) | NULL |
| #3 getDmCandidates LIMIT/pagination (scale) | `c5051444-318f-4a90-a79a-947b4452e42f` | M8 (84e17739…) | NULL |

## Action 5 — Noise suppressions

- #4 background 401 on /auth/session/refresh — cosmetic; session stayed valid; no user-perceivable effect. Suppressed.
- #5 `as any` on mock EventEmitter — test-only, biome-ignored, zero production bypass (Karen confirmed). Suppressed.

```yaml
findings_input_count: 5                # distinct after dedup (T-block 11 raw → 5 findings + 2 HEADLINE-PASS results; Karen/jenny 0 net-new)
findings_blocking: []
findings_non_blocking:
  - {id: 1, source: "T-8 rate_limit + T-5 poll-429", summary: "throttle policy inconsistency + message-poll 429 backoff", task_id: 874bd233-e5fc-4c29-a851-4474b330c0e6, milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4}
  - {id: 2, source: "T-4/T-8/T-2 privacy-coverage", summary: "nobody-exclusion + negative-isolation live-proof (test-coverage gap)", task_id: 03ccf636-ceb2-4ebc-aff7-6c55e8283521, milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4}
  - {id: 3, source: "T-7 perf", summary: "getDmCandidates LIMIT/pagination for scale (scope-fenced)", task_id: c5051444-318f-4a90-a79a-947b4452e42f, milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4}
findings_noise:
  - {id: 4, source: "T-5 session-refresh", summary: "background 401 on session refresh", rationale: "cosmetic; session stayed valid; no user-perceivable effect"}
  - {id: 5, source: "T-1 static", summary: "'as any' on mock EventEmitter", rationale: "test-only, biome-ignored, zero production bypass"}
fast_fix_queue: []
b_block_re_entry_required: []
```
