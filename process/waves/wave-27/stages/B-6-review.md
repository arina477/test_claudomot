# Wave 27 — B-6 Review (Build block-exit gate)

**Branch:** wave-27-presence-perf @ c2e4b4d. **wave_type:** multi-spec.

## Phase 1 — head-builder gate verdict
Fresh head-builder (agentId aecf3296955d58fe0). Verdict: **APPROVED** (Attempt 1). Verified both specs against the diff:
- **Spec A honest:** real `index().on(user_id)` (servers.ts) + committed migration 0012 `CREATE INDEX ... (user_id)`; `presence.service.ts` EMPTY diff (index-only, no rewrite; getCoMemberUserIds untouched — SELECT DISTINCT no-op correctly excluded); EXPLAIN proof test genuine (CF-2 first, real EXPLAIN, skipIf fail-loud) — not decorative.
- **Spec B CARRY-B preserved:** ONE list-level subscription (count=1); AuthorPresenceDot React.memo'd on a derived scalar `status` → author-B's presence event does NOT re-render author-A's dot (dedicated CARRY-B test). Tri-state + AC4 + self-seed intact.
- **Commit-per-spec (Action 6):** ff4126b apps/api-only + Refs 6a546c7b; bd18a08 apps/web-only + Refs 07361daf. No cross-spec commit. PASS.
- **CARRY-A:** Spec A by postgres-pro. PASS.

## Phase 2 — /review production-bug pass
Independent adversarial code-reviewer. Findings:
- **[P1] EXPLAIN CI-flake** — presence-index-scan.spec.ts AC2 seeded 1 row + no enable_seqscan=off/ANALYZE → Postgres would pick Seq Scan on the tiny table → the AC2 Index-Scan assertion reds CI. **FIXED (postgres-pro, c2e4b4d):** added `harnessExplainWithSeqscanOff` (pinned PoolClient + BEGIN + `SET LOCAL enable_seqscan=off` + EXPLAIN + ROLLBACK) → planner deterministically costs the index path → Index Scan regardless of row count. + migration trailing newline.
- **[P3] test-comment nit** (presence-dots.test.tsx claims a custom `areEqual` that doesn't exist; the plain memo-on-scalar works) → **accepted cosmetic debt** (doc-only; behavior correct). Also flagged by head-builder.
- **[P3] migration newline** → fixed in c2e4b4d.
- **Categories CLEARED:** subscription lifecycle (no leak; channel-switch doesn't remount MessageList), missed-update (SentRow is a plain function, not memoized → tick propagates), self-seed timing (works), migration safety (additive btree, no collision).

## Post-fix re-verification
typecheck 4/4 · lint 0 errors (7 pre-existing warnings) · api 395/395 · web 254/254. Phase-1 verdict not invalidated (test-harness fix, not contract drift).

```yaml
phase1_head_builder_verdict: APPROVED
phase2_review_invocations: 1
findings_critical: []
findings_high: []                     # P1 EXPLAIN flake fixed
findings_medium_accepted: []
findings_low_accepted:
  - "presence-dots.test.tsx comment claims custom areEqual (plain memo-on-scalar works) — cosmetic doc nit"
fix_up_commits: [c2e4b4d]
final_verdict: APPROVE
commit_per_spec_discipline: PASS
```

## Exit
Phase 1 APPROVED, Phase 2 P1 fixed (EXPLAIN eligibility) + P3s (newline fixed, comment accepted), re-verified green, commit-per-spec clean. → C block.
