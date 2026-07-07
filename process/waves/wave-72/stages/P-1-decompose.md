# P-1 — Decompose (wave-72, M10 account self-deletion)
## Maximum rubric: none trip. ~12-18 files (erasure service+controller+specs, SuperTokens auth-user delete, owned-server/cross-table disposition, shared DTO, Danger-Zone UI + typed-confirm + api fn + tests); ~2,500-3,200 net LOC (decomposer ~2,000-2,800 + the P-0 spec-gap additions: SuperTokens auth-user deletion + owned-server disposition ~+400-600); ~8-12 primitives. Under all caps (60 files, 60 primitives, 5,000 LOC).
## wave_type + floor
claimed_task_ids.length = 3 → **wave_type: multi-spec**. Floor: >2,500 net LOC OR ≥6 specs.
Estimate ~2,500-3,200 net LOC (with the SuperTokens auth-user deletion + owned-server/cross-table disposition the P-0 problem-framer flagged as load-bearing) → **clears the multi-spec floor** (>2,500). No RESCOPE.
## Verdict: PROCEED
claimed_task_ids = [9658fb0b (erasure API + service + SuperTokens auth-user delete + owned-server disposition — SEED), e11f8746 (shared account-deletion DTO), 898490b1 (Delete-my-account Danger-Zone UI + typed-confirm)]
## design_gap_flag: true
```yaml
design_gap_flag: true
missing_surfaces:
  - "Delete-my-account Danger-Zone (Settings › Privacy): a high-stakes DESTRUCTIVE flow — a Danger-Zone section + a confirm dialog with an explicit consequence list + a typed-confirmation (type your username / 'DELETE') to prevent accidental deletion + irreversibility warning. No mockup in design/. This is a distinct destructive-UX pattern (heavier than the block/report confirm). Prior art: design/moderation-report.html + design/block-ui.html (danger #b91c1c confirm dialog chrome, focus-trap, mobile sheet, toast) + design/server-settings.html (settings surface). The typed-confirmation + Danger-Zone framing are net-new."
```
The erasure API + DTO are non-UI (backend/contract). The Danger-Zone destructive UI warrants a D-3 mockup to get the irreversibility/consequence/typed-confirm UX right (accidental account deletion is a severe failure mode).
```yaml
wave_type: multi-spec
verdict: PROCEED
claimed_task_ids: [9658fb0b-567a-44f7-b873-c8d110e7d391, e11f8746-e85f-4900-ac82-a08c50f147d3, 898490b1-e658-4968-adfd-e75a85c75864]
floor_merge_attempt: 0
design_gap_flag: true
```
