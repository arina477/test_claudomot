# Wave 14 — P-2 Spec (pointer)

**Source of truth:** `tasks.description` of seed `d1c4693d-b793-4960-8adf-f561aad20677` (YAML head + `---` + prose).
**wave_type:** multi-spec (3 blocks). **design_gap_flag:** true.
**claimed_task_ids:** [d1c4693d (presence namespace), 58633934 (typing), 058984c5 (member-list panel)]

## AC summary (per block)
- **d1c4693d /presence:** namespace w/ WS-upgrade auth (reuse 723b5b6a); online on first socket, offline on last (per-user ref-count, multi-tab safe); presence:online/offline fan out membership-scoped (NO leak); presence:snapshot on join; self-presence stable across tabs.
- **58633934 typing:** composer typing:start throttled ~1/3s + typing:stop on send/blur/idle; recipients viewing channel see "<name> is typing…" auto-expiring ~5s; aggregate >3 → "Several people…"; channel+membership-scoped (no leak).
- **058984c5 member-list:** right panel grouped Online/Offline, avatar+name+presence-dot; consumes snapshot + incremental events live (no reload); real server membership (existing source); responsive/collapsible ≤1024px.

**Security (T-8/P-4 tightened):** all presence+typing events membership-scoped; two-authenticated-client fan-out + no-leak verification.
