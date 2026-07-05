# V-1 — Summary (wave-50)

Karen (ad874102d2c0f5aa7) + jenny (a58fb13107f8e7e3b) ran independently against deployed prod. Both **APPROVE**.

- **Karen APPROVE — 0 findings.** 6/6 source-claim checks true on merge 699477 + deployed: 7 files exist; configureDurations + row-aware phaseDurationMs/computeCurrentPhase + StudyTimerConfigSchema exports present; PATCH /config live (401-not-404); migration 0023 columns load (401-not-500 + DTO); deploy hash = merge SHA; **antipattern crux REAL** — bare WORK/BREAK_DURATION_MS only in no-row fallback (service.ts:230-231, 481-482), live walk (phaseDurationMs/computeCurrentPhase/selfHealIfOverdue:277,283/doPhaseAdvance:388) all row-aware; configureDurations emits internal STUDY_TIMER_UPDATED_EVENT (gateway re-broadcasts); idle-only 409 (service.ts:731-732); F-1 fix real (StudyTimerWidget.tsx:867-872 borderTop/Right/Bottom only, no border-left).
- **jenny APPROVE — 0 drift, 0 blocking.** Both specs match live: config persists (30/10 → 1800000/600000 DTO), validation 400 per-field, idle-only 409 running+paused ("Reset the timer to change durations"), next Start uses new durations, **2-client fan-out live** (co-member B received study-timer:update), authz 401/403, GET DTO gained the 2 fields, 0023 additive backward-compat. F-1 fix confirmed in the deployed CSS bundle (.timer-phase-work/break border-left 2px emerald/amber + ≥1024 none). Intended choices (idle-only, per-server, no presets/history) correctly present/absent — not drift.

## Findings (raw → V-2)
- **jenny GAP-1 (info, spec-gap, non-blocking):** PATCH /config sits behind the throttler (429 on rapid calls). Spec silent; sensible default; affects no AC.

```yaml
karen_verdict: APPROVE
karen_findings_count: 0
jenny_verdict: APPROVE
jenny_findings_count: 1
spec_drift_count: 0
spec_gap_count: 1
findings:
  - {id: jenny-GAP-1, severity: info, kind: spec-gap, description: "config endpoint throttled (429) — sensible default, spec silent, no AC impact"}
```
