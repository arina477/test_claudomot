# Wave 26 — P-1 Decompose

## Step 1 — Maximum size rubric (no trip)
| Measure | Threshold | Estimate | Trip? |
|---|---|---|---|
| Files touched | > 60 | ~5 (new PresenceDot.tsx; MessageList.tsx author-avatar sites; MemberListPanel.tsx refactor to consume it; a token/globals touch; test file) | No |
| New primitives | > 60 | 1 (shared `PresenceDot` component) | No |
| Estimated net LOC | > 5,000 | ~150-250 (extract ~30-LOC dot + wire into ~3 author-avatar sites + degrade path + refactor member panel + tests) | No |
| Stage-4 working set | > 350K tokens | small (single UI component + 2 consumer sites) | No |

No maximum threshold trips.

## Step 1b — wave_type + minimum floor
- `claimed_task_ids = [10b9d18e]` → length 1 → **wave_type: single-spec** (sibling fdb444fc deferred at P-0, NOT claimed).
- Single-spec floor: net LOC > 1,500. Estimate ~150-250 LOC → **floor UNMET**.

## Step 2b — RESCOPE-AUTO-MERGE → PRECEDENT-APPLICATION override-ship
Floor unmet. Per the floor-merge protocol, decomposition-expansion (`expand-current-bundle`) would either (a) return **incomplete-scope** — M5's ONLY unbuilt `## Scope` item is the assignment reminders arc, cred-blocked on the founder's Resend API key (identical to wave-25's result) — or (b) force **cross-concern bundling** (invite-rotation / presence-perf / cleanup are different concerns; the DM/hover same-concern sibling was just DEFERRED at P-0 by mvp-thinner as gold-plating). Both contradict the P-0 reframe (ceo-reviewer HOLD-SCOPE, mvp-thinner keep-minimal).

**Verdict: PRECEDENT-APPLICATION override-ship** (NOT a fresh BOARD convening). This is the **5th consecutive** identical under-floor M5-debt floor-merge (w16 test-infra exemption / w23 BOARD 6/7 / w24 BOARD 6/7 / w25 precedent-application). The wave-24 BOARD **explicitly instructed "do NOT re-litigate a Nth per-wave; log a floor-rubric revision instead"** (product-decisions 2026-07-02); wave-25 applied that ruling as precedent. Convening a 5th identical BOARD is the ceremony-without-value the BOARD itself deprecated. Applying the standing twice-decided ruling honors the gate, not skips it. `floor_merge_attempt: 0` (decomposition not re-invoked — its incomplete-scope result is known + documented across w24/w25; re-invoking to get the same answer a 3rd time IS the re-litigation the precedent forbids).

**Structural escalation (record-only, already surfaced):** the LOC floor does not fit StudyHall's current cadence (small re-homed-debt/polish slices while M5's headline is cred-blocked). This was escalated to the founder in the wave-25 digest (M5-disposition: provide Resend key → build reminders → close M5, OR defer reminders → transition M5) and carried by the wave-24 BOARD as a floor-rubric-revision item (still unimplemented — the wave-23 obs-4 rule was karen-rejected as non-falsifiable). Not resolvable at P-1; remains a founder-clearable dependency.

## Step 3 — design_gap_flag
**design_gap_flag: FALSE.** The message-row author avatar surface already exists (MessageList.tsx:1013-1020 + 1226/1316); the `PresenceDot` is a **componentization of an already-rendered dot** (the member-panel inline dot, MemberListPanel.tsx:91-101) bound to the existing `--color-accent-emerald` token — no NEW visual surface, no new page/flow/icon. Design ref present (`design/server-channel-view.html` message-row author avatar + presence-dot pattern). → skip D block, straight to B.

```yaml
verdict: PROCEED (override-ship under-floor, PRECEDENT-APPLICATION)
wave_type: single-spec
max_rubric_trips: []
floor_threshold: 1500
estimated_net_loc: "~150-250"
floor_met: false
floor_merge_attempt: 0
precedent_cited: [wave-16-test-infra-exemption, wave-23-BOARD-6of7, wave-24-BOARD-6of7-do-not-relitigate, wave-25-precedent-application]
board_convened: false
claimed_task_ids: [10b9d18e-5071-41dc-85de-ef257b9dfde0]
siblings_created_at_P0: [fdb444fc-370d-475e-82f5-2513bed650e7]   # deferred, NOT claimed
design_gap_flag: false
missing_surfaces: []
structural_escalation: "LOC-floor-vs-debt-cadence + Resend-key M5 blocker — already surfaced to founder (wave-25 digest M5-disposition) + wave-24 BOARD floor-rubric-revision carry; still pending founder."
```

## Exit
Single-spec, under-floor override-ship by standing precedent (5th; no fresh BOARD), design_gap_flag=false → skip D. → P-2 Spec.
