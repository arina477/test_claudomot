# P-2 — Spec (wave-51) — POINTER

**Source of truth:** spec contract in `tasks.description` of **39fc1c5e-7fcc-473a-9f50-71cdb53f8759** (YAML head + prose).

**wave_type:** single-spec. **claimed_task_ids:** [39fc1c5e]. **design_gap_flag:** false.

## ACs
- DM surface (state `dmHomeActive`) renders canonical 3-panel (ServerRail + DmConversationList + DmThread); NO server ChannelSidebar.
- DmThread full canonical width (632px @1024), no message wrap at 1024/1280.
- Stale server channel list / "Select a server" placeholder NOT shown on DM surface.
- Mobile (<lg) DM path: ChannelSidebar overlay drawer gated off; DM nav unaffected.
- Server↔DM toggle: ChannelSidebar present in server view, absent on DM; no flash/orphaned column. Server view unchanged (no regression).

## Contracts
None (UI layout only — no API/schema/type/SDK change).

## Fix
Extend the existing `{!dmHomeActive && ...}` guard (mirror MemberListPanel at AppShell.tsx:122) to gate the ChannelSidebar desktop wrapper (AppShell.tsx:64-69) + mobile overlay drawer (82-106). Component-state conditional render — not routing/CSS-hide/framework.

## Scope-fence
Geometry/gating only. No DM redesign, no conversation-list/composer/thread changes, no new breakpoints, no sibling DM todos.
