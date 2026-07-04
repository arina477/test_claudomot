# Wave 47 — B-block review artifacts
**Block:** B (Build) · **Wave topic:** M8 DM entry-point completion — GET /dm/candidates + StartDmPicker rewire + id-space fix (make DMs startable) · **Block exit gate:** B-6 · **Status:** gate-passed

## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | in-progress | branch wave-47-m8-dm-startable; NO schema (read-only) |
| B-1 | stages/B-1-contracts.md | pending | DmCandidateSchema |
| B-2 | stages/B-2-backend.md | pending | getDmCandidates + GET /dm/candidates |
| B-3 | stages/B-3-frontend.md | pending | picker source rewire + DmHome id-space (profile.userId) |
| B-4 | stages/B-4-wiring.md | pending | |
| B-5 | stages/B-5-verify.md | pending | |
| B-6 | stages/B-6-review.md | pending | |

## Block-specific context
- Spec: tasks row 10967558. Branch: wave-47-m8-dm-startable. claimed: [10967558, 379978a4]. design_gap_flag: false. Schema: NONE (read-only over server_members+users).
- Key: candidate query mirror `apps/api/src/presence/presence.service.ts` getCoMemberUserIds (co-members, self-excluded, deduped); DTO shape mirror `apps/api/src/servers/servers.service.ts` listServerMembers; who_can_dm != 'nobody' filter. B-3 currentUserId from **profile.userId** (NOT profile.id). Scope-fence: co-members only, NO directory/typeahead.
- New deps: none. B-1 fast-path: false (DmCandidateSchema is a contract).

## Gate verdict log
<appended by head-builder at B-6>
