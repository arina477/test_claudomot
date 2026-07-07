# Wave 70 — V-3 Verdict

**Reviewer:** head-verifier (fresh spawn, V-block gate)
**Reviewed against:** process/waves/wave-70/blocks/V/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

Both reviewers performed real, independent verification and the launch-gate safety core is
proven live — the two open findings are correctly triaged as non-blocking, neither is a
mis-downgraded safety issue, and neither is a dodged cheap fast-fix.

**Karen (source-claim, APPROVE, 0 findings) did genuine load-bearing verification, not a
rubber stamp.** She did not trust C-2's recorded Railway SUCCESS ids alone — she probed the
deployed api behaviorally this session: POST/GET /blocks → 401 (not 404 → route registered on
serving revision; not 500 → AuthGuard fired before DB, and a control `POST /blocks-nonexistent`
→ 404 proves the 401 is a real route, not a catch-all). Migration-applied is proven not by
assertion but by the T-8 live prod probe filing/reading/idempotent-double/deleting a REAL block
against the real `user_blocks` table (a block cannot be filed against a non-existent table).
The 5 DM HIDE seams are verified real and honestly decomposed (3 `isBlockedBetween` predicate
calls at :261/:599/:700 + 2 query-shaped seams — `NOT EXISTS` subquery in getDmCandidates, batch
`blockedConvIds` filter in listConversations, no N+1), matching B-2's documentation — this is the
kind of "3+2 not 5-theater" trap a false-negative reviewer misses, and Karen caught and cleared
it. A "no findings" verdict on a substrate-level change is exactly what warrants probing; here
the clean verdict is backed by direct behavioral evidence at every load-bearing point, so it
passes the spot-check.

**jenny (semantic-spec, APPROVE, 2 findings) independently probed DEPLOYED behavior vs spec
INTENT with 2 prod fixtures — not code-reading.** She exercised the full block endpoint contract
live (self-block 400, non-existent 404, empty-id Zod 400, happy 201, idempotent single-row,
IDOR-safe GET where B sees only own, DELETE 204 idempotent) AND all 5 DM HIDE seams
BIDIRECTIONALLY on prod (createConversation/sendMessage 403 both directions, getDmCandidates
excludes both, listConversations 1→0 both, listMessages 403 both), plus reversibility on unblock.
Her explicit answer to the load-bearing question — "blocked user's DMs + content hidden" holds
bidirectionally at the user-observable layer — is backed by live probes, not just the code paths
T-8 traced. That she surfaced 2 genuine defects while APPROVING the core is itself evidence she
was not rubber-stamping. Prod was left clean (her block deleted, GET /blocks as A → []).

**V-2 triage is SOUND — this is the core gate finding.** I independently checked the safety
boundary for each open finding:

- **FINDING-1** (member-row affordance is block-only, no Block↔Unblock toggle — MemberListPanel:546):
  real spec-drift against spec-C AC1 ("reflects blocked state"), correctly severity MEDIUM /
  non-blocking. It CANNOT leak or fail a block: the actual safety mechanism is the server-side
  bidirectional DM HIDE, which fires regardless of the member-row UI. A stale "Block" button
  re-issues an idempotent POST (proven: same row id, no dup, no error), and a working reverse path
  exists via /settings/privacy (verified live). UX, not safety. The fix (fetch blocks set + state
  lookup + toggle wire + label swap) is ~30-50 LOC across fetch/state/render — genuinely over the
  V-3 20-LOC single-file fast-fix budget, so deferral to M14 follow-on task 1193aebf is correct,
  not a dodged cheap fix.

- **FINDING-2** (blocked-list renders UUID not name — BlockedUsersPanel:265): real spec-gap against
  spec-C AC2, correctly severity MEDIUM / non-blocking. The list is functional (correct rows,
  working inline Unblock verified live); only the display name is a UUID. A UUID-vs-name cannot leak
  or fail a block. The root fix requires GET /blocks (spec A) to return profile fields — a CONTRACT
  change jenny explicitly scoped as a P-block scope decision, NOT a V-3 fast-fix. Deferral to M14
  follow-on task 1c633d2f is correct; forcing a contract change through a 20-LOC fast-fix would be
  the wrong move (guessing a contract seam under time pressure).

- **Noise bucket** correctly sized: B-6 P3 transient self-affordance fails safe (backend self-block
  400 is the real guard); stale "409" docblock comments are docs-only drift; group-DM per-author
  filtering + 3-user-group-block-untested are P-4-anticipated/fenced with safe minimal behavior
  shipped and CI integration covering the 1:1 logic. None are safety.

**Fast-fix queue is correctly EMPTY.** Neither blocking-candidate is a <20-LOC single-file fix:
FINDING-1 is over budget AND non-safety; FINDING-2 needs a contract change. No genuine cheap
fast-fix was deferred, and no safety finding was mis-classified as non-blocking. The wave shipped
live (C-2, both services on merge SHA a2c006a) and the launch-gate safety core (block authz +
bidirectional DM HIDE across 5 seams) is proven live on prod. No green-by-suppression: no finding
was closed by weakening a test or check; the 2 findings are honestly carried as filed follow-on
tasks (wave_id NULL, seedable per N-2), not buried.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---

## Block-exit handoff

```yaml
verify_block_status:    complete
karen_verdict:          APPROVE
jenny_verdict:          APPROVE
triaged_findings:
  blocking_resolved:    []
  non_blocking_tagged:
    - {id: FINDING-1, severity: MEDIUM, type: spec-drift, task_id: 1193aebf-0b83-4cb2-bec8-0caa98339241, milestone_id: M14}
    - {id: FINDING-2, severity: MEDIUM, type: spec-gap,  task_id: 1c633d2f-4cb7-4cd1-b589-b735e23228a2, milestone_id: M14}
  noise_suppressed:     4
fast_fix_cycles:        0
ready_for_learn:        true
```
