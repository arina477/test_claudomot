# Wave 69 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, Phase-1 gate — final re-gate)
**Reviewed against:** process/waves/wave-69/blocks/B/review-artifacts.md
**Attempt:** 2  (post-fix re-gate; attempt-1 APPROVED was invalidated by the Phase-2 /review P1 catch, now fixed in d7c5574 and re-reviewed clean)

## Verdict
APPROVED

## Rationale

Re-gated against the *actual post-fix code* (diff `e7af205..d7c5574` on `reports.service.ts` + the strengthened integration spec), not the fix summary. All three /review findings are correctly resolved, the five load-bearing authz invariants still hold after the transaction rewrite, and the single residual is bounded, documented, and correctly classified as V-2 debt rather than a merge blocker.

**P1 — TOCTOU double-resolve — FIXED, verified line-by-line.** `resolveReport` is now wrapped in `db.transaction(async (tx) => {...})` (reports.service.ts:277-375). The transaction spans the entire critical section: the FOR-UPDATE load (280-285), the cross-server tamper guard (293), the RBAC gate (299), the open-check (305), the action dispatch (311-349), and the conditional status flip (359-367). The row lock is acquired **at load** via `.for('update')` on the SELECT (line 284) — so a second concurrent resolve blocks at the SELECT until the first commits, then re-reads status != 'open' and throws 409 (line 306). The conditional flip is present and correct: `.update(reports).set(...).where(and(eq(reports.id, reportId), eq(reports.status, 'open'))).returning()` with an empty-returning → `ConflictException('Report was resolved by a concurrent request')` (366-372) — a genuine belt-and-suspenders second guard behind the row lock. The pre-fix version's unconditional `.where(eq(reports.id, reportId))` + generic `Error('Report update failed')` on empty is gone; this is a strict improvement. **No guard was moved, dropped, or reordered** — the security chain (load → tamper 404 → RBAC 403 → open-check 409 → dispatch → flip) is identical to pre-fix, only relocated inside the tx.

**P2 — timeout duration — FIXED.** `DEFAULT_TIMEOUT_MINUTES` 60 → 1440 (reports.service.ts:60), matching the design's "Timeout 24h" label. Integration test 8 pins it: asserts `muted_until` falls within ±60 s of `now + 24h` via a real-Postgres `harnessQuery` DB cross-check (spec lines 391-403) — the old 60-minute value would fail this.

**P3 — status validation — FIXED.** `getServerReports` runs `ReportStatus.safeParse(status)` before querying and throws `BadRequestException` on a non-enum value (reports.service.ts:209-216), closing the silent-empty-result gap. Integration test 11 exercises three invalid-status 400 paths.

**Five load-bearing authz invariants — RE-CONFIRMED post-fix:**
1. **no-IDOR — PASS.** `createReport` inserts `reporter_id: callerUserId` (session-derived, line 171); this function was untouched by the fix-up. `CreateReportSchema` carries no reporter field.
2. **moderate_members gate before mutation — PASS.** `rbacService.can(..., 'moderate_members')` at line 299 runs *before* dispatch (311) and flip (359), and now inside the serialising tx. `getServerReports` gate at 202 unchanged.
3. **rank-guard route-through UNCHANGED — PASS.** `setMemberTimeout(serverId, callerUserId, report.target_user_id, DEFAULT_TIMEOUT_MINUTES)` (arg order verified against the real signature at moderation.service.ts:40-45) and `deleteMessage(msg.channel_id, report.target_message_id, callerUserId)` (verified against messages.service.ts:801) both route through the existing services whose internal rank guards are NOT re-implemented here. The dispatch block was only wrapped in the tx, not altered.
4. **cross-server tamper guard before side effects — PASS.** `report.target_server_id !== serverId` → 404 (not 403, to avoid cross-server existence leak) at line 293, before RBAC, before any dispatch.
5. **server-side target_server_id resolution — PASS.** `createReport` resolves + persists `target_server_id` server-side for all three target types (server / member / message-via-channel); untouched by the fix-up.

**LOW crash-window residual — ACCEPTED as V-2 debt, NOT a REWORK.** `setMemberTimeout` / `deleteMessage` commit via the module-level `db` (outside the tx boundary, since those services can't accept a tx handle), then the status flip commits inside the tx. A process crash in the sub-millisecond window between the side-effect commit and the tx commit leaves the report `open` with the side effect already applied; on retry the side effect re-applies. This is idempotent by construction: a timeout re-applies as a *fresh, re-based* 24h expiry (worst case — NOT a compounded/stacked timeout), and a soft-delete re-delete is a no-op. The failure mode is bounded, non-escalating, requires a crash inside a nanoscale window, and is explicitly documented in code (reports.service.ts:262-269, 309-310). The proper fix — threading a tx handle through ModerationService/MessagesService, or an outbox — is a cross-module refactor that would be scale/robustness gold-plating for a self-use MVP. Correctly carried to V-2 per the /review re-run. Not a merge blocker.

**404-vs-403 ordering info-leak (P3 secondary)** — the fix-up commit body explicitly accepts this as documented debt: the 404 on cross-server access deliberately avoids leaking cross-server report existence, which is the more important boundary. Consistent with the tamper-guard design; accepted.

**Independent /review re-run:** CLEAN TO SHIP — all 3 fixes correct, no authz regression, exception-rollback + no-deadlock confirmed (the tx rolls back cleanly on any thrown exception; the single row lock per report cannot deadlock). Concur.

## Action 6 — Commit-discipline ruling (multi-spec)

**Ruling: PASS — no split required.**

The fix-up commit `d7c5574` cites exactly one task_id (`d7250881` = spec B, action loop) and its file set is exactly the two reports-feature files it should touch: `apps/api/src/reports/reports.service.ts` and `apps/api/test/integration/reports.integration.spec.ts`. Both `resolveReport`/`getServerReports` (the surfaces changed) belong to spec B. No cross-spec file drift; single task_id cited; commit body is exemplary (per-finding breakdown + explicit debt callout). The attempt-1 ratified co-location ruling for `e7af205` (specs A+B in the same ReportsModule, plan-mandated) stands unchanged. Every claimed task_id retains commit coverage: 9f2bb017 + d7250881 → e7af205 (+ d7250881 → d7c5574 fix-up); 96d5ed58 → 8312264. No orphan task_id; no commit reaches outside its spec block's file set.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 1

---

## Block-exit handoff

- build_block_status: complete
- branch: wave-69-moderation-reports
- review_verdict: APPROVE
- last_commit_sha: d7c5574ffcbbb813fc9d181e118a5581de834973
- ready_for_ci: true
