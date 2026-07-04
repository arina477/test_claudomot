# T-9 — Journey (wave-46 M8 direct messages slice 1) — T-block exit gate

**Pattern:** B — Active-execution (Phase 2). Phase 1 = fresh head-tester gate spawn.

## Phase 1 — Gate verdict (fresh head-tester, agentId aba4e5b5)

**Verdict: APPROVED** (attempt 1, rework_attempt_cap_remaining: 2). Full verdict at `process/waves/wave-46/blocks/T/gate-verdict.md`.

The fresh head-tester independently verified the three load-bearing findings against source (not the fix notes): F4 cursor ms-vs-µs truncation confirmed at `dm.service.ts` encodeCursor L58-59 + predicate L597; F6 self-double-render confirmed at `useDm.ts:205` (dedup missing optimistic-by-idempotencyKey vs M1 echo); T-8 socket MEDIUM→LOW correction confirmed at `ws-auth.ts:66/91` (the `/messaging` namespace DOES reject unauth WS upgrades). Key judgment: the presence of F4/F6/F7 on a live feature is the T-block SUCCEEDING — the suite is not falsely green, it caught real bugs with on-wire/DB evidence + root cause. No finding exceeds the wave's risk budget → V-2 owns blocking classification, no ESCALATE. Two-client E2E confirmed genuinely two-client (real receiver ws frame, separate process), not a single-client echo.

## Phase 2 — Journey-map regen (REQUIRED — UI wave)

### Action 2 — Skip evaluation
Regen REQUIRED: `wave_type` includes `ui`; D-block fired (`design/direct-messages.html` canonicalized at D-3); B-3 Frontend ran (DM UI components + useDm). Not skipped.

### Action 3/4 — Crawl + regen
The DM journey was crawled LIVE across T-3/T-4/T-5/T-6/T-8 (start-picker → create → send → real-time receive → reply → offline → security). Regenerated the DM entry in `command-center/artifacts/user-journey-map.md`:
- **Direct Messages section** (~L341): promoted from "implementation in-flight / to-be-finalized" placeholder → "LIVE, T-9-verified against shipped prod" with the verified surface (server-rail `aria-label="Direct Messages"` → DM home → thread/composer/picker), the 4 REST endpoints with verified status codes, `dm:message` realtime on the auth-gated `/messaging` namespace, and the T-9 LIVE-verified checklist + known-defects→V-2 block.
- **NEW flow F11 — Direct messages (P1) — LIVE (wave-46 M8 slice 1)** added to the Flows cross-reference with a smoke assertion (2-client fan-out A→B real ws frame + DOM both runs; reply; picker; optimistic; offline→reconnect; 4 authz invariants).
- **Orphan/reachability audit** updated: DMs promoted from H2-deferred to MVP-present; DM home reachable from the `/app` server rail; F11 smoke-asserted.

**regen diff:**
- routes_added: DM home (in `/app` shell), 4 `/dm/conversations*` endpoints, `dm:message` event, F11 flow.
- routes_removed: none.
- coverage_gaps: none new — every DM route reached by F11; the DM UI surface is reachable and smoke-asserted.

### Action 5 — Scenario smoke
No `user-scenarios/` directory exists → scenario smoke absence noted (not applicable). The DM journey smoke is captured via F11's smoke assertion (live-verified this block).

### Action 6 — Cross-wave regression check
No prior-wave journey regressed. DM is a NET-NEW surface reached from a NEW server-rail button; the existing channel-messaging flow (F3), offline-first (F5), and notifications (F10) were re-touched only by the shared outbox generalization (kind:dm|channel) — T-2 outbox tests + T-5 confirm the channel-send path is NOT regressed (mixed-drain both orderings, legacy-row fallback). No accidental regression. The F6 self-double-render is NEW-surface DM behavior (not a regression of an existing flow).

### Action 7 — Triage
All findings already surfaced to V-2 in the aggregate (F1–F12). No NEW T-9 findings (F11 smoke all PASS). No critical journey-break → no hard stop.

## Findings (T-9)
None new. F11 smoke all PASS; the DM defects (F4/F6/F7/F1/F3/F11/F12) are already in the aggregate for V-2.

---
```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
journey_regen_skip_reason: ""
crawl_routes_visited: 5   # DM home + 4 /dm endpoints (crawled live across T-3/4/5/6/8)
regen_diff:
  routes_added: ["DM home (/app shell)", "POST /dm/conversations", "GET /dm/conversations", "POST /dm/conversations/:id/messages", "GET /dm/conversations/:id/messages", "dm:message event", "flow F11"]
  routes_removed: []
  coverage_gaps: []
scenarios_run: 0   # no user-scenarios/ dir; DM smoke via F11 assertion
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: fa1ea10
findings: []
head_signoff:
  verdict: APPROVED
  stage: T-9
  failed_checks: []
  rationale: >
    Phase 1 fresh-head-tester gate = APPROVED with independent source verification of the three
    load-bearing findings. Phase 2 journey-map regenerated: the DM entry is promoted from placeholder
    to LIVE/verified, a new flow F11 (Direct messages) is added with a live smoke assertion, and the
    orphan-audit promotes DMs from H2-deferred to MVP-present. Every DM route is reached by F11 and
    smoke-asserted; no prior flow regressed (channel-send confirmed not-regressed via the shared
    outbox tests). The DM feature is genuinely live and its journey is now canonically inventoried.
    T-block exits APPROVED to V — the suite is honest, the headline (2-client fan-out) is proven, and
    all real defects are surfaced to V-2 with evidence + root cause.
  next_action: PROCEED_TO_V_BLOCK
```
