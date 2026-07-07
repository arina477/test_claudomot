# Wave 70 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, B-6 Phase-1 gate)
**Reviewed against:** process/waves/wave-70/blocks/B/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

Verified by reading the actual code + diff (`git diff main...wave-70-user-block`), not the stage summaries. The launch-gate core — the user-to-user Block substrate plus the DM HIDE predicate — is correct and complete against the 4-block spec, and the security invariants hold in the shipped source. All three block endpoints derive `blocker_id` exclusively from `req.session.getUserId()` (never from body/params), `GET /blocks` returns only the caller's own list, `CreateBlockSchema` carries no `blocker_id` field, and the controller is `@UseGuards(AuthGuard)` — no IDOR surface. The DM HIDE predicate is applied at all five DmService seams (createConversation 403, sendMessage 403, getDmCandidates NOT-EXISTS exclusion, listConversations filter, listMessages 403 direct-URL-bypass guard), each using the bidirectional `isBlockedBetween` helper, and each is layered on top of the pre-existing `isParticipant`/`enforceWhoCanDm` gates rather than replacing them. Idempotency and the guard matrix are correct: self-block→400, missing-user→404, double-block→`onConflictDoNothing` single row, unblock-not-blocked→no-op. No circular DI (BlocksModule→DmModule one-way; BlocksService independent of DmService). The spec-D member-row fix threads `profile.userId` via AppShell→MemberListPanel and the `isSelf` guard suppresses BOTH Report AND Block on the viewer's own row. The 19-case LIVE-DB integration spec genuinely exercises the block authz path and all five DM seams bidirectionally against real Postgres (`DATABASE_URL_TEST` is set in CI at `.github/workflows/ci.yml:46`, so it is not silently skipped), and the pre-existing DM unit tests were preserved (only a default-false BlocksService mock was added to the constructor — no test gutting). Multi-spec commit discipline is clean (see § Commit-discipline ruling). The one known gap — the blocked-users settings list rendering a UUID fallback instead of avatar+name — is a real but non-security, secondary-surface UX shortfall that does not gate the safety-critical Block+HIDE work; it is accepted as a V-2 follow-on (see § Known-gap ruling).

## Security-invariant verification (read from source)

1. **no-IDOR** — PASS. `blocks.controller.ts`: `createBlock`/`removeBlock`/`listBlocks` all take `blockerUserId = req.session.getUserId()`. `blockedUserId` comes from validated body (POST) or route param (DELETE), never the blocker. `listBlocks(blockerUserId)` → `WHERE blocker_id = blockerUserId` (own list only). `CreateBlockSchema = z.object({ blockedUserId })` — no blocker field. Controller `@UseGuards(AuthGuard)` (real supertokens `verifySession` guard).
2. **DM HIDE at all 5 seams** — PASS, all bidirectional, all additive. createConversation (line ~260, per-target `isBlockedBetween` → 403), sendMessage (line ~598, per other-participant → 403), getDmCandidates (line ~844, `NOT EXISTS` either-direction subquery), listConversations (line ~504, batch either-direction block-rows → excludes conv), listMessages (line ~699, per other-participant → 403 direct-URL guard). `isBlockedBetween(a,b)` is a single `OR(a→b, b→a)` query — genuinely bidirectional. Existing `enforceWhoCanDm` + `isParticipant` gates remain and run before the block check.
3. **idempotency + guards** — PASS. self-block→`BadRequestException` (400); missing user→`NotFoundException` (404); double-block→`onConflictDoNothing` on `UNIQUE(blocker_id,blocked_id)`, conflict path re-fetches and returns the single existing row; unblock-not-blocked→`DELETE` with no match, no error (204 upstream). DB `UNIQUE` constraint present in migration 0026.
4. **No circular DI** — PASS. `DmModule imports [BlocksModule]`; `BlocksModule exports [BlocksService]`; `BlocksService` imports nothing from dm. One-way.
5. **member-row fix (spec D)** — PASS. `AppShell` passes `selfUserId={profile?.userId ?? null}` into `MemberListPanel`; `MemberItem` computes `isSelf = Boolean(selfUserId && member.userId === selfUserId)` and gates both the Report button (`!isSelf`) and the Block button (`!isSelf`); self-row kebab is `aria-hidden` + `pointerEvents:none`. Mirrors the wave-69 message-row isOwn gate.
6. **LIVE-DB integration spec (19 cases)** — PASS. Real pg-harness (first import, CF-2), 19 cases covering block CRUD, self/exists/double-block/unblock idempotency, no-IDOR listBlocks, bidirectional isBlockedBetween, and all 5 DM seams in BOTH directions (cases 10–19). Not stubbed. Runs in CI.

## Commit-discipline ruling (Action 6 — multi-spec)

All four `claimed_task_ids` have commit coverage and no commit crosses a spec-block file boundary:

| Commit | task_id(s) | File set | Boundary-clean? |
|---|---|---|---|
| 2642a45 (B-0) | bc5986a9 (spec A) | schema/user-blocks.ts + index + migration 0026 | yes |
| 60f3123 (B-1) | c8c9742a (spec B) | packages/shared/blocks.ts + index | yes |
| 3a9c81a (B-2) | bc5986a9 (spec A) | blocks/{service,controller,module} + dm.{service,module} + app.module + integration spec | yes (all spec-A backend surface) |
| 728c9b7 (B-3) | 6e4d56b2 (spec C) + cc783559 (spec D) | apps/web only: api.ts, BlockConfirmDialog, BlockedUsersPanel, MemberListPanel, AppShell, SettingsPrivacyPage, block-ui.test | yes (co-located frontend surface) |

**Co-location RATIFIED (not a split).** Specs C (block UI) and D (member-row fix) both mutate `MemberListPanel.tsx` — the `isSelf` guard added for D is the same guard that gates C's block affordance on non-self rows, and the P-3 plan explicitly serialized them under one react-specialist to avoid a merge conflict on that file. This is the same accepted pattern as wave-69's reports.service A+B co-location. Splitting the commit would tear the single `isSelf` change across two commits touching the same lines — a worse outcome. Spec A having two commits (B-0 schema, B-2 backend) is fine: both cite exactly one task_id (bc5986a9) and the rule requires ≥1 commit per task_id, not exactly one. PASS.

## Known-gap ruling — blocked-users list renders UUID fallback

**Ruling: ACCEPTED as a V-2 follow-on. Not a REWORK blocker.**

The gap is real: `GET /blocks` returns bare Block DTOs (`blocker_id`/`blocked_id`/`created_at` UUIDs), so `BlockedUsersPanel` maps `displayName: b.blocked_id`, rendering the blocked user's UUID as the name where the D-3-approved design (§7) specifies avatar + name. Reasoning for accept-as-follow-on:

- **The safety-critical work is complete and correct.** The Block predicate and the 5-seam DM HIDE — the actual M14 public-launch gate leg — fully work and are the load-bearing surface. A blocked user's DMs are hidden everywhere, cross-server, bidirectionally. That is the mvp-critical claim; it holds.
- **The gap is confined to a secondary management surface.** The blocked-users list is a review/undo convenience, not the enforcement path. Its unblock action works correctly (DELETE /blocks/:id, optimistic removal, error-restore). Only the display label is degraded.
- **No security or data-integrity consequence.** Rendering a UUID is a cosmetic/UX shortfall, not an IDOR, leak, or drift. The panel does not error on the fallback.
- **The fix is a clean, self-contained enrichment** (enrich `listBlocks` with a JOIN on users/profile, extend the list DTO with displayName/username/avatarUrl, render the enriched fields — B-1/B-2/B-3 touch). It is well-scoped for a follow-on task and does not require reopening the safety core.
- **Precedent + honesty.** The gap was flagged transparently in the B-3 commit body and the manifest carry, not hidden. Gating the entire safety-critical Block launch leg on a settings-list display label would be disproportionate — shipping the enforcement now and enriching the label next is the correct MVP sequencing.

**Follow-on directive (for V-2 / next-wave seed):** enrich `BlocksService.listBlocks` to LEFT JOIN `users` (+ profile) on `blocked_id`, return `{ id, blocked_id, displayName, username, avatarUrl, created_at }`; extend `BlockListResponseSchema` accordingly; drop the `displayName: b.blocked_id` fallback in `BlockedUsersPanel`. Specialist: backend-developer (listBlocks JOIN + DTO) → react-specialist (panel render). This is a V-2 follow-up, wave_id NULL, so it seeds cleanly at N-2 (per memory: V-2 milestone follow-up wave_id must be NULL).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2
