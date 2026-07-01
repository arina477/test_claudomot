# Wave 28 — L-2 Distill

## Task done-marking
`d058283d` (claimed) → `status='done'` (UPDATE 1). M5 (a5232e16) census: **11 done / 7 open** → stays `in_progress` (open≠0; reminders arc Resend-blocked remains sole M5-close blocker).

## Observations captured
`process/waves/wave-28/blocks/L/observations.md` — 4 (knowledge-synthesizer):

| id | title | severity | recurrence | disposition |
|----|-------|----------|------------|-------------|
| obs-1 | Entropy secret-scanner false-positives on model-authored `process/` transcripts (blocked CI) | warning | 1st | HOLD (CI candidate) |
| obs-2 | CI-config fix pushed unverified wasted a full CI cycle (verify-tool-locally-first) | strong | 1st | HOLD (CI candidate) |
| obs-3 | Format check keeps being skipped (3rd instance) → machine-enforced pre-commit gate | strong | **3rd** | **PROMOTED → BUILD rule 8** |
| obs-4 | V-block spec-GAP vs spec-drift: more-correct deployed behavior amends the spec, not the code | informational | 1st | HOLD (VERIFY candidate) |

Dropped as reinforcement of already-promoted rules: signal 4 (404→401 route-liveness → CI rule 1), signal 5 (T-8 integration executed-count → CI rule 5).

## Promotion this wave — 1 (BUILD, karen-vetted, ≤1/file cap satisfied)

### BUILD-PRINCIPLES rule 8 (from obs-3, strong, 3rd instance)
```
8. Gate commits with a pre-commit hook running the format/import-sort check on staged files so violations cannot be committed.
   Why: A rule prescribing what to run is advisory and gets skipped; a hook enforces it at every commit.
```
- **Recurrence:** the format/import-sort check keeps being skipped by fresh B-2 implementers → unformatted commits caught later at B-4/CI. w25 (promoted rule 7 wording) → w27 → w28 (node-specialist committed 2 unformatted spec files, remediated by deterministic biome --write). head-builder B-6 explicitly escalated: "if it fires a 3rd time, promote a hard pre-commit biome gate."
- **New axis (karen confirmed):** ENFORCEMENT-MECHANISM (a machine gate makes the violation non-committable) — orthogonal to rule 7 (WHICH command to run) + rule 6 (run the formatter) + CI rule 4 (formatter-at-wiring operator discipline). The fact rules 6/7 exist and STILL got skipped 3× is the evidence the enforcement axis is missing + load-bearing.
- **Contract check:** rule 118 chars (≤120 ✓), why 90 chars (≤100 ✓), 2 non-empty lines, no forbidden tokens. karen PROMOTE.

## Held (no promotion) — first-instance signals
- obs-1 (CI: scope secret-scanning to source paths / exclude transcript dirs) — 1st; HOLD for a 2nd confirming instance. The wave-28 `.gitleaks.toml` process/ allowlist already fixes the immediate issue; the principle waits on recurrence.
- obs-2 (CI/BUILD: verify a CI-tooling/config fix against the real tool locally before pushing) — 1st; HOLD. Strong signal (1 wasted cycle) but single instance.
- obs-4 (VERIFY: distinguish spec-gap from spec-drift at triage; more-correct deployed behavior amends the spec) — 1st; HOLD.
- Prior-wave holds not re-confirmed this wave: w27 obs-1 (T-4 enable_seqscan), w27 obs-3 (T-7 structural proofs), w26 obs-1/obs-3 (T-2) — remain single-wave HOLDs.

## Deliverable
```yaml
l2_stage_verdict: COMPLETE
tasks_marked_done: [d058283d]
observations_captured: 4
promotions: 1
promoted:
  - {file: BUILD-PRINCIPLES.md, rule: 8, source_obs: obs-3, recurrence: "w25+w27+w28 (3rd)", karen_vetted: true}
holds: [obs-1 (CI), obs-2 (CI/BUILD), obs-4 (VERIFY)]
per_file_cap_respected: true   # 1 rule into BUILD only
head_learn_gate: implicit-pass (karen strict-vet PROMOTE; contract-conformant; genuine new-axis, no near-dup)
milestone_delta: {M5: "10 done → 11 done", transition: none, stays: in_progress}
```

## Exit
L-1 (docs) COMPLETE + L-2 (distill) COMPLETE — d058283d done, 1 karen-vetted promotion (BUILD rule 8, 3rd-instance enforcement rule), M5 stays in_progress (11/7). → N-block.
