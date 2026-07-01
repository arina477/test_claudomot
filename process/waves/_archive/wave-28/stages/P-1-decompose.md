# Wave 28 — P-1 Decompose

## Step 1 — Maximum size rubric (no trip)
| Measure | Threshold | Estimate | Trip? |
|---|---|---|---|
| Files touched | > 60 | ~3-4 (servers.service.ts +rotate method; servers.controller.ts +route; controller/integration test; optional e2e) | No |
| New primitives | > 60 | 1 route (`POST /servers/:id/invite-code/rotate`) + 0 models + 0 migrations + 0 SDKs | No |
| Estimated net LOC | > 5,000 | ~120-200 (service method ~30 + controller ~15 + tests ~60-90 + e2e ~40) | No |
| Stage-4 working set | > 350K | small (single endpoint, reused CSPRNG util, no SDK docs) | No |

No maximum threshold trips.

## Step 1b — wave_type + minimum floor
- `claimed_task_ids = [d058283d]` → length 1 → **wave_type: single-spec**.
- Single-spec floor: net LOC > 1,500. Estimate ~120-200 LOC → **floor UNMET**.

## Step 2b — RESCOPE-AUTO-MERGE → PRECEDENT-APPLICATION override-ship
Floor unmet. Per step 2b the merge protocol would re-invoke decomposition with `expand-current-bundle`. That is **known-futile here** and would contradict the P-0 gate reviewers:

1. **Decomposition-expansion is futile for M5.** M5's only unbuilt `## Scope` item is the assignment due-date **reminders arc** (cron + Resend), cred-blocked on the founder's Resend API key — identical block to w25/26/27. The other M5 candidates (`d23a0740` presence/members code-debt) are a *different concern* — bundling them would be cross-concern cramming, not a coherent slice.
2. **All three P-0 reviewers explicitly rejected expansion of THIS seed.** ceo-reviewer: HOLD-SCOPE ("full invite lifecycle is gold-plating at 0 prod servers; the seed is the minimum that closes the hole; no SELECTIVE-EXPANSION"). mvp-thinner: OK + keep-OUT (rate-limit / audit-log / client UI). problem-framer: keep-OUT (same). Re-invoking decomposition to pad LOC would directly override the gate reviewers' atomic-single-spec endorsement.
3. **This is the 7th consecutive under-floor M5-debt wave** (w16/21/23/24/25/26). The wave-24 BOARD explicitly instructed "do NOT re-litigate a Nth per-wave; log a floor-rubric revision instead"; applied as PRECEDENT-APPLICATION at w25/26/27.

**Verdict: PRECEDENT-APPLICATION override-ship** (NOT a fresh BOARD). `floor_merge_attempt: 0` (decomposition not re-invoked — known incomplete-scope + reviewer-rejected result). This is a **launch-gating, milestone-agnostic security fix** (ceo-reviewer) that must ship as its own atomic slice — the override-ship is doubly justified here vs the prior perf/code-debt waves.

**Structural escalation (record-only carry, NOT re-raised):** the M5 **park-or-key fork** is founder-pending since digest 2026-07-01 (now 7th recurrence). Already with the founder; head-product carries it forward without duplicating the ask. ceo-reviewer advisory: N-1 may attach a non-blocking nudge to the pending digest if still unanswered by wave close.

## Step 3 — design_gap_flag
**design_gap_flag: FALSE.** Backend-only endpoint (`POST /servers/:id/invite-code/rotate`) — owner-gate + CSPRNG regeneration + old-link invalidation. No new/changed visual surface (client "regenerate link" UI is explicitly keep-OUT per mvp-thinner — demand-gated, not this wave). → skip D, straight to B.

```yaml
verdict: PROCEED (override-ship under-floor, PRECEDENT-APPLICATION, 7th)
wave_type: single-spec
claimed_task_ids: [d058283d-a979-4528-9cd6-3ff48b4cfbc1]
max_rubric_trips: []
floor_threshold: "1500 LOC (single-spec)"
estimated_net_loc: "~120-200"
floor_met: false
floor_merge_attempt: 0
precedent_cited: [wave-16, wave-23, wave-24-do-not-relitigate, wave-25, wave-26, wave-27]
board_convened: false
design_gap_flag: false
missing_surfaces: []
structural_escalation: "M5 park-or-key fork — founder-pending since digest 2026-07-01 (record-only carry, not re-raised)."
security_surface: true   # owner-authz + invite-code secret → P-4 security-scope gate + T-8
specs:
  - {task_id: d058283d, layer: server, scope: "POST /servers/:id/invite-code/rotate — AuthGuard + in-service owner-ONLY check; regenerate servers.invite_code via generateCode() in 23505-retry loop; invalidate old link. Keep OUT: rate-limit, audit-log, client UI"}
```

## Exit
Single-spec (1 spec), under-floor override-ship by standing precedent (7th; no fresh BOARD, floor_merge_attempt 0), design_gap_flag=false → skip D. Security surface flagged → P-4 security gate + T-8. → P-2 Spec.
