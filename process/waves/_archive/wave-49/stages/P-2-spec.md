# Wave 49 — P-2 Spec (pointer)
Spec in tasks.description of seed 1387d845. wave_type: multi-spec (4 blocks). design_gap_flag: true. claimed: [1387d845, cb81bf03, c3daf6d3, 832b83b7].
- **1387d845**: server_study_timer schema (ANCHORS ONLY, hardcoded 25/5) + compute-on-read service (derive remaining/phase, NO server timer-loop) + membership-gated start/pause/resume/reset + GET (IDOR-safe assertMember).
- **cb81bf03**: Socket.IO study-timer:update fan-out to server room + EPHEMERAL study-timer:presence roster (who's viewing; no persistence).
- **c3daf6d3**: timer widget (countdown to authoritative endsAt, phase, controls) + presence roster; dark tokens (D-3).
- **832b83b7**: phase auto-advance = broadcast-on-transition (one-shot idempotent at ends_at, self-healing, NO loop) + reconnect reconciliation (late joiner sees the same timer).
BINDING MODEL: persist anchors, compute-on-read, client counts to authoritative ends_at, no per-server timer loop (problem-framer REFRAME).
```yaml
p_stage_verdict: COMPLETE
spec_location: "tasks.description of 1387d845"
wave_type: multi-spec
design_gap_flag: true
claimed_task_ids: [1387d845-b8db-40cc-b6cb-a83d508ce3fe, cb81bf03-3472-4987-9749-86b254f89f19, c3daf6d3-01b4-4aa8-8e45-a198c456ecf3, 832b83b7-2124-475c-90bd-7dbc33f3a4f8]
```
