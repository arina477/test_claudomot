# Wave 67 — V-3 Verdict

**Reviewer:** head-verifier (fresh spawn, V-block gate)
**Reviewed against:** process/waves/wave-67/blocks/V/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

Both V-1 reviewers APPROVE with load-bearing evidence, not acceptance-by-assertion, and the V-2 triage is correctly classified — so the wave's shipped promise (browse the public directory + is_public-gated one-click join) is demonstrably met, and the single confirmed correctness bug is a zero-current-impact metric defect that I dispose to a follow-up rather than an in-wave fast-fix. **Karen's APPROVE is DB-cross-checked, not code-read:** she measured `memberCount` false against reality — raw `SELECT count(*) FROM server_members` returned 1 then 2 at the same instants the deployed `GET /servers/discover` returned 0, so the "memberCount = COUNT(server_members)" claim is WRONG, not merely unverified; and she verified the security gate's read-before-insert ordering (svc:614-631, 404/403 precede insert) plus the private-reject test asserting `insert.not.toHaveBeenCalled()` — a behavioral assertion, not a mocked count. **jenny's APPROVE is live-probed** (unauth discover → 401, unauth join-public → 401, private join-public → 403 ×2 per T-8, `/discover` → 200 SPA, migration 0024 resolves not-500) and she independently traced the drift to the correlated subquery at `servers.service.ts:550-554`. T-8 LIVE-confirmed the load-bearing is_public gate (403 on both a member-private server and the private proof server — not a backdoor), and T-5 proved browse+join end-to-end by publishing a fixture B owned and driving a real non-member A join to completion (button flipped to "Open", `GET /servers` returned it) — non-echo, real-DB. This is criteria-satisfaction with evidence, not green-suite inference. **The two "no NEW blocking findings" verdicts on a non-trivial change are not rubber stamps** — both reviewers surfaced and characterized the two known findings and probed the empty-directory question rather than waving it through.

**Triage assessment — correct, no mis-classification.** F67-T5-1 (memberCount:0) is correctly a confirmed spec-DRIFT / WRONG-claim (measured false against the DB), not noise. F67-T5-2 (role_id:NULL) is correctly non-blocking: jenny independently verified the live-and-shipped `joinViaInvite` core (svc:671-675) inserts the identical `{server_id,user_id}` with no role_id, and the spec AC explicitly mandates *reusing* that core — so the NULL-role is faithful pre-existing parity, an RBAC-substrate spec-gap, NOT a wave-67 regression. Routing it to the cross-cutting RBAC-intent follow-up (task dc4abee3, milestone_id NULL) rather than an in-wave patch is the right disposition — patching it here would guess RBAC intent on a substrate the spec told us to reuse (spec-gap-patching, correctly avoided). No severity-flattening, no green-by-suppression: no finding was closed by weakening a test or assertion.

## Disposition call — F67-T5-1 memberCount:0 → **DEFER** (re-classify as non-blocking follow-up; do NOT fast-fix in-wave)

This is the core V-3 judgment for this wave, and I rule **DEFER**, not FAST-FIX. Reasoning:

- **It is a real, confirmed, reproducible correctness bug** — every discover card understates membership as 0, measured false against the DB. On correctness grounds alone, it warrants a fix. That is not in dispute.
- **But it has ZERO current user impact.** The prod directory is organically empty by deliberate, documented scope (the publish-to-directory write path is fenced OUT of this substrate-first bundle). No public server can surface in `/discover` until the publish path `2bd37c4c` — the *immediate next M11 bundle* — ships. Therefore no real user renders a discover card, and no one ever sees `memberCount`, until `2bd37c4c` lands. The bug is latent behind a feature that does not yet exist in prod.
- **Fixing now costs a full api re-deploy cycle** (fix → CI → merge → Railway `railway up` on the api service, which is CLI-push not git-trigger) to correct a number no current user can see. That is a redundant deploy for a zero-impact defect.
- **Deferral's only real risk is being forgotten — and that risk is removed by tracking + co-location.** The fix's natural home is `2bd37c4c`, the very bundle that first makes memberCount user-visible, where: (a) the query fix ships in the same wave as the populated-grid path it feeds; (b) the missing live-DB test — the coverage gap Karen and jenny both flagged for L-2 (the unit test mocks memberCount and never exercises the real correlated subquery) — can be written against the real populated path rather than mocked; and (c) memberCount-shows-the-real-count becomes a hard acceptance criterion of the bundle that first exposes it, so it cannot re-ship broken.

This is a disposition call, not suppression: nothing is weakened, the finding is documented and owned, and it is escalated INTO the acceptance criteria of the next bundle. Fast-fixing now would trade a real deploy cycle for correcting a value zero users can currently observe. **DEFER wins on cost-vs-impact with the forgotten-risk fully mitigated.**

**Consequence of DEFER:** F67-T5-1 is re-classified from the fast-fix queue to a non-blocking follow-up. The fast-fix queue is therefore EMPTY, Phase 2 is skipped, and the V-block exits clean on this APPROVED verdict.

### Orchestrator follow-through (post-gate, before block exit)
1. Re-classify F67-T5-1 as a non-blocking follow-up: either fold the memberCount query fix into the `2bd37c4c` publish-path bundle spec (preferred — co-locates fix + live-DB test + first user-visible surface) OR author a dedicated follow-up task. If a standalone task, set `wave_id = NULL` so it is N-2-seedable (per known-failure: a follow-up with a non-NULL wave_id strands and is never seedable).
2. The fix, when authored, MUST include a live-DB test that exercises the real correlated subquery (not a mocked memberCount) — this is the coverage gap that let the bug ship green; carry it as an L-2 observation candidate.
3. The role_id:NULL follow-up (F67-T5-2, task dc4abee3) stays as-is — already correctly routed.

## Cascade
No REWORK, no ESCALATE. All V-stages hold; fast-fix queue emptied by disposition.
- **Stages that must re-run:** none.
- **Stages that stay untouched:** V-1 (Karen + jenny), V-2 (triage classification stands).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
- phase1_verdict: APPROVED
- fast_fix_queue_after_disposition: empty (F67-T5-1 deferred to non-blocking follow-up)
- proceed_to: block exit → L-block (Learn)
