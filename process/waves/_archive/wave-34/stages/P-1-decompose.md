# Wave 34 — P-1 Decompose

## Step 1 — Maximum size rubric (no trip)
| Measure | Threshold | Estimate | Trip? |
|---|---|---|---|
| Files touched | > 60 | ~6-10 (voice-token.service.ts grant + its spec; VoiceStudyRoom.tsx screen-share publish/tile + audio-fallback subscription logic; maybe a small hook/component; tests: unit + integration + live e2e) | No |
| New primitives | > 60 | ~3 (screen-share track publish/tile, ConnectionQuality-driven fallback controller, audio-only-state UI) | No |
| Net LOC | > 5,000 | ~1,800-2,600 (client-heavy; minimal API — grant + spec) | No |
| Stage-4 working set | > 350K | small (wave-31 VoiceStudyRoom + LiveKit SDK docs) | No |

No maximum threshold trips.

## Step 1b — wave_type + minimum floor
- `claimed_task_ids = [e9cd341a, 61e52c3e]` → length 2 → **wave_type: multi-spec**.
- Multi-spec floor: net LOC > 2,500 **OR** claimed_task_ids ≥ 6. Estimate ~1,800-2,600 (straddles 2,500); task count 2 (<6). If LOC lands <2,500 → floor UNMET.

## Step 2b — floor evaluation → override-ship (metric-close, expansion excluded)
Floor borderline/likely-unmet (~1,800-2,600 vs 2,500; 2 tasks < 6). Expansion analysis: mvp-thinner ruled BOTH pieces mvp-critical + explicitly keep-OUT the only expansion candidates (annotation/multi-share/recording for screen-share; per-track/heuristic-depth for audio-fallback). These 2 tasks are the LAST unbuilt M6 metric clauses — no coherent credential-independent expansion exists (M6's other scope is non-metric polish, deferred). So decomposition-expand is futile/excluded. **Override-ship** per the standing precedent (wave-24 do-not-relitigate; applied w25-w33) — this is the metric-closing slice. `floor_merge_attempt: 0`. No BOARD. (If the actual B-block LOC lands >2,500 the floor is met outright; either way PROCEED.)

## Step 3 — design_gap_flag
**design_gap_flag: TRUE.** Two NEW visual surfaces on the voice-study-room:
1. **Screen-share tile** — a distinct, prominent tile rendering a subscriber's screen-share track (larger/emphasized vs. participant avatar tiles). NOT in the wave-31/32 adopted design (which is audio-only avatars + occupancy).
2. **Audio-only-state UI** — the surfaced "degraded to audio-only" state + a restore-video affordance (a banner/pill + control) when bandwidth drops.
→ **D-block FIRES** (bounded additions to the adopted voice-study-room surface: screen-share tile + audio-only-state indicator/control). D-1 briefs both; matches the dark-theme/token language.

```yaml
verdict: PROCEED (override-ship under-floor — metric-closing M6 slice; expansion mvp-excluded; precedent-application)
wave_type: multi-spec
claimed_task_ids: [e9cd341a-a093-459a-8ffb-72ba82e7a1ab, 61e52c3e-689a-4837-9cec-a08f1b051171]
max_rubric_trips: []
floor_threshold: "2500 LOC OR >=6 tasks (multi-spec)"
estimated_net_loc: "~1800-2600 (straddles floor)"
floor_met: borderline
floor_merge_attempt: 0
override_basis: "metric-closing M6 slice (screen-share + audio-fallback = last 2 metric clauses); mvp-thinner ruled both mvp-critical + expansion keep-OUT; wave-24 do-not-relitigate precedent"
board_convened: false
design_gap_flag: true
missing_surfaces:
  - "screen-share tile: distinct prominent tile rendering a subscriber's screen-share track on the voice-study-room in-room surface (new; extends design/voice-study-room.html)"
  - "audio-only-state UI: degraded-to-audio banner/pill + restore-video affordance on the in-room surface (new)"
external_sdk: ["@livekit/components-react screen-share publish/subscribe + ConnectionQuality + subscription control (client, already installed w31); livekit-server-sdk AccessToken grant extension (screen_share source, api)"]
security_surface: "the API token grant is extended to permit screen_share publish — a capability change on an auth-gated token-mint; T-8 re-probe the token grant (only members get screen_share; secret server-side unchanged)"
livekit_creds_status: "LIVE (founder-provided; both Railway services redeployed). Build + LIVE-verifiable. ceo flag: live-verification NON-NEGOTIABLE (2 participants + screen-share render/revert + poor-bandwidth degrade/restore)."
specs:
  - {task_id: e9cd341a, layer: "api + client", scope: "screen-share TWO-LAYER: (api) extend AccessToken canPublishSources to add SCREEN_SHARE[+_AUDIO] + update voice-token.service.spec.ts:156; (client) @livekit/components-react screen-share publish/subscribe in VoiceStudyRoom.tsx (start/stop, prominent tile, clean revert). D-block designs the tile."}
  - {task_id: 61e52c3e, layer: "client", scope: "audio-only fallback: on ConnectionQuality drop OR manual opt-in toggle, unsubscribe/pause inbound video (camera + screen-share), keep audio, surface audio-only state + restore-video path on recovery. D-block designs the state UI. keep-OUT: per-track granularity, custom bandwidth heuristics, quality tiers, persisted pref."}
```

## Exit
multi-spec (screen-share + audio-fallback), override-ship under-floor (metric-close, expansion mvp-excluded, floor_merge_attempt 0, no BOARD). **design_gap_flag=TRUE → D-block FIRES** (screen-share tile + audio-only-state UI). Screen-share is 2-layer (API grant + client). Security: token-grant capability change → P-4 security-scope + T-8 re-probe. LiveKit LIVE → live-verification MANDATORY (ceo). M6-close→M7 (N-block). → P-2 Spec (multi-spec template, per-task blocks).
