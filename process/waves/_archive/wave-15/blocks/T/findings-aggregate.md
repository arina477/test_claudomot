# Wave 15 — T-block findings aggregate

> Canonical V-2 input. Append-only as each T-stage runs. T-block surfaces findings with evidence; V-2 decides blocking.

## Carried B-6 accepted debt (context, not new findings)

M-1, M-2, M-3, M-4, L-1, L-2, L-3, L-4, L-5, L-6 — all B-6-accepted, non-blocking. See review-artifacts.md.

## New findings (this T-block)

_None yet._

### T-1 (static) — APPROVED
- **T1-F1 (LOW, → V-2):** `biome.json:23` added `a11y.useSemanticElements: off` globally. The suppression is JUSTIFIED for the MentionAutocomplete combobox-with-listbox WAI-ARIA pattern (already has inline `biome-ignore` at lines 299/310), but turning it off project-wide silences future genuine semantic-element violations. Recommend reverting global-off, keep inline ignores. Non-blocking.

### T-2 (unit) — APPROVED
- **T2-F1 (INFO/carry, → V-2):** messaging service unit tier mocks drizzle; no real-Postgres per-test-rollback integration tier for `message_mentions` (wave-14 carry task 02fa8011). Correct for the unit layer; gap is the missing dedicated integration tier. Covered by CI integration job + live two-client T-8 probe. Not new this wave.

### T-3 (contract) — APPROVED
- **T3-F1 (LOW, → V-2):** None of the 5 new/extended shared schemas (MentionRef, MessageResponse.mentions[], MyMentionsResponse, MentionEvent, ServerMember.username) has a dedicated parse-valid/parse-invalid contract test. Behavioral contract covered indirectly via consumer assertions; schemas are type-only (never runtime-parsed) so runtime risk is low. Wave-14 added presence contract tests; wave-15 omitted the mention equivalent. T-3 principles candidate. Non-blocking.

### T-4 (integration) — APPROVED
- **T4-F1 (MEDIUM, → V-2; = carry 02fa8011):** No real-Postgres per-test-rollback integration test for message_mentions (persist/resolve/edit-diff/my-mentions). Messaging service tests mock drizzle. Live two-client T-8 probe + C-2 direct-pg schema verification are the load-bearing substitutes. 2 waves running on the messaging-integration gap. T-4 principles candidate. Not the mock-the-SUT anti-pattern (unit tier may mock); the gap is the missing integration tier.

### T-5 (e2e) — APPROVED (all 7 scenarios PASS)
- **T5-F1 (MEDIUM, → V-2):** Playwright MCP instances (mcp__playwright-1..10) pinned to absent Chrome `chrome` channel → standard ui-comprehensive-tester swarm BLOCKED. Worked around via bundled chromium + node script. Test-harness infra, NOT product. Reconfigure MCP to bundled `chromium` (or install Chrome stable) before next UI wave. Standing env limitation since wave-1, now affecting the MCP swarm specifically.

### T-6 (layout) — APPROVED
- **T6-F1 (LOW, → V-2):** mention pills use --radius-md (6px) where DESIGN-SYSTEM lists --radius-full as canonical pill radius. Both are tokens; composed against the D-3-adopted mockup. Token-choice note, not a violation. All other pill colors map exactly to --surface-700 / --accent-emerald tokens; WCAG AA viewer-pill 10.08:1 PASS.

### T-7 (perf) — SKIPPED (not heavy wave)

### T-8 (security) — APPROVED — LOAD-BEARING, all 5 checks PASS live (two-client)
- (a) two-client mention realtime ALIVE (H-1 fix proven: B not-in-channel got 'mention' event; 0 message:new leak)
- (b) my-mentions authz session-derived, IDOR-closed (B sees only B; A sees only A, not A-authored-to-B; ?userId= ignored)
- (c) membership-scoped resolution (non-member → mentions:[] plain text)
- (d) unauthed /me/mentions → 401
- (e) author NOT self-badged (self-mention → 0 realtime events)
- **T8-OBS (info):** cross-user authz + two-client realtime now PROVEN with two distinct verified fixtures (A+B), closing the recurring fixture-gated live-authz carry (4a2ad286) for the mention surface. Secret-grep clean (0).

### T-9 (journey) — APPROVED (block-exit gate PASS)
- Phase 1 head-tester verdict: APPROVED (fresh spawn ace214d93f8422e6c). Journey map regenerated v0.10→v0.11, committed bcdfd2b. No prior journey regressed. No new page route (extends page-9).

---

## V-2 input summary (canonical)

**0 critical · 0 high.** T-block does NOT decide blocking — V-2 classifies each.

| ID | Sev | Layer | Routable-to | Summary |
|---|---|---|---|---|
| T4-F1 | MEDIUM | T-4 | test-infra (integration) | message_mentions real-PG integration tier absent (2-wave carry 02fa8011). **V-2 MUST issue explicit disposition — cannot become a 3rd-wave silent carry.** Recommend messages.integration.spec.ts. |
| T5-F1 | MEDIUM | T-5 | test-infra (MCP) | Playwright MCP instances pinned to absent chrome channel; swarm blocked. Worked around via bundled chromium. Reconfigure to bundled chromium before next UI wave. |
| T3-F1 | LOW | T-3 | test-infra (contract) | 5 new shared schemas lack dedicated parse-valid/parse-invalid tests (type-only, covered via consumers). Add messaging-contract.spec.ts. |
| T1-F1 | LOW | T-1 | code (lint config) | biome a11y.useSemanticElements:off set globally; revert to inline biome-ignore at the 2 combobox sites. |
| T6-F1 | LOW | T-6 | design | mention pill --radius-md vs canonical --radius-full; both tokens, no action unless D-block flags. |
| T2-F1 | info | T-2 | (= T4-F1) | unit tier mocks DB (correct); gap is the missing integration tier (folds into T4-F1). |
| T8-OBS | info | T-8 | (positive) | cross-user authz + two-client realtime PROVEN with A+B fixtures; closes the recurring fixture-gated live-authz carry (4a2ad286) for the mention surface. |

## L-2 distill — principles promotion CANDIDATES (head-tester surfaces; karen vets ≤1/file at L-2)

- **T-4.md candidate:** "A feature whose data plane is only unit-mocked + boot-probed has no proof its SQL/constraints/cascade behave against a real database; require a real-Postgres integration test for any new association table." (Why: 02fa8011 is now a 2-wave-running gap on the messaging integration tier; mock + boot-probe cannot catch a malformed ON CONFLICT, FK cascade misfire, or index that doesn't serve the order-by.)
- **T-3.md candidate:** "Every new shared Zod schema gets a parse-valid + parse-invalid test even when consumed only as a type, so producer drift is caught at the contract, not at a consumer assertion that may not exist." (Why: wave-14 added presence contract tests; wave-15 omitted the mention equivalent — the pattern of type-only schemas with no isolated contract test recurs.)
- **T-5.md candidate (tooling):** "When the Playwright MCP swarm is unavailable, drive the bundled chromium binary via a node script with explicit executablePath rather than declaring the E2E layer BLOCKED." (Why: the chrome-channel-absent limitation is standing in this env since wave-1; the bundled-chromium fallback keeps T-5 honest.)
