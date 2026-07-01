# Wave 25 — B-6 Review (Build block-exit gate)

**Branch:** wave-25-mention-parity | **wave_type:** single-spec (Action 6 commit-discipline check skipped).

## Phase 1 — head-builder gate verdict
Fresh head-builder spawn (agentId a2302e3f5ac513fad). Verdict: **APPROVED** (Attempt 1). Verified all 5 ACs line-by-line against the diff (not manifest claims):
- AC4 atomicity real (same `tx` handle, sentinel throw inside txn, mirrors createReply/createServer).
- AC5 rollback spec honest (fault-injected at Pool layer, real ROLLBACK, no SUT mock; CF-2 import first; CI provisions postgres:16 + DATABASE_URL_TEST so it actually runs, not silent no-op).
- Approach deviation (client web-local mirror + parity test vs direct shared import) BLESSED as proportionate to the documented CJS-avoidance convention.
- Binding B-1 carry honored (export named as mention TOKEN slug, warned against tightening to username grammar).
- One Medium (unused shared exports) recorded as accepted-debt, not rework.
Verdict file: `process/waves/wave-25/blocks/B/gate-verdict.md`.

## Phase 2 — /review production-bug pass
Independent adversarial code-reviewer (fresh context) on the diff vs main. Full report: `stages/B-6-review-output.md`.
- **0 critical / 0 high.** Core atomicity confirmed genuinely correct.
- 3 Medium: #1 rollback-proof honesty (row-content assertions on SUT pool while claiming isolation) + #2 single-source-of-truth gap (regexes hardcoded, not derived from `MENTION_TOKEN_SLUG_SRC`) → both FIXED same-branch (charter-relevant, cheap). #3 mid-word split boundary → ACCEPTED DEBT (pre-existing, low blast radius, deferred).
- 4 Low: 1 subsumed by fix #2, 3 accepted (pre-existing / convenience).

## Fix-up commits (Iron Law: routed to specialists)
- `f9b7887` — backend-developer: rollback spec routes ALL post-rollback assertions through the separate `harnessPool` via new `harnessQuery` helper; comments now true per-assertion. (Medium #1)
- `aeeb8d6` — typescript-pro: `MENTION_TOKEN_SLUG_RE` + `extractMentionSlug` (shared + web mirror) derived from `MENTION_TOKEN_SLUG_SRC`; parity test gains `['@pre.fix','pre']` class-boundary-drift guard; behavior byte-identical. (Medium #2, subsumes P3 dead-export)

## Post-fix re-verification (Action 3) + re-review (Action 5)
typecheck 4/4 · build 3/3 · lint 0 errors (7 pre-existing warnings) · api 395/395 · web 234/234. Both fix diffs re-read: surgical, behavior-preserving, no new critical/high. Phase-1 verdict NOT invalidated (Medium tightenings, not contract drift) — no head-builder re-spawn needed.

```yaml
phase1_head_builder_verdict: APPROVED
phase2_review_invocations: 1        # + 1 lightweight post-fix confirmation
findings_critical: []
findings_high: []
findings_medium_accepted:
  - "MessageList.tsx:560 mid-word @ split boundary still divergent from server (?:^|\\s)@ — pre-existing, low blast radius (server mentions[] gate); → L-1 / future-seed"
findings_low_accepted:
  - "mentions.spec.ts txn mock forwards tx.* to same mocks (integration spec is the real atomicity proof)"
  - "messages.service.ts:683 resolveMentions non-tx read pre-txn (pre-existing, createReply parity, negligible)"
  - "MessageList @bob) now resolves+trails (net-positive behavior change, test-covered)"
fix_up_commits: [f9b7887, aeeb8d6]
final_verdict: APPROVE
```

## Exit
Phase 1 APPROVED · Phase 2 no critical/high (2 Medium tightened, 1 deferred) · fix-ups landed + re-verified green · all pushed (HEAD aeeb8d6). → C block (CI/CD).
