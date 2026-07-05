```yaml
verdict: REFRAME
verdict_source: problem-framer
matched_antipatterns: [1, 2]
symptom_vs_cause: |
  Ran (mandatory). Seed diagnoses a SYMPTOM ("empty channel-sidebar column")
  and a plausible cause layer ("app shell renders the column unconditionally"),
  but the verified cause differs on two load-bearing details:
    (1) The column is NOT empty — the ChannelSidebar (apps/web/src/shell/AppShell.tsx
        lines 64-69) renders the *selected server's* channel list, or a "Select a
        server from the rail" placeholder when none is selected (ChannelSidebar.tsx
        lines 316-322). On the DM surface this is a stale/irrelevant SERVER column,
        not a blank one. The real cause is: the ChannelSidebar wrapper is not gated
        on the DM state, so it leaks the server-context channel list into the DM
        surface.
    (2) There is NO "DM route." DM is a component-STATE toggle (`dmHomeActive`,
        AppShell.tsx line 37), not a URL route. "Route-aware layout" mis-describes
        the fix layer and risks a fixer introducing router plumbing that does not exist.
  Geometry cause is CORRECT and verified: ServerRail 72 + ChannelSidebar 260 +
  DmConversationList (lg:w-[320px]) 320 leaves DmThread flex-1 = 1024-72-260-320 =
  372px at 1024px viewport — exactly the seed's "~372px". Gating the ChannelSidebar
  off yields 1024-72-320 = 632px, restoring the canonical 3-panel DM geometry.
reasoning: |
  The seed's fix layer is right (app-shell conditional render, not CSS) but its
  premise wording is wrong in a way that will misdirect the fixer. Matched
  antipattern #2 (wrong-layer framing: "route-aware" implies routing where only
  state exists) and #1 (symptom-vs-cause: "empty column" mis-states what renders).
  The correct, verified fix is a one-line-shape change mirroring the pattern
  ALREADY used for MemberListPanel at AppShell.tsx line 122 (`{!dmHomeActive && ...}`):
  gate the ChannelSidebar desktop wrapper (lines 64-69) AND the mobile overlay
  drawer (lines 82-106) on `!dmHomeActive`. No CSS-hide, no router, no layout
  framework. This is a REFRAME (recoverable, same layer) not a RESCOPE — scope
  stays one cosmetic geometry fix.
proposed_reframe: |
  On the DM surface (`dmHomeActive === true` in apps/web/src/shell/AppShell.tsx),
  the shell still renders the ServerRail-adjacent ChannelSidebar column (260px),
  which shows the previously-selected server's channel list (or a "Select a server"
  placeholder) — irrelevant on the DM surface, which already has its own
  conversation-list rail (DmConversationList, lg:w-[320px]). This produces a
  4-column DM layout; at 1024px the DmThread (flex-1) is squeezed to ~372px and
  message content wraps.

  Root cause (verified): the ChannelSidebar wrapper (AppShell.tsx lines 64-69) and
  its mobile overlay drawer (lines 82-106) are NOT gated on `dmHomeActive`, unlike
  MemberListPanel which is already correctly gated at line 122 (`{!dmHomeActive && ...}`).

  Fix (right layer — component-state conditional render, NOT routing, NOT CSS-hide):
  extend the existing `{!dmHomeActive && ...}` guard to the ChannelSidebar desktop
  wrapper and mobile drawer so both are unmounted when the DM surface is active.
  This drops the column from layout, giving DmThread the full canonical width
  (632px at 1024px).

  Expected: DM surface renders exactly 3 panels — ServerRail (72) + DmConversationList
  (320) + DmThread (flex-1). Re-check thread geometry and no-wrap at BOTH 1024px and
  1280px (design-system breakpoints §9), and confirm the mobile (<lg) DM drawer path
  is unaffected. Cosmetic, non-blocking.

  Do NOT: introduce a router/route abstraction (DM is a state toggle, not a route);
  hide the column via CSS `display:none` (leaves the stale ServerContext subscription
  mounted and still reserves nothing but risks re-layout bugs — unmount cleanly like
  MemberListPanel does conceptually, though note MemberListPanel uses CSS-hide for
  socket-persistence reasons that do NOT apply to ChannelSidebar on the DM surface).
notes: |
  Verified against code per PRODUCT-PRINCIPLES rule 1 (seed-claim verification).
  Files read: AppShell.tsx, ChannelSidebar.tsx, DmHome.tsx; widths grepped from
  DmConversationList.tsx (lg:w-[320px]) + DmThread.tsx (flex-1). Scope is sound and
  wave-worthy — real user-visible polish on the shipped DM surface; not trivially
  small, not scope-creeping.
sibling_visible: false
```
