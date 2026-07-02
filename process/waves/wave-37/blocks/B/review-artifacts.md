# Wave 37 — B-block review artifacts
**Block:** B (Build) · **Wave topic:** persistent in-app notifications (model + owner-404 API + web bell/panel) · **Gate:** B-6 · **Status:** gate-passed · **Branch:** wave-37-notifications
## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | in-progress | notifications table + migration |
| B-1 | stages/B-1-contracts.md | pending | shared Zod |
| B-2 | stages/B-2-backend.md | pending | @OnEvent persist + owner-404 API + reminder hook |
| B-3 | stages/B-3-frontend.md | pending | bell + panel per design/notifications-center.html |
| B-4 | stages/B-4-wiring.md | pending | |
| B-5 | stages/B-5-verify.md | pending | |
| B-6 | stages/B-6-review.md | pending | |
## Block-specific context
- **Spec:** tasks.description of 0b33df33 (DB). **claimed_task_ids:** [0b33df33, f3f52d9a, edac03e0]
- **Canonical design:** design/notifications-center.html (D-3 adopted).
- **CARRY-FORWARDS:** B-1 notifications user_id ON DELETE CASCADE (assignment-reminder does NOT cascade user FK — deliberate); decide source-ref FK ON DELETE; add `notifications` to pg-harness TRUNCATE ahead of users. B-3 @OnEvent no-retry failure-domain comment. 404-owner-authz (not 403). @OnEvent('mention.created') decouple + ON CONFLICT (user_id,message_id) mention dedup. Bell live=mentions-only. B-4 handoff: rows as <button>, pb-safe, prefers-reduced-motion, text-token aliases, wire mark-read.
## Gate verdict log
<head-builder at B-6>
