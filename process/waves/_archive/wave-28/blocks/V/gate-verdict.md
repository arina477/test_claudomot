# Wave 28 — V-3 Verdict

**Reviewer:** head-verifier (fresh spawn, Phase 1 gate)
**Reviewed against:** process/waves/wave-28/blocks/V/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

Both reviewers ran and emitted evidence-backed verdicts; neither returned a bare "no findings" on a non-trivial security change. **Karen APPROVE** is sound and independently re-confirmed against the deployed tree: `rotateInviteCode` (servers.service.ts:387) carries the single owner-ONLY `owner_id !== callerId` gate with NO creator OR-branch (contrast revoke:354), reuses `generateCode()`, and the 23505-retry test is load-bearing (asserts `capturedCodes[1] !== capturedCodes[0]`, proving genuine regeneration — not coverage theater). Route is live (I re-ran the probe: 401 not 404), no orphan migration, the two deferred limitations are actually in the JSDoc, and the owner-ONLY decision is recorded in product-decisions.md. **jenny APPROVE** is sound: all 7 AC intents met in the live deployment, the owner-ONLY 403 was proven with a *real verified non-owner session* (T-8 fixture B, server ad62cd12) — not a mere unauth probe — which is the load-bearing authorization intent and the whole point of the wave (closing the wave-9 irrevocable-leaked-link gap). Old-link invalidation is complete (single `servers.invite_code` source kills both preview + join atomically).

**V-2 triage classification is correct.** F28-T8a (spec said 200, deployed returns 201) is genuinely a non-blocking spec-GAP, NOT a hidden blocking spec-drift: the load-bearing body contract `{ invite_code }` (new ≠ old) is exactly right; the divergence is only the incidental success-status text, and there is zero client consumer this wave (regenerate-link UI is keep-OUT per spec), so nothing breaks. I independently confirmed jenny's sibling-consistency reasoning at the source: `createServer` (controller:40) and `createInvite` (controller:111) both declare `@HttpCode(HttpStatus.CREATED)`; `revoke` (controller:171) declares `@HttpCode(OK)` because it is a mutate, not a create. The controller already distinguishes create-vs-mutate intent via explicit status. Rotate mints a NEW credential — a create — so 201 is the MORE correct status, and reconciling the spec to 201 (vs forcing `@HttpCode(200)`) is the right call: forcing 200 would make rotate the lone inconsistent create-handler in its own controller for no consumer benefit. F28-T8b is correctly noise: spec-CONFORMANT (AC4 explicitly specifies non-owner→403), consciously accepted at B-6, recorded in product-decisions.md, and consistent with the existing `findServerDetail` existence-oracle precedent on non-secret UUIDs — a documented accepted-debt, not a defect. F28-V1k (6-vs-7 case count) is a cosmetic undercount with more coverage than claimed — noise.

**Fast-fix re-verification is satisfied without a Karen/jenny re-fire.** I verified the DB row `d058283d` description directly: AC1 now reads "receives 201 (Created)", the api contract now reads "201 (Created) -> { invite_code }", and the AC3 preview/join 200s are untouched (those are genuinely 200). The fast-fix changed 0 production LOC — the most recent commit touching servers.controller.ts is the merge 8996230 itself. This is the inverse of green-by-suppression: the fix aligned an imprecise *spec doc* to the already-jenny-verified-correct deployed behavior, rather than weakening any test or check. A re-fire would re-verify code that did not change against a spec that now matches what jenny already verified live — no new claim surface exists. Re-verification is satisfied by the spec now aligning with verified-correct behavior. Zero blocking findings; acceptance criteria demonstrably met, not merely asserted; triage sound.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2
