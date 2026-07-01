# Wave 26 — T-1 Static (Pattern A: CI-verified)

## Action 1 — CI evidence (merge/PR #38 run 28519830784)
`lint` job SUCCESS + `typecheck` job SUCCESS on the green PR HEAD (a603680, squash-merged 1543a4e). biome ci 0 errors / 7 pre-existing warnings; turbo typecheck 4/4. Notably this run REPAIRED main's previously-red lint job (biome `process/**` ignore).

## Action 2 — Bypass audit
0 production-code bypasses in the wave diff. 1 `as unknown as` in `presence-dots.test.tsx:404` (mockApi cast — test-only, acceptable). New surface (PresenceDot.tsx, AuthorPresenceDot, hasPresence) is fully lint+typecheck covered.

## Action 3 — Discipline note
`process/**` added to biome ignore (transcript/evidence artifacts are not source) — repairs a class of false-red where committed T-5 evidence dumps fail `biome ci`. → CI/T-1 principles candidate.

```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["PR#38 run 28519830784: lint SUCCESS (0 err), typecheck SUCCESS (4/4)"]
findings: [{severity: INFO, location: "presence-dots.test.tsx:404", description: "as unknown as in test mock — acceptable"}]
ts_bypasses_in_wave_diff: 0
```
