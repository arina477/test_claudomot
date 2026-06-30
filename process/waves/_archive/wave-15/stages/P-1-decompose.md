# Wave 15 — P-1 Decompose

## Maximum size rubric (no threshold trips)
| Measure | Estimate | Threshold | Pass |
|---|---|---|---|
| Files touched | ~24-28 (migration, mention parser, messages.service edit, messaging.gateway event, my-mentions controller/service, shared mention contracts, MentionAutocomplete component, composer wire, MessageList pill render, unread store/badge, tests) | >60 | ✓ |
| New primitives | ~11 (message_mentions table, mention parser, resolve-membership, my-mentions endpoint, mention realtime event, MentionAutocomplete, mention-pill, unread-mention store, Zod contracts) | >60 | ✓ |
| Net LOC | ~2600 (err-high: migration + parser + edit add/remove diffing + authz endpoint + autocomplete keyboard-nav + pills + unread + 3-layer tests) | >5000 | ✓ |
| Stage-4 working set | <350K | >350K | ✓ |

## Wave type + floor
- claimed_task_ids = [3d238446, cd585f04, c3f3f62a] → length 3 → **multi-spec**.
- Floor (multi-spec): >2500 LOC OR >=6 specs. **Estimate ~2600 LOC (err-high per rubric) → ABOVE floor.**
- **Floor-flag resolution (carried from P-0 mvp-thinner ~2200 est):** P-1 precise err-high estimate clears 2500 because this wave carries MORE backend complexity than the presence wave (a DB migration + mention parser + edit add/remove diffing + a paginated authz-scoped my-mentions endpoint) ON TOP of two full UI surfaces (autocomplete w/ keyboard-nav + pills/unread) and 3-layer tests. RESCOPE-AUTO-MERGE rejected: the only adjacent M3 ## Scope items are threads (schema+nested UI) and attachments (storage SDK) — both incoherent with a mentions slice and explicitly excluded by the P-0 reframe trio (coherence). Merging them would harm the wave, not help it. PROCEED at the floor boundary; B-block will confirm actual LOC.

## Verdict: PROCEED (multi-spec)
- floor_merge_attempt: 0 (no merge — estimate clears floor err-high; merge target incoherent)

## design_gap_flag: TRUE
```yaml
design_gap_flag: true
missing_surfaces:
  - mention-autocomplete-dropdown: composer @-triggered member-picker dropdown (keyboard nav, candidate rows, selected state). NOT in design/server-channel-view.html. Prior art: composer (L427) + member-list rows (L474+) + reaction popover pattern. Task cd585f04.
  - mention-pill: inline @username pill in message rows (distinct treatment when targeting viewer). Reaction-pill (L78) is a DIFFERENT primitive; mention-pill is new. Task c3f3f62a.
  - unread-mention-affordance: badge/highlight (channel sidebar or message-list) signalling an unread mention. New. Task c3f3f62a.
```
