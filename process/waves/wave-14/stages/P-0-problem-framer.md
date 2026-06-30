verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Symptom-vs-cause (mandatory): presence is a CAUSE-layer primitive, not a symptom-patch.
  The full message lifecycle (send/list/edit/delete/reactions) is LIVE; the documented next
  M3 ## Scope clause is "presence + typing (/presence namespace), member list with presence,"
  and feature-list line 7 bundles "send/receive, presence, typing" as one P1 feature. Page 9
  (server-channel-view) already declares `presence` as a dependency. So the wave builds the
  right thing at the right layer (new Socket.IO namespace + presence state), not a UI veneer
  over a missing data plane.

  Antipattern sweep — all clear:
  - #2 wrong-layer: NO. Presence is correctly a server-side namespace + state primitive that
    the UI siblings consume; fix lives at the transport/state layer where the gap is.
  - #3 demo-path tunnel vision: NO. Seed explicitly enumerates the hard paths — multi-tab via
    per-user socket ref-counting, snapshot-on-join, offline transition, and co-member scoping
    so presence never leaks to non-co-members. These are the exact edge cases a naive presence
    impl drops; their presence in the seed is the opposite of tunnel vision.
  - #4 premature abstraction: NO. One concrete /presence namespace with one client/store reused
    across both UI siblings — a single shared primitive, not a generalized framework.
  - #6 config drift: NO new knobs/flags introduced.
  - #7 validation theater: NO. WS-upgrade auth is a real system boundary (cookie verification at
    connect, reject unauthenticated) — boundary validation, not "just in case" guards.
  - #5 scope creep / RESCOPE-AUTO-SPLIT: considered and REJECTED. The 4 tasks are one coherent
    slice, not bundled-unrelated-changes. Seed (namespace + online/offline state + snapshot/
    fan-out) is the shared foundation; typing rides the same namespace; member-list + author-dots
    consume the same presence store. Splitting typing/dots to a later wave would strand the seed's
    namespace with no consumer surface and force a second presence-client wiring pass — higher net
    cost. WIP discipline is already exercised UPSTREAM: threads, mentions, attachments deliberately
    deferred per the decomposition rationale. The bundle is the minimum coherent presence slice.

  Multi-tab ref-counting is correctly-sized, NOT gold-plating: it is the known-correct presence
  pattern (a user with 2 tabs must not flip offline when one closes). Omitting it would ship a
  visibly-broken presence (#3 demo-path) — so it is mvp-critical, not over-engineering.

  Strategic note (out of my lane, deferred to ceo-reviewer): presence is table-stakes Discord-core
  and advances the displace-Discord bet; the offline-first wedge is served downstream (M4 builds on
  this messaging/presence path). I flag this only for the merge; ambition judgment is ceo-reviewer's.

proposed_reframe: |
  (n/a — PROCEED)

escalation_reason: |
  (n/a — PROCEED)

sibling_visible: false
