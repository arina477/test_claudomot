# Wave 13 — P-4 Gate Verdict (M3 message lifecycle: edit/delete + reactions + UI)

**Block:** P · **Gate:** P-4 · **Verdict source:** head-product · **Mode:** automatic
**Security-tightened gate:** APPLIES (edit/delete authz + realtime fan-out)

## VERDICT: APPROVED → Phase 2 (karen + jenny mandatory)

## Wave
- wave_db_id 9e3cf3bc (wave 13); M3 6198650e. multi-spec, 3 tasks. design_gap_flag TRUE.
- Bundle: seed e12886d7 (edit/delete + realtime) → d78df376 (reactions toggle + realtime) + f323a71f (UI).
- Reuses wave-12 MessagingModule + /messaging gateway + ChannelMessageGuard — NO new namespace/auth surface.

## Upstream stage-exit (all ticked from concrete artifacts)
- **P-0 Frame:** problem-framer PROCEED + ceo-reviewer PROCEED(HOLD-SCOPE) both present, reconciled. Maps to M3 (live milestone); M3-before-M4 justified (M4 offline-wedge has a hard dependency on a stable message-lifecycle contract). mvp-thinner SKIP (platform-foundation floor) — correct. Falsifiable: edit shows "edited"; deleted → tombstone; double-react toggles off; cross-client <1s.
- **P-1 Decompose:** one cohesive bundle (shared messages/reactions tables + guard chain + gateway + Zod). No cross-bundle unbuilt dep (seed schema-extends; reactions ∥ UI consume the two contracts). Both reviewers: not a split.
- **P-2 Spec:** 3-block, full YAML embedded at head of seed e12886d7 description (DB-canonical, verified via psql). Each AC independently verifiable. Non-goals explicit (threads/mentions/attachments/presence DEFERRED). Auth/authz surface flagged for tightened gate.
- **P-3 Plan:** reuses locked architecture (the @OnEvent → server.to('channel:id').emit room-only pattern; ChannelMessageGuard; RbacService.can; committed migration no-auto-migrate). No scale gold-plating (no Redis/multi-replica — single-pod in-memory adapter retained). Each step → bundle task → observable artifact.

## Security-tightened judgements (load-bearing claims VERIFIED against live wave-12 code)
- **Edit authz (AUTHOR-ONLY, server-side):** PASS. messages.service editMessage checks `message.author_id === session.getUserId()` else 403. `messages.author_id` confirmed present (schema L17; service L36/L93/L124). Deleted message can't be edited (409/404 in AC2). Non-author → 403 (AC5).
- **Delete authz (author OR moderator, server-side):** PASS. `RbacService.can(userId, serverId, 'manage_channels')` exists (rbac.service.ts L46), `'manage_channels'` is a valid Permission (L29), owner-superuser + default-deny semantics intact. Path: resolve serverId from message→channel→channels.server_id (notNull; pattern proven by canViewChannelById L344), then can(manage_channels). Moderator can delete others'; regular member cannot (AC3/AC5).
- **Soft-delete (row-level tombstone):** PASS. is_deleted/deleted_at + content tombstone; no hard delete; no thread machinery. Matches _library L153 (is_edited/edited_at/is_deleted/deleted_at; "[deleted]" at query layer; content_snapshot prevents account-delete tombstones). Idempotent.
- **Reactions idempotent:** PASS. Toggle via UNIQUE(message_id,user_id,emoji) (matches _library L142). user from session. Aggregated [{emoji,count,reactedByMe}] on list/get; reactedByMe per caller. Cascade on message delete.
- **Realtime fan-out (room-only, no leak):** PASS. Extends the wave-12 @OnEvent('message.created') → `this.server.to('channel:'+id).emit(...)` pattern (messaging.gateway.ts L207-211) — never broadcast-all. message.updated/deleted + reaction.added/removed reuse it identically. No new namespace/auth surface (gateway WS-upgrade auth + join_channel canViewChannelById gating unchanged).
- **Data model + migration:** PASS. Soft-delete cols + reactions UNIQUE match _library. Committed migration (drizzle-kit generate → migrate; no auto-migrate) per _library migrations contract.
- **Controllers reuse the guard chain:** PASS. New PATCH/DELETE/POST routes use @UseGuards(AuthGuard, ChannelMessageGuard) + req.session.getUserId() (IDOR-safe; never body) — identical to the proven wave-12 messages.controller pattern.
- **T-8 plan:** edit/delete cross-user 403 + idempotent reaction + room-only fan-out + two-client (edit/delete/react <1s cross-client) via the wave-11 fixture — all named in P-3 Security/Sequencing.

## Non-blocking build-time reconciliation (NOT a gate-blocker)
- Table-name discrepancy: `_library` L142 names the reactions table `reactions`; the wave-13 spec/plan name it `message_reactions`. Internally consistent within the wave's own artifacts, so non-load-bearing for the gate. Reconcile to the `_library` canonical name (`reactions`) at B-0 (schema) to avoid a divergent table name in the locked architecture; carry to B-0/database-administrator.

## Falsifiable AC + specialist routing
- Each block: falsifiable ACs → P-3 step → valid AGENTS.md specialist (database-administrator/postgres-pro, backend-developer, head-designer, react-specialist). design_gap_flag TRUE → D-block (component-level delta on server-channel-view.html). Scope holds: NO threads/mentions/attachments/presence.

## Handoff
- design_gap_flag TRUE → D-block runs (D-1 Brief → D-3) BEFORE B-3 UI, per P-3 sequencing.
- Carry to B-0: reconcile reactions table name to `_library` canonical (`reactions`).
- Phase 2 (this gate): karen (load-bearing-claim re-verify) + jenny (spec-vs-bet/journey drift) MANDATORY before block exit.

```yaml
head_signoff:
  verdict: APPROVED
  stage: P-4
  reviewers: { problem-framer: PROCEED, ceo-reviewer: PROCEED-HOLD-SCOPE, mvp-thinner: SKIP, karen: PENDING-phase-2, jenny: PENDING-phase-2 }
  failed_checks: []
  rationale: >
    All upstream stage-exit boxes tick from concrete artifacts. Every load-bearing security
    claim verified against live wave-12 code: edit author-only (real author_id, server-side ===),
    delete author||moderator (RbacService.can(manage_channels) exists and is the documented path,
    serverId resolvable from channel as canViewChannelById already does), soft-delete row-level
    tombstone matching _library, reactions idempotent via the real UNIQUE(message_id,user_id,emoji),
    room-only fan-out reusing the proven @OnEvent → server.to('channel:id').emit pattern with no new
    namespace/auth surface. Plan respects the locked architecture and adds no MVP-unneeded infra.
    The only finding is a non-load-bearing table-name discrepancy (_library 'reactions' vs spec
    'message_reactions') reconciled at B-0 — not a gate-blocker. Build-ready.
  next_action: PROCEED_TO_P-4-phase-2 (karen + jenny), then handoff to D-block (design_gap_flag TRUE)
```

---
## Phase 2 — Karen + jenny — PASS (Gemini UNAVAILABLE-transient)
- **Karen APPROVE** — 8/8 claims VERIFIED vs live: messages.author_id; @OnEvent→server.to room-only pattern (gateway:207); can(_,_,'manage_channels') valid (rbac:46, Permission:29); canViewChannelById resolves channels.server_id (:344); ChannelMessageGuard channelId-@Param reusable; soft-delete cols don't exist yet (migration real); idempotent toggle implementable; no gold-plating. Table-name → KEEP message_reactions (record override; _library non-binding+self-contradictory).
- **jenny APPROVE** — 3/3 blocks MATCH; completes M3 conversational basics (edit/delete/react = next scope clause); no creep (threads/mentions/attachments/presence deferred); reuses wave-12 gateway; M3 progressing-not-closeable; correctly before M4 (offline needs frozen message contract). content_snapshot out-of-scope (don't regress).
## BINDING CARRY-FORWARDS to B:
- (1) deleteMessage must resolve serverId from channels.server_id BEFORE rbacService.can(userId, serverId, 'manage_channels') — can() is serverId-keyed (one extra select; canViewChannelById shows the pattern).
- (2) Use specialist **postgres-pro** at B-0 (database-administrator is NOT registered in AGENTS.md — rule 11).
- (3) Record the message_reactions-vs-_library-`reactions` name override in the migration comment; reconcile _library L142 at L-1.
- (4) Don't regress _library L155 content_snapshot (out-of-scope send-path); pin 200/204 + 409/404 at T-2.
GATE: PASS → D-block (component-level edit/tombstone/reaction-pills on server-channel-view.html). Security-tightened satisfied. T-8: edit/delete cross-user 403 + idempotent reaction + room-only fan-out + two-client <1s via wave-11 fixture.
