# Wave 82 — B-6 /review (Phase 2) output

**Scope Check:** CLEAN. Intent: fix transient-401 DM-after-login bounce. Delivered: AuthGuard settle-then-recheck + shared single-flight refresh + request()-seam defense-in-depth. Files match intent (5 auth files), no scope creep.

**Critical pass (orchestrator):** no Critical/High. Single-flight synchronous assignment (no two-refresh window), `.catch(()=>false)` never rejects at await sites, 429 layering intact (retryOn429 OUTER, withRefreshRetry INNER, disjoint status sets), genuine-logout preserved.

**Adversarial subagent (fresh context, af3ce4fc):** Recommendation **ship-as-is**. No Critical. Findings:

| # | Sev | Conf | Loc | Issue | Disposition |
|---|---|---|---|---|---|
| 6a | HIGH-sev / LOW-risk | 8 | api.ts:159 | POST retry safe ONLY by the 401⇒handler-never-ran invariant; undocumented | fast-follow (doc comment) — behavior already safe |
| 2a | MEDIUM | 7 | AuthGuard.tsx:47 | onSessionExpired no re-entrancy guard → multi-fire redirect under burst (idempotent nav) | fast-follow (settling flag) |
| 1a/5a | MEDIUM | 6 | refreshAndRetry.ts:53 | `.catch(()=>false)` conflates transient refresh-endpoint failure with revocation → spurious bounce on flaky net | fast-follow (transient-vs-revoked) |
| 5b | LOW | 6 | AuthGuard.tsx:87 | awaited redirectToAuth rejection could escape unhandled | accepted-debt (cosmetic; redirectToAuth resolves) |

**Triage:** 0 Critical, 0 real-High (6a neutralized by auth-layer-pre-handler-401 invariant). No same-branch blocking fixes. Behavioral-merit items (6a-doc, 2a, 1a) filed as a tracked fast-follow bundle rather than churning a green, correct diff (Iron Law — no orchestrator hand-edits; adversary recommended fast-follow, not blocker). 5b accepted as cosmetic.

```yaml
phase1_head_builder_verdict: APPROVED   # attempt 2 (attempt 1 REWORK caught the no-op defect)
phase2_review_invocations: 1
findings_critical: []
findings_high: []                        # 6a is HIGH-severity-label but LOW-real-risk, neutralized by invariant; filed fast-follow
findings_medium_accepted: [2a-reentrancy, 1a-transient-vs-revoked]   # filed as fast-follow tasks
findings_low_accepted: [5b-redirectToAuth-unhandled]
fix_up_commits: []
final_verdict: APPROVE
```
