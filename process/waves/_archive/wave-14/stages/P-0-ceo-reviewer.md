verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  Wave-14's 4-item bundle (presence namespace + typing + member-list panel + author presence dots)
  maps 1:1 onto M3's `## Scope` clause "presence + typing (/presence namespace), member list with
  presence" — no more, no less. NOT scope-expansion: adding idle/away or rich-presence would gold-plate
  past the documented milestone scope and isn't justified by any live bet at self-use-mvp (founder is the
  sole user). NOT selective-expansion: there is no cheap-but-disproportionate single add — typing and
  member-list are already in-bundle, and they are the high-leverage pair. NOT scope-reduction: dropping
  any of the four leaves presence half-built — presence state with no member-list to render it is
  invisible, and typing rides the same /presence namespace for near-zero marginal cost. The scope is
  exactly right; the bar here is execution quality, not ambition calibration.
bet_traced_to: "Academic tools + offline-first win students from Discord"
milestone_traced_to: "6198650e-f4e0-44dc-9b0a-6550f01f9f82 — M3 — Real-time messaging (in_progress)"
proposed_scope_change: |
  None. Scope held as decomposed.
notes: |
  - Strategic alignment: STRONG. The live bet's product definition names "real-time messaging" and
    "member presence" as core; North Star is weekly active students collaborating. Presence + member-list
    is the Discord-parity conversational primitive that makes a channel feel alive — directly serves the
    displace-Discord wedge, not a side-quest. M4 (offline-first, the wedge) builds on this messaging path.
  - Ambition calibration: 8-9/10 coherent slice, correctly bounded. Shipping all four is the minimum
    coherent unit (presence is only perceptible when rendered in the member-list + author rows; typing is
    the cheap same-namespace pairing). idle/away and rich-presence are correctly OUT (not in M3 scope, no
    bet pull at self-use-mvp) — including them would be grandiose. Nothing load-bearing is missing.
  - In-house realtime check: building presence on the in-house Socket.IO /presence namespace (vs a vendor
    presence service) does NOT reopen a strategic question. The locked v6b architecture already provisions
    exactly two namespaces (/messaging, /presence); seed reuses the wave-12 /messaging WS-upgrade auth
    path. No live bet argues for buying realtime; in-house is the documented stack decision. Fits.
  - "Fixing a real thing that doesn't matter" risk: NONE. Presence is core conversational UX, not trivial
    polish — it is a documented milestone scope item on the active milestone serving the only live bet.
  - WIP discipline is sound: threads, mentions, attachments deliberately deferred to later M3 waves —
    correct bundle-bloat avoidance, consistent with the prior M3 decomposition pattern.
sibling_visible: false
