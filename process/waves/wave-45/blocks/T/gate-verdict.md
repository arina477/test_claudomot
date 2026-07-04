# Wave 45 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, T-9 Phase-1 gate review)
**Reviewed against:** process/waves/wave-45/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
Independent review confirms the T-block suite is honest for wave-45's scope (Playwright runner → bundled chromium `67881a58` + biome useTyping cleanup `4e994e96`, apps/web only). The load-bearing T-5 acceptance proof is REAL and mutation-sane, not coverage theater: `playwright.config.ts` sets `process.env.PLAYWRIGHT_BROWSERS_PATH = ~/.cache/ms-playwright` at config-load (line 14 — runs on every invocation path, the exact reason it neutralises the broken ambient var) and `channel: undefined` on all three projects (lines 46/52/62); the proof invoked the canonical fixed runner directly (not a mock, not the wrong `.mcp.json --browser chromium` path a tester-swarm would hit), against the LIVE Railway deploy, WITH the broken ambient `PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright` present, `grep executablePath` → 0 repo matches, exit 0 on two runs (smoke-only + full-authed 5/5). A real runner regression (restoring `channel: 'chrome'` or dropping the config-level override) would fail to launch against that broken ambient env and non-zero-exit — the test can fail for a real bug. F2 (2-client delete fan-out soft-check, delete-any-message.spec.ts:153-162: `.catch(()=>false)` + `console.log`, no `expect()` gating delivery, observed NOT_DELIVERED_IN_WINDOW yet passes) is a genuine single-client-realtime anti-pattern, but it is PRE-EXISTING wave-44 code (`ca43eb12`) untouched by wave-45's diff and OUT of a runner-fix wave's scope; critically, the same spec's RBAC/IDOR affordance checks ARE hard-asserted (step 5 `expect(modDeleteBtn).toBeVisible` line 134; step 8 IDOR `expect(unauthorizedDeleteBtn).toBeHidden` line 178) and green, and backend fan-out was proven at wave-41 T-4/T-8 — so the security surface is not soft, only the delivery-observability path is. F1 (buildTypingLabel transition-table has no dedicated unit test) is correctly non-blocking: source review confirms each `typers[N] as Typer` cast (useTyping.ts:65-84) is bound after its `length ===` guard, output is byte-identical per branch, and CI lint+typecheck+354-unit+e2e are green on merge SHA 8bb4e51. The five skips (T-3 no contract, T-4 no schema/service, T-6 byte-identical UI, T-7 bundle-neutral, T-8 non-auth + clean secret-grep) each reflect a real absence of the relevant surface, not convenience. No mock-the-SUT (the runner ran for real), no flaky-retry masking (`retries: 1` configured, 0 reruns, no blind retries), no untestable-surface scope creep. F1/F2 carry to V-2 as debt.

## Cascade

T-block cascade rules (no rework required — informational):

- **Stages that must re-run after the above:** none (APPROVED — no rework triggered).
- **Stages that stay untouched:** all (T-1 through T-8 stand as delivered).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
