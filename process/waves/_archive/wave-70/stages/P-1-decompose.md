# P-1 — Decompose (wave-70)

## Maximum rubric (split when over — none trip)
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | >60 | ~15-25 (user_blocks schema+migration, BlockModule service/controller/module, DM-service HIDE integrations, shared blocks.ts, Block UI components + settings, MemberListPanel fix) | no |
| New primitives | >60 | ~10-14 (1 table+migration, 1 module, 3 endpoints, 4 DM HIDE paths, 3 Zod schemas, ~3 UI surfaces) | no |
| Net LOC | >5,000 | ~2,500-3,000 | no |
| Stage-4 working set | >350K | normal | no |
→ No split.

## wave_type + floor
claimed_task_ids.length = 4 → **wave_type: multi-spec**. Floor: >2,500 net LOC OR ≥6 specs.
Initial bundle was [cc783559] (~20 LOC) → below floor → **RESCOPE-AUTO-MERGE** fired (floor_merge_attempt=1).
milestone-decomposer (expand-current-bundle) authored the Block bundle under M14: seed bc5986a9 (Block substrate + block/unblock/list endpoints + DM HIDE predicate) + siblings c8c9742a (shared Zod block contracts) + 6e4d56b2 (Block UI). cc783559 (member-row report-leak fix) re-parented under bc5986a9 as a trailing-polish sibling.
Post-merge estimate ~2,500-3,000 net LOC → **clears the multi-spec floor** (>2,500).

## Verdict: PROCEED-AFTER-MERGE
claimed_task_ids = [bc5986a9-a633-426e-9b50-3cd4230a4b8a (SEED: Block backend + DM HIDE), c8c9742a-7291-4488-bd01-d903c7336924 (shared contracts), 6e4d56b2-6954-4cd0-b523-8ff1dc21f413 (Block UI), cc783559-b181-4c65-ab57-de07a9e551e0 (member-row fix)]

## design_gap_flag: true
```yaml
design_gap_flag: true
missing_surfaces:
  - "Block/Unblock affordance (member row / profile / DM surface): a control to block a user + confirmation. No mockup in design/. Prior art: member-moderation.html (kebab/action pattern), moderation-report.html (dialog)."
  - "Blocked-users settings list: a 'Blocked users' list in settings to view/unblock. No mockup in design/. Prior art: server-settings.html (settings surface), the wave-68 Overview settings shell."
```
The member-row fix (cc783559) reuses the existing MemberListPanel (no new surface). The Block backend + contracts are non-UI.

```yaml
wave_type: multi-spec
verdict: PROCEED-AFTER-MERGE
claimed_task_ids: [bc5986a9-a633-426e-9b50-3cd4230a4b8a, c8c9742a-7291-4488-bd01-d903c7336924, 6e4d56b2-6954-4cd0-b523-8ff1dc21f413, cc783559-b181-4c65-ab57-de07a9e551e0]
bundled_in_task_ids: [bc5986a9, c8c9742a, 6e4d56b2]   # authored by milestone-decomposer this stage
floor_merge_attempt: 1
design_gap_flag: true
```
