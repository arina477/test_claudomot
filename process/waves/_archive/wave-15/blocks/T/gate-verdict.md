# Wave 15 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, T-9 Phase-1 independent gate)
**Reviewed against:** process/waves/wave-15/blocks/T/review-artifacts.md + findings-aggregate.md (T-1 through T-8 deliverables read in full)
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

Every applicable T-layer proves a user-observable outcome and no layer claims coverage it does not have. T-1: lint+typecheck green on the merge commit; the static-bypass grep returns 19 matches, of which 18 are test-mock casts and exactly 1 is the L-1 carry production cast — honest, the new mention surface is fully typed. T-2: parseMentions is tested as a full word-boundary transition table (not a single happy case), and the H-1/H-2 badge fixes plus my-mentions authz have unit coverage that asserts return values/rows, not mock call counts — mutation-sanity holds. The two MEDIUM findings are honestly scoped, not false-green: **T4-F1** is a missing real-Postgres integration TIER (the unit layer is correctly allowed to mock; the deliverable explicitly labels the messaging tests as unit and records the integration tier as absent/deferred — this is NOT mock-the-system-under-test), and the SQL-level behaviors are load-bearingly substituted by C-2 direct-pg verification (UNIQUE + my-mentions index + both FKs present in prod, count 7→8) and the live two-client T-8 probe; **T5-F1** is a test-harness infra blocker (Playwright MCP swarm pinned to an absent chrome channel) that was correctly worked around per always-on rule 10 with bundled Chromium + REST/socket wire probes that read the actual rendered DOM, computed pill colors, and network payloads against live prod — the layer's job was done, the MCP misconfig is a harness defect to fix before the next UI wave, not a product defect. T-3's no-dedicated-schema-test gap (T3-F1 LOW) is defensible-as-APPROVE because the 5 shared schemas are type-only and never runtime-parsed at any boundary (grep-verified: `.parse()`/`.safeParse()` never called, all `import type`), so a parse-invalid test would exercise Zod rather than StudyHall — the real contract (per-recipient `mentionedUserId` not an array; `mentions[]` round-trip) IS asserted at every consumer (messages.service.spec.ts:761,818; messaging.gateway.spec.ts 12/13; DTO 193/343). The LOAD-BEARING T-8 layer is genuine two-client cross-user delivery, not self-echo: receiver B connected to /messaging and did NOT join the channel room A posted to, A sent via REST, B received the `mention` event on its per-user room with the correct channelId + mentionedUserId=B AND zero `message:new` events — proving the B-6 H-1 fix is alive and the mention rides the dedicated per-user room with no channel-room leak; my-mentions is IDOR-closed (`?userId=B` ignored, session-derived), author-not-self-badged, 401 unauthed, membership-scoped (non-member → mentions:[]), secret-grep clean. That is the correct bar for an auth wave and it is met. No critical, no high. The suite is honest.

## Conditions carried to V-2 (non-blocking; recorded, not rework)

- **T4-F1 (MEDIUM):** message_mentions real-Postgres per-test-rollback integration tier is now a **2-wave carry (02fa8011)**. V-2 MUST issue an explicit disposition — do not let it silently slide to a 3rd-wave carry. The residual uncovered behavior is FK-CASCADE-on-message-delete; recommend `messages.integration.spec.ts` against the existing CI Postgres-16 service. L-2 T-4 principles candidate.
- **T5-F1 (MEDIUM):** Reconfigure Playwright MCP instances to the bundled `chromium` channel (or install Chrome stable) before the next UI wave so the ui-comprehensive-tester swarm is usable.
- **T3-F1 (LOW):** Add `messaging-contract.spec.ts` (parse-valid + parse-invalid per schema) mirroring wave-14's `presence.spec.ts` to catch future producer drift the consumer tests might miss. L-2 T-3 principles candidate.
- **T1-F1 (LOW):** Revert the global `biome.json a11y.useSemanticElements: off`; keep only the two inline `biome-ignore` comments so future genuine semantic-element violations are still caught.
- **T6-F1 (LOW):** mention pill radius token-choice note (--radius-md vs canonical --radius-full); both are tokens, no action unless D-block flags it.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2
