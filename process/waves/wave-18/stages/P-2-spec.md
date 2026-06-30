# Wave 18 — P-2 Spec (pointer)
**Source of truth:** tasks.description of seed 497c2ae6. wave_type multi-spec (3 blocks). design_gap_flag true.
**claimed_task_ids:** [497c2ae6 (data plane), 6c008dd6 (panel+affordance), 0b728319 (outbox parity)]
## AC summary
- 497c2ae6: POST reply w/ thread_parent_id (one-level: reject reply-of-reply / cross-channel parent); GET replies oldest-first paginated (tombstone-excluded); parent reply_count+last_reply_at TRANSACTIONAL on create/soft-delete; thread-scoped realtime over /messaging; idempotency reuse. Schema 0008 THREE-PART (thread_parent_id self-FK [ABSENT] + reply_count + last_reply_at + index).
- 6c008dd6: in-list affordance (reply count + last-reply when reply_count>0) → opens thread panel (parent pinned + replies + composer); live append on realtime; responsive.
- 0b728319: thread-reply optimistic outbox parity (pending/failed/idempotency-reconcile) = same machinery as top-level → consistent M3→M4 send model.
**Scope:** one-level threads only; nested/notifications/unread-in-thread OUT; attachments next wave.
