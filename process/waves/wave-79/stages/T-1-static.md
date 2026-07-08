# T-1 — Static (wave-79)

**Wave:** M13 leg-3a — server-blind E2E DM encryption.
**Pattern:** A — Verified-via-CI. Merge commit `0fa0f5f`.

## Action 1 — CI evidence
C-1 verdict PASS (single CI run `28912467863` on HEAD `e18b114`, squashed to merge `0fa0f5f`):
- **lint** — required, pass (20s).
- **typecheck** — required, pass (43s).
Both jobs green on the merge commit. No missing job → no C-1 defect.

## Action 2 — Coverage audit (static-analysis bypass grep)
`git diff 0fa0f5f~1..0fa0f5f -- '*.ts' '*.tsx' | grep -nE '@ts-expect-error|@ts-ignore|: any|as any|as unknown as'`

7 hits — **all in test files, zero in production code**:
- `profile.controller.spec.ts` L412-418: `usersService as any` / `profileVisibility as any` / `encryptionKeys as any` / `dmService as any` — standard NestJS unit-test dependency stubbing (controller under test wired with typed stubs; unused deps cast). Acceptable test idiom.
- `dm-encryption.integration.spec.ts` L657 `req()` builder `as unknown as {session...}`; L671 `noopAppend as unknown as AppendPrivacyEventService` — mock-shaping for a real-Postgres integration harness. Acceptable.
- L538 is a code COMMENT ("FAIL-CLOSED: any not-permitted result funnels...") — not a cast; regex false-positive on the word "any".

Production surface (privacy.ts, dm.ts, dm.service.ts, encryption-key.service.ts, profile.controller.ts, dm-crypto.ts, keystore.ts, useDmEncryption.ts, DmEncryptionIndicator.tsx, etc.) carries **no `any` cast, no `@ts-ignore`, no `@ts-expect-error`**. Crypto boundary (SubtleCrypto) is fully typed.

## Action 3 — Discipline note
- New shared contract types (EncryptionKeySchema, PublicKeyResponseSchema, DM envelope fields) are Zod-first with named ESM value exports — the typechecker reasons over the full contract surface; no escape hatches.
- Bounded `z.enum(ENCRYPTION_ALGORITHMS)` for `algorithm` (not `string`) — keeps unsupported-algorithm rejection in the type system + at runtime (400).
- No new lint rule needed.

## Action 4 — Mask-mode self-check
- C-1 evidence cites both lint + typecheck on merge commit. ✓
- Bypass grep ran, output captured. ✓
- Findings concrete with file:line + severity. ✓

```yaml
mask_mode_signoff: PASS
signoff_note: ""
test_pattern: ci-verified
evidence:
  - "C-1 lint job: CI run 28912467863 green"
  - "C-1 typecheck job: CI run 28912467863 green"
findings: []
ts_bypasses_in_wave_diff: 0   # 7 grep hits all in test files or a comment; 0 in production code
```
