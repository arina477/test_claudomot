# Wave 46 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, Phase 1 gate reviewer)
**Reviewed against:** process/waves/wave-46/blocks/P/review-artifacts.md
**Attempt:** 1  (first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-46 (M8 direct messages, slice 1) ladders to a live M8 bet (displace-Discord; DMs the named, metric-set M8 scope the founder chose this session) and is scoped to the smallest valuable increment: start a 1:1 or small-group DM, send/receive in real time, offline-tolerant — with block/report and the rest of M8 DM surface explicitly deferred. All four spec blocks carry falsifiable, independently verifiable acceptance criteria with the non-happy states (empty / loading-optimistic / error-403/404 / offline) specified per surface. The load-bearing correctness claim holds under direct verification: `who_can_dm` is stored-but-UNENFORCED (`privacy.service.ts` is get/update only — lines 18/29/34/43; no send/create consumer; no `assertCanBeDmed` anywhere in `apps/api/src`), so the spec correctly treats enforcement (everyone / server-members=shared-server / nobody=reject, whole-create-fails-403, no partial conversation) as NEW hard work rather than reuse. The separate-DM-entity decision is sound (channel messages FK `channels` NOT NULL, dedup on channel_id, server-role authz — none fit serverless/roleless/participant-set DMs) and is reflected in the P-3 architecture deltas with rejected alternatives. The outbox generalization is framed as real work, not drop-in: `outbox.ts` is confirmed channelId-hardcoded end-to-end (SendFn signature `channelId: string`, `OutboxItem.channelId`, send call site), and spec-4 requires a routing-key discriminator with a channel-send regression guard. The plan maps every AC to a step, routes to valid specialists (node-specialist, typescript-pro, react-specialist all present in AGENTS.md), reuses the locked architecture (keyset/cursor pagination, idempotency-keyed creates, participant-scoped Socket.IO fan-out via the existing gateway), introduces no unneeded infra, and correctly sequences the D-block before B-3 (design_gap_flag=true; DM conversation-list + start-picker are genuine new surfaces). One non-material note is passed to Phase-2 karen: the spec's "Substrate to reuse" line cites `apps/api/src/messaging/channel-message.guard.ts`, but the guard actually lives at `apps/api/src/rbac/channel-message.guard.ts` — a reuse-hint path imprecision, not an AC, with the real file trivially discoverable.

## Notes for Phase 2 (Karen / jenny)
- **Karen spot-check:** verify the reuse-substrate path `apps/api/src/messaging/channel-message.guard.ts` (spec "Substrate to reuse" prose) — the actual guard is at `apps/api/src/rbac/channel-message.guard.ts`. Load-bearing claims otherwise verified this phase (who_can_dm get/update-only in privacy.service.ts; outbox.ts channelId-hardcoded).
- **Security-scope:** wave touches a privacy/authz-enforcement surface (who_can_dm) + IDOR-safe participant gating. Tightened P-4 security posture applies; enforcement + IDOR-safety are hard ACs in spec-1. T-8 security stage carries the follow-through.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---
## Phase 2 — Karen + jenny + Gemini (merged)
**Attempt 1 · Phase 2**
| Reviewer | Verdict | Notes |
|---|---|---|
| karen | **APPROVE** | 6/6 load-bearing claims VERIFIED: who_can_dm stored-but-unenforced (privacy.service get/update only; no message-path consumer); WHO_CAN_DM=[everyone,server-members,nobody]; messages.channel_id NOT NULL FK (separate-entity justified); substrate files exist (channel-message.guard at rbac/ not messaging/ — harmless, pattern ref); node/typescript/react specialists in AGENTS.md; outbox channelId-hardcoded (generalization real). 0 UNVERIFIED/WRONG. Nicety: cite full guard path in B-block prompt. |
| jenny | **APPROVE** | 0 drift. Spec FULFILLS a standing wave-35 commitment: who_can_dm enforcement was deferred at wave-35 with an explicit trigger-to-revisit ("wire enforcement when DMs are built"); this wave honors it, enum byte-identical. DM search deferral consistent (separate M8 scope item). Cleanly additive to journey map. No "one messaging system" decision to conflict with. |
| Gemini | **UNAVAILABLE** | exit=3 HTTP 429 (credits depleted). Degradable — gate proceeds on Karen+jenny. |

## Gate result: **PASS** (Phase 1 APPROVED; Karen+jenny APPROVE; Gemini UNAVAILABLE)
→ design_gap_flag=true → exit P-block → **D-block** (D-1 Brief).
Carry to B-block: cite full path `apps/api/src/rbac/channel-message.guard.ts` for the IDOR-authz pattern reuse.
