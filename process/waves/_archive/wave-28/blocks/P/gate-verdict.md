# Wave 28 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, P-4 Phase 1)
**Reviewed against:** process/waves/wave-28/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This wave closes a real, launch-gating security hole: the permanent server invite link (`servers.invite_code`, made the default shared link in wave-8b) currently has no invalidation path once leaked, because revoke only covers the ad-hoc `invites` table — the permanent code isn't in it. Adding an owner-gated `POST /servers/:id/invite-code/rotate` that regenerates the CSPRNG code in place is the correct cause-layer fix, not a symptom patch, and the falsifiable success signal is concrete (AC2: the old link returns 404 after rotate). The P-block is build-ready across all four gated dimensions. Framing: root cause named, mapped to a live launch-gating / milestone-agnostic bet, all three P-0 reviewers present and reconciled (problem-framer PROCEED / ceo-reviewer PROCEED-HOLD-SCOPE / mvp-thinner OK — no silent override, no ceo-vs-mvp mediation needed). Decomposition: genuinely atomic single-spec (owner-gate → regenerate → invalidate is inseparable; a partial rotate is a security hole or a no-op), keep-OUT items split cleanly, no dependency on unbuilt tasks. Spec: 7 ACs each independently verifiable via concrete HTTP observables, all non-happy states covered (401/403/404/409, old-link-dead, new-link-works, concurrent last-write-wins, 23505 retry), non-goals explicit, auth/authz surface flagged for the security-scope gate, and the load-bearing owner-ONLY-vs-owner-OR-creator distinction is correctly specified (rotate mirrors revoke's owner branch and drops the creator path — the permanent code has no creator concept). Plan: reuses the locked architecture (generateCode + 23505-retry + inline in-service owner-check per the shipped revoke convention) rather than inventing a parallel path — a reusable guard-class and a flag-column were both considered and rejected with rationale; every AC maps to a file-level step; node-specialist is the correct route (vs deprecated backend-developer, vs supertokens-integration which is unneeded since AuthGuard is reused unmodified). The security keep-OUT list is defensible NOW: rate-limiting has no abuse/enumeration surface at 0 prod servers behind an owner-ONLY door and is a documented decision (not an omission), audit-log defers to M10 Compliance, and the client regenerate-link UI is demand-gated (the endpoint alone satisfies the trigger, design_gap_flag=false is correct). The under-floor override-ship is legitimate: 7th consecutive under-floor M5-debt wave, floor_merge_attempt 0 is correct because re-invoking decomposition is known-futile (M5's only unbuilt scope is Resend-cred-blocked) and would contradict all three reviewers who rejected expansion, and the wave-24 BOARD standing instruction ("do not re-litigate an Nth per-wave; PRECEDENT-APPLICATION") applies squarely — no fresh BOARD required. The M5 park-or-key fork is correctly carried as record-only founder-pending, not re-raised.

## Security-scope tightened gate — awareness (carry to Phase 2 + T-8)
This wave's surface intersects `{auth, authorization, user-invite-secret}`: owner-only authorization (not any authenticated member), CSPRNG regeneration (base64url ~128-bit via `generateCode()`), and proven old-link invalidation. The tightened P-4 gate and T-8 Security are in-scope. Phase 2 must confirm: (1) the owner-ONLY branch does NOT reuse revoke's OR-creator path; (2) the CSPRNG reuse is real (`generateCode()` servers.service.ts:35-37) and not a weaker code path; (3) old-link invalidation is proven end-to-end (integration AC2/AC3); (4) the no-rate-limit decision is documented, which it is. Karen should spot-check the load-bearing line refs (servers.service.ts:35-37 / :286-317 / :354 / :401-402; servers.controller.ts:133; db/schema/servers.ts:20); jenny should confirm no drift vs product-decisions 2026-06-30 (invite-rotation as re-homed independent M5 backlog, not assignments scope).

## Rework instructions
N/A — APPROVED.

## Escalation
N/A — APPROVED.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

# Wave 28 — P-4 Verdict (Phase 2 — Karen + jenny + Gemini merged)

**Phase:** 2
**Reviewers:** karen (agentId af1066d8a8a115510) · jenny (agentId a3dd86b4484bd4feb) · Gemini cross-review

## Per-reviewer status
| Reviewer | Verdict | Detail |
|---|---|---|
| **karen** | **APPROVE** | All 8 load-bearing claims VERIFIED against real files (generateCode:35-37, 23505-retry:288-316, revokeInvite owner-OR-creator:354, invite_code UNIQUE schema:20 + resolved:402, no existing rotate endpoint, AuthGuard verify-only auth.guard.ts:15, node-specialist AGENTS.md:84, pg-harness present). PRODUCT rule-2 wrong-target check PASS — revokeInvite structurally cannot touch the permanent code (resolves `invites` table only); rotate targets the genuine irrevocable gap. matched_antipatterns: []. |
| **jenny** | **APPROVE (conditional → resolved)** | 4/5 drift checks clean MATCHES with verified citations (invite-rotation re-homing chain, journey-map rotation-gap note L120, under-floor precedent chain w24/25/26/27 all real, keep-OUT non-contradicted). Check 2 DRIFT: owner-ONLY bypasses the reserved-but-unwired `manage_server` RBAC flag — soft/defensible (behaviorally inert at 0 servers, cheaply reversible, mirrors wave-22 `manage_assignments`). **RESOLVED** via the sanctioned "document intentional drift" path: product-decisions.md wave-28 entry records owner-ONLY as a conscious bypass + flip-trigger (first non-owner manage_server role → `can(manage_server)`). No code change (implementation correct for 0-server state). |
| **Gemini** | **UNAVAILABLE** | helper exit=3, HTTP 429 (rate-limited); already retried once. Degradable per P-4 Action 3 — does NOT block; gate proceeds on Karen + jenny. |

## Merged Phase 2 verdict: PASS
Karen APPROVE + jenny APPROVE (drift resolved-in-record) + Gemini UNAVAILABLE (non-blocking) → **P-block gate PASSED**.

## Security-scope tightened gate
Wave touches {auth, authorization, invite-secret}. First (and only) Phase 2 pass returned no BLOCK with >2 medium+ findings (karen APPROVE; jenny's single drift is soft + resolved-in-record) → the forced-second-iteration rule does NOT trigger. T-8 Security remains in-scope for the T-block; security carries (owner-only, CSPRNG, old-link-invalidation proof, no-rate-limit-is-a-decision) forwarded to B/T.

## Footer
- verdict_complete: true
- phase2_complete: true
- gate: PASSED
- design_gap_flag: false → next block B-0 (skip D)
