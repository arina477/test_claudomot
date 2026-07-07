# Wave 74 — C-1 PR, CI & merge
- **PR #91** — "feat: monetization entitlements substrate (M9)".
- CI: first run FAILED on `create-server-rollback.spec.ts` (2 pg-harness tests) — the DI-updated stub used a REAL EntitlementsService whose live COUNT query ran through the fault-injection-wrapped pool, breaking the rollback fault tests (postgres-only → not caught locally). Iron Law: routed to backend-developer → replaced with a pure permissive stub (correct {tier,caps,currentServerCount} shape). Re-run: **all 7 checks GREEN** (run 28867264449) — incl. `test` (binding verify-gate-reads THROWS test + entitlements tests) + **boot-probe** (confirms EntitlementsModule wiring boots, no DI cycle).
- **Merge:** squash --auto. MERGED, commit **113e5cd**. Local main synced.
```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence: ["gh pr 91 MERGED", "all 6 required + e2e green on run 28867264449", "merge 113e5cd"]
pr_number: 91
merge_commit_sha: 113e5cd
fix_up_cycles: 1
note: "create-server-rollback stub regression (real service through fault-injected pool) fixed with a pure permissive stub"
```
