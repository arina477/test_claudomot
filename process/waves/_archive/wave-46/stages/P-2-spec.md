# Wave 46 — P-2 Spec (pointer)

**Spec contract in** `tasks.description` of seed `a48f1910` (YAML head + `---` + prose). wave_type: **multi-spec**, 4 blocks. design_gap_flag: **true**. claimed_task_ids: [a48f1910, 32f5d29e, 1ceffdc9, d8264800].

## Spec blocks (falsifiable ACs — see DB for full)
1. **a48f1910** — DM schema (dm_conversations/dm_participants/dm_messages, mirror messages.ts) + participant-gated IDOR-safe backend (create/list conversations, send/list messages, idempotent) + **who_can_dm ENFORCEMENT (NEW — stored-but-unenforced today; everyone/server-members=shared-server/nobody=reject)** + small-group cap ≤10.
2. **32f5d29e** — Socket.IO `dm:message` fan-out to online participants only (reuse gateway + WS session validation; optimistic sender echo).
3. **1ceffdc9** — DM UI: conversation list + thread + composer + **start-DM picker** (respects who_can_dm; the entry point) + empty states; dark-theme tokens (D-3 canonicalizes).
4. **d8264800** — outbox routing-key generalization (channel|dm discriminator) WITHOUT regressing channel send; offline DM flush → idempotent exactly-once.

Key facts verified at P-2: who_can_dm grep-confirmed UNENFORCED (privacy.service only get/update) → enforcement is new. outbox.ts channelId-hardcoded → generalization required. WHO_CAN_DM enum = [everyone, server-members, nobody].

```yaml
p_stage_verdict: COMPLETE
spec_location: "tasks.description of a48f1910"
wave_type: multi-spec
design_gap_flag: true
claimed_task_ids: [a48f1910-473f-4a4a-bed6-385ec8d8c2d3, 32f5d29e-ba81-4a2e-a29c-53c4752f5fe4, 1ceffdc9-4a38-4bdd-b287-747ea7a2e319, d8264800-765d-443b-9d29-217d58dff308]
```
