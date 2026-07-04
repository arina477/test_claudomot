# Wave 46 — P-1 Decompose

## Maximum-size rubric (split when any trips)
| Measure | Estimate | Threshold | Trips? |
|---|---|---|---|
| Files touched | ~18-25 (DM schema+migration; NestJS DM module service/controller/module; gateway extension; shared Zod types; ~4-5 UI components+hook; outbox generalization client+server; tests) | > 60 | no |
| New primitives | ~15 (3 tables dm_conversations/dm_participants/dm_messages + 1 migration + 1 module + ~5 endpoints + gateway events + ~5 components) | > 60 | no |
| Estimated net LOC | ~2,800 | > 5,000 | no |
| Stage-4 working set | moderate (feature slice, substrate reuse) | > 350K tokens | no |

No maximum threshold trips.

## Wave type
`claimed_task_ids.length == 4` → **multi-spec**. claimed_task_ids = [a48f1910 (seed), 32f5d29e, 1ceffdc9, d8264800].

## Minimum floor
multi-spec floor: net LOC > 2,500 **OR** claimed_task_ids.length >= 6. Estimate **~2,800 LOC > 2,500** → floor MET → **PROCEED** (no RESCOPE-AUTO-MERGE; this is a real feature slice, not sub-floor hygiene).

## design_gap_flag
```yaml
design_gap_flag: true
missing_surfaces:
  - "DM conversation list (new member-facing surface — left-rail/panel listing a user's DM threads; no mockup in design/)"
  - "DM thread view (message list for a 1:1/group conversation; reuses MessageList pattern but new placement/context)"
  - "DM composer (reuse MessageComposer pattern; new context)"
  - "Start-DM picker (pick recipient(s) respecting who_can_dm — new surface, no prior art)"
```
Rationale: the DM UI introduces new member-facing surfaces (conversation list + start-picker especially) not in `design/`. → D-block runs (D-1 audit; thread/composer may empty-audit as they extend shipped MessageList/Composer patterns, but the conversation-list + start-picker are genuine new surfaces).

## Carry-forwards confirmed (from P-0)
- who_can_dm enforcement = NEW backend work (currently stored-but-unenforced) → P-2 hard AC on seed a48f1910.
- outbox d8264800 = routing-key generalization (channel|conversation), client OutboxItem + server dedup UNIQUE — sized into the LOC estimate.
- block/report = named deferral (slice 2); who_can_dm opt-out is slice-1 safety floor.

```yaml
p_stage_verdict: COMPLETE
verdict: PROCEED
wave_type: multi-spec
claimed_task_ids: [a48f1910-473f-4a4a-bed6-385ec8d8c2d3, 32f5d29e-ba81-4a2e-a29c-53c4752f5fe4, 1ceffdc9-4a38-4bdd-b287-747ea7a2e319, d8264800-765d-443b-9d29-217d58dff308]
floor_merge_attempt: 0
design_gap_flag: true
next_block: D
```
