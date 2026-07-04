```yaml
verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  The four-task slice is already sized exactly to "a student can have a real private conversation" — no smaller, no larger. HOLD-SCOPE, not SCOPE-EXPANSION: the obvious bigger version (search / read-receipts / reactions / typing / attachments / group-DM admin) is correctly deferred; none is load-bearing for a first useful DM, and pulling any forward would delay the wedge feature for polish nobody needs yet. Not SCOPE-REDUCTION: all four tasks are load-bearing — drop the picker (in 1ceffdc9) and you can't START a DM; drop fan-out (32f5d29e) and it's refresh-to-see; drop offline (d8264800) and it breaks the core offline-first bet. Not SELECTIVE-EXPANSION: the only candidate addition (a "message this user" entry point from profile/roster) is a nice-to-have, not cheap-but-disproportionate — the nav item + user picker already makes DMs reachable AND startable, so a second doorway is later-slice fold-in, not slice-1.
bet_traced_to: "Academic tools + offline-first win students from Discord (status='live') — DMs are Discord's key retention surface; a study app without private messaging pushes coursework chat back to Discord."
milestone_traced_to: "84e17739 — Educator tools & deeper academics (M8, in_progress); ## Scope names 'direct messages + group DMs'; founder chose DMs first + set the M8 success metric this session."
proposed_scope_change: |
  None. Scope held as framed.
sibling_visible: false
```

## Ambition assessment (the three questions asked)

1. **Right-sized first slice? YES.** IN-slice = start (1:1 or small-group) → send → receive real-time → offline-tolerant → participant-gated + who_can_dm-enforced. That is a genuinely usable private conversation, not a 3/10 stub. The specific stub-risk I was asked to check — "no way to START a DM if there's no user picker" — is NOT present: task 1ceffdc9 explicitly includes a "start a conversation" affordance (pick one user for 1:1 or a few for small group) that respects who_can_dm. The load-bearing entry point is in slice-1, not deferred.

2. **Cheap high-leverage addition? NO qualifying one.** The candidate (a "message @user" shortcut from an existing profile/member-roster surface) is a convenience, not load-bearing — the DM nav item + in-picker user selection already unlock reach + start. Adding a second entry point now is scope creep against an otherwise clean slice; correct as a later fold-in. No deferred piece is secretly load-bearing: search/receipts/reactions/typing/attachments/group-admin are all real deferrals, none required for a first useful conversation.

3. **Strategic risk in the framing? NEUTRALIZED BY DESIGN.** The risk of building DMs that don't interoperate with the shipped offline/real-time model is explicitly closed: fan-out (32f5d29e) reuses messaging.gateway.ts + existing WS session-validation (no new transport); offline send (d8264800) reuses features/sync/outbox.ts with the same client-generated idempotency key that the seed's UNIQUE(conversation_id, idempotency_key) dedups server-side. Authz reuses the channel-message.guard IDOR-safe server-derived pattern and the existing privacy.service who_can_dm check. Substrate reuse throughout — no divergent parallel model.

Direction is founder-set and traces cleanly to the live bet + M8; not re-litigated. Proceed at the proposed scope.
