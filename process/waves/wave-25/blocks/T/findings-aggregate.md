# Wave 25 — T-block findings aggregate

(Canonical V-2 input. Append-only; each T-stage adds its findings.)

## T-1 Static
- [INFO] test-files only — 4 `any` casts in fault-injection/mocks (edit-message-mentions-rollback.spec.ts:370/377/381 pg-pool patch; mentions.spec.ts:132 tx mock). Acceptable: patching pg-pool internals + drizzle tx mock legitimately need `any`. 0 production-code bypasses. Not blocking.

## T-2 Unit
- (none — coverage adequate)

## T-3 Contract
- (none — shared slug grammar traced to parity test)

## T-4 Integration
- (none — editMessage rollback + commit proven real-PG in CI)

## T-5 E2E (live prod)
- [PASS×4] AC2 resolved→pill, AC2 dot-suffix (`@studyhallfixturea.done`→pill+`.done` plain), AC3 unresolved→plain, AC3 mixed — all PASS both runs, zero flakes on live prod. MentionPill = emerald chip `aria-label="mention: @… (you)"`.
- [LOW / infra, not product] All 10 Playwright MCP instances fail at browser launch — `@playwright/mcp` defaults to chrome channel `/opt/google/chrome/chrome` which is absent + `/opt` unwritable. Tester worked around by driving bundled `chromium-1228` via playwright-core (same React render path). Recurring env defect (cf. chrome-absent 67881a58 backlog). → V-2 (bug-infra / tooling); recommend pinning MCP `--browser chromium`. NOT blocking.
