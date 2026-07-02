# Wave 32 — T-3 Contract (Pattern A — CI-verified)
- **Surface:** new endpoint GET /channels/:channelId/voice/participants → {count:number, participants:[{userId:string, displayName:string}]}. Inline DTO (B-1 skipped — no shared Zod/OpenAPI change).
- **C-1 evidence:** controller spec (6 tests) in test:ci asserts the response shape + status contract (200/401/403/400/503). Client consumes identical shape (api.ts getVoiceParticipants typed return → hook → indicator); repo typecheck enforces server↔client contract match.
- **Adequacy:** contract is enforced end-to-end by the strict typecheck; no drift (B-4 verified).
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["controller.spec.ts contract assertions in C-1 test:ci green", "repo typecheck enforces {count,participants} server↔client"]
findings: []
```
