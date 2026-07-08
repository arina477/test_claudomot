# Wave 79 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-e5ea35d8)
**Reviewed against:** process/waves/wave-79/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale

Wave-79 (M13 leg-3a — server-blind end-to-end DM encryption) clears the security-scope tightened bar on all six judged dimensions, and the three most-dangerous claims were verified against live code rather than taken on the decomposer's word. (1) The **server-blind invariant** is a hard, falsifiable AC with an explicit non-happy proof (encrypted send → DB row has `content = NULL` + ciphertext set; "no plaintext recoverable server-side") and a mandatory T-8 obligation carried through P-1/P-2/P-3. (2) The **honest E2E indicator** is pinned as a fail-closed ship-blocker with a named test (plaintext-fallback shows NO lock; absent-proof → not-encrypted; the anti-security-theater guard), and design_gap true correctly routes its visual language to the D-block. (3) The **peer-key-fetch** endpoint does NOT hand-roll authz — it delegates to the shipped `ProfileVisibilityService.resolve()`, which I confirmed returns a `{visible:false}`-collapsing discriminated union and whose controller already emits a uniform 404 for missing/soft-deleted/blocked/nobody/not-shared/unknown, with the spec correctly extending that same uniform-404 to the visible-but-no-key case (no "user exists but no key" oracle). (4) Both migration-realism drifts problem-framer caught are true in the shipped schema — `dm_messages.content` is `text().notNull()` today (must relax) and no tombstone/soft-delete column exists (must build) — and the plan treats both as build-not-inherit rather than assuming them. (5) The v1 constraints (key-loss, no-multi-device, plaintext-fallback) are named as accepted posture and logged to product-decisions, not silently shipped; the task-4 (read-receipt/presence) split to leg-3b is sound because problem-framer independently found it hides an unbuilt read-receipt subsystem (crypto-independent, no shared schema edge). (6) The plan is concrete: every AC maps to a file-level B-stage step with a real AGENTS.md specialist (postgres-pro / typescript-pro / backend-developer / supertokens-integration consult / react-specialist + head-designer), no new dependency (Web Crypto + IndexedDB native), and B-3 correctly gated behind both B-2 and D-3. Proceed to Phase 2 (Karen + jenny + Gemini) and the D-block.

## Notes carried forward (non-blocking — for B/T, not rework)

- **Uniform-404 completeness at T-8:** the security bar hinges on the encryption-key GET collapsing *visible-but-no-key* into the SAME 404 as hidden/blocked/nonexistent. The spec pins this; T-8's key-fetch visibility matrix MUST include a "target visible, no key registered → 404 (byte-identical to hidden)" row so no oracle leaks via status/body/timing.
- **Mutual-exclusion enforcement:** the "encrypted send with plaintext content also set → reject" edge case is the server-blindness guard at the write boundary; B-2 must enforce reject (not silently ignore) so a client cannot smuggle plaintext alongside ciphertext into a row the UI will badge as encrypted. T-8 non-happy proof should assert this.
- **Algorithm pin is deferred to B-3 (acceptable):** `EncryptionKeySchema.algorithm` is a bounded `z.enum`; B-3 pins ECDH P-256 + AES-GCM (recommended) or RSA-OAEP. Fine to defer — it is an engineering default with no product/taste consequence — but B-1 must land the enum as bounded (not free `string`) so an unsupported/oversized algorithm is a 400, per the block-1 edge case.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

## Phase 2 — Karen + jenny + Gemini (appended) — security-scope tightened gate

**Phase 2 verdict: PASS** (Karen APPROVE + jenny APPROVE, both with mandatory corrections FOLDED into the spec+plan; Gemini UNAVAILABLE → degraded, non-blocking). No BLOCK returned → security-scope forced-2nd-iteration not triggered.

| Reviewer | Status | Key findings (all folded as binding corrections) |
|---|---|---|
| **Karen** | APPROVE + 3 fixes | (1) **[authz, load-bearing]** peer-key GET must gate on who_can_dm (dm.service.enforceWhoCanDm), NOT ProfileVisibilityService (profile_visibility only) — reusing the wrong service under-gates DM-ability; (2) user_encryption_keys.user_id = text FK not uuid (users.id is text opaque id); (3) listConversations preview handles NULL content. No hidden plaintext-retention vector (notifications don't touch dm_messages; no search index). server-blind achievable. |
| **jenny** | APPROVE + 1 DRIFT + 1 GAP | DRIFT: GET /dm/conversations preview breaks on NULL content (wave-46 F11) → placeholder (= Karen 3). GAP: group DMs (≤10) unaddressed by 1:1 crypto → state plaintext-fallback + honest not-encrypted (folded, correction 4). Security spine MATCHES all prior decisions + fences; no safety-capability regression (DM moderation/search don't exist server-side). |
| **Gemini** | UNAVAILABLE | exit=3, HTTP 429 credits depleted. Degraded per P-4 Action 3; does NOT block. Not retried. |

**Corrections folded (binding, in DB spec + P-3 plan):** (1) who_can_dm gate; (2) text FK; (3) NULL-content preview placeholder; (4) group-DM out-of-scope plaintext-fallback; (5) algorithm z.enum + reject-plaintext-both + T-8 no-key-oracle row + reuse dexie. These sharpen the APPROVED Phase-1 verdict; no re-architecture, no head-product re-spawn needed.

**Carried to B (head-product Phase-1 notes):** T-8 visible-but-no-key byte-identical 404; reject encrypted-send-with-plaintext-also-set; algorithm bounded z.enum.

## Gate result: APPROVED — P-block exits → D-1 (design_gap_flag true: E2E status indicator).
