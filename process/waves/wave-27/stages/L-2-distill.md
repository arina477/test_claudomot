# Wave 27 — L-2 Distill

## Observations captured
`process/waves/wave-27/blocks/L/observations.md` — 4 observations (knowledge-synthesizer):

| id | title | severity | recurrence | disposition |
|----|-------|----------|------------|-------------|
| obs-1 | EXPLAIN index-proof on small-seeded table needs `SET LOCAL enable_seqscan=off` | warning | 1st instance | HOLD (T-4 candidate) |
| obs-2 | P-0 framer must code-verify the seed's technical claim (correct target), not just existence | strong | **2nd instance** (after w26 obs-4) | **PROMOTED → PRODUCT rule 2** |
| obs-3 | Behavior-preserving perf wave verifies via spec structural proofs (plan + sub-count), not a load test | informational | 1st instance | HOLD (T-7 candidate) |
| obs-4 | Process/docs direct-main pushes bypass the CI gate | warning | **2nd instance** (after w26 obs-2) | **PROMOTED → CI rule 6** |

Dropped by synthesizer: CARRY-B React.memo-on-scalar idiom (too narrow to generalize), recurring test-comment nit (cosmetic, V-2 classified).

## Promotions this wave — 2 (one per file, both karen-vetted, ≤1/file cap satisfied)

### PRODUCT-PRINCIPLES rule 2 (from obs-2, strong, 2nd instance)
```
2. Verify at P-0 that the seed's named entity is the real cost source or output boundary, not merely that it exists.
   Why: An existing but wrong-target entity sends the wave to fix nothing.
```
- **Recurrence:** w26 obs-4 (framer verified presence store EXISTS but not that it emits self-excluded identity → T-5 bug) + w27 (seed named `getCoMemberUserIds` as the scan cost; framer's code-read found the real un-indexed query was `getServerIdsForUser` → whole wave redirected to the correct fix). Same meta-class: verify the seed's *technical premise* at code level, not just entity existence.
- **Orthogonality vs rule 1:** rule 1 = existence/absence check; rule 2 = the-named-thing-exists-but-is-it-the-correct-target check. Distinct axis, no near-dup (karen confirmed).
- **Contract check:** rule 113 chars (≤120 ✓), why 73 chars (≤100 ✓), 2 non-empty lines, no forbidden tokens.

### CI-PRINCIPLES rule 6 (from obs-4, warning, 2nd instance)
```
6. Run CI on every push to main, including docs and bypass pushes, or scope the linter to source files only.
   Why: A direct-to-main push that skips CI hides breakage until the next feature PR runs.
```
- **Recurrence:** w26 obs-2 (a bypass docs push committed an unformatted non-source artifact that silently reddened main's lint for 8 pushes) + w27 (multiple `process(wave-27)` / `product(wave-27)` commits again pushed directly to main outside any PR/CI path; the w26 `biome.json process/** ignore` fix narrowed the linter surface but the structural bypass gap is unaddressed). Same meta-class: direct-to-main pushes skip the branch-protection CI gate.
- **Near-dup vs rule 4:** rule 4 = local pre-commit formatter discipline (what a committer runs); rule 6 = structural bypass-path coverage (pushes that never trigger CI at all). Distinct axis, no near-dup (karen confirmed).
- **Contract check:** rule 108 chars (≤120 ✓), why 88 chars (≤100 ✓), 2 non-empty lines, no forbidden tokens.

## Held (no promotion) — first-instance signals
- obs-1 (T-4 `enable_seqscan=off` EXPLAIN proof) — 1st instance; HOLD for a 2nd confirming instance.
- obs-3 (T-7 behavior-preserving-perf verifies via structural proofs) — 1st instance; HOLD. T-7 still 0 rules.
- Carry from w26 (not re-confirmed this wave): w26 obs-1 (T-2 impossible-producer-state fixture) + w26 obs-3 (T-2 hard-coded-date clock-mock) remain single-wave holds.

## Deliverable
```yaml
l2_stage_verdict: COMPLETE
observations_captured: 4
promotions: 2
promoted:
  - {file: PRODUCT-PRINCIPLES.md, rule: 2, source_obs: obs-2, recurrence: "w26 obs-4 + w27", karen_vetted: true}
  - {file: CI-PRINCIPLES.md, rule: 6, source_obs: obs-4, recurrence: "w26 obs-2 + w27", karen_vetted: true}
holds: [obs-1 (T-4), obs-3 (T-7)]
per_file_cap_respected: true   # 1 rule each into 2 distinct files
head_learn_gate: implicit-pass (karen strict-vet PROMOTE on both; contract-conformant; no near-dup)
```

## Exit
L-1 (docs) COMPLETE + L-2 (distill) COMPLETE — 2 karen-vetted promotions (PRODUCT rule 2, CI rule 6), both genuine 2nd-instance recurrences. → commit L-block → N-block (N-1 survey).
