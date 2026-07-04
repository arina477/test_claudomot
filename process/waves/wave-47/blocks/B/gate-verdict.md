# Wave 47 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, Phase 1 gate)
**Reviewed against:** process/waves/wave-47/blocks/B/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

Both claimed specs land contract-faithful with every acceptance criterion met and no
unguarded door. The new candidate endpoint (`DmService.getDmCandidates`, dm.service.ts:677)
returns exactly the caller's shared-server co-members: it scopes to the caller's own
servers (`inArray(server_id, callerServerIds)` built from `server_members WHERE user_id =
callerId`), excludes self (`ne(user_id, callerId)`), excludes `who_can_dm='nobody'`
(`ne(who_can_dm, 'nobody')`), dedups a co-member shared across N servers via
`DISTINCT ON (users.id)`, sorts stably by displayName, and short-circuits to `[]` when the
caller shares no servers. This is a scope-fenced co-member list — NOT a global directory,
typeahead, ranking, or pagination surface — honoring the mvp-thinner fence and the
2026-07-04 founder-reserved-directory decision. The endpoint is session-authed
(`@UseGuards(AuthGuard)`, callerId from `req.session.getUserId()`, never a client param).
The new `DmCandidatesController` anchored at `@Controller('dm')` exposes `GET candidates`
→ `/dm/candidates`, which does NOT collide with the existing `DmController` at
`@Controller('dm/conversations')` (distinct path prefixes; both registered in DmModule).

The id-space fix (379978a4) is correct and load-bearing: `DmHome.currentUserId` now sources
`profile?.userId` (DmHome.tsx:30), the true opaque `users.id` — verified against the
ProfileContext precedent (`profile.userId` seeds self-presence at line 64) and the server
contract (`profile.controller.ts` returns `userId = session.getUserId()` = real users.id).
This is the same id-space as `candidate.userId` and DM participant/author ids, so
self-exclusion and the optimistic-author display now compare matched id-spaces — curing the
wave-46 F7 "Unknown user" author and the silent self-exclusion miss. It is not
`profile.username` and not `profile.id`.

The feature is now startable end-to-end through the UI: StartDmPicker loads candidates from
`api.getDmCandidates()` (StartDmPicker.tsx:106, no serverId gate, calm empty-state copy
"No one to message yet — join a study server with others"), select → `onConfirm` →
`createConversation` → POST /dm/conversations (wave-46 find-or-create, so re-picking an
existing 1:1 opens the existing thread). The always-null serverId dead-end is removed.
Tests are honest: 6 backend getDmCandidates cases exercise real service logic (co-member
scope, self-exclusion, nobody-filter, cross-server dedup, no-servers empty, no-co-members
empty) and the frontend picker/startable/F7 suites drive the real components against the
mocked API. I independently spot-ran the API package: 611/611 pass in 2.18s — confirming the
B-5 combined-run vitest startup crash is local turbo-parallel resource contention, not a
code defect (CI is authoritative). Contract discipline holds: the Zod `DmCandidateSchema`
(bare `DmCandidate[]`, mirroring the ServerMember convention) is the single source, the DTO
and api client both derive from it, and no off-contract field appears.

Multi-spec commit discipline PASSES. B-1 (DmCandidateSchema) and B-2 (endpoint) cite only
10967558; B-3 cites both 10967558 and 379978a4 with a body explaining that the currentUserId
line (379978a4) is a physically un-splittable sibling hunk inside 10967558's DmHome
entry-point edit (removing the serverId gate and re-sourcing currentUserId are the same
contiguous change). This coupling is acceptable — a rebase-split would be artificial and both
task_ids are explicitly referenced. Every claimed task_id has at least one citing commit.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
