# Wave 13 — P-block review artifacts
**Block:** P · **Wave topic:** M3 message lifecycle — edit/delete + reactions + UI · **Gate:** P-4 · **Status:** in-progress
| Stage | Deliverable | Status |
|---|---|---|
| P-0 | stages/P-0-frame.md | done (PROCEED; edit/delete-authz + soft-delete + room-fan-out flags; design TRUE; M3-before-M4 confirmed) |
| P-1 | done (multi-spec, whole lifecycle; security→P-2) |
| P-2 | done (3-block; edit/delete authz + reactions + soft-delete ACs) |
| P-3 | done (edit/delete + reactions endpoints + gateway events + UI; D-delta) |
| P-4 | done | PASS (head-product APPROVED; Karen+jenny APPROVE; carry: serverId-resolve, postgres-pro, table-name-override) | |
## Context
- wave_db_id 9e3cf3bc (wave 13); M3 6198650e. claimed [e12886d7 edit/delete(seed), d78df376 reactions, f323a71f UI]. multi-spec. Reuses wave-12 MessagingModule + /messaging gateway + ChannelMessageGuard (no new namespace/auth surface). UI wave → D-block (edit/delete tombstones + reactions UI).
- SECURITY: edit/delete authz (author-only? + manage_messages role perm?); reactions (channel-member, via the channel-gate). Realtime fan-out (message:updated/deleted/reaction via the existing gateway). T-8 (authz + the wave-11 fixture live-probe). PUSH after each B/D stage. Autonomous mode: automatic.
