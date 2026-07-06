verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Symptom-vs-cause check PASSED. Verified against apps/web/src/shell/AppShell.tsx +
  ServerRail.tsx: dmHomeActive is local useState in AppShell (line 37) whose only writer
  is the DM-rail button's onDmHome (lines 55-58); server-select (selectServer, ServerRail.tsx:237)
  and Home paths have no route to setDmHomeActive, so the AppShell ternary (line 118) keeps
  rendering <DmHome/> after a server click — first click swallowed, exactly as the seed states.
  Root cause (write-side reset gap) is correctly identified and the fix (add the reset to the
  server-select + Home handlers, or lift it into AppShell's select handler) is at the cause layer.
  Scope is correctly minimal for a verified papercut.
note: |
  The deeper "derive dmHomeActive instead of a separate boolean" cause is a real desync-prone-state
  smell (dmHomeActive + selectedId are two sources of truth that can drift — that drift IS this bug
  class). But deriving it cleanly needs a route/URL source-of-truth this shell does not yet have, and
  DM-home is not simply selectedId==null (a last-selected server persists independently). The
  state-model refactor is disproportionate to a papercut. Minimal targeted fix is right; flag the
  boolean as a recurring foot-gun for L-2 to promote if a second desync bug appears in this shell.
sibling_visible: false
