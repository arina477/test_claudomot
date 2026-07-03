# Wave 41 — B-block review artifacts
**Block:** B (Build) · **Wave topic:** M8 educator role + light moderation · **Block exit gate:** B-6 · **Status:** in-progress
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | in-progress | roles +moderate_members, server_members +muted_until |
| B-1 | stages/B-1-contracts.md | pending | rbac.ts +moderate_members |
| B-2 | stages/B-2-backend.md | pending | can() + moderation service (delete-any + timeout) + send-gate + rank guard + tests |
| B-3 | stages/B-3-frontend.md | pending | ServerRolesPage toggle + MessageList delete-any + member-moderation UI (design/member-moderation.html) |
| B-4 | stages/B-4-wiring.md | pending | |
| B-5 | stages/B-5-verify.md | pending | |
| B-6 | stages/B-6-review.md | pending | head-builder gate |
## Block-specific context
- **Spec contract:** tasks 6cf06f99 (multi-spec: +6ddddc2d)
- **Branch name:** wave-41-educator-moderation
- **claimed_task_ids:** [6cf06f99, 6ddddc2d]
- **Schema changes:** roles.moderate_members boolean; server_members.muted_until timestamptz
- **Adopted design:** design/member-moderation.html
- **P-4/Karen carries:** widen moderator delete gate manage_channels→(moderate_members OR author); note manage_members vs moderate_members naming distinction.
- **D-3 handoff a11y (B-3):** aria-label on role=menu; prefers-reduced-motion; transitionend vs setTimeout; unique injected-icon id.
## Gate verdict log
<appended by head-builder at B-6>
