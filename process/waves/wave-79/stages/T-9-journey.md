# T-9 — Journey (wave-79) — T-block exit gate

**Wave:** M13 leg-3a — server-blind E2E DM encryption.

## Phase 1 — head-tester gate verdict
Fresh head-tester spawned (agentId a384b24d2f28021ba). Reviewed manifest + findings-aggregate + T-1..T-8 deliverables + spec (DB) + source spot-check of the integration spec & indicator component.

**Verdict: APPROVED (attempt 1).** Verdict written to `process/waves/wave-79/blocks/T/gate-verdict.md`. Rationale: server-blind PROVEN not asserted (real-Postgres separate-connection SELECT content IS NULL + live server API content:''+ciphertext; app-DB-access limitation honestly disclosed + compensated by dual evidence); no-oracle 404 real (toStrictEqual cases A-D + live malformed→404); indicator honesty structural (`e2e-lock-affordance` only inside the `encrypted` shield-check branch, isLock:true) + live-verified count=1/0/0; no private-key leak; T-5 genuine two-client (A sends, B decrypts, distinct identity). The two gaps (app-DB direct read, group indicator not live-constructible) correctly handled; 3 findings correctly surfaced-to-V-2 not silenced → do not block per surface-not-fix contract.

## Phase 2 — journey regen (UI wave → required per Action 2; not skipped)
Action 2 skip did NOT fire: wave_type includes ui + B-3 Frontend ran (DmEncryptionIndicator, useDmEncryption, dm-crypto, DmThread, DmHome, etc. touched). Regen required.

- **Regen type:** ANNOTATION-ONLY. No new route/screen — the DM view + route pre-exist (F11, live since wave-46). This wave adds: an encryption indicator (2 placements) on the existing DM surface, a ciphertext-envelope send/receive path on the existing POST/GET /dm messages, and TWO new REST endpoints (PUT/GET /profile/encryption-key). A full crawl would add/remove no routes.
- **routes_added:** [] (PUT/GET /profile/encryption-key are REST endpoints, not user-facing routes/screens — recorded in the F11 REST annotation).
- **routes_removed:** []
- **coverage_gaps:** [] (the encrypted-DM path is exercised end-to-end by T-5 live + CI integration).
- Journey map updated: F11 Direct-messages section gained a "Server-blind E2E encryption (wave-79)" annotation (indicator + 2 key endpoints + encrypted-envelope path + who_can_dm-gated 404 + client crypto + honest-indicator states + group-out-of-scope). Header `last_updated_wave79` entry added.

## Action 4 — Scenario smoke
No `user-scenarios/` directory present → scenario smoke n/a (0 scenarios).

## Action 6 — Cross-wave regression check
No regression. The wave is additive on the existing F11 DM surface: plaintext DMs still deliver (backward-compat plaintext path preserved + proven in CI + live plaintext history renders); offline read-cache (wave-62) unaffected; the new indicator + envelope are net-new capability. The only observed anomaly (F-T5-1 auth-guard race on DM route) is a NEW client-side race introduced by the concurrent DM-load burst, NOT a regression of a previously-working journey (the DM journey completes on a stable retry). Surfaced to V-2, not a blocking regression.

## Findings (this stage)
None new. Carries the 3 prior findings (F-T5-1 medium, F-T8-1 info, F-T8-2 low) into V-2.

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
journey_regen_skip_reason: ""
crawl_routes_visited: 0    # annotation-only regen; T-5 live crawl of DM surface is the deployed-state evidence
regen_diff:
  routes_added: []
  routes_removed: []
  coverage_gaps: []
scenarios_run: 0
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: 7c8ee89
findings: []
```
