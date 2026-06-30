verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Symptom-vs-cause (mandatory): not a bug-fix wave. The stated problem — message data
  plane supports send/receive but not edit/delete/reactions — is a genuine capability gap,
  and the cause is correctly identified at the right layer (MessagingModule REST + /messaging
  fan-out + message UI). The M3 milestone `## Scope` lists "send/receive/edit/delete, reactions"
  in exactly this order; this wave is the literal next clause after wave-12's shipped send/receive.
  No symptom-layer fix, no wrong-layer fix.

  No antipattern matched. The 3-task bundle is cohesive, not scope-creep coupling (#5): edit/delete
  and reactions both mutate the same `messages`/`message_reactions` tables, reuse the same
  JwtAuthGuard+ChannelPermissionGuard→RbacService.can() guard, the same /messaging room-per-channel
  gateway, and the same @studyhall/shared Zod REST+WS contract. The "lifecycle vs engagement"
  split is cosmetic — same module, same namespace, same auth surface. No new abstraction (#4),
  no new config knob (#6), no validation theater (#7), no backcompat shim (#8). Data model is
  PRE-DESIGNED in _library.md (messages.is_edited/edited_at/is_deleted/deleted_at/content_snapshot
  line 153; message_reactions UNIQUE(message_id,user_id,emoji) line 142) — the wave consumes the
  locked schema rather than inventing one. NO new namespace, NO new auth surface (reuses /messaging
  + ChannelPermissionGuard), respecting locked decisions D20 + RBAC-server-side-only (line 317).
  Scope is WIP-limited: threads/mentions/attachments/presence/typing all explicitly deferred.

  LOC ~2200-2800 / 3 tasks is one coherent wave, not a split — P-1 owns final sizing but no
  RESCOPE trigger fires here.

security_flags: |
  T-8 MANDATORY (auth-touching, already in carry-forward #2):
  - Edit authz: author-only. Delete authz: author OR a manage_messages/manage_channels role perm
    (moderation). MUST be enforced SERVER-SIDE via RbacService.can() + authorship check in the
    guard/handler — never UI-only. A user must not edit/delete another's message unless permitted.
  - Reactions: any channel-member (via ChannelPermissionGuard membership). Toggle idempotent —
    repeat-add is a no-op, remove-when-absent is a no-op — enforced by the UNIQUE(message_id,user_id,
    emoji) constraint, not app-level guesswork.
  - Realtime fan-out (message.updated / message.deleted / reaction.added / reaction.removed) MUST be
    room-scoped (no cross-channel leak) AND verified with TWO authenticated clients — no single-client
    realtime theater (carries the wave-11/12 T-8 rule).

framing_flags_for_P1_P2: |
  1. design_gap_flag = TRUE confirmed. UI task f323a71f introduces inline edit-in-place, deleted-
     tombstone placeholder, and the reaction-pill primitive + picker (design/server-channel-view.html
     names message-row, composer, reaction-pill). D-block runs. P-1 to confirm against design/.
  2. Soft-delete only (MVP, _library.md lines 154/611): tombstone is row-level — content replaced
     with [deleted] at query layer, content_snapshot preserves author identity. Seed spec mentions
     "preserving thread/reply integrity," but threads (thread_parent_id) are DEFERRED; soft-delete
     keeps the row so reply integrity is structurally preserved regardless. P-2: keep the tombstone a
     pure row-level soft-delete — do NOT build thread machinery this wave.
  3. Committed Drizzle migration required for message_reactions table + any edited_at/deleted_at
     columns not already present; never auto-migrate on startup (line 164).
  4. Aggregated reaction counts must be included on the message list/get payload (sibling d78df376),
     and the message:list cursor/pagination + idempotency contracts stay unchanged.

proposed_reframe: |
  (none — PROCEED)
escalation_reason: |
  (none — PROCEED)
sibling_visible: false
