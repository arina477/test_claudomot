# Wave 31 — V-3 gate verdict (V-block exit)

**Block:** V (Verify) | **Stage:** V-3 Fast-fix (block-exit gate) | **Gate owner:** head-verifier (fresh spawn)
**Wave topic:** M6 voice — token-mint (session + RBAC uniform-403 gate) + voice-study-room client | **State:** LIVE deployed; live-voice-connect creds-deferred (LIVEKIT_* unset)
**Deployed rev:** HEAD `aa8c8af` (ca3d277 / PR #44 = ancestor, independently confirmed); api `001b3da2` + web `e103384e` SUCCESS on Railway prod.

## Verdict: APPROVED

This wave is genuinely verified-shipped as the **FIRST M6 slice** — the token-mint security gate and the client join surface demonstrably meet their acceptance criteria in the deployed revision, not merely in source or green tests. M6 correctly stays `in_progress` (first slice ≠ metric met). Zero blocking findings; the single spec deviation is a security-correct spec-GAP reconciled doc-only.

---

## Independent verification (head-verifier — not accepted at reviewer face value)

Both reviewers APPROVED; because this is a credential-issuing endpoint, I re-probed the load-bearing security claim directly rather than sign on their word.

| # | Claim | Independent check | Result |
|---|---|---|---|
| 1 | Fixed-P1 uniform-403 gate is real + RBAC provably upstream of type-check | Read `voice-token.service.ts:93-145` — `canViewChannelById` at :97 FIRST → `ForbiddenException` (403) at :99; channel load + type-check (400) at :104-111 is downstream. Missing + non-member both → `canView===false` → identical 403, zero existence/type signal. | HOLDS |
| 2 | Deployed rev serves the voice feature | `git merge-base --is-ancestor ca3d277 HEAD` → true; PR #44 merge is ancestor of HEAD `aa8c8af`. | HOLDS |
| 3 | Audio-scoped grant | `voice-token.service.ts:137` `canPublishSources:[TrackSource.MICROPHONE]` — camera/screen-share excluded at token layer. | HOLDS |
| 4 | Secret server-side only | `LIVEKIT_API_SECRET` read from `process.env` (:116-ish), passed only into `AccessToken` ctor; return is `{ token, url }`. | HOLDS |
| 5 | Fast-fix is doc-only, zero code | `git diff --stat HEAD` shows NO change under `apps/`; only brain-VERSION / onboarding / checklist. No test weakened, no assertion loosened, no check disabled. | HOLDS |
| 6 | MEDIUM (malformed-UUID→500) pre-existing | Voice controller inherits the identical raw-`@Param` no-`ParseUUIDPipe` pattern reaching the same `canViewChannelById` uuid-column as `messages.controller:74` (wave-12). Not introduced this wave. | HOLDS |

Header comment `voice-token.service.ts:1-20` documents the gate-order rationale verbatim as karen quoted (B-6 security fix; uniform-403; missing→403 flagged for L-1). Not paraphrased.

---

## Gate questions

1. **karen + jenny APPROVEs sound?** YES — both ran, both emitted evidence-backed findings (not bare "no findings"; each surfaced the 404→403 + the MEDIUM). No reviewer false-negative to probe. karen's load-bearing claims (gate reorder, ancestry, audio-scope, secret) independently re-verified against source above. jenny's AC-by-AC intent match backed by live T-8 (403 on random UUID) + C-2 (401 route-flip) prod probes.
2. **V-2 correct — 404→403 a security-correct spec-GAP; reconcile-not-revert right; queue = doc-only?** YES on all three. A 404-vs-403 split is a channel-existence oracle on a credential endpoint; uniform-403 default-deny (matching `ChannelMessageGuard`) is the correct trade — live-proven deployed. Amending the spec AC to match verified-correct code (wave-28 200→201 precedent) is right; reverting to 404 would re-introduce the enumeration leak. This is NOT spec-gap-patching (no intent guessed in code) — it amends a spec AC to a security-superior, already-verified behavior. Fast-fix = doc reconciliation only, zero code (confirmed).
3. **Token-mint security genuinely verified?** YES — uniform-403 gate enumeration-safe + live-proven (T-8 prod), secret server-side, audio-scoped, RBAC provably upstream of the type-check. Credential endpoint sound.
4. **Deferring live-voice-connect correct?** YES — creds unset → 503-by-design, live-confirmed. Deployed code + authz gate + client states verified by source + unit + live probes; only the media-plane call awaits creds. Honest deferral anticipated by the spec's creds edge-case; does not block this slice's ACs.
5. **MEDIUM correctly non-blocking?** YES — genuinely pre-existing/wave-wide (inherited from messages route), no leak / no auth bypass, tracked (4a92327c). Not a hard-stop.

---

## Stage-exit checklist (V-3, block-exit)

- [x] Both reviewers ran + emitted evidence-backed findings — no skipped reviewer.
- [x] Author not sole reviewer — independent karen + jenny + fresh head-verifier.
- [x] Load-bearing claims checked against codebase reality (re-verified gate order, ancestry, grant, secret) — not paraphrased.
- [x] jenny cross-referenced spec vs user-journey-map (F4) vs product-decisions/fixed-decisions — reported the GAP, not just "matches."
- [x] Non-trivial "clean" verdicts spot-checked (I re-probed the security claim directly).
- [x] Every finding carries severity + disposition (V-2 triage).
- [x] Findings classified (symptom→domain) before any fix — Iron Law honored (0 code fixes; doc reconciliation only).
- [x] Spec-gap finding (404→403) adjudicated: security-correct → reconcile spec (not silent code patch), NOT routed to ESCALATE because code is verified-correct and precedent exists — reconciliation is the disposition.
- [x] Fast-fix loop bounded — 1 iteration, doc-only, within bound.
- [x] Every Critical/High resolved-or-escalated — 0 Critical/High findings.
- [x] "Done" = acceptance criteria demonstrably met (live probes), not just code-exists / green-suite.
- [x] No finding closed by weakening a test / loosening an assertion / disabling a check (git diff clean).
- [x] Re-verify: the fixed condition (spec now matches verified uniform-403) confirmed against deployed behavior.
- [x] No regressions — zero code change under `apps/`; T-block suite already gate-passed.
- [x] Orchestrator did not fix routed issues directly.
- [x] Block verdict backed by the finding ledger, not a vibe.
- [x] user-journey-map (F4) + product-decisions reflect as-shipped behavior (T-9 confirmed current).

## Finding ledger

| id | sev | disposition | status |
|---|---|---|---|
| F31-404-403 (spec-GAP) | n/a (security-correct) | spec AC reconciled 404→403 (V-3, DB row d8a85de0, 0 code LOC); dead 404 JSDoc/branch/fictional-test → L-1 | RESOLVED (doc) |
| F-31-T-1 | MEDIUM | pre-existing/wave-wide; tracked existing task 4a92327c (ParseUUIDPipe project-wide); not re-filed | ACCEPTED-WITH-OWNER |
| F-31-T-2 | LOW | controller JSDoc :37 stale 404 → L-1 | CARRIED → L-1 |
| F-31-T-3 | LOW | `useVoiceToken.ts:126-128` dead 404 branch → L-1 | CARRIED → L-1 |
| F-31-T-4 | LOW | test-discipline (testId-over-role, weak anti-pattern assert) → L-2 candidate | NOISE → L-2 |

**Blocking findings: 0.**

## Carries

- **N-block:** M6 stays `in_progress` (first slice; metric NOT met — live voice + screen-share + audio-fallback + occupancy are future M6 waves). Do NOT close M6 at N-1; dispose/continue per N-1 (M6 has open non-seed tasks: 78f51968 occupancy split + siblings).
- **L-1:** (a) 404→403 spec AC amended — clean dead 404 JSDoc (`voice-token.controller.ts:37`), dead branch (`useVoiceToken.ts:126-128`), and fictional controller-spec 404 test; (b) correct `product-decisions.md:387` stale creds-provisioned line (from P-4).
- **L-2:** F-31-T-4 test-discipline principle candidate.

---
```yaml
head_signoff:
  agent: head-verifier
  verdict: APPROVED
  stage: V-3
  reviewers: { karen: APPROVE, jenny: APPROVE }
  independent_reverification: [gate-order-RBAC-first, git-ancestry-ca3d277, audio-scope-grant, secret-server-side, fast-fix-zero-code, medium-preexisting]
  failed_checks: []
  blocking_findings: 0
  fast_fix_iterations: 1
  fast_fix_footprint: doc-only (0 code LOC; git diff clean under apps/)
  rationale: >
    First M6 slice is verified-shipped, not merely claimed. The load-bearing security
    property — a uniform enumeration-safe 403 on a credential-issuing endpoint, with the
    RBAC gate provably upstream of the channel type-check — was re-verified by head-verifier
    against shipped source and is live-proven (T-8 prod 403 on random UUID). Secret stays
    server-side; grant is audio-scoped; git ancestry confirms the deployed revision serves
    the feature. The single spec deviation (404→403 on missing channel) is a security-correct
    spec-GAP: reconciled by amending the spec AC to match the verified-correct code (wave-28
    200→201 precedent), zero code LOC, closing no finding by weakening verification. The MEDIUM
    (malformed-UUID→500) is genuinely pre-existing/wave-wide and tracked. Live-voice-connect is
    honestly deferred (503-by-design, creds-pending) and does not gate this slice's ACs. Every
    applicable stage-exit check ticks. M6 correctly stays in_progress.
  next_action: PROCEED_TO_L-block
  verdict_complete: true
  rework_attempt_cap_remaining: 2
```
