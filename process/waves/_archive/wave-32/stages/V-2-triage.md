# Wave 32 — V-2 Triage

## Action 1 — Aggregated finding inputs (deduped)
- **F-32-T-8-1** (T-8 + jenny V-1, same finding): non-UUID channelId → 500 not 400 (missing param validation). Deduped across T-8 (robustness) + jenny (spec-gap).
- **T-1 test-cast** (T-1): `as unknown as MockFn` in a .spec.ts.
- **T-4 deferred-leg** (T-4): live RoomServiceClient→LiveKit leg not integration-tested (creds unset).
- karen V-1: 0 findings (APPROVE). jenny V-1: 1 finding (= F-32-T-8-1).

## Action 2 — Classification
| Finding | Bucket | Rationale |
|---|---|---|
| F-32-T-8-1 | **Non-blocking** | jenny spec-gap (rubric: non-blocking). No spec AC violated (AC2 silent on malformed-param validation; code faithfully implements written spec). No security leak (generic body, no stack/state leak; unauth malformed still 401). Not on any real-user path (client sends valid UUIDs). Fix touches wave-31's endpoint too → out-of-this-wave-scope to fix mid-V-block. |
| T-1 test-cast | **Noise** | Legit test-mock cast in a spec file, not a production type bypass. Suppress. |
| T-4 deferred-leg | **Noise (documented boundary)** | The credential-independent boundary (LiveKit creds unset) is documented + intentional; not a coverage defect. Suppress. |

## Action 3 — Blocking routing
None. Fast-fix queue EMPTY. No B re-entry required.

## Action 4 — Non-blocking task rows INSERTed
- **F-32-T-8-1 → task `a2dd9f3d-1b93-4dfc-a6a8-5afded4a3354`** (milestone_id = M6 8702a335, wave_id = 32). Prose: add ParseUUIDPipe to :channelId on BOTH voice routes (participants + wave-31 token) → 400 on malformed; ~2 LOC each + a unit test. Candidate seed for a future M6 wave.

## Action 5 — Noise suppressions
- T-1 `as unknown as MockFn` — test-mock cast, not prod bypass.
- T-4 live-LiveKit-leg — documented credential-independent boundary (creds unset), intentional deferral.

```yaml
findings_input_count: 3
findings_blocking: []
findings_non_blocking:
  - {id: F-32-T-8-1, source: "T-8 + jenny V-1", summary: "non-UUID channelId -> 500 not 400 (both voice endpoints)", task_id: a2dd9f3d-1b93-4dfc-a6a8-5afded4a3354, milestone_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27}
findings_noise:
  - {id: T-1-test-cast, source: T-1, summary: "as unknown as MockFn in spec", rationale: "test-mock cast, not prod bypass"}
  - {id: T-4-deferred-leg, source: T-4, summary: "live LiveKit leg not integration-tested", rationale: "documented credential-independent boundary; intentional deferral"}
fast_fix_queue: []
b_block_re_entry_required: []
```
