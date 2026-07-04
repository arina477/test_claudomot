# Wave 42 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-wave42-P4-phase1)
**Reviewed against:** process/waves/wave-42/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-42 frames a concrete user job — students submit coursework, educators collect and return it — that is the root-cause slice of M8 (84e17739, cited), not a symptom or demo artifact; all three P-0 reviewers (problem-framer, ceo-reviewer, mvp-thinner) returned PROCEED and were reconciled without conflict. The bundle is one seed plus only the siblings that must ship together for the collect/return loop to hold (roster is the read-side of collect; return-state is intrinsic to return), and mvp-thinner confirmed none is deferrable. Every acceptance criterion is independently verifiable and tied to an API/DB/user action with the non-happy paths enumerated (empty submission 400, non-member 403 on both submit and presign, unknown/soft-deleted assignment 404, cross-assignment return 404, idempotent upsert on UNIQUE(assignment_id,user_id), resubmit-clears-return) — no "works correctly" aspirations. The authz model is airtight: server_id is derived from the assignment row on every data route (never a client param), the new member-gated presign is guarded by assertMember with the shipped anti-spoof HeadObject re-validating server-derived size/content-type at submit, roster and return are assertOrganizer-gated, and return enforces submission-belongs-to-path-assignment. Scope is held with no gold-plating — NO grade/score field anywhere (milestone ceiling), and the ceo-reviewer's rejection of a return-notification expansion is respected (returned state surfaces via pull). The plan reuses the locked architecture (FilesService presign, validateAndHeadAttachment, RBAC can(), Drizzle, existing attachment-URL resolver, presign-before-`/:id` route-ordering rule) with no unneeded infra; the two consequential deltas — single migration (returned_at/organizer_comment authored nullable in the initial CREATE) and on-row attachment vs a join table — are both sound, carry documented trade-offs and a future-migration escape hatch, and correctly resolve the two P-0 load-bearing findings. The self-consistency sweep maps every AC to a file-level step with a validated specialist, contracts are concrete with no TBD, and design_gap_flag=true is correctly set because the educator submissions roster + return-with-comment control is a plausibly-new educator surface. The spec contract is embedded as a fenced YAML head + `---` + prose at the head of the seed task's description (verified in-DB), satisfying rule 7. Metric-TBD is a known carry already surfaced to the founder; it gates later discretionary M8 slices, not this founder-directed core slice, so it is non-blocking here.

**Carry-forward (non-blocking, not gate conditions):**
- **D-1 (design block):** the roster, student submit control, and returned-state display are the P-block's UI surfaces routed to D-block. D-1 must define the empty / loading / error / offline presentation states for each (the spec correctly stops at the API-behavior states; UI-state design is D-block's job). D-1 should also settle whether offline-draft submission is in scope for this slice or deferred — the offline-first wedge is the live bet, but offline-sync is a documented separate high-risk surface; recommend online-only submit for this slice unless D/B surfaces a cheap path, consistent with the held scope.
- **T-8 (security layer):** apply emphasis to the authz boundaries this wave introduces — the NEW member-gated presign call site (assertMember, not assertOrganizer), server_id IDOR-derivation on every route, and the member-vs-organizer gate correctness (a member must never reach the roster/return; a non-member must never reach submit/presign). Note: the P-4 security-scope *tightened* gate set {auth, payments, sessions, csrf, rate-limit, user-creation} is not tripped (this is authz/permission over existing SuperTokens auth, not authentication/session/user-creation), so no forced second Phase-2 iteration — but the authz model is load-bearing and T-8 should treat it as a first-class test target.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---
## Phase 2 — Karen + jenny + Gemini (merged)

**Karen (claim verification): APPROVE** — 7/7 load-bearing claims VERIFIED against real code: assertOrganizer→can(manage_assignments) (stale manage_channels comment confirmed cosmetic); assertMember (server_members); validateAndHeadAttachment (server-scoped anti-spoof, IDOR-safe); presignAttachmentUpload IS organizer-gated (confirms member-presign genuinely needed); assignment_status vs assignment_submissions distinct + assignment_attachments on-row shape mirrored; shared Zod substrate present; route-shadowing precedent real. No antipattern matches (no authz rewrite, no grading taxonomy, no gold-plating).

**jenny (spec-drift): APPROVE** — 5/5 MATCHES: no-grading matches M8 scope + decomposition entry; manage_assignments gating consistent with wave-23 perm split + wave-41 educator-role decision (no role-type); member-gated presign matches the shipped wave-38 message-attachment member-presign pattern (no organizer-only-attachments decision exists); assignment_submissions net-new + orthogonal to the private assignment_status toggle; journeys slot into page-14 without contradiction. Non-blocking note: the "F10-F12 educator flows" are to-be-authored (F10 is actually notifications), not pre-existing — expected for a new feature, T-9 regenerates.

**Gemini (cross-model): UNAVAILABLE** — helper exit=3, HTTP 429 rate-limit. Degradable per Action 3 → does NOT block; gate proceeds on Karen + jenny APPROVE.

## Gate result: PASS (Phase 1 APPROVED + Phase 2 Karen APPROVE + jenny APPROVE + Gemini UNAVAILABLE-degraded)
→ design_gap_flag=true → D-block.
