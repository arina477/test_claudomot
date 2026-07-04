# Wave 46 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** M8 direct messages slice 1 — DM schema + participant-gated backend (who_can_dm-enforced) + Socket.IO fan-out + DM UI + offline outbox
**Block exit gate:** B-6
**Status:** gate-passed

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-46/stages/B-0-branch-and-schema.md | in-progress | branch + DM schema/migration (schema sub-actions RUN this wave) |
| B-1 | process/waves/wave-46/stages/B-1-contracts.md | pending | packages/shared/src/dm.ts Zod |
| B-2 | process/waves/wave-46/stages/B-2-backend.md | pending | dm module + who_can_dm enforce + gateway dm:message |
| B-3 | process/waves/wave-46/stages/B-3-frontend.md | pending | DM UI (design/direct-messages.html) + outbox generalization |
| B-4 | process/waves/wave-46/stages/B-4-wiring.md | pending | |
| B-5 | process/waves/wave-46/stages/B-5-verify.md | pending | |
| B-6 | process/waves/wave-46/stages/B-6-review.md | done | APPROVED (3 attempts + /review: C1 critical + 3 med fixed) |

## Block-specific context
- **Spec contract:** tasks row a48f1910 (DB); spec at process/waves/wave-46/stages/P-2-spec.md
- **Branch name:** wave-46-m8-direct-messages
- **claimed_task_ids:** [a48f1910, 32f5d29e, 1ceffdc9, d8264800]
- **Design canonical:** design/direct-messages.html (D-3 adopted)
- **New deps added this wave:** none expected
- **Schema changes this wave:** 3 tables (dm_conversations/dm_participants/dm_messages) + 1 migration
- **B-1 fast-path approved:** false (contracts change — Zod dm.ts)
- **Key correctness reqs:** who_can_dm ENFORCEMENT is NEW (stored-but-unenforced today); outbox routing-key GENERALIZATION (no channel regression); IDOR-safe participant-gating (403/404 non-leak); idempotency UNIQUE(conversation_id,idempotency_key); reuse channel-message.guard pattern at apps/api/src/rbac/channel-message.guard.ts
- **B-3 design notes (from D-3):** px-3 conversation-row padding; aria-labels (search/send); sr-only presence text; React focus-trap in StartDmPicker; reduced-motion guards
- **Deviations from plan logged this block:** none

## Open escalations carried into gate
none (aidesigner credit top-up surfaced to founder separately, non-blocking)

## Gate verdict log
<appended by head-builder at B-6>
