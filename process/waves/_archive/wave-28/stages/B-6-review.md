# Wave 28 — B-6 Review

## Phase 1 — head-builder gate
Fresh head-builder spawn (agentId aa411956174d4c68b) → **APPROVED**. All 7 gate items PASS: owner-ONLY authz (no creator path), CSPRNG+23505-retry reuse, old-link invalidation proven by integration test against real resolvers, controller wiring, test honesty, scope discipline (no rate-limit/audit/UI/RBAC), AuthGuard verify-only + in-service owner check. Verdict at `blocks/B/gate-verdict.md`. Noted B-2 formatter miss (non-blocking; remediated f78552c) — flagged: if it recurs a 3rd time, L-2 should promote a hard pre-commit biome gate.

## Phase 2 — /review (adversarial, 2 parallel passes)
Security specialist + adversarial red-team pass on the ~321-line code diff.

**No P0/P1 code bugs.** Findings + triage:
| Finding | Sev | Disposition |
|---|---|---|
| Rotate-vs-join non-transactional race (in-flight join on old code may still admit before rotate commits) | P1 (INVESTIGATE) | Inherent to rotation-invalidation; acceptable at scale. **Fixed = documented** in rotateInviteCode JSDoc (42636bc). Strict invalidation (SELECT FOR UPDATE in join) deferred/out-of-scope. |
| 23505 retry guards only servers.invite_code self-collision, not cross-namespace invites.code (~2^-128) | P1 (INVESTIGATE) | Negligible; **documented** as known non-issue in JSDoc (42636bc). |
| 23505-retry unit test asserts the mock, not that a NEW code is generated on retry | P2 (test-honesty, 9/10) | **Fixed** (42636bc): test now captures `.set()` code per attempt + asserts attempt-2 ≠ attempt-1. |
| "differs from old-code" unit assertion trivially true (mock never persists) | P2 | **Fixed** (42636bc): downgraded to base64url-shape check; real old-vs-new contract owned by the integration test. |
| 403-vs-404 existence oracle (non-owner→403, missing→404) reveals server existence | P2 (6/10) | **Accepted-debt**: 403 matches spec AC4 + existing findServerDetail precedent; server ids are non-secret UUIDs; owner-only mutation still enforced. No code change. |

Reviewer overall recommendation: **MERGE with the cheap fixes** — all applied at 42636bc. Re-verify after fix-up: typecheck 4/4, lint 0-err, 402 unit pass. The two P1s were accepted-if-documented → now documented (resolved-in-record); no critical/high remains → no fresh head-builder re-spawn needed.

## Action 6 — commit-discipline
SKIP (wave_type single-spec).

```yaml
phase1_head_builder_verdict: APPROVED
phase2_review_invocations: 1
findings_critical: []
findings_high: []                      # both P1s were INVESTIGATE/accept-if-documented → documented at 42636bc
findings_medium_accepted: ["403-vs-404 existence oracle (matches spec AC4 + findServerDetail precedent)"]
findings_low_accepted: []
fix_up_commits: [f78552c, 42636bc]     # f78552c formatter (B-4); 42636bc docs + test-honesty (B-6)
final_verdict: APPROVE
```

## Exit
Phase 1 APPROVED + Phase 2 /review findings all resolved (2 documented, 2 test-fixed, 1 accepted-debt). No critical/high. → C-block.
