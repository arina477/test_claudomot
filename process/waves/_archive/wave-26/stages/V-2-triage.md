# Wave 26 — V-2 Triage

## Aggregated inputs (T-block + Karen + jenny)
Karen: 0 REJECT (1 info note = J1 dup). jenny: 1 (J1). T-block: 2 (per-row perf, Playwright chrome-absent).

## Classification
| Finding | Bucket | Rationale |
|---|---|---|
| J1 ring-mask #121214 hex | **Noise (accepted polish)** | Out of AC scope (AC2 "no hex" = dot COLOR, which is tokenized); single value in one shared component; the mask needs the surface-tint bg. Micro-polish, not worth a task. |
| P2 per-row subscription perf | **Non-blocking** | Real perf debt (O(rows×events) callback), NOT a leak/correctness bug; non-blocking at ~0 users. → task 07361daf. |
| 67881a58 Playwright chrome-absent | **Noise (known-carry)** | Existing task, recurring infra defect, bundled-chromium substitute worked. No double-insert. |

**0 blocking** — both reviewers APPROVE; T-5 critical resolved in fix-up cycle 1 (re-verified live); no spec drift, no fabricated claim, no broken journey.

## Non-blocking task INSERTed
- **07361daf-0fa2-426b-ab26-98427b86adf1** — "Presence author dots: lift per-row subscription to a single message-list subscription" (milestone_id NULL — presence-client perf debt, not M5-assignment scope; wave_id = wave-26 provenance).

## Noise suppressions
- J1 ring-mask hex (accepted polish). 
- 67881a58 (known-carry). Playwright MCP chrome-absent now 5th wave (w16/w22/w23/w25/w26) — T-5 rule 1 (bundled-chromium) already promoted covers it.

```yaml
findings_input_count: 3
findings_blocking: []
findings_non_blocking:
  - {id: P2, source: B-6/T-7, summary: "per-row presence subscription perf lift", task_id: 07361daf-0fa2-426b-ab26-98427b86adf1, milestone_id: null}
findings_noise:
  - {id: J1, source: V-1-jenny, summary: "ring-mask #121214 hex", rationale: "out of dot-color AC scope; micro-polish"}
  - {id: 67881a58, source: T-5, summary: "Playwright MCP chrome-absent", rationale: "known-carry, existing task, bundled-chromium substitute"}
fast_fix_queue: []
b_block_re_entry_required: []
```
