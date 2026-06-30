# P-4 Phase 2 — Spec-drift verification (jenny)

**Wave 11 — Persistent verified prod test fixture (single-spec, test-infra)**
**Task:** `4a2ad286-c068-406b-a2b3-4fee2a4d528b`

## Verdict: **APPROVE**

Faithful minimal implementation of the 4-wave-escalated need. No drift; no scope creep; no founder dependency.

## Findings (MATCHES / DRIFTS)

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Implements the escalated need (PERSISTENT verified prod fixture → repeatable authed C-2/T-8 verification, no per-wave ad-hoc admin-API verify) | **MATCHES** | AC1 provisions a persistent verified user (signup + admin-API email-verify so the EmailVerification REQUIRED claim is satisfied); spec body "Closes the 4-wave verification gap." Escalation source is the wave-10 N-1 close-out (product-decisions L175): flagged ESCALATION-CRITICAL, "4 consecutive authed-feature waves without it," seeded FIRST to de-risk M3. |
| 2 | Scope = exactly provision + record gitignored + prove + tiny re-verify snippet; no fixture-management framework / test-orchestration system | **MATCHES** | 4 ACs map 1:1 (provision / record / prove end-to-end / tiny re-verify snippet). AC4 explicitly bounds: "minimal, NOT a fixture-management framework." `contracts.api: no app code change`. P-3 plan L11: "C-block is a near-no-op." No creep. |
| 3 | Secrets: password only in gitignored test-accounts.md; project.yaml labels+emails only | **MATCHES** | AC2 + edge-cases bind password to `command-center/testing/test-accounts.md`, "verified via git check-ignore." **Verified independently:** `git check-ignore` returns the path (ignored ✓); `project.yaml` test_users block (L71-74) documents the same partition ("NEVER include passwords … Prod-fixture credentials live in … test-accounts.md (gitignored)"). Honors always-on rule 2 + doctor schema guard. |
| 4 | No founder dependency (admin-API verify autonomous; pending Resend domain correctly NOT a blocker) | **MATCHES** | AC1: verify via "SuperTokens core admin API (generate+consume verification token — the autonomous path; NOT dependent on Resend email delivery)." Spec body: "No founder dependency … the pending Resend domain is not needed." Password is CSPRNG brain-generated (rule 6), not founder-supplied. P-3 L12 notes waves 7/8/10 used this admin path successfully — known-good. |
| 5 | design_gap_flag FALSE (no UI) | **MATCHES** | YAML `design_gap_flag: false`; spec body + P-3 L11 confirm "no UI." Correct — pure test-infra/ops action. |
| 6 | Unblocks M3 (real-time messaging) live-verification — right enabler, right time | **MATCHES** | M3 is the active milestone (product-decisions L171-177: M2 done → M3 promoted). All M3 messaging waves are authed/session-gated; this fixture is the prerequisite for live C-2/T-8 authed-route proof. N-2 (L175) correctly ordered it FIRST among M3's 4 test-infra seed candidates so the messaging build is de-risked before it lands. |

## Additional confirmations
- **Idempotency** specced (edge-case: find-by-email + re-verify, not duplicate; records SuperTokens user-id so future waves re-verify identity, not re-create) — prevents fixture drift across waves. Good.
- **Proof is end-to-end, not assertion-only** (AC3: verified session → live authed route GET /me 200 or POST /servers 201) — satisfies the "repeatable authed verification" intent, not just "an account exists."
- **Fallback/escalation path** noted in P-3 (L12) if the core admin token flow changed — appropriate, not a blocker.

## Minor (non-blocking, no rework)
- AC3 offers GET /me OR POST /servers as the proof route. Note /me is exempted from the EmailVerification REQUIRED gate (product-decisions L135-136, wave-3 low-friction banner decision), so a /me 200 does **not** by itself prove the *verified* claim is satisfied — it would pass even unverified. To actually prove AC1's "passes the global REQUIRED gate," the proof should hit a route that IS behind the EmailVerification claim (e.g. POST /servers → 201). Recommend B/C-block pick the gated route for the proof. Spec is not wrong (it lists both); just flagging the stronger option so the proof is meaningful. Not a P-4 blocker.

## Conclusion
The spec is the **faithful minimal implementation** of the 4-wave-escalated need. All six verification points MATCH. Secrets handling, no-founder-dependency, design_gap_flag, and M3-enablement all confirmed against independent evidence (git check-ignore, project.yaml, product-decisions log). The single minor note (pick a claim-gated proof route) is a build-time refinement, not spec drift.

**APPROVE.**
