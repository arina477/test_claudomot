# T-9 — Journey (wave-34, M6 FINAL: screen-share LIVE + audio-only shipped-not-reachable)

**Wave:** 34 · **Block:** T · **Stage:** T-9 (block-exit gate) · **Mode:** automatic
**Phase 1 verdict:** APPROVED (fresh head-tester; verdict at `process/waves/wave-34/blocks/T/gate-verdict.md`)

## Phase 1 — Gate summary
The ceo NON-NEGOTIABLE (live 2-participant voice verification against real LiveKit) genuinely passed for screen-share: two DISTINCT prod users co-present in one SFU room (server-corroborated via `RoomServiceClient.listParticipants`=2), screen-share track server-accepted (A's SFU track set gained `SCREEN_SHARE/VIDEO` on share, lost it on stop), B rendered the prominent tile + reverted with no orphan. This is genuine PROVEN-LIVE two-client verification (sender ≠ receiver), the first live LiveKit connection in StudyHall history. The HIGH audio-only finding is correctly classified (real product gap: `enterManual()` unwired + auto path non-headless → spec-2 AC1 unverifiable-live AND un-invokable) and honestly routed to V-2, not swept as a test-limit or claimed green. T-8 security adequate (grant widening live in JWT, auth matrix + IDOR pair intact, secrets clean). Coverage honest (T-6 layout match, T-1..T-4 CI-verified, media-plane boundary documented as deferred). See gate-verdict.md for the full rationale.

## Phase 2 — Journey regen

**Action 2 skip evaluation:** regen REQUIRED, not skipped — the wave touched the UI surface (`design_gap_flag: true`, D-block fired canonicalizing `design/screen-share-tile.html` + `design/audio-only-state.html`, B-3 Frontend ran adding the screen-share tile + `AudioOnlyBanner` to `VoiceStudyRoom.tsx`).

**Regen mode: TARGETED (not full re-crawl).** Justification: a single additive in-room surface (screen-share tile + audio-only banner) on an otherwise structurally-unchanged map. F4 (voice flow) + page-10 (voice/video study room) are the only touched nodes, and their live evidence is already captured — T-5 drove the 2-participant screen-share against prod (server-truth + DOM) and T-6 captured the tile layout at 1440/1280/1024. A full prod re-crawl of the unchanged routes (auth, servers, messaging, assignments, offline, roles) would add cost without new signal. This mirrors the wave-32 targeted-F4 precedent.

### Regen diff vs prior map (v0.21 → v0.22)
- **F4 flow (line ~221):** added `share screen (wave-34, LIVE)` to the in-room flow; added a "LiveKit connection now LIVE" bullet (keys supplied; voice actually connects for the first time).
- **Screen-share MOVED out of the F4 KEEP-OUT/deferred list** into the live in-room flow (PROVEN LIVE 2-participant). New bullet documents the prominent-tile publish/subscribe/revert + the API token-grant widening.
- **Low-bandwidth/audio-only downgrade MOVED out of the F4 KEEP-OUT list** into the flow — annotated with its HONEST state: shipped + unit-tested + audio-invariant-proven-live, but NO user-reachable trigger (dead UI), HIGH → V-2.
- **New F4 access-control note** (screen-share T-8 security): grant widening live in JWT, auth matrix intact, IDOR pair 403/200, secret server-side.
- **KEEP-OUT list trimmed + re-scoped** to genuinely-still-out items (camera/video grid, presence rings, reconnection UI, multi-room, annotation/drawing, multi-share grid, quality selector, recording).
- **Page-10 table row:** added screen-share tile (LIVE) + audio-only banner (shipped-not-reachable, HIGH → V-2) to the components column.
- **New `last_updated_wave34` header annotation** + version bump 0.21 → 0.22.

```yaml
routes_added: []            # no new route/screen — additive in-room surface on existing page-10
routes_removed: []
coverage_gaps:
  - "audio-only fallback has no user-reachable trigger in prod (enterManual unwired) — HIGH, carried to V-2"
```

### Cross-wave regression check
No regression. F4 pre-join occupancy indicator (wave-32) + malformed-UUID→400 robustness (wave-33) unchanged. Every prior flow (F1–F9) structurally intact; the only deltas are additive (screen-share in-room, audio-only banner). The audio-only-not-reachable state is a NEW-this-wave shipped-but-incomplete gap (declared in spec-2 scope), not a break of a previously-working journey — routed to V-2 as a significant finding, not a critical hard-stop.

### Scenario smoke
`user-scenarios/` directory does not exist → no scenario smoke run.

## Findings (this stage)
No new T-9 findings. The three carried findings (1 HIGH audio-only-not-reachable, 1 low aria-label empty-name, 1 info two-sharer-not-exercised) originate at T-5/T-6 and are already in `findings-aggregate.md` routed to V-2. T-9 confirms the journey map honestly reflects the HIGH finding's shipped-but-not-reachable state rather than papering over it.

## F1–F9 smoke coverage (block-exit confirmation)
Every flow has ≥1 smoke assertion in the canonical map: F1 signup/onboarding (live), F2 messaging (M3 two-client <1s live), F3 servers/channels (live E2E), **F4 voice (wave-34: screen-share PROVEN LIVE 2-participant; audio-only shipped-not-reachable HIGH→V-2)**, F5 offline-first (fake-indexeddb + CI), F6/F9 assignments+reminders (live), F7 create-server (authed E2E), F8 invites (live gate). No flow lacks a smoke assertion.

---

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
journey_regen_skip_reason: ""
crawl_routes_visited: 0            # targeted regen from T-5/T-6 live evidence, not a fresh full crawl
regen_diff:
  routes_added: []
  routes_removed: []
  coverage_gaps: ["audio-only fallback has no user-reachable trigger in prod (HIGH → V-2)"]
scenarios_run: 0                   # no user-scenarios/ directory
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: 6921f580f1557f14dea53808cc9c4e8df23a1c7e
findings:
  - {severity: high, journey: F4, description: "audio-only fallback shipped but has no user-reachable trigger in prod (enterManual unwired, auto path non-headless); spec-2 AC1 unverifiable-live + un-invokable — carried to V-2 for head-verifier adjudication before M6 close"}
  - {severity: low, journey: F4, description: "screen-share tile aria-label empty name (LiveKit participant .name unset on mint; lacks identity/Someone fallback) — cosmetic a11y, cross-ref T-6, V-2"}
  - {severity: info, journey: F4, description: "two-simultaneous-sharer edge case not exercised (single publisher this run); single-share prominent path proven, multi-share by construction takes remoteScreenShareTracks[0]"}
```

## head-tester block-exit sign-off

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-9
  reviewers: {phase1_gate: head-tester-fresh-spawn}
  failed_checks: []
  rationale: >
    T-block exits APPROVED. The ceo-mandated live 2-participant screen-share verification is genuine
    PROVEN-LIVE (two distinct SFU-corroborated userIds, server-accepted screen_share track publish +
    clean revert, receiver-rendered prominent tile — not one client's echo), the first live LiveKit
    connection StudyHall has achieved. The HIGH audio-only-not-user-reachable finding is honestly
    surfaced (real product gap, not a test-limit) and flows to V-2 — the gate PASSES with it because
    coverage is adequate and the suite is honest, not because findings are zero. Security is proven
    live, layout matches design, CI tiers green, and the media-plane boundary is documented as deferred.
    The journey map is regenerated (targeted F4/page-10, justified) — screen-share + audio-only MOVED
    out of KEEP-OUT into the live flow, audio-only annotated with its honest shipped-not-reachable state,
    version bumped 0.21 -> 0.22. No FAIL scenario left unrouted, no realtime claim on a single client,
    no green-by-assertion. Carried to V-2/N: the HIGH audio-only finding gates head-verifier's spec-2
    AC1 adjudication; N-block close of M6->M7 is CONDITIONAL on that disposition. No measured pause
    trigger (b/d/e/f) fired.
  next_action: PROCEED_TO_V_BLOCK
```
