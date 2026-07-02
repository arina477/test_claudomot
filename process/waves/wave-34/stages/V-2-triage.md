# Wave 34 — V-2 Triage
## Inputs: T-block (HIGH audio-only-not-reachable + LOW aria-label) + jenny V-1 REJECT (spec-2 drift, blocking).
## Classification
| Finding | Bucket | Rationale |
|---|---|---|
| F-34-AUDIO-TOGGLE | **BLOCKING** | jenny spec-DRIFT: spec-2 AC1 (manual toggle) un-invokable + AC2/3/5 unverifiable; M6 metric clause "graceful audio-only degrade" has no user path. Must resolve before V-block exit + M6-close. |
| F-34-ARIA | Non-blocking (fold) | LOW a11y; fold into the fast-fix (cheap, same file). |
## Routing
- **F-34-AUDIO-TOGGLE → V-3 FAST-FIX** (candidate: <20 LOC — wire enterManual to a control-cluster toggle button in VoiceStudyRoom.tsx, matching the [mute,share,leave] cluster + the audio-only-state.html design language). Enables the deterministic manual path → AC1 manual-disjunct MET + AC2/AC3/AC5 live-verifiable. Fold F-34-ARIA (aria-label fallback).
## Fast-fix queue: [F-34-AUDIO-TOGGLE (+F-34-ARIA fold)]
```yaml
findings_blocking: [F-34-AUDIO-TOGGLE]
findings_non_blocking: [F-34-ARIA (folded into fast-fix)]
fast_fix_queue: [F-34-AUDIO-TOGGLE]
b_block_re_entry_required: []
