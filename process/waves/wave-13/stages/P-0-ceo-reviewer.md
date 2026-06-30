# P-0 — ceo-reviewer verdict (wave-13)

```yaml
verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  The proposed bundle (edit/delete + reactions + UI) is exactly the next M3
  Scope clause — no expansion, reduction, or cherry-pick is warranted. EXPANSION
  is wrong: presence/typing introduces the locked /presence namespace + a new auth
  surface (correctly deferred), and threads/mentions/attachments would bloat the
  wave past the WIP-limited slice. REDUCTION is wrong: reactions are named in M3's
  success metric and edit/delete is the literal next Scope item — neither is a
  real-bug-that-doesn't-matter nor grandiose. SELECTIVE-EXPANSION finds no single
  cheap-but-disproportionate add that beats the deferral discipline already applied.
  HOLD-SCOPE: verify trace + measurability, no scope change.
bet_traced_to: "Academic tools + offline-first win students from Discord (live) — core collaboration surface, match Discord's messaging"
milestone_traced_to: "6198650e-f4e0-44dc-9b0a-6550f01f9f82 — M3 Real-time messaging (in_progress)"
proposed_scope_change: |
  None.
drop_rationale: |
  N/A
escalation_reason: |
  N/A
sibling_visible: false
```

## Reasoning (concise)

**Strategic value — right slice.** Edit/delete + reactions are not message-lifecycle
*polish*; they are table-stakes message management every chat app ships, and reactions
are named verbatim in M3's success metric ("with reactions, threads, and attachments
working"). Edit/delete is the literal next clause in M3 `## Scope` after send/receive.
A messaging surface that cannot edit a typo or remove a message reads as broken to
students arriving from Discord — this is core, not gold-plating. Maps cleanly to the
live bet ("match Discord's messaging").

**Ambition / sizing — right-sized.** The bundle extends the already-built
MessagingModule + /messaging gateway: no new namespace, no new auth surface. Threads,
mentions, attachments, presence/typing, member-list are all explicitly deferred to
later M3 waves — the WIP-limited cut is disciplined, not timid. No 9/10 was achievable
here for 1.2x cost; the deferred items are genuinely separate slices, not cheap adds.

**Sequencing — M3-first before M4 is correct, not a detour from the wedge.** The
strongest possible "jump to M4-offline now" case fails on a hard dependency: M3's
prose carries `## Required by: M4 (offline builds on the messaging path)`, and M4's
scope (outbox queue, idempotent replay `POST /api/messages`, reconnect reconciliation)
sits directly on top of the message send/edit/delete contract. Shipping M4 against a
still-churning message-lifecycle contract would force offline-sync rework — the most
expensive surface to redo (risk-officer's named high-risk area). Completing M3's
conversational basics first *de-risks* the wedge rather than delaying it. This also
matches the founder's standing "build the core, keep momentum, fold follow-ups around
it" direction (logged wave-4 + M2→M3 pivot decisions).

**Caveat (non-blocking, for P-1/P-2):** edit/delete + reactions touch the authz path
(only author edits/deletes; reaction toggle is per-user). T-8 security applies — server-
side authorization re-derivation through the existing ChannelPermissionGuard + author
check, never client-supplied identity. Soft-delete tombstone (not hard delete) is the
right default for moderation/audit. These are spec concerns, not scope concerns —
PROCEED stands.
```
```
