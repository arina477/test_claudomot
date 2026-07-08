# T-9 — Journey (wave-78)

**Pattern:** B — Active-execution (Phase 2). Phase 1 = fresh head-tester gate spawn.

## Phase 1 — head-tester gate verdict
Fresh `head-tester` spawned (agentId ab8c85b7). Verdict written to `process/waves/wave-78/blocks/T/gate-verdict.md`.

**Verdict: APPROVED (attempt 1).** head-tester independently verified in source: the fail-closed branch (`MemberProfileCard.tsx` L215 is a true allowlist — only non-HttpError throw OR 5xx retries; every other status → byte-identical hidden) and the CI 403→hidden guard test (`member-profile-card.test.tsx` L184-198 asserts real DOM — hidden copy present, retry button absent — so a fail-open mutation fails it). Judged legitimate: T-8's live-403-via-client-injection (server has no 403 path; client injection is the only honest way to prove the client arm), T-7 SKIP, and the 3 non-blocking findings routed to V-2. No coverage theater, no mock-the-SUT (T-4 reads NULL back through a separate harness connection), no single-client (no realtime path this wave), no flaky-retry masking. Cascade: no rework; no downstream re-run.

## Phase 2 — Action 2 skip evaluation
Regen is **REQUIRED** (not skipped): `wave_type` includes `ui` AND B-3 Frontend touched `MemberProfileCard.tsx` + `ProfilePage.tsx`. Per head-tester's gate note, the correct disposition is **annotation-only regen** — this wave adds NO new route / screen / endpoint (`/settings/profile` editor, MemberProfileCard, GET+PATCH /profile all pre-exist from wave-77); what changed is the state inventory of an existing surface (card 4→5 states) and an existing editor control becoming functional (empty-option now clears). Crawl still ran (via the live T-5/T-6 probes) to confirm zero accidental route drift.

## Phase 2 — Crawl + regen diff
Live crawl evidence gathered across T-5 (editor at /settings/profile; card LOADED via roster in Fixture Proof Server) + T-6/T-8 (card ERROR/HIDDEN states via client interception). Route inventory vs the wave-77 map:
- `routes_added: []` — no new route.
- `routes_removed: []` — nothing removed.
- `coverage_gaps: []` — every changed surface reached by a live probe.

Journey map updated in-place: the `## [wave-77] Cross-server member profile card` entry now lists the 5th card state (retryable transport error, amber DS accent, distinct from hidden) and marks the editor empty-option functional (clears academicRole → SQL NULL). Hidden state noted byte-identical. A `last_updated_wave78` annotation captures the full T-block evidence. Committed to main.

## Phase 2 — Cross-wave regression check
No regression. The two changes are precisely the two LOW findings wave-77 carried to V-2 (restore-to-unset gap; transient-error-looks-hidden). Both intentional (declared in this wave's spec ACs) → journey update entry, not findings. The hidden state stays byte-identical (proven live T-8 Probe C/D) — no privacy-oracle regression. GET /profile/:userId 200/404/401 behavior unchanged; PATCH /profile now additionally accepts null/''→null (200) without breaking the enum path (400) or username-conflict (409).

## Scenario smoke
No `user-scenarios/` directory present → scenario smoke N/A (recorded).

## Findings
No new T-9 findings. The 3 prior findings (all non-blocking) carry to V-2 via findings-aggregate.

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
journey_regen_skip_reason: ""
crawl_routes_visited: 2   # /settings/profile editor + member card surface (live, via T-5/T-6/T-8 probes); zero-route-delta annotation
regen_diff:
  routes_added: []
  routes_removed: []
  coverage_gaps: []
scenarios_run: 0
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: f1adaf354c2fd122df2a7842b96a06704f539ac9
findings: []
```
