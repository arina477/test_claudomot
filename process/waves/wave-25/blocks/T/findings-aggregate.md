# Wave 25 — T-block findings aggregate

(Canonical V-2 input. Append-only; each T-stage adds its findings.)

## T-1 Static
- [INFO] test-files only — 4 `any` casts in fault-injection/mocks (edit-message-mentions-rollback.spec.ts:370/377/381 pg-pool patch; mentions.spec.ts:132 tx mock). Acceptable: patching pg-pool internals + drizzle tx mock legitimately need `any`. 0 production-code bypasses. Not blocking.

## T-2 Unit
- (none — coverage adequate)
