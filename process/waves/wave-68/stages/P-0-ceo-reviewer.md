```yaml
verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  HOLD-SCOPE, not the other three. Not SCOPE-EXPANSION: the wave-67 read-half is
  already shipped but INERT (directory permanently empty in prod — nothing can be
  made public); the single highest-leverage move is precisely the write-half in this
  bundle. Expanding beyond publish-toggle + PATCH + memberCount fix (ranking,
  categories, trending, moderation) sorts an empty shelf at ~0 users and front-runs
  demand that does not yet exist — same premature-at-zero-users bar the reviewer trio
  has repeatedly enforced (waves 56/59/66/67). Not SELECTIVE-EXPANSION: there is no
  single cheap-but-disproportionate add — the one genuinely disproportionate item
  (moderation) is NOT cheap and is correctly deferred to its own pre-launch bundle.
  Not SCOPE-REDUCTION/DROP: the memberCount:0 fix is a real bug that DOES matter
  (discover cards showing "0 members" actively undercut the join signal the whole
  feature exists to create), and the write-half is load-bearing, not gold-plating —
  stripping either would leave M11 delivering zero user-visible discovery value.
  The scope is exactly right: it converts inert infra into a working growth feature.
bet_traced_to: "Academic tools + offline-first win students from Discord (status='live') — the win-students-from-Discord network-effect leg."
milestone_traced_to: "8d88e691-5e39-492f-83a9-73a1a9440af3 — M11 Growth: server discovery (in_progress, product-feature, H2). Success metric: browse/search a public directory, see community info, one-click join. This wave supplies the publish (write) half that makes that metric reachable in prod."
proposed_scope_change: |
  None. Publish-toggle + owner-gated PATCH /servers/:id + server-settings UI +
  memberCount:0 fix is the correct coherent bundle. Publish makes the directory
  populatable; memberCount makes the cards honest — a natural pairing, each half
  incomplete without the other for M11 to deliver value.
escalation_reason: |
  Not an escalation. Two strategic signals surfaced for the founder (flags, not blocks):

  1. MODERATION-BEFORE-LAUNCH (sequencing confirmation). Once servers CAN be published,
     the public directory becomes launch-able. At ~0 users pre-launch, building publish
     WITHOUT a moderation/safety layer (report / block / takedown of public servers,
     capacity/abuse controls) is the correct sequencing — you cannot moderate an empty
     shelf, and moderation built now would be speculative. BUT a moderation bundle MUST
     precede any real PUBLIC LAUNCH: an open, joinable, publicly-listed directory is the
     first StudyHall surface where a bad actor reaches users who did not invite them.
     Recommended sequence: build publish now (this wave) → moderation bundle next →
     THEN public launch. This is already the standing M11 deferral (recorded wave-67);
     this wave confirms it as the gating pre-launch dependency. Flag for founder
     acknowledgement, not a blocker for this wave.

  2. FOUNDER-RESERVED boundary intact. The public directory is a product-surface
     exposure decision, but it is opt-in and owner-controlled (is_public defaults false,
     verified wave-67; publishing is an explicit owner action via the new settings
     toggle), so pre-launch exposure risk is low and does not require a founder gate to
     BUILD. Monetization (M9) and compliance-regime (M10) remain founder-reserved and
     are untouched by this wave. Public LAUNCH itself (flipping the directory on for real
     users) is the founder-reserved go decision — gated behind the moderation bundle above.
sibling_visible: false
```

## Narrative (for P-0 merge)

**Is this worth doing, at the right ambition? Yes — PROCEED, HOLD-SCOPE.**

Wave-67 shipped the discovery READ path (public directory API + /discover browse UI + one-click join) but with no write path, so the directory is permanently empty in production — a shipped-but-inert investment. This wave supplies the keystone write-half: an owner-gated `PATCH /servers/:id` to toggle `is_public` + set description/topic, a server-settings toggle UI, and the folded `memberCount:0` fix. Together the directory becomes populatable AND the cards become correct — M11 discovery goes from inert to real. This is the direct, non-optional completion of the just-shipped read-half; deferring it would strand wave-67's spend.

**Ambition is correctly calibrated.** Publish + PATCH + settings UI + memberCount is the right coherent bundle — not too much (ranking/trending/categories sort an empty shelf at ~0 users; correctly deferred), not too little (both halves are load-bearing for any user-visible value). The memberCount:0 fix is a real bug that matters: cards showing "0 members" undercut the exact join signal the feature exists to produce, and it shipped green only because the unit test mocks the subquery — the folded live-DB-test requirement is the right guard.

**One strategic flag for founder (does not block this wave):** once servers can be published, the directory is launch-able. Building publish now without moderation is correct at zero users, but a moderation/safety bundle (report/block/takedown of public servers) MUST precede any real public launch — the directory is the first StudyHall surface exposing users to un-invited actors. Recommended sequencing: publish now → moderation next → public launch (founder-reserved go). This confirms the standing wave-67 deferral as the gating pre-launch dependency.
