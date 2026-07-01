# T-9 — Journey (gate + targeted journey regen)

**Wave:** 32 (M6 voice occupancy — `GET /channels/:channelId/voice/participants` + pre-join occupancy indicator)
**Pattern:** active (Phase 2 regen ran — UI wave)

## Phase 1 — Gate verdict

**head-tester (fresh spawn) verdict: APPROVED.** Full verdict at `process/waves/wave-32/blocks/T/gate-verdict.md`.

Reviewed all eight T-stage deliverables directly (not via the aggregate summary). Key independent confirmations:
- **Security crux (load-bearing):** T-8 non-member→403 is proven with **byte-identical 403 bodies across rows 2/2b/2c** (channel-exists / nil-UUID / random-valid-UUID) — a real enumeration-leak control, not an assertion. Gate order (canViewChannelById→403 FIRST → type→400 → creds→503) is proven by construction. Rate-limit real (1×503→29×429, no leak). secret_grep empty of real secrets (2 matches = confirmed fake fixtures `'devkey'`/`'devsecret…'`; Railway carries no `LIVEKIT_*`).
- **Fail-soft (T-5):** Join CTA visible+enabled while occupancy=error (S3, screenshot-backed); graceful degrade on Join, no white screen (S5). Proven live on prod.
- **CI tier honesty (T-1..T-4):** RoomServiceClient mocked at the outermost SDK boundary only — RBAC/db is NOT mocked; the gate ORDER is asserted as a real transition (non-member → RoomServiceClient NOT called), not a call-count trivium. Merge 45b08c3, run 28554411114, api 449 + web 296 green on Postgres 16.
- **Credential boundary:** populated-occupancy deferral (LiveKit creds unset) is honest and consistently documented — the security gate runs before RoomServiceClient, so the full RBAC/type/creds surface is provable without keys. Not coverage theater.
- **Finding F-32-T-8-1** (non-UUID channelId → 500, generic message, no leak, missing ParseUUIDPipe): correctly surfaced-not-fixed → V-2, judged NON-blocking (robustness gap, not a security leak; unauth malformed correctly → 401). Added a V-2 cross-check flag: the wave-31 `POST /channels/:channelId/voice/token` endpoint shares the identical `:channelId` param pattern and likely the same gap.

No single-client-realtime concern applies (polled read endpoint, correctly tested as such). 0 flakes, 0 fix-up cycles. Prod DB fixtures torn down + restored+verified.

## Phase 2 — Journey regen (TARGETED, not full crawl)

**Skip evaluation (Action 2):** regen REQUIRED — `design_gap_flag: TRUE` + B-3 frontend touched (occupancy indicator + hook). Did NOT skip.

**Crawl method:** TARGETED F4 update, NOT a full prod re-crawl. Rationale (per the stage-file allowance for small additive surfaces): this wave added one endpoint + one pre-join indicator on an otherwise structurally-unchanged map; F4 / page-10 are the only touched nodes; a full re-crawl would add cost without new signal. The live behavior of the touched surface was already crawled at T-5/T-6 (prod, @playwright/test --no-sandbox) — the regen consumes that evidence rather than re-crawling.

**Regen diff vs prior map (v0.20 → v0.21):**
- **MOVED:** "who's-in-room occupancy indicator" OUT of the F4 KEEP-OUT / deferred list → INTO the live F4 pre-join flow (it shipped this wave).
- **ADDED (endpoint):** `GET /channels/:channelId/voice/participants` to F4's API inventory + a new F4 access-control note (T-8 live evidence).
- **ADDED (page inventory):** page-10 tools/modules now lists "pre-join occupancy indicator (wave-32, LIVE fail-soft)".
- **ADDED (frontmatter):** `last_updated_wave32` deployment-status annotation; version bumped 0.20 → 0.21.
- **Credential-gated state noted honestly:** indicator ships + Error/fail-soft state live-verified; populated occupancy (Empty vs Populated, real participants) deferred to founder-supplies-keys; security surface fully proven live without keys.
- **routes_added:** none (no new page route — extends page-10 / F4).
- **routes_removed:** none.
- **coverage_gaps:** F-32-T-8-1 → V-2 (non-blocking); populated-occupancy live-verify deferred (credential boundary, N-1 tripwire).

**Cross-wave regression check:** targeted — no regression to F4 or adjacent flows. The occupancy indicator is purely additive; the wave-31 voice-token flow (`POST …/voice/token`) is unchanged (still 503 on creds-unset, by design). No existing journey broke.

**Scenario smoke (Action 5):** `user-scenarios/` does not exist → not run. Not applicable.

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
journey_regen_skip_reason: ""
crawl_routes_visited: 0            # targeted F4 update; live surface crawled at T-5/T-6, consumed here (no separate re-crawl)
regen_diff:
  routes_added: []                # no new page route — extends page-10 / F4
  routes_removed: []
  coverage_gaps:
    - "F-32-T-8-1 non-UUID channelId → 500 (missing ParseUUIDPipe) → V-2 (non-blocking; also check wave-31 voice-token endpoint)"
    - "populated occupancy (Empty/Populated states) live-verify deferred — LIVEKIT_* unset (credential boundary, N-1 tripwire)"
  endpoints_added:
    - "GET /channels/:channelId/voice/participants (session + membership gated, {count, participants[]})"
  flow_updates:
    - "F4: who's-in-room occupancy indicator MOVED from KEEP-OUT/deferred → live pre-join flow"
scenarios_run: 0                  # no user-scenarios/ directory
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: 23893bf
findings:
  - {severity: low-medium, journey: F4, description: "F-32-T-8-1 malformed non-UUID channelId → 500 (generic message, no leak) instead of 400/403; missing ParseUUIDPipe; → V-2 (non-blocking). V-2 to also check wave-31 POST /channels/:channelId/voice/token (same :channelId pattern)."}
```
