# Wave 18 — B-6 Review
```yaml
phase1_head_builder_verdict: APPROVED   # code-read; Phase-2 /review caught a CRITICAL IDOR it missed
phase2_review_invocations: 2
findings_critical: []   # C-1 IDOR (thread routes dropped channel-membership authz) FIXED (canViewChannelById parent-derived, 3 tests) + re-confirmed
findings_high: []       # H-1 (reply soft-delete no thread-scoped event → panel/affordance drift) FIXED (thread:reply:deleted end-to-end) + re-confirmed
findings_medium_accepted: [M-1 dead reconcile branch REMOVED, M-2/M-3 relative-time cosmetic]
findings_low_accepted: [L-1 idempotency scope unreachable, L-2 authorId display (consistent), L-3 FK no-action fail-safe, L-4 Esc capture listener]
fix_up_commits:
  - "C-1: canViewChannelById(userId, parent.channel_id) on createReply + listThreadReplies (parent-derived authz, query-param can't bypass); 3 IDOR tests (non-member 403 x2, member 200)"
  - "H-1: thread:reply:deleted event {parentId,channelId,replyId,replyCount,lastReplyAt} → client affordance (hide@0) + panel removal"
  - "M-1: removed dead reconcile-by-idempotency_key branch (server never echoes the key); reconcile via API-confirm + socket dedup-by-id"
final_verdict: APPROVE
```
- Phase 1 head-builder APPROVED by code-reading — but Phase-2 /review (adversarial) caught a CRITICAL IDOR (thread routes used AuthGuard only, dropped ChannelMessageGuard; service made zero membership checks → any authed user could read/post in any channel's thread incl private) + a HIGH realtime-delete divergence. **LESSON (L-2 candidate, 2nd instance after wave-17): the Phase-1 code-read gate is insufficient for security/realtime correctness — adversarial Phase-2 /review is load-bearing.** Security-scope gate (wave touches channel authz) correctly surfaced the IDOR.
- Repo green post-fix: typecheck 4/4, build 3/3, lint 0, api 309 (+IDOR+delete-event tests), web 145. Re-review: 0 Critical/High.
