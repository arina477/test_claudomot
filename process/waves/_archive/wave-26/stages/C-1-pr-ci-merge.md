# Wave 26 — C-1 PR, CI & merge

**Owner:** head-ci-cd. **PR:** #38. **Mode:** automatic (--auto squash).

## Sequence
- PR #38 opened (branch HEAD a603680). Title `feat: presence dots on message-row author avatars (wave-26)`.
- CI run **28519830784**: **all 7 required checks GREEN first run** (build, boot-probe, test, typecheck, lint, e2e, secret-scan) — 0 fix-up cycles, no flakes. Gated per-job via `gh run view --json jobs` (CI rule 3).
- **main-CI repair confirmed:** the `lint` + `test` jobs — RED on main since the wave-25 T/L bypass commits — are now GREEN (biome `process/**` ignore cleared the transcript-artifact format error; `vi.setSystemTime` clock-mock fixed the time-dependent assignments chip tests). Merging #38 repaired main.
- CI-rule-5: integration tier still executed (5 real-PG spec files, non-zero, not dropped — frontend-only wave adds none).
- Merged `gh pr merge 38 --squash --delete-branch` → state MERGED, merge commit **1543a4e**. Local main synced. Brain-owned working files preserved (not committed).

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "PR #38 state MERGED"
  - "run 28519830784 (a603680) all 7 required checks success"
  - "lint + test jobs GREEN — main CI repaired"
  - "integration tier executed (5 spec files)"
  - "merge commit 1543a4e"
pr_number: 38
pr_url: https://github.com/arina477/test_claudomot/pull/38
required_checks: [build, boot-probe, test, typecheck, lint, e2e, secret-scan]
fix_up_cycles: 0
final_commit_sha: a603680950bd05ca9142b3deacf75a39f5b8e3bf
merge_strategy: squash
merge_commit_sha: 1543a4e2ff07838c44f9688daf58a52fb7da7210
note: "All 7 green first run; PR also repaired main's pre-existing red lint+test."
```

## Exit
PR merged, main synced to 1543a4e, CI green (+ main repaired). → C-2 (deploy web only — frontend wave; api unchanged).
