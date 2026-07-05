# P-0 — Frame (wave-51)

## Discover section
- **wave_db_id:** 8da109d9-f6f7-4151-83dc-4ad581e810d6 (wave_number 51, running, milestone M8)
- **Prior-work:** wave-46 V-2 T-6 finding F9 (the source of this seed). DM feature shipped waves 46-48.
- **Roadmap milestone:** M8 — Educator tools & deeper academics (in_progress). Seed pre-assigned M8; waves.milestone_id set at open.
- **Spec-contract short-circuit:** no-prior-spec (prose seed) → full P-1..P-3.
- **Product-decision resolutions:** none (cosmetic layout).

## Reframe section
**Original framing (seed 39fc1c5e):** "DM route app shell renders the empty ~260px channel-sidebar column from the 4-col layout; gate it off route-aware → canonical 3-panel."

**problem-framer (a517eb10) — REFRAME (framing-precision, scope sound):** verified the geometry (ServerRail 72 + ChannelSidebar 260 + DmConversationList 320 → DmThread flex-1 = 372px @1024; gating the sidebar → 632px canonical). **Two premise corrections:** (1) the ChannelSidebar is NOT empty on the DM surface — it renders the STALE previously-selected server's channel list (or a "Select a server" placeholder) — irrelevant to DMs, not blank; (2) "route-aware / DM route" is misleading — DM is a component STATE toggle (`dmHomeActive`, AppShell.tsx:37), NOT a router route (risk: a fixer adding non-existent router plumbing). **Right-layer fix (confirmed):** extend the existing `{!dmHomeActive && ...}` guard — already used for `MemberListPanel` at AppShell.tsx:122 — to gate the ChannelSidebar desktop wrapper (AppShell.tsx:64-69) AND its mobile overlay drawer (82-106). Component-state conditional render — not routing, not CSS-hide, not a layout framework. Re-check thread no-wrap at 1024 + 1280, plus the mobile (<lg) DM drawer path. No RESCOPE, no ESCALATE.

**ceo-reviewer (a4455687) — PROCEED / HOLD-SCOPE:** right-sized cosmetic debt-clear on the shipped DM surface; traces to the bet (DMs load-bearing per the M8 metric). Don't expand (bolting the focus-room on would repeat the anticipatory-scope antipattern). **Sequencing signal (flag, not blocker):** 7 DM-polish stragglers + a deferred focus-room — pivot back to the focus-room headline within 1-2 waves rather than draining all 7; surface at a future N-1 / founder checkpoint.

**mvp-thinner (a93c79fd) — OK (floor_constraint_active):** single indivisible AC (route-conditional + full-width thread + 1024/1280 re-check are inseparable). mvp-critical DM metric already shipped → this is cosmetic debt, no sub-scope to defer. Not OVER-CUT (minimum coherent slice). Fences: geometry only — no DM redesign, no conversation-list/composer/thread-internals, no breakpoints beyond 1024/1280, do NOT fold in sibling DM todos.

**Mediation:** none (no expansion proposed; mvp OK).

**REFRAME disposition — PROCEED with corrected framing (no re-spawn):** the problem-framer REFRAME is a framing-PRECISION correction (the exact fix + accurate premise), NOT a wrong-problem finding — ceo-reviewer + mvp-thinner already judged the correct DM-layout-debt substance (PROCEED/OK), and problem-framer confirmed scope sound + handed the precise implementation. Re-spawning all 3 (Action 6 REFRAME edge) would be disproportionate process-for-process — the correction sharpens the framing P-2/P-3 will encode, without changing disposition or scope. Rationale documented here.

**Disposition: PROCEED.**

**Final framing (rest of P-block uses this):** On the DM surface (component state `dmHomeActive`, not a route), gate off the stale server ChannelSidebar so the DM surface is the canonical 3-panel (ServerRail + DmConversationList + DmThread) and the thread gets full canonical width. Fix = extend the existing `{!dmHomeActive && ...}` guard (mirror MemberListPanel at AppShell.tsx:122) to the ChannelSidebar desktop wrapper (AppShell.tsx:64-69) + mobile overlay drawer (82-106). Verify DmThread no-wrap / full width at 1024 + 1280 and the mobile (<lg) DM drawer path unaffected. **Fences:** geometry/gating only — no DM redesign, no conversation-list/composer/thread-internals changes, no new breakpoints, no sibling DM todos. claimed_task_ids = [39fc1c5e]. **Design:** restores the ALREADY-canonical 3-panel DM layout (no new mockup) → design_gap_flag likely false (P-1 confirms).
