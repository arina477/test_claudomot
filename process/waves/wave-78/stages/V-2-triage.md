# Wave 78 — V-2 Triage

Master list: T-block aggregate (3) + Karen V-1 (0) + jenny V-1 (3). After dedup → 4 distinct. **Zero blocking.** Fast-fix queue empty; no B re-entry.

## Dedup
- T-1 displayName residue == jenny J-1 → one.
- T-2 Playwright shared chrome profile (MEDIUM infra) == wave-77 V-2 task cda38633 (already filed) → dedup to that task.
- T-3 ~714 leftover servers / no server-DELETE path → distinct.
- jenny J-2 (cross-viewer not re-probed) + J-3 (spec under-spec) → distinct.

## Classification
| # | Finding | Source | Bucket | Disposition |
|---|---|---|---|---|
| 1 | Fixture A displayName left "Fixture A" (test-hygiene residue) | T-1 + J-1 | **Noise** | suppress — test-fixture state on a test account, not app behavior; harmless self-declared data |
| 2 | Playwright MCP shares one Chrome profile (no --isolated) | T-2 (MEDIUM, infra) | **Noise** | suppress — already tracked as wave-77 V-2 task cda38633 (dedup; not re-filed) |
| 3 | No server delete/archive lifecycle path (servers create-only; ~714 fixture leftovers) | T-3 | **Non-blocking** | task d075cfed (unassigned — cross-cutting platform gap, not M13) |
| 4 | Cross-viewer hidden-404 not re-probed live (fixture B creds absent) | jenny J-2 | **Noise** | suppress — mitigated: server returns byte-identical 404 independent of viewer (proven live) + prior wave-77 T-8 cross-server matrix |
| 5 | Spec under-specified the fail-closed superset (non-5xx/non-404 → hidden) | jenny J-3 | **Noise** | suppress — POSITIVE: impl is SAFER than spec wording (fail-closed hardening at B-6); behavior correct + documented in B-6/T-8 deliverables. Spec wording could tighten next authoring, not a defect. |

## Blocking
None. All ACs met (jenny 0 drift), all claims true (Karen 0 REJECT), anti-oracle proven LIVE (T-8, jenny).

## Non-blocking task (wave_id NULL — seedable)
- d075cfed-fc01-47ac-aa93-c4bac93c30d9 — server delete/archive lifecycle path — unassigned (NULL milestone).

```yaml
findings_input_count: 6   # 3 T + 0 karen + 3 jenny → 4 distinct after dedup
findings_blocking: []
findings_non_blocking:
  - {id: 3, source: "T-3", summary: "no server delete/archive path", task_id: d075cfed-fc01-47ac-aa93-c4bac93c30d9, milestone_id: null}
findings_noise:
  - {id: 1, source: "T-1+J-1", summary: "displayName test-hygiene residue", rationale: "test-fixture state, not app behavior"}
  - {id: 2, source: "T-2", summary: "playwright shared chrome profile", rationale: "already tracked wave-77 V-2 cda38633"}
  - {id: 4, source: "J-2", summary: "cross-viewer 404 not re-probed", rationale: "mitigated by server byte-identity + wave-77 T-8"}
  - {id: 5, source: "J-3", summary: "spec under-specified fail-closed superset", rationale: "positive: code safer than spec; behavior correct"}
fast_fix_queue: []
b_block_re_entry_required: []
```
