# Wave 27 — P-1 Decompose

## Step 1 — Maximum size rubric (no trip)
| Measure | Threshold | Estimate | Trip? |
|---|---|---|---|
| Files touched | > 60 | ~5 (Spec A: server_members schema + generated migration + presence.service confirm + integration/query test; Spec B: MessageList.tsx + presence-dots test) | No |
| New primitives | > 60 | 1 index (migration) + 0 new component | No |
| Estimated net LOC | > 5,000 | ~120-180 (Spec A: index migration ~15 + test ~40; Spec B: subscription lift ~50 + test ~40) | No |
| Stage-4 working set | > 350K | small | No |

No maximum threshold trips.

## Step 1b — wave_type + minimum floor
- `claimed_task_ids = [6a546c7b, 07361daf]` → length 2 → **wave_type: multi-spec** (SELECTIVE-EXPANSION at P-0 bundled the client sibling).
- Multi-spec floor: net LOC > 2,500 **OR** ≥ 6 specs. Estimate ~120-180 LOC / 2 specs → **floor UNMET**.

## Step 2b — RESCOPE-AUTO-MERGE → PRECEDENT-APPLICATION override-ship
Floor unmet. Decomposition-expansion is known-futile (M5's only unbuilt `## Scope` item is the reminders arc, cred-blocked on the Resend key — identical to w25/w26; the other M5 candidates are different concerns). This is the **6th consecutive** under-floor M5-debt wave (w16/w23/w24/w25/w26). The wave-24 BOARD explicitly instructed "do NOT re-litigate a Nth per-wave; log a floor-rubric revision instead"; applied as precedent at w25/w26.

**Verdict: PRECEDENT-APPLICATION override-ship** (NOT a fresh BOARD). `floor_merge_attempt: 0` (decomposition not re-invoked — known incomplete-scope result). The bundled 2-spec presence-perf slice is already the ceo-reviewer's right-sized answer to the perpetual-thin-wave concern — this is the most substantial coherent M5-debt slice available without cross-concern cramming.

**Structural escalation (SHARPENED, carried into P-4):** the M5 **park-or-key fork** — see P-0 § Open escalation + founder digest 2026-07-01. 6 waves of under-floor debt while the bet-load-bearing reminders headline sits on one founder-clearable Resend key. head-product to elevate this to a first-class blocking founder fork at P-4 (provide key → build reminders → close M5, OR park M5 + pivot). This is the real fix; the LOC-floor override is a symptom of it.

## Step 3 — design_gap_flag
**design_gap_flag: FALSE.** Spec A is a DB index (Drizzle schema + migration) + service confirm — no UI. Spec B is a client presence-subscription refactor in MessageList (behavior-preserving — the presence dots render identically; only the subscription topology changes) — no new/changed visual surface. → skip D, straight to B.

```yaml
verdict: PROCEED (override-ship under-floor, PRECEDENT-APPLICATION, 6th)
wave_type: multi-spec
claimed_task_ids: [6a546c7b-e459-46a6-95f2-d00707353308, 07361daf-0fa2-426b-ab26-98427b86adf1]
max_rubric_trips: []
floor_threshold: "2500 LOC OR 6 specs (multi-spec)"
estimated_net_loc: "~120-180"
floor_met: false
floor_merge_attempt: 0
precedent_cited: [wave-16, wave-23, wave-24-do-not-relitigate, wave-25, wave-26]
board_convened: false
design_gap_flag: false
missing_surfaces: []
structural_escalation: "M5 park-or-key fork — sharpened per ceo-reviewer, carried to P-4 + founder digest 2026-07-01."
specs:
  - {task_id: 6a546c7b, layer: server, scope: "index on server_members(user_id) fixing getServerIdsForUser scan; NOT getCoMemberUserIds; keep OUT cache infra"}
  - {task_id: 07361daf, layer: client, scope: "lift MessageList per-row presence subscription to a single subscription (O(rows×events)→O(events)); preserve AC3/AC4/self-seed"}
```

## Exit
Multi-spec (2 specs), under-floor override-ship by standing precedent (6th; no fresh BOARD), design_gap_flag=false → skip D. M5 park-or-key escalation carried to P-4. → P-2 Spec.
