# C-3 — Canary disposition (wave-18 M3 threads)

Brain's C-block stage sequence is `C-1 → C-2 → exit` (canary is C-2 Action 5–7); the wave-18 checklist carries an explicit C-3 row, recorded here.

## Disposition: SKIPPED
- **Threshold**: `project.yaml: deploy_targets[].canary_threshold_dau = 1000`. CI-PRINCIPLES canary config: `enabled: false` (self-use-mvp, no real cohort onboarded).
- **Current traffic**: DAU = 0 (< 1000). No real-user telemetry exists to compare against a baseline.
- **Rationale**: below the threshold the noise/signal ratio on real-user probes is too high; synthetic probes are cheaper and more reliable. The T-block synthetic suite (and the C-2 new-only-route + health probes already run) are the authoritative post-deploy signal for this wave.
- **Feared regression class for M3 threads** (what a canary WOULD have watched at launch): IDOR on thread routes (already covered by executed unit tests + the C-2 401-not-404 probe), reply-count drift, and realtime delete-event gaps. All are covered by the test suite and deploy-state verification rather than a live canary at this traffic level.
- **Sentry / error blackout**: N/A at this stage (no live cohort; observability arms at M7 launch per CI-PRINCIPLES). No rollback triggered — no canary alert possible.

## Stage-exit checklist (C-3)
- [x] Canary verdict is a deliberate SKIP read from the traffic threshold, not assumed-clean.
- [x] Skip rationale records the threshold + the feared regression class + where its coverage moved (tests + deploy-state).
- [x] No rollback needed (no canary alert; both deploys verified SUCCESS on new revisions).
- [x] No preemptive pause.

```yaml
canary_status: skipped
canary_skip_reason: "DAU 0 < 1000 threshold; canary.enabled=false (self-use-mvp). Feared regression class (thread IDOR, reply-count drift, realtime-delete gap) covered by executed tests + C-2 new-only-route/deploy-state verification; T-block synthetic probes are the post-deploy signal."

head_signoff:
  verdict: APPROVED
  stage: C-3
  reviewers: {}
  failed_checks: []
  rationale: >
    Canary is a deliberate SKIP, not an assumption: real-user DAU is below the 1000 threshold and the
    canary is disabled for the self-use-mvp phase, so live-traffic anomaly detection would be all noise.
    The feared regression class for thread replies (IDOR, reply-count drift, realtime-delete gaps) is
    instead covered by the executed CI tests and the C-2 authoritative deploy-state + new-only-route
    (401-not-404) verification. No alert fired and no rollback was needed; both services verified SUCCESS
    on new revisions.
  next_action: PROCEED_TO_T-block
```
