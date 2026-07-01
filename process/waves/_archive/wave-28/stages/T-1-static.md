# Wave 28 — T-1 Static

**Pattern A (CI-verified).** No re-execution; audit C-1 evidence + wave diff for static-analysis bypasses.

## Action 1 — CI evidence (both jobs on merge-head)
C-1 run `28532913181` (HEAD `6eb62e4`, folded into merge `8996230`): typecheck=success, lint=success (7/7 required green). Both static jobs present on the single final commit.

## Action 2 — Coverage audit / bypass grep
`git show 8996230 -- apps/**/*.ts | grep '@ts-ignore|@ts-expect-error|: any|as any|as unknown as'` -> **0 production bypasses**. Only match: `sut = new ServersService({} as never)` in the integration spec — a test-only mock stub for the unused rbacService constructor arg (rotateInviteCode never calls rbacService). Legitimate scaffolding, not a prod escape hatch.

## Action 3 — Discipline note
None new. Service uses typed `{ code?: string }` narrowing for the pg 23505 error path (no `any`). Controller return type is the explicit inline DTO `{ invite_code: string }`.

## Deliverable
```yaml
mask_mode_signoff: PASS
signoff_note: ""
test_pattern: ci-verified
evidence:
  - "C-1 lint job: run 28532913181 (HEAD 6eb62e4) success"
  - "C-1 typecheck job: run 28532913181 (HEAD 6eb62e4) success"
findings: []
ts_bypasses_in_wave_diff: 0   # ({} as never) in test mock only, not production
```
