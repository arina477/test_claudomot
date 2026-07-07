# P-0 Frame — wave-69

## Discover
- wave_db_id: ea3de54c-7d20-402a-979a-36c8738c4fc8 (wave_number 69, running; milestone M14 backfilled)
- Prior-work: M11 discovery (waves 67-68) shipped public server directory + join + publish — exposed users to un-invited actors. M14 (BOARD 7/7-mandated at wave-68 L-1) is the moderation launch-gate. THIS is M14 bundle #1 (report→action→unlist). Cited.
- Roadmap milestone: M14 Trust & Safety (6a9424fe), in_progress. ## Class product-feature, mvp-critical, Tier T1. (→ mvp-thinner spawned.)
- Spec-contract short-circuit: no-prior-spec (decomposer prose, 3 tasks).
- Product decisions: report-actioning gated on can(moderate_members)+rank-guard; unlist owner-gated (opt-in is_public=false). Moderation POLICY = owner/mod discretion (not a platform-policy call this wave). Public-launch-go + platform-admin-takedown-role remain FOUNDER-RESERVED. Monetization/compliance untouched.

## Reframe (3-task M14 bundle #1: 9f2bb017 seed + d7250881 + 96d5ed58)
- **problem-framer: PROCEED** — report→action→unlist is cause-layer + right shape; REUSES ModerationService.setMemberTimeout (moderation.service.ts:47-53, gated on can(moderate_members)+assertRankGuard), MessagesService.deleteMessage soft-delete (messages.service.ts:801/838), discoverServers is_public filter (:615), owner-authz idiom (:372/412/462) — no second permission system. Authz STRONG (callerUserId from session, no IDOR; cross-server tampering blocked by report.target_server_id===serverId; unlist owner-gated, platform-admin deferred). reports table net-new. Scope coherent (block/admin-queue/appeals/auto-detect/rate-limits deferred). Notes for P-2/P-3: deleteMessage needs channelId (resolve from message row — mechanical); non-owner-mod unlist is a P-2 scoping question (owner-only for now).
- **ceo-reviewer: PROCEED / HOLD-SCOPE** — BOARD-mandated launch gate, correct priority over founder-reserved M9/M10/M13; right coherent bundle (block = separate cross-server surface, don't pull forward; no reduction — dropping UI=unreachable, dropping action=inert reports). FLAGS: this bundle does NOT complete the launch gate (block + full coverage need ≥1 more bundle) — do NOT close M14 or imply launch-ready at N-1; public-launch-go stays founder-reserved + blocked on M14; realist caveat — T-9 must prove the report→action→resolution loop end-to-end live.
- **mvp-thinner: OK** — every AC traces the M14 success metric verbatim; member/message reporting NOT deferrable (metric names "server, member, OR message"); one reports table/target_type enum (splitting = later enum-ALTER); block(leg 3)/admin-queue/appeals correctly OUT. ~2800 LOC clears the multi-spec >2,500 floor INDEPENDENTLY (above floor; no override needed).

**Disposition: PROCEED** to P-1 (multi-spec, 3 tasks, ~2800 LOC, ABOVE floor).

**Final framing for P-block:** M14 bundle #1 = the public-directory report→action→unlist safety loop. (1) Report SUBSTRATE: new `reports` table (target_type: server|member|message, target ids, reporter=session user, reason, status) + POST /reports; directory-level UNLIST (owner sets is_public=false → drops from GET /servers/discover). (2) ACTION loop: owner/moderator (can(moderate_members)+assertRankGuard) actions a report → reuse ModerationService (timeout) + MessagesService.deleteMessage (message soft-delete) for in-server takedown + resolve/dismiss the report; report status transitions. (3) UI: student report affordance (on listings + in-server member/message) + owner report inbox (list + action). CARRIES: report-action authz server-side (can(moderate_members)+rank-guard, hard AC); no-IDOR (callerId from session); cross-server tampering guard; deleteMessage channelId resolved from message row; report all 3 target types. STRATEGIC (founder, not blocker): launch gate incomplete after this bundle (block + coverage = later); public-launch-go founder-reserved; platform-admin-takedown-role future founder-reserved.

```yaml
short_circuit: no-prior-spec
roadmap_milestone: 6a9424fe-c943-4b26-9110-6915661a6fb9
disposition: PROCEED
wave_type_expected: multi-spec
claimed_task_ids: [9f2bb017-fd19-464d-ab2b-c13ed75c04bb, d7250881-eb30-40fc-880a-95cf055c2425, 96d5ed58-ccc9-482a-a469-ec714edb7962]
design_gap_flag: unset  # P-1 (likely true — report UI + owner inbox new surfaces → D-block)
strategic_notes: [launch-gate-incomplete-after-this-bundle, public-launch-go-founder-reserved, platform-admin-takedown-future-founder-reserved]
