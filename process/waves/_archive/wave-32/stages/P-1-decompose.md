# Wave 32 — P-1 Decompose

## Step 1 — Maximum size rubric (no trip)
| Measure | Threshold | Estimate | Trip? |
|---|---|---|---|
| Files touched | > 60 | ~6-8 (voice-participants.service + controller route + spec [server]; occupancy indicator + poll hook + tests [client]; VoiceModule wiring) | No |
| New primitives | > 60 | ~3 (participants endpoint, RoomServiceClient wiring, occupancy indicator component) | No |
| Estimated net LOC | > 5,000 | ~400 (server endpoint+mapping+tests ~200, client indicator+poll+tests ~200) | No |
| Stage-4 working set | > 350K | small (reuses wave-31 VoiceModule + LiveKit SDK docs) | No |

No maximum threshold trips.

## Step 1b — wave_type + minimum floor
- `claimed_task_ids = [78f51968]` → length 1 → **wave_type: single-spec**.
- Single-spec floor: net LOC > 1,500. Estimate ~400 → **floor UNMET**.

## Step 2b — RESCOPE-AUTO-MERGE → override-ship (M6-mvp-scope right-size)
Floor unmet, but this is the atomic occupancy slice (mvp-thinner OK — server endpoint + client indicator are one coherent slice; splitting = dead endpoint or dependent follow-up). Occupancy is a named M6 `## Scope` item + completes the drop-in loop. Expanding (presence rings / speaking / live-push) is reviewer-EXCLUDED keep-OUT. Override-ship the residual per the standing precedent (w16/w23-w29-w30-w31) + mvp-thinner's atomic ruling. `floor_merge_attempt: 0`. No BOARD.

## Step 3 — design_gap_flag
**design_gap_flag: TRUE.** The occupancy indicator (participant count + member identities/avatars) is a NEW UI element on the voice-study-room PRE-JOIN surface — it is NOT in the adopted `design/voice-study-room.html` (occupancy was split out of wave-31). → **D-block FIRES** (a BOUNDED addition — D-1 briefs just the occupancy indicator as an extension of the adopted pre-join surface, matching its dark-theme/token language; D-2 variants; D-3 adopt). Scoped small — the occupancy indicator only, not a re-design of the voice-study-room. If the D-block reviewers judge it a trivial token-driven extension, it adopts quickly.

```yaml
verdict: PROCEED (override-ship under-floor — M6-mvp occupancy right-size, expansion reviewer-excluded)
wave_type: single-spec
claimed_task_ids: [78f51968-2c48-4368-93d4-7d3f02111a7b]
max_rubric_trips: []
floor_threshold: "1500 LOC (single-spec)"
estimated_net_loc: "~400"
floor_met: false
floor_merge_attempt: 0
override_basis: "atomic M6 occupancy slice (mvp-thinner OK); expansion reviewer-excluded (presence rings/push/animations keep-OUT)"
board_convened: false
design_gap_flag: true
missing_surfaces:
  - "voice-study-room occupancy indicator: participant count + member identities/avatars on the pre-join surface — extends the wave-31-adopted design/voice-study-room.html (bounded D-block)"
external_sdk: ["livekit-server-sdk RoomServiceClient (server, api-only — already installed wave-31)"]
livekit_creds_status: "LIVEKIT_* NOT in Railway — build credential-independent (mock RoomServiceClient); live-verify deferred T/C-2. SHARPENED founder ask (P-0 + digest); N-1 tripwire (3rd cred-blocked M6 → park-or-key fork)."
security_surface: "the participants endpoint reuses the wave-31 uniform-403 membership gate (no cross-server occupancy leak) → P-4 security-scope + T-8 apply"
specs:
  - {task_id: 78f51968, layer: "backend + client", scope: "GET /channels/:channelId/voice/participants (reuse wave-31 gate → RoomServiceClient.listParticipants explicit-creds, empty→0, identity=userId→member-display w/ null fallback) + client occupancy indicator (count+identities, bounded poll) on the voice-study-room pre-join surface. D-block designs the indicator."}
```

## Exit
Single-spec (occupancy), override-ship under-floor (atomic M6-mvp slice, floor_merge_attempt 0, no BOARD), **design_gap_flag=TRUE → D-block FIRES** (bounded occupancy-indicator addition to the adopted voice-study-room surface). Security (membership-gated endpoint) → P-4 security gate + T-8. LiveKit creds not-in-Railway → credential-independent build + sharpened founder ask + N-1 tripwire. → P-2 Spec.
