# Wave 8 — P-block review artifacts
**Block:** P · **Wave topic:** M2 invites + join-flow (the multi-user core) · **Gate:** P-4 · **Status:** in-progress
| Stage | Deliverable | Status |
|---|---|---|
| P-0 | stages/P-0-frame.md | done (PROCEED; 4 security flags; design_gap_flag TRUE-delta) |
| P-1 | stages/P-1-decompose.md | done (multi-spec, whole, security→P-2) |
| P-2 | done (4-block spec; security encoded) |
| P-3..P-4 | pending | |
## Context
- wave_db_id 44af7dae (wave 8); M2 41e61975. claimed [c7443638 seed (invite backend), 77e2041a (invite-preview+join API), 72fc08ea (invite-join page), 54407e1d (invite-create UI)]. multi-spec (4 tasks, ~2800 LOC). **UI wave → D-block likely** (invite-join page + invite-create/share UI). Builds on wave-7 servers/channels.
- M2 success metric: organizer invites cohort → members join → see channels. This bundle makes M2 MULTI-USER. NO RBAC/kick-ban/settings (later). Autonomous mode: automatic. RESTART-LESSON: push branch after each major B/D stage.
