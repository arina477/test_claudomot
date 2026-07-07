# Wave 78 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-984f6929)
**Reviewed against:** process/waves/wave-78/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Both tasks are genuine, cause-level correctness/UX defects on the live wave-77 member-profile surface, not busywork — I verified each claim against the shipped code. Block 1's "dead no-op clear" is real: `UpdateProfileSchema.academicRole` is `z.enum(ACADEMIC_ROLES).optional()` with no null branch (packages/shared/src/profile.ts:39), and `users.service.updateProfile` gates on `academicRole !== undefined` then writes a `string`-typed patch (apps/api/src/users/users.service.ts:71,83,113-114), so a set role can never be cleared — exactly as framed. The read schemas already `.nullable()` (profile.ts:18,64) and are correctly left untouched. Block 2's defect is also real: MemberProfileCard's `.catch` collapses the 404 branch and every other failure into one `hidden` state (apps/web/src/shell/MemberProfileCard.tsx:184-192), so a network blip masquerades as a deliberate privacy state — a strictly worse failure than the one it hides. The fix is grounded: `HttpError.status` already exists (apps/web/src/auth/api.ts:83-85), so the hidden-vs-retryable distinction is derivable purely client-side with no new server field. The floor-waiver (PRODUCT-PRINCIPLES rule 5) is correctly applied — mvp-thinner returned OK with zero split candidates under metric-absence abstention, and the only adjacent unauthored scope (leg-3 privacy/E2E) is a security-sensitive slice that rightly warrants its own P-block rather than a bolt-on to a UX-polish wave; the RESCOPE-AUTO-MERGE was correctly declined. The LOAD-BEARING uniform-404 anti-oracle constraint — the one place this small wave could do privacy harm — is specified consistently and non-negotiably across all four deliverables and the DB spec contract (card 404 stays byte-identical across hidden/blocked/nonexistent; retry reachable ONLY for client-observable transport failure; NO server error-kind field), tagged for T-8 re-prove. The undefined-vs-null service distinction is pinned with a falsifiable round-trip AC (PATCH null persists NULL and GET returns null; PATCH omitting academicRole leaves the stored value unchanged). Every AC is observable, every AC maps to a concrete file-level step, and every step is routed to a real AGENTS.md specialist (typescript-pro contract, backend-developer service, react-specialist editor+api+card). design_gap_flag false is correct — both surfaces were adopted at wave-77 D-3 and the changes reuse existing DS patterns (the card's "could not load" state is a copy/affordance variant of the already-adopted "Profile Unavailable" container). No migration (users.academic_role already nullable text). It holds.

## Non-blocking observation (carry to B, not rework)
- P-3's B-2 step labels the write-path fix as the "profile service `updateProfile`", which reads as if it lives in the profile module. The actual gate is `apps/api/src/users/users.service.ts:113-114` (the controller at apps/api/src/profile/profile.controller.ts:61 delegates to `usersService.updateProfile`). P-0 (frame line 21) names `users.service.ts` correctly, and the behavioral spec + AC are exact, so this is a labeling looseness, not a wrong-file error. The backend-developer at B-2 must edit `apps/api/src/users/users.service.ts`: change the param type (line 71) and patch type (line 83) to admit `null`, and change the `!== undefined` gate (line 113) so `null` writes NULL while absent leaves the field unchanged. Not gate-blocking.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---

## Phase 2 — Karen + jenny + Gemini (appended)

**Phase 2 verdict: PASS** (Karen APPROVE + jenny APPROVE; Gemini UNAVAILABLE → degraded, non-blocking).

| Reviewer | Status | Notes |
|---|---|---|
| **Karen** | APPROVE | 6/6 load-bearing claims VERIFIED against main HEAD 86995ca. profile.ts:39 (academicRole enum.optional no null), read schemas already nullable (L18/L64); users.service.ts L71/L83/L113 gate on `!== undefined` writes string-only (confirmed real write-path file, not "profile.service"); MemberProfileCard.tsx:184-194 `.catch` collapses 404+network into one 'hidden' (FetchState L48-51 has no error state); api.ts:83-93 HttpError.status already available; users.ts:24 academic_role nullable text (no migration); all 3 specialists in AGENTS.md. Bonus: ProfilePage.tsx:354 `...(academicRole ? {academicRole} : {})` confirms editor dead-no-op end-to-end. 0 antipattern violations. |
| **jenny** | APPROVE | 4/4 MATCHES, 0 DRIFTS. Both tasks are the literal wave-77 V-2 LOW findings; spec TIGHTENS (not drifts) the wave-77 uniform-404 anti-oracle (server contract unchanged, retry purely client-observed); academicRole-nullable touches WRITE contract only, read/visibility path untouched, no conflict with self-declared/no-verification; no fenced-item (B2B2C / success-metric / verification) disturbed. |
| **Gemini** | UNAVAILABLE | helper exit=3, HTTP 429 (prepayment credits depleted). Degraded per P-4 Action 3 — does NOT block; gate proceeds on Karen + jenny. Not retried (helper already retried once). |

**Carried to T-9 (non-blocking, jenny note):** the journey-map member-profile-card entry (~L487/L491) lists 4 card states + records the collapsed hidden/error behavior as shipped. T-9 must regenerate it to add the 5th (retryable transport-error) state and note the hidden state stays byte-identical. Standard post-ship map refresh.

**Carried to B-2 (non-blocking, head-product note):** write-path fix lands in `apps/api/src/users/users.service.ts` (L71 param, L83 patch type, L113 `!== undefined` gate) — the plan's "profile service" label resolves here (no separate profile.service.ts).

## Gate result: APPROVED — P-block exits → B-0 (design_gap_flag false).
