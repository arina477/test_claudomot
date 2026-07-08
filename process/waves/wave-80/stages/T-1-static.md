# T-1 — Static (wave-80, presence privacy toggle)

**Pattern:** A — Verified-via-CI. head-tester at T-9 for gate.

## Action 1 — CI evidence (merge commit 4795638)
C-1 verdict_evidence confirms both static jobs green on merge SHA:
- lint: pass (26s) — CI run 28917150735 (required).
- typecheck: pass (42s) — same run (required).
Both ran against final_commit_sha adbc826 → merged as 4795638. No missing job.

## Action 2 — Coverage audit + bypass grep
Diff `4795638~1..4795638` grepped for TS bypasses:
- Total matches: 23. **All 23 are in TEST files** (`.spec.ts` / `.test.tsx` / `test/`): `as any` on mock `makeReq()` request objects, `(gateway as any).server` Server-double injection, `as unknown as` on mock service doubles.
- **Production files: ZERO bypasses** (verified per-file filter excluding spec/test paths). New production surface — presence.gateway.ts, presence.service.ts, privacy.service.ts, privacy.controller.ts, SettingsPrivacyPage.tsx, packages/shared/src/privacy.ts — is fully typed. showPresence flows as `z.boolean()` → `boolean` end-to-end.

## Action 3 — Discipline note
- Shared Zod schema (`packages/shared/src/privacy.ts`) is the single contract source; `z.infer` picks up showPresence on both request + response types. Good pattern (no drift).

## Action 4 — Mask-mode self-check: PASS.

```yaml
mask_mode_signoff: PASS
signoff_note: ""
test_pattern: ci-verified
evidence:
  - "C-1 lint job: CI run 28917150735 green (required)"
  - "C-1 typecheck job: CI run 28917150735 green (required)"
findings: []
ts_bypasses_in_wave_diff: 23   # ALL in test files; 0 in production source
```
