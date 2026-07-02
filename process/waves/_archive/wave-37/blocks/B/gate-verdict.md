# Wave 37 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn)
**Reviewed against:** process/waves/wave-37/blocks/B/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
All three claimed specs are implemented, coherent, and complete on the current branch state (verified post the two git-reset recoveries — full commit chain 239b13f→2786a40 intact, working tree clean on apps/ and packages/). The security-critical surface holds: every route on `NotificationsController` composes `SessionNoVerifyGuard` and derives `userId` from the session only (never a URL param), and `markRead` enforces owner-scope via a `WHERE id=$1 AND user_id=$userId` UPDATE that returns 404 (`NotFoundException`) on zero rows — the deliberate anti-existence-leak convention the spec mandates. That boundary is reproduced by a load-bearing real-PG negative-path test (`notifications-authz.spec.ts`): user B marking A's notification throws 404 AND A's row stays unread (no partial mutation), plus the double-emit mention dedup yields exactly 1 row through the partial-unique `(user_id, message_id) WHERE type='mention'` + `ON CONFLICT DO NOTHING` — pg-harness, no mock-the-SUT, with row-count sanity guards against vacuous passes. The `@OnEvent('mention.created')` decoupling is clean: persist listens off the already-emitted event (messages.service.ts:611 create + :764 edit, both pre-existing wave-15 paths — messages.service.ts is untouched by this branch), errors are logged-and-swallowed so a notification-persist failure can never propagate into the committed message flow, and the failure-domain is documented inline. `createForReminder` sits inside the reminder-scan send-once winner branch (after the `INSERT ... RETURNING` gate), with a defensive `ON CONFLICT` belt. Contract discipline is correct — the Zod schema in @studyhall/shared is the single source and the Nest layer imports its types; the migration (0015) is additive, generated, and committed (no startup auto-migrate introduced); pagination is keyset (created_at DESC, id DESC), never offset; `notifications` was added to the pg-harness TRUNCATE ahead of users per the B-1 carry-forward. Web side reconciles correctly: optimistic mark-read/mark-all with server-`unreadCount` as source of truth and rollback on error, bell live-increment is mentions-only via `onMention` (no reminder socket added, per NON-GOAL), emerald 9+-capped badge with aria-live, and the per-channel `useMentionBadge` is left independent as the documented drift NON-GOAL. No scale gold-plating (no Redis/queue/replica). B-5 is green (lint 0 + 7 pre-existing warns, unit green incl. web 330, build 3/3; the integration authz spec skips locally without a 5433 test DB and executes in CI via DATABASE_URL_TEST — the standard pattern for this repo's integration layer, T-4 verifies execution). Commit-per-spec discipline PASSES with a documented nuance (below): every claimed_task_id has ≥1 citing commit and commits are stage-scoped, which is the build.md carve-out for file-inseparable specs.

## Commit-discipline note (Action 6 — multi-spec)
- claimed_task_ids [0b33df33, f3f52d9a, edac03e0] each have ≥1 commit: 0b33df33 (239b13f schema, 46f525f contracts, 65bd1c4 backend, 1ffa4ba test); f3f52d9a (65bd1c4 backend, 1ffa4ba test); edac03e0 (bb083aa web).
- Two commits reference multiple task_ids — 65bd1c4 (B-2 backend: 0b33df33 list + f3f52d9a read endpoints) and 1ffa4ba (authz test: both). This is NOT a splittable violation: specs 0b33df33 and f3f52d9a share the same physical files (`notifications.controller.ts`, `notifications.service.ts`) — the GET list endpoint (0b33df33) and PATCH/POST read endpoints (f3f52d9a) live in one controller + one service and cannot be file-separated without producing a non-compiling partial-file commit. Per build.md § commit hygiene ("one tightly-scoped set of commits if implementation legitimately splits across B-0 schema + B-1 contracts + B-2 backend + B-3 frontend"), the stage-scoped commit set is the correct granularity here. Forcing a rebase-split would be process gold-plating. Accepted, not REWORK.
- Minor/accepted: B-0 commit 239b13f omits an explicit `Refs:` line (body describes the schema for 0b33df33's data contract; 0b33df33 is cited by three sibling commits). Non-blocking.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---
## Phase 2 — production-bug review (recorded by orchestrator)
**Reviewer:** code-reviewer on `git diff main...HEAD`. First pass found 2 HIGH (single mark-read POST→404; panel never refetched → stale list) + MEDIUM-1 (cursor ms/µs skip) + MEDIUM-2 (count drift) + LOW. **REWORK executed** (Iron Law — routed to react-specialist + node-specialist):
- HIGH-1 FIXED (ce3d4cb): api.ts markNotificationRead POST→PATCH (align to @Patch controller).
- HIGH-2 FIXED (ce3d4cb): HeaderBell reload() on panel-open (list+count reconcile; also fixes MEDIUM-2 drift). +HeaderBell.test.tsx.
- MEDIUM-1 FIXED (43f02cf): cursor carries raw pg timestamptz (µs precision), keyset compares at ::timestamptz.
- LOW-1 FIXED (43f02cf): partial-unique (user_id,assignment_id) WHERE type='assignment_reminder' + migration 0016 backs createForReminder ON CONFLICT.
- HIGH-1 test gap FIXED (43f02cf): controller.spec asserts PATCH/POST route metadata → method drift fails CI.
Re-verified: repo typecheck 4/4, lint pass, api 521 + web 333 tests, build 3/3. **Re-review (iteration 2): PASS — no Critical/High remain**, no new bugs (1 INFO nit: stale UnreadCountResponse doc comment).

## Phase 2 — commit-discipline (Action 6) — PASS
Every claimed_task_id has ≥1 commit; the shared-file specs (0b33df33+f3f52d9a: controller/service serve GET list + PATCH/POST read on inseparable files) legitimately co-cited per build.md carve-out (head-builder ratified).

## Final verdict: APPROVE — B-block gate-passed.
