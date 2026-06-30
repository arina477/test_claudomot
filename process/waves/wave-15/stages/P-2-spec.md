# Wave 15 — P-2 Spec (pointer)
**Source of truth:** tasks.description of seed 3d238446 (YAML head + --- + prose). wave_type multi-spec (3 blocks). design_gap_flag true.
**claimed_task_ids:** [3d238446 (@mention data plane), cd585f04 (composer autocomplete), c3f3f62a (pills+unread)]
## AC summary
- 3d238446: parse @username on create/edit, resolve to server members only (non-member→plain), persist message_mentions (0007 migration, UNIQUE), realtime over /messaging, GET /me/mentions (paginated, authz session-derived no cross-user), edit add/remove diffing.
- cd585f04: composer @-autocomplete dropdown from server members, keyboard nav + click, inserts canonical @username, no @-mid-word trigger, Enter selects (not send).
- c3f3f62a: mention pills (viewer-targeted distinct, WCAG AA), unread-mention affordance (realtime + my-mentions, clears on view, no self-badge).
**Security (T-8/P-4):** my-mentions authz session-derived; resolution membership-scoped; @everyone/@role + notif-inbox OUT.
