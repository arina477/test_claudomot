# Wave 77 — V-2 Triage

Merged master finding list: T-block aggregate (5) + Karen V-1 (0) + jenny V-1 (3). After dedup → 5 distinct findings. **Zero blocking.** Fast-fix queue empty; no B re-entry.

## Dedup map
- T-1 (academicRole NULL-clear) == jenny F-J1 → one finding.
- T-2 (card hidden-vs-error copy) == jenny F-J2 == B-3 carried escalation → one finding.
- T-5 (uniform 404 on malformed :id) == jenny F-J3 (positive) → one finding.
- T-3 (playwright shared chrome profile) → distinct (test infra).
- T-4 (test-file `as any`) → distinct.

## Classification
| # | Finding | Source | Bucket | Disposition |
|---|---|---|---|---|
| 1 | academicRole not clearable to NULL once set; editor empty `<select>` dead affordance | T-1 + jenny F-J1 | **Non-blocking** | task 4be3b084 (milestone M13) |
| 2 | Member card same copy for genuinely-hidden vs transient network error (no retry) | T-2 + jenny F-J2 + B-3 | **Non-blocking** | task 3b3530d8 (milestone M13) — carried V-block escalation |
| 3 | Playwright MCP swarm shares one Chrome profile (no --isolated) | T-3 | **Non-blocking** | task cda38633 (unassigned, test infra) |
| 4 | Test-file `as any` casts (5, all in tests) | T-4 | **Noise** | suppress — test-only, zero prod type escape (Karen confirmed); cosmetic |
| 5 | Malformed non-UUID `:userId` → uniform 404 (not 400/500) | T-5 + jenny F-J3 | **Noise** | suppress — POSITIVE/expected: stronger anti-oracle, avoids non-UUID→500 defect class; not a defect |

## Blocking
None. All spec ACs met (jenny 0 drift), all claims true (Karen 0 REJECT), crown-jewel privacy proven live.

## Noise suppressions
- T-4 `as any` in tests: test-only, no production type escape (Karen verified); not promoted (single-wave, cosmetic).
- T-5/F-J3 uniform-404 on malformed id: deliberate anti-oracle behavior, positive finding, not a defect.

## Non-blocking task rows (wave_id = NULL — seedable per N-2/decomposition `wave_id IS NULL` requirement; wave-77 provenance in prose)
- 4be3b084-c86f-48f6-b3fc-fe9e95d60556 — academicRole NULL-clear — milestone M13
- 3b3530d8-f452-4e26-b50d-be2d3dabf384 — card hidden-vs-error distinction — milestone M13
- cda38633-e281-42d1-aca1-6b570023cabe — playwright --isolated — unassigned (NULL milestone)

Note: wave_id set NULL (not current wave) deliberately — the V-2 stage SQL sets wave_id=current for provenance, but N-2-seed.md:34/53/72 + milestone-decomposition require `wave_id IS NULL` for a row to be a seed candidate. Provenance preserved in prose ("Source: wave-77 V-2 ...").

```yaml
findings_input_count: 8   # 5 T + 0 karen + 3 jenny, → 5 distinct after dedup
findings_blocking: []
findings_non_blocking:
  - {id: 1, source: "T-1+jenny-F-J1", summary: "academicRole not NULL-clearable", task_id: 4be3b084-c86f-48f6-b3fc-fe9e95d60556, milestone_id: b7400254-9c16-4b97-a898-2619b949fc5e}
  - {id: 2, source: "T-2+jenny-F-J2+B-3", summary: "card hidden-vs-error copy", task_id: 3b3530d8-f452-4e26-b50d-be2d3dabf384, milestone_id: b7400254-9c16-4b97-a898-2619b949fc5e}
  - {id: 3, source: "T-3", summary: "playwright shared chrome profile", task_id: cda38633-e281-42d1-aca1-6b570023cabe, milestone_id: null}
findings_noise:
  - {id: 4, source: "T-4", summary: "test-file as-any casts", rationale: "test-only, zero prod type escape (Karen), cosmetic"}
  - {id: 5, source: "T-5+jenny-F-J3", summary: "malformed :id uniform 404", rationale: "positive/expected anti-oracle behavior, not a defect"}
fast_fix_queue: []
b_block_re_entry_required: []
```
