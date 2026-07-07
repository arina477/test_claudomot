verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
symptom_vs_cause: |
  Run (mandatory). Symptom = "waves 67-68 made servers publicly discoverable, exposing
  users to un-invited actors with no recourse." The bundle does NOT patch at the symptom
  layer (e.g. hide the discovery UI, add a static 'contact support' link); it addresses the
  cause — the absence of a report -> action -> unlist primitive. Cause-layer fix. No
  symptom-vs-cause confusion.
reasoning: |
  Framing is sound across all four checks. (1) SHAPE is correct: report substrate (net-new
  `reports` table + POST /reports) -> in-server action loop (reuses ModerationService +
  MessagesService, NOT a second permission system) -> directory unlist (flips is_public=false,
  reusing the existing discover filter). Every reuse claim was verified against code and holds:
  ModerationService.setMemberTimeout gated on can(moderate_members)+assertRankGuard
  (moderation.service.ts:47-53); MessagesService.deleteMessage soft-delete gated on
  moderate_members+rank-guard (messages.service.ts:801,838); discoverServers filters
  is_public=true (servers.service.ts:615); owner-authz idiom owner_id!==callerId->Forbidden
  (servers.service.ts:372,412,462); moderate_members is a real RBAC flag (rbac.service.ts +
  packages/shared/src/rbac.ts); reports table confirmed absent (net-new). PRODUCT-PRINCIPLES
  rules 1 & 2 satisfied. (2) AUTHZ (key check) is strong: report-actioning is server-side
  gated on can(moderate_members) and routes timeout/delete through the existing services so
  assertRankGuard applies unchanged; callerUserId always from req.session.getUserId() (no IDOR);
  cross-server tampering blocked by report.target_server_id===serverId. Unlist is owner-gated
  (owner_id!==callerId->Forbidden) with platform-admin unlist explicitly deferred — coherent.
  (3) SCOPE is a coherent first slice matching success-metric legs 1+2; block, platform-admin
  unlist, appeals, triage/filtering, auto-detection, rate-limits correctly deferred to later
  M14 bundles. (4) No mis-layering: unlist mutates the single is_public state the directory
  read already keys on, rather than a parallel hide-table.
non_blocking_notes: |
  Two items for P-2/P-3, NOT framing defects:
  - MessagesService.deleteMessage(channelId, messageId, userId) requires a channelId that the
    reports row does not store (it stores target_message_id + target_server_id). The message
    row carries channel_id (messages.ts:26), so the resolve action resolves the channel from
    the message before calling deleteMessage. Mechanical B-block detail; correctly abstracted
    in the framing as "calls the existing deleteMessage path."
  - Owner-initiated unlist reuses the OWNER-only path (owner_id!==userId), not moderate_members.
    Coherent for a takedown-your-own-server action and consistent with the deferral of
    platform-admin. Whether a non-owner moderate_members mod should also unlist is a legitimate
    P-2 scoping question, but the seed's choice (owner-only now) is internally coherent — not a
    reframe trigger.
proposed_reframe: |
  n/a
escalation_reason: |
  n/a
sibling_visible: false
