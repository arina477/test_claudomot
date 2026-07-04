# Wave 43 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, agentId head-builder-b6-w43)
**Reviewed against:** process/waves/wave-43/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)

## Verdict
APPROVED

## Rationale
The class-scheduling slice implements all three claimed tasks faithfully against the locked contract, with the authz boundary airtight and the offline-of-scope recurrence engine correctly bounded. Every `:id` route derives `server_id` from the fetched session row inside the service (never a client param) — IDOR-safe on update/delete/get; create/update/delete gate on `assertOrganizer → can(userId, serverId, 'manage_assignments')` and list/get gate on `assertMember`, mirroring the shipped assignments module with no new permission surface. Every route carries `@UseGuards(AuthGuard)` (SuperTokens `verifySession`, attaching `req.session.getUserId()` — same pattern the shipped AssignmentsController uses). The compute-on-read weekly expansion is provably bounded: the window is hard-capped at 90 days (60-day default), the first occurrence is fast-forwarded via `Math.ceil((windowStart - startsAt)/week)` (no linear scan from origin), the loop steps exactly one week and terminates at `min(recurrence_until, windowEnd)` — at most ~13 iterations per weekly session, no infinite-loop or DoS risk, and `'none'` sessions are emitted exactly once. The Zod contract is the single source (shared → DTO via `safeParse`, frontend types imported from `@studyhall/shared`), cross-field refines enforce `endsAt > startsAt` and weekly `recurrenceUntil >= startsAt`, with a defensive service-layer guard on create. Soft-deleted rows are excluded from every read path (list/get) and every `:id` target (update/delete → 404). The scope fence holds: a full grep of the scheduling backend, shared schema, and all three web components found zero reminder/RSVP/attendance/timezone/ICS/notification code. Migration 0020 is generated + committed (not auto-run), mirrors the assignments shape with `INDEX(server_id, starts_at)` and the correct FK cascade. Frontend Edit/Delete affordances are gated on `isOrganizer` (derived from `getMyPermissions().owner || manage_assignments`) as UX polish over the server-enforced 403. One Medium accepted-debt edge case documented below (single-field PATCH bypasses the cross-field time-order refine); it is not a security, contract-drift, or data-loss failure and does not block the gate. Commit discipline is clean: each of the three claimed task_ids has ≥1 commit citing exactly it, backend and frontend commits are file-disjoint, and the lone B-5 biome-format commit is a legitimate whole-branch formatting fix.

## Accepted-debt (Medium — not REWORK)

- **Single-field PATCH can bypass the `endsAt > startsAt` refine.** `UpdateScheduledSessionSchema`'s refine only fires when BOTH `startsAt` and `endsAt` are present in the patch (correct for a partial), and `updateSession` in the service has no defensive re-check against the persisted counterpart field (unlike `createSession`, which guards). A patch setting only `startsAt` to a value after the stored `endsAt` (or only `endsAt` before the stored `startsAt`) would persist an inverted interval. Impact is a benign display artifact in the agenda (negative duration), never a security or data-loss issue. Route to `node-specialist` in a follow-up: in `updateSession`, after merging the patch, re-assert `effectiveEndsAt > effectiveStartsAt` (fetched-or-patched) and throw 400 otherwise. Logged as accepted-debt for a later M8 sibling, not gated here.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
