# Wave 40 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-w40-p4)
**Reviewed against:** process/waves/wave-40/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This wave hardens two avatar endpoints' malformed-input 500s into clean 4xx responses, drawn directly from wave-38's T-8 security probes (F-T8-1/F-T8-2). It maps to exactly one live milestone (M7, 6e2f68d8) cited by id and is the last buildable M7 item, laddering to the live founder bet. The P-0 REFRAME is sound and I verified its load-bearing claims against the codebase directly: `users.id` is `text('id').primaryKey()` (apps/api/src/db/schema/users.ts:8) — an opaque SuperTokens string, so ParseUUIDPipe would 400 legitimate non-UUID avatar fetches; `grep ParseUUIDPipe apps/api/src` returns zero hits, confirming the wave-33 global-filter decision the original fix#1 would have contradicted; and the global filter's `isInvalidTextRepresentation` (22P02→400) branch exists at auth.exception.filter.ts (registered main.ts:121), confirming P-3's reasoning that a NUL byte on a text column fails deeper than a uuid-cast 22P02 and is not caught today. The REGRESSION-GUARD acceptance criterion (AC2 — valid non-UUID id still 302/404, NEVER 400) is present, explicitly named as the ParseUUIDPipe-trap protection, and falsifiable. fix#2 catches HeadObject NoSuchKey → 404 and re-throws all other errors unchanged (checkAvatarSize verified at files.service.ts:173/184), so 503 storage errors correctly stay 5xx — no over-catching. The plan chooses a deterministic boundary guard (Option A) over extending the filter (Option B) with a defensible rationale, respecting the locked architecture rather than inventing a parallel path. Scope is held to the two probe-flagged endpoints (ceo HOLD-SCOPE honoured — no validation sweep, no evidence-free fold-ins), and the sub-floor override-ship is a legitimate precedent-application (wave-16 tech-debt exemption + wave-24 no-re-litigation standing ruling), not decomposition bloat. design_gap_flag=false is correct (backend-only; D-block skips). Every Phase-1 stage-exit checkbox ticks from a concrete artifact.

## Notes for downstream (non-blocking)
- **T-8 re-verify flag:** Both endpoints' fixes originate from wave-38 T-8 security probes (public-endpoint error handling). This wave does not touch auth/sessions/cookies/csrf/rate-limits, so the P-4 security-scope tightened gate (which governs Phase-2 iteration count) is not force-triggered — but the T-8 provenance means the T-block MUST re-run T-8 to confirm the 500→4xx behaviour live for both endpoints, including the AC2 regression guard (valid non-UUID id path). Carry this to T-8.
- **Phase 2 focus for Karen:** the three verified load-bearing claims above (users.id text type, zero ParseUUIDPipe usage, 22P02-branch-does-not-cover-NUL) are the spec's foundation; independent re-verification is the highest-value Karen check.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---
## Phase 2 — Karen + jenny + Gemini (merged)
**Karen:** APPROVE — all 6 load-bearing claims VERIFIED (users.id text('id') schema:8; zero ParseUUIDPipe in apps/api; wave-33 SupertokensExceptionFilter 22P02→400 at auth.exception.filter.ts:66 + main.ts:121; GET /users/:userId/avatar → findAvatarKey DB query users.service.ts:124; checkAvatarSize uncaught HeadObject files.service.ts:184; node-specialist AGENTS.md:84).
**jenny:** APPROVE — no material drift. fix#1 boundary-guard AFFIRMATIVELY consistent with wave-33 (correctly identifies the filter can't catch a text-column NUL since it's not a 22P02 → guard complements, not contradicts) + correctly reverses the STALE pre-wave-33 T-8 ParseUUIDPipe recommendations (wave-23/32); fix#2 + hardening align w38/39; floor-merge w16..w39 lineage consistent; regression-guard AC2 adequately closes the trap. Carry-forward (T-9): flip wave-38 F-T8-1/2 to resolved + annotate the 500→4xx change (routine).
**Gemini:** UNAVAILABLE (exit 3, 429) — degradable, does not block.
## Phase 2 verdict: PASS (Karen + jenny APPROVE; Gemini UNAVAILABLE) → P-block EXIT → B-0 (design_gap_flag=false, D skips)
Carry-forwards: T-8 (re-verify 500→4xx live on both endpoints); T-9 (map: F-T8-1/2 resolved).
