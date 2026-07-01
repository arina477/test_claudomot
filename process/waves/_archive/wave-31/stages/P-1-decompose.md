# Wave 31 — P-1 Decompose

## Step 1 — Maximum size rubric (no trip)
| Measure | Threshold | Estimate | Trip? |
|---|---|---|---|
| Files touched | > 60 | ~10-14 (VoiceModule + token service + route + unit tests [server]; voice-study-room component + token-fetch hook + join UI + tests [client]; @livekit deps; app.module wiring) | No |
| New primitives | > 60 | ~5 (VoiceModule, token-mint service, voice-token route, voice-study-room client component, token-fetch hook) | No |
| Estimated net LOC | > 5,000 | ~1,900 (token-mint+route+tests ~700, client join surface+hook+tests ~900, wiring+deps ~300) | No |
| Stage-4 working set | > 350K | moderate (LiveKit SDK docs + auth/rbac/channels source) | No |

No maximum threshold trips.

## Step 1b — wave_type + minimum floor
- `claimed_task_ids = [d8a85de0, 1dd1f2ca]` (occupancy 78f51968 split out at P-0) → length 2 → **wave_type: multi-spec**.
- Multi-spec floor: >2,500 LOC OR ≥6 specs. ~1,900 LOC / 2 specs → **floor UNMET**.

## Step 2b — RESCOPE-AUTO-MERGE → override-ship residual (mvp-thinner-directed, do NOT floor-fill)
Floor unmet, but expansion is reviewer-EXCLUDED: mvp-thinner emitted THIN precisely to split occupancy OUT; re-bundling it back to floor-fill would re-import the deferred affordance + defeat the split. The residual [token-mint + minimal client-join] is the minimal coherent M6-mvp-critical first slice (foundation + end-to-end de-risking). Per mvp-thinner's explicit direction + the standing override-ship precedent (product-decisions w16/w23-w29; wave-24 BOARD "do not re-litigate a Nth per-wave"), **override-ship the residual**. `floor_merge_attempt: 0`. No fresh BOARD (M6 strategic + cost decision is founder-settled: LiveKit Cloud). M6 has zero done children → mvp-thinner wins.

## Step 3 — design_gap_flag
**design_gap_flag: TRUE.** Sibling 1dd1f2ca is a NEW UI surface — the **voice-study-room client join surface** (join/leave, in-room UI, audio). `design/voice-study-room.html` is referenced in M6 `## Scope` but must be verified/authored. → **D-block FIRES** (D-1 brief → D-2 variants → D-3 adopt) for the voice-study-room surface before B-3 builds it. The token-mint (seed d8a85de0) is backend (no UI). D-block scopes to the client join surface only.

```yaml
verdict: PROCEED (override-ship residual under-floor — mvp-thinner-directed, expansion-excluded)
wave_type: multi-spec
claimed_task_ids: [d8a85de0-3015-45f0-84be-e879ccd90c91, 1dd1f2ca-7679-4fc4-a130-4a6e2fe48e41]
max_rubric_trips: []
floor_threshold: "2500 LOC OR 6 specs (multi-spec)"
estimated_net_loc: "~1900"
floor_met: false
floor_merge_attempt: 0
override_basis: "M6-mvp-critical first slice; occupancy split by mvp-thinner (do NOT re-bundle to floor-fill)"
board_convened: false
design_gap_flag: true
missing_surfaces:
  - "voice-study-room: the client join/in-room surface (join/leave, audio, minimal room UI) — design/voice-study-room.html referenced in M6 scope; verify/author at D-block"
external_sdk: ["livekit-server-sdk (server token-mint, NEW)", "@livekit/components-react (client, NEW)"]
livekit_creds_status: "LIVEKIT_* NOT in Railway (verified) — build with placeholder key; live-connect verification needs founder-supplied creds (surfaced at P-0, proactive founder heads-up; NOT blocking the build)"
security_surface: "token-mint = a credential-issuing endpoint (session + RBAC gate; API secret server-side only; short-lived room-scoped token) → P-4 security-scope gate + T-8 apply"
specs:
  - {task_id: d8a85de0, layer: server, scope: "VoiceModule + POST /channels/:channelId/voice/token — AuthGuard + canViewChannelById gate + channel-load (404/403) + voice-type check → mint short-lived room-scoped LiveKit JWT (livekit-server-sdk, placeholder key OK for build/tests). No UI."}
  - {task_id: 1dd1f2ca, layer: client, scope: "voice-study-room join surface (@livekit/components-react) — fetch token → connect-on-demand → minimal room UI. NEW UI → D-block designs it first."}
```

## Exit
Multi-spec (2 specs after occupancy split), override-ship residual (mvp-thinner-directed, floor_merge_attempt 0, no BOARD), **design_gap_flag=TRUE → D-block FIRES** (voice-study-room client surface). External SDK: LiveKit (server + client, NEW). Security surface (token-mint) → P-4 security gate + T-8. LiveKit creds not-in-Railway → build with placeholder + founder heads-up for live-connect. → P-2 Spec.
