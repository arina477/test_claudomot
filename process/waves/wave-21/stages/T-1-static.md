# T-1 — Static (wave-21)
**Pattern A — CI-verified.** lint + typecheck jobs conclusion=success on merge SHA 106e70e (CI run 28475903958, all 7 jobs green). Frontend-only diff (apps/web). New offline-UX files (useConnectionState.ts, multiPageCatchup.test.ts, useConnectionState.test.tsx, useMessages.ts loop) typecheck clean — type-only shared imports, no new CJS runtime import (B-6 confirmed). 9 pre-existing biome warnings (4e994e96) predate the diff — not introduced this wave; carried, non-blocking.

```yaml
test_pattern: ci-verified
evidence:
  - "CI 28475903958 lint+typecheck conclusion=success on 106e70e"
findings:
  - {severity: LOW, layer: T-1, description: "9 pre-existing biome warnings (4e994e96) — carried, not introduced"}
head_signoff: {verdict: APPROVED, stage: T-1, failed_checks: [], rationale: "lint+typecheck green per-job on merge SHA; frontend-only; new files typecheck clean.", next_action: PROCEED}
```
