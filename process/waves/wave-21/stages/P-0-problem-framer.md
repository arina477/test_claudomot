```yaml
verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  All three decomposer premises verified true against the codebase (PRODUCT-PRINCIPLES
  rule 1 — verify-seed-claims-vs-codebase). (1) ConnectionStateIndicator is genuinely
  BUILT (apps/web/src/shell/ConnectionStateIndicator.tsx, full 3-state spec) + WIRED
  (AppShell prop → MainColumn line 123 renders it) but DEAD: AppHome.tsx line 39
  hardcodes `connectionState="online"`, so the prop never reflects reality. (2)
  runDrainAndCatchup (useMessages.ts lines 134-162) calls api.getMessagesAfter ONCE,
  reads only result.items, advances the cursor in-state, and never loops on a
  nextCursor/hasMore — confirmed multi-page gap; offline windows past the first page
  silently drop messages. (3) Pending/failed UI is genuinely already shipped
  (MessageList.tsx PendingRow @1215, FailedRow @1296, dispatched @1569-1572) and is
  correctly NOT in this bundle. Symptom-vs-cause: the cause IS being targeted in both
  cases — dead indicator fixed at the data-derivation/plumbing layer (the actual
  hardcode at AppHome line 39), not by re-styling the component; the lost-messages
  symptom fixed at its cause (single-shot fetch ignoring pagination), not by raising
  the limit. No antipattern matches: no gold-plating (shipped components/UI reused, not
  rebuilt), no premature abstraction (bounded loop-until-nextCursor-null, not an
  infinite/generic paginator), no scope creep (connection-state confined to the message
  surface; the three tasks form one coherent offline-UX-completion slice on top of the
  wave-20 spine). Right problem, right layer, right size as the 2nd M4 increment: the
  wedge's spine works but is invisible + lossy past one page, both real reliability/
  visibility gaps. Tests sibling (2fe6b517) correctly covers the two new behaviors the
  wave-20 fake-indexeddb harness doesn't reach.
proposed_reframe: |
  (n/a — PROCEED)
escalation_reason: |
  (n/a — PROCEED)
sibling_visible: false
```
