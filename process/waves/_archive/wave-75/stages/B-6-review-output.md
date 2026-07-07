# Wave 75 — B-6 /review output (Phase 2)

Diff: origin/main..wave-75-mock-billing (1694 insertions / 18 files code+tests). Autonomous headless run — core production-bug review (gstack interactive/telemetry/Codex ceremony skipped: not provisioned in this environment).

## Findings
**0 critical · 0 high · 0 medium · 1 low**

- **[LOW] (confidence 9/10) packages/shared/src/entitlements.ts — dead `TierChangeResponse` type alias.** Exported (index.ts:347) with zero runtime/source consumers (only the export line + generated dist). Harmless documentation alias ("tier-change response = ServerPlan"). Per B-6 Action 3, Low/cosmetic → **accepted-debt, not fixed** (a fix-up would force a disproportionate B-4+B-5 re-run for a cosmetic removal). Can be pruned at the next shared-package touch.

## Categories checked — all clean
- **SQL/upsert safety:** MockBillingProvider `insert().onConflictDoUpdate({target: subscriptions.server_id, set:{tier, updated_at}})` — target matches the UNIQUE(server_id) index → idempotent, exactly one row per server. Safe.
- **Auth/owner-check boundary (payments):** billing.controller POST tier — body-validate(400) → getUserId → 404(server missing) → 403(not owner) → provider write. Owner-check precedes mutation (no-IDOR); AuthGuard (verification-required). Reproduced by head-builder + karen (non-owner 403, provider never called). Safe.
- **Enum completeness:** no `switch(tier)`; resolveForServer is a map lookup with an out-of-enum safe-default (wave-74). New TierChange DTO reuses TierSchema z.enum. Safe.
- **Null access:** billing.controller guards `if (!server)` (×2, lines 79/109); ServerPlanPanel guards `plan ? … : 0` (line 134) + load/error/loaded states. Safe.
- **Contract mismatch:** shared ServerPlan {serverId,tier,entitlements} matches controller responses + web client types; repo typecheck 4/4 (B-4). Safe.
- **Race:** concurrent tier changes → last-write-wins on the UNIQUE row (no partial); panel disables confirm while `changing`; backend idempotent. Safe.

## Commit-discipline (Action 6, multi-spec) — PASS
feat commits each cite exactly one task_id: 2a8c224+a63264c→4bc40741, 9b9ec24→69765cee, ddc9b14→77665ee5. All 3 claimed_task_ids covered. entitlements.module.ts appears in a63264c+9b9ec24 but each diff is scoped to that block's wiring (head-builder confirmed). No cross-spec code commit.
