verdict: SCOPE-EXPANSION
verdict_source: ceo-reviewer
mode_applied: SCOPE-EXPANSION
mode_rationale: |
  The seed alone (cc783559 — suppress the Report affordance on the viewer's own
  member row, ~15-25 LOC non-security non-blocking UI polish) is a 2/10 wave in
  isolation: correct, cheap, but strategically inert. Not HOLD-SCOPE — the seed
  does not trace to any live success-metric leg; it is cosmetic cleanup of a
  shipped surface. Not SELECTIVE-EXPANSION — the highest-leverage addition (Block)
  is not a small cheap-but-disproportionate garnish on the seed; it is a
  substantive feature slice (new state + hide-logic across DMs + content, its own
  ACs) that dwarfs the seed and constitutes the real remaining launch-gate
  dependency. Not SCOPE-REDUCTION/DROP — the seed is worth doing, just not worth a
  whole wave. The right move is to LIFT ambition: fold the seed into a coherent
  M14 slice whose spine is the Block feature, so the wave ships the last
  outstanding success-metric leg of the active milestone rather than a cosmetic
  loose end. This feeds P-1 RESCOPE-AUTO-MERGE.
bet_traced_to: "Academic tools + offline-first win students from Discord (status='live')"
milestone_traced_to: "6a9424fe-c943-4b26-9110-6915661a6fb9 — M14 — Trust & Safety: moderation for public discovery (in_progress)"
proposed_scope_change: |
  Expand wave-70 from the standalone member-row affordance fix into a coherent M14
  slice whose primary spine is the BLOCK feature. Concretely fold in:

  1. PRIMARY (new — the real launch-gate dependency): user-to-user Block.
     - A user blocks another user; the blocked user's DMs and content are hidden
       from the blocker (and the block is cross-server, directory-safe) — this is
       M14 success-metric LEG 3 verbatim, the only unshipped leg of an
       in_progress, mvp-critical, founder-launch-gating milestone.
     - Reuse, do not reinvent (mandated by M14 Scope "Reuse, do not reinvent"):
       session-derived identity (backend derives actor from session — same idiom
       the report substrate used for reporter_id), the existing RBAC/authz guard
       idiom, message/content soft-delete, and the discover filter pattern. Block
       is a new relation + a hide predicate over existing DM/content read paths —
       NOT a second permission system.
     - Directory-safe requirement: a blocked user must not be able to route around
       the block via the public directory (shared public server, discover listing,
       or a fresh DM). The hide predicate must hold cross-server.

  2. SECONDARY (fold the seed in as a cheap adjacent finish): cc783559 —
     suppress the Report affordance on the viewer's own member row (selfUserId =
     profile.userId threaded from AppShell into MemberListPanel; isSelf guard in
     MemberItem mirroring the message-row isOwn gate). Ships as UI-polish riding
     the same wave; closes the wave-69 V-3 loose end without spending a wave on it.

  Why this is ambitious-but-right (not grandiose): shipping Block advances M14 from
  "report + action loop live" to "all three success-metric legs reachable," which
  is the concrete precondition for the founder-reserved public-directory launch —
  the network-effect leg of the live displace-Discord bet. It is the single
  highest-leverage next slice, not gold-plating: it closes the milestone's stated
  metric rather than adding scope beyond it. Explicitly OUT of this expansion
  (already fenced to later M14 bundles per product-decisions [2026-07-06]):
  full review-queue/triage UI, appeal flow, automated abuse detection, report
  rate-limits, and the distinct platform-admin (non-owner) unlist role. Do not
  absorb those — that would be the grandiose failure mode. Block + the seed is the
  right ambition ceiling for one wave.

  P-1 owns RESCOPE-AUTO-MERGE: this SCOPE-EXPANSION recommends P-1 promote the
  Block feature to the wave's seed (parent) and demote cc783559 to a sibling
  UI-polish task under it. If M14 has no Block task row yet (it does not — only
  cc783559 is queued), milestone-decomposition should author the Block seed + fold
  the existing seed as a sibling in the same bundle.
drop_rationale: |
  (n/a)
escalation_reason: |
  (n/a)
sibling_visible: false
