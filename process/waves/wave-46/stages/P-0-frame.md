# Wave 46 — P-0 Frame

## Discover section
- wave_db_id: d95be780-b47e-436d-a980-1af25b488470 (wave_number 46, running, milestone M8)
- Prior-work: server-channel messaging shipped (messages.ts, messaging.gateway.ts, MessageList/Composer, outbox). `users.who_can_dm` + privacy.service.ts exist (DM-privacy groundwork, but see carry-forward #1 — UNENFORCED). DMs is new (separate entity).
- Roadmap milestone: M8 (84e17739, in_progress); success-metric SET this session (founder delegated); DMs is named M8 scope; founder chose DMs first. Bet: displace-Discord (DMs = key retention surface).
- Spec-contract short-circuit: **no-prior-spec** (seed a48f1910 is decomposer prose, no YAML head) → full P-1..P-3.
- Product decision: student-DM privacy/safety. who_can_dm opt-out (everyone|server-members|nobody) is the policy floor for slice 1. block/report deferred to a later slice (named deferral). Minors-safety angle flagged (not escalated — who_can_dm provides opt-out; founder just directed DMs; re-pausing would undo the resume). NOT a new money/Tier-3-founder escalation.

## Reframe section
- Original framing: M8 DMs slice 1 — seed a48f1910 (DM schema + participant-gated backend respecting who_can_dm) + 32f5d29e (Socket.IO fan-out) + 1ceffdc9 (DM UI incl. start-picker) + d8264800 (offline outbox).
- **problem-framer: PROCEED.** Separate DM entity is RIGHT (channel messages FK channels NOT NULL, dedup on channel_id, server-role authz — none fit serverless/roleless/participant-set DMs; reuse is PATTERN reuse at transport). 3 carry-forwards → P-1/P-2:
  1. **who_can_dm STORED but UNENFORCED** (grep-verified: PrivacyService only reads/writes it; no send path consumes it). Enforcing it at conversation-CREATE is NEW backend work + the privacy floor → HARD P-2 AC.
  2. **block/report deferred** — acceptable for slice 1 (who_can_dm opt-out is the floor) but name it explicitly; minors-safety flagged.
  3. **outbox hard-coded to channelId** (enqueue/OutboxItem/SendFn + server UNIQUE(channel_id, idempotency_key)) → d8264800 GENERALIZES the routing key (channel|conversation) client+server; P-1 sizes as generalization, not drop-in.
- **ceo-reviewer: PROCEED (HOLD-SCOPE).** Right-sized; start-a-DM picker IS in 1ceffdc9 (not a stub); all 4 tasks load-bearing; interop risk neutralized by substrate reuse; no cheap high-leverage addition qualifies.
- **mvp-thinner: OK.** 4-task bundle minimal; group-DM vs 1:1 is a FALSE thinness lever (metric names "small-group" verbatim; group = is_group + N-row participants, near-zero cost); offline mvp-critical; create-endpoint + picker present → not over-cut.
- Mediation: none (no ceo/mvp disagreement).
- Sibling task IDs created: none.
- Disposition: **PROCEED** (all reviewers clear).
- Final framing: M8 DMs slice 1, 4-task multi-spec bundle. Separate DM entity. who_can_dm enforcement + outbox generalization are the two non-obvious work items P-1/P-2 must make explicit. design_gap_flag EXPECT true (DM UI is new surface → D-block).

```yaml
p_stage_verdict: COMPLETE
disposition: PROCEED
short_circuit: no-prior-spec
reframe: {problem-framer: PROCEED, ceo-reviewer: PROCEED-HOLD-SCOPE, mvp-thinner: OK}
carry_forward:
  - "P-2 HARD AC: enforce who_can_dm at conversation-create (currently stored-but-unenforced, NEW backend work) — privacy floor"
  - "P-1/P-3: outbox d8264800 = generalize routing key channel|conversation (client OutboxItem + server dedup UNIQUE), NOT drop-in"
  - "P-1/P-2: name block/report deferral explicitly; minors-safety flagged (not escalated — who_can_dm opt-out is the floor)"
  - "P-1: design_gap_flag=true expected (DM UI new surface)"
```
