# Wave 72 — T-3 Contract (Pattern A: CI-verified)

- **Pattern A** — project-internal Zod/shared-type contract (`packages/shared/account-deletion.ts`); no external SDK contract this wave.
- **Contract surface (B-1):** DeleteAccountRequestSchema ({confirm: literal true}), DeleteAccountResponseSchema ({status:'deleted'}), DeleteAccountBlockedResponseSchema ({status:'blocked', reason, servers[]}).
- **Coverage:** server emits (controller returns DeleteAccountResponse / 409 blocked body) ↔ client consumes (api.ts safeParses both schemas; DangerZonePanel renders blocked.servers). The 409 wire-shape agreement (Nest ConflictException object passes unwrapped → filter forwards verbatim → web parses exact shape) was independently verified in the B-6 /review. Negative case: confirm absent/false → 400 (Zod) — covered. CI typecheck + build green on e5bfba1 prove the contract compiles across server+client+shared.

```yaml
test_pattern: ci-verified
skipped: false
contracts_audited: [DeleteAccountRequestSchema, DeleteAccountResponseSchema, DeleteAccountBlockedResponseSchema]
ci_evidence: ["typecheck + build green on e5bfba1 across api/web/shared", "B-6 /review verified 409 wire-shape agreement end-to-end"]
active_probe_results: []
infrastructure_gap_recorded: false
findings: []
