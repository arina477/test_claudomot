# Wave 38 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-w38-p4)
**Reviewed against:** process/waves/wave-38/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-38 is correctly framed as founder-directed launch-ops that makes already-built-but-dormant upload infrastructure actually run: it wires the 4 founder-supplied Tigris creds, ships avatar upload end-to-end, and bounded-verifies the attachment path. Every checklist item ticks from a concrete artifact, not inference. The framing names a real user job (a student can set a profile avatar / share a file) and traces to the only live founder bet plus M7 (in_progress); the problem-framer REFRAME (2MB cap is already shipped, not to be rebuilt) and ceo-reviewer SELECTIVE-EXPANSION (bounded attachment verify) are both present and reconciled, not overridden. I independently verified the two load-bearing "already-shipped" claims against the live code: `checkAvatarSize` (files.service.ts:165) is implemented and unit-tested for the 2MB/boundary/AVATAR_TOO_LARGE cases (files.service.spec.ts:133-168), and `resolveAttachmentUrl` (files.service.ts:356) already uses presigned-GET with an explicit "Railway Buckets are PRIVATE" note (L349-351) — so the crux render fix (`resolveAvatarUrl` mirroring the proven attachment pattern) reuses the locked architecture rather than inventing a parallel path, and the 2MB/10MB caps are genuinely verify-only. The crux render AC is falsifiable (anonymous GET of the persisted avatar_url must return 200; a 403 is a hard FAIL), the redirect-endpoint approach is the minimal fix (confines change to confirm + one new endpoint + one additive nullable column, zero frontend/DTO-consumer change) versus the rejected 6-site per-DTO-presign blast radius, and public-bucket was ruled out empirically (PutBucketPolicy NotImplemented, ACL ignored) and on privacy grounds. Non-happy states (private-bucket 403, >2MB 413, >10MB 413, no-avatar 404, storage-unset 503, content-type spoof 400, presign expiry) are enumerated. The floor-merge override-ship is legitimate: the sole adjacent M7 scope (a1299e88 Resend domain) is founder-cred-blocked, the wave-21 infra-reuse exemption applies verbatim (making shipped infra function at runtime), and the wave-24 standing "do-not-re-litigate" ruling plus explicit founder direction are higher authority than a fresh floor BOARD. design_gap_flag=false is correct (no new visual surface; `<img>` follows the 302 transparently) → hand off to B. One residual I am approving through rather than blocking on: the new unauthenticated `GET /users/:userId/avatar` surface is adequately security-noted for the P-4 security-scope-tightened gate and T-8 (server-derived key = IDOR-safe, 404 for no-avatar, short presign TTL, coarse rate-limit specified), and it must be routed to that tightened gate — flagged below.

## Security-scope routing note (carry into Phase 2 / T-8)
The wave introduces a NEW public, unauthenticated endpoint `GET /users/:userId/avatar` (302 → presigned GET). This intersects the security-scope set (new anonymous surface / enumeration + DoS vector). Per P-4 §"Security-scope tightened gate" this surface MUST be routed to the tightened Phase-2 security gate and to T-8. The spec/plan security note is adequate at P-block granularity — key is server-derived (no client-controlled path → IDOR-safe by design since avatars are public content), no-avatar returns 404, presigned TTL is short, and a coarse rate-limit is specified to blunt enumeration/DoS — but T-8 must confirm the rate-limit is actually implemented and the endpoint leaks no private-attachment keys.

## Stage-exit checklist trace
- **P-0 Frame:** concrete user job (avatar / file-share) ✓; single live bet + M7 6e2f68d8 cited ✓; falsifiable (crux render AC: anon GET 200/403) ✓; problem-framer REFRAME + ceo SELECTIVE-EXPANSION present + reconciled ✓.
- **P-1 Decompose:** one seed (84e09891) + verify-only attachment sibling that must co-ship for the M7 launch-readiness claim ✓; attachment re-verify correctly NOT re-claimed (task done) ✓; no dependency on unbuilt out-of-bundle task ✓.
- **P-2 Spec:** 7 ACs each independently verifiable ✓; empty(404)/error(413/400)/offline-storage(503)/private-bucket(403) states specified ✓; non-goals named (no thumbnailing/virus-scan/CDN/lifecycle) ✓; auth/anonymous-surface flagged for security gate ✓; spec-contract YAML embedded at head of task 84e09891 description (verified via DB read) ✓.
- **P-3 Plan:** reuses presigned-GET architecture (resolveAvatarUrl mirrors shipped resolveAttachmentUrl — verified in code) ✓; no MVP-inappropriate infra (no Redis/multi-replica/billing) ✓; every step maps to a bundle task + produces an observable artifact (migration, endpoint, integration test) ✓.
- **Load-bearing verification (head-product independent spot-check):** checkAvatarSize shipped+tested ✓ (files.service.ts:165, spec.ts:133-168); resolveAttachmentUrl presigned-GET + PRIVATE-bucket note ✓ (files.service.ts:349-356). Verify-only claims stand.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---

## Phase 2 — Karen + jenny + Gemini (merged)

**Karen:** APPROVE — all 6 load-bearing claims VERIFIED against repo (checkAvatarSize 2MB shipped+tested files.service.ts:165-188 / files.controller.ts:101; resolveAttachmentUrl presigned-GET files.service.ts:356; resolvePublicUrl static files.service.ts:194; consumers read stable avatar_url = zero blast radius; users.avatar_url present, avatar_key absent users.ts:12; node-specialist AGENTS.md:84).
  - **Carry-forward (cosmetic, non-blocking):** P-3 named the attachment DTO caller `MessagesService.rowToDto`; actual caller is `buildAttachmentRefMap` at apps/api/src/messaging/messages.service.ts:290. Pointer imprecision only — claim holds. B-block should use the correct name.

**jenny:** APPROVE — no material drift across all 4 checks (F1 avatar arc completed, not contradicted; M7 privacy enums govern roster listing + DM eligibility, NOT avatar bytes — public avatar render consistent; attachment verify re-asserts wave-19 contract verbatim; floor-merge in-lineage w16/21/24 precedent).
  - **Carry-forward (expected, non-blocking):** T-9 journey regen MUST capture the net-new public `GET /users/:userId/avatar` endpoint + `users.avatar_url` static→redirect semantics + new `users.avatar_key` column + flip F1/page-15 avatar Deferred→LIVE. Forward-drift, resolved at T-9.

**Gemini cross-review:** UNAVAILABLE (helper exit=3, HTTP 429 prepayment credits depleted). Degradable per stage rule — does NOT block; gate proceeds on Karen + jenny.

## Phase 2 verdict: PASS (Karen APPROVE + jenny APPROVE + Gemini UNAVAILABLE)

**P-block EXIT → B-0** (design_gap_flag=false).
