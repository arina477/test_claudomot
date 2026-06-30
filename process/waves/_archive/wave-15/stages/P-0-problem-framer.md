```yaml
verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Symptom-vs-cause: @mentions is a root primitive, not a symptom patch. It is the
  documented M3 ## Scope item and feature-list #8 (Discord-parity baseline); it is
  the lightest unshipped M3 feature and reuses the LIVE messaging-core persistence +
  presence-layer membership with no new infra (no new gateway namespace). This
  advances the displace-Discord + engagement bets and sits on the messaging path M4
  offline depends on. Right primitive, right layer, right time.

  Layer check (message_mentions table vs parse-on-read): the persisted-relation
  choice is correct, not over-engineering. Parse-on-read cannot serve the
  authz-scoped GET my-mentions endpoint (no cross-user index without a relation),
  cannot drive unread-mention affordance cheaply, and re-resolves membership on every
  render. A normalized message_mentions row is the cause-layer home for "who was
  mentioned" and is what M4 offline + future notification-dispatch (feature #14) will
  read. This is the correct seam, not premature abstraction.

  Antipattern sweep (universal catalog; PRODUCT-PRINCIPLES § Antipatterns empty):
  - #3 demo-path tunnel vision: PASS. Non-happy paths are enumerated in the seed —
    edit add/remove mention, non-member tokens stay plain text, authz on my-mentions
    (no cross-user read). Edge cases are in scope, not deferred.
  - #1/#2 symptom/wrong-layer: PASS (see above).
  - gold-plating: PASS. @everyone/@here and the notification center are correctly
    OUT of scope. feature-list cleanly separates #8 (mention primitive, this wave)
    from #14 (Notifications, depends on F6 + notification-dispatch infra) — the
    framing stops at the primitive and does not pull the dispatch system forward.
  - #4 premature abstraction: PASS. Reuses existing gateway; no new namespace, no
    generalized "entity reference" framework — concrete @username only.

  Bundle coherence: the 3 tasks form ONE vertical slice of a single primitive —
  data plane (seed) + composer autocomplete (sibling) + render pills/unread
  (sibling). The two siblings are pure consumers of the seed's data + wave-14
  presence/member data; neither is an independent feature that could ship alone with
  value. This is a coherent thin slice, not scope creep through coupling
  (antipattern #5). No split warranted.
proposed_reframe: |
  n/a — PROCEED.
escalation_reason: |
  n/a — PROCEED.
sibling_visible: false
```
