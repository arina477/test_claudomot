# Wave 42 — T-1 Static (ci-verified)

- **C-1 evidence:** CI run 28689110054 (merge commit c31354d3 → squash 07ebda95) — lint (biome ci) green + typecheck green.
- **Bypass audit:** `git diff` merge vs parent — **0** ts-expect-error/@ts-ignore/`as any`/`: any` in production code. The single `api as unknown as {...}` is in a test mock (assignments.test.tsx), acceptable.
- **Coverage:** new .ts/.tsx (assignments.service, controller, shared Zod, AssignmentCard, SubmissionsRoster, AssignmentsPanel, api.ts) all under biome + tsc; strict types preserved (no `any`).
- **Discipline note:** none new.

```yaml
mask_mode_signoff: PASS
signoff_note: "0 production ts-bypasses; lint+typecheck green on merge"
test_pattern: ci-verified
evidence:
  - "C-1 lint job: run 28689110054 green"
  - "C-1 typecheck job: run 28689110054 green"
findings: []
ts_bypasses_in_wave_diff: 0
```
