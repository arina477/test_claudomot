# L-1 — Docs (wave-51)

> Block: L (Learn). Stage L-1 (∥ L-2). head-learn owns the L-block; gate discipline applies.
> Wave: DM surface canonical 3-panel LAYOUT FIX (M8 DM-polish, resolves wave-46 V-2 F9).
> Shipped LIVE — PR #65, merge 01399a5. Frontend-only, no migration. Clean wave (0 blocking).

## Action 1 — CHANGELOG entry

Appended 1 bullet under **Fixed** (`CHANGELOG.md:107`), citing (#65):

> Direct messages now use the full three-panel layout: an empty leftover channel column
> that used to cram the conversation is gone, so the message thread gets the full width it
> should. (#65)

Terse, user-facing, declarative present-tense — matches the house style of the surrounding
Fixed bullets (#54/#58/#64). Well under the 5-bullet cap (single bullet). No **Added** /
**Changed** / **Security** entry: this is a layout regression fix of an existing surface
(the DM 3-panel that wave-46 shipped), not a new feature and not a shipped-vuln patch.

## Action 2 — Milestone delta

Touched milestone: **M8 DM-polish** (`84e17739-af5e-4396-beb9-b6f3d6836fc4`).

Claimed task `39fc1c5e-7fcc-473a-9f50-71cdb53f8759` is an M8 child; L-2 Action 1 flipped it
to `done`. M8 child-count evaluation:

| | done | open (todo/in_progress/blocked) | cancelled | total |
|---|---|---|---|---|
| before this wave's done-mark | 29 | 8 | 0 | 37 |
| after | 30 | 7 | 0 | 37 |

`open_count = 7 > 0` → **milestone NOT done; no transition.** Mechanical no-op branch — no
ambiguity, so no BOARD escalation under `automatic` mode. No `milestones` UPDATE, no
`product-decisions.md` append. `open_count = 7 ≥ 3` → NOT a backlog-stockout flag for N-1.

Remaining 7 open M8 stragglers (all `todo`): this wave's own F-1 follow-up
`ff09c4c9` (DM→server return race, pre-existing/non-blocking), plus deferred cross-wave
V-2 findings (`344eabde`, `5bcbd27f`, `874bd233`, `a1dda389`, `c5051444`, `f8eb49c1`).

## Action 3 — README touchups

**Skipped.** Frontend layout fix — no new env var, CLI command/flag, install step, or
breaking change. Gating the server ChannelSidebar off the DM surface is an internal
component-visibility change, not a README surface.

## Action 4 — Commit

`docs: L-1 wave-51 closeout (changelog)` — pushed to `main`. SHA recorded in footer.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:107"
  - "milestones row UPDATE: none (M8 open_count=7>0, no transition)"
  - "tasks done-mark verified: 39fc1c5e-7fcc-473a-9f50-71cdb53f8759 = done"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M8 DM-polish (84e17739)", before: "done=29/open=8", after: "done=30/open=7"}
roadmap_skip_reason: ""
readme_sections_touched: []
note: "Clean wave — 0 blocking, 1 pre-existing deferred finding (F-1 -> task ff09c4c9). M8 stays in_progress (7 open stragglers). No milestone transition, no BOARD (mechanical no-op, automatic mode)."
```
