# L-1 — Docs (wave-50)

**Wave:** M8 study-group slice 2 — per-server custom Pomodoro durations (configurable work/break, idle-only 409, validated, synced) on the LIVE shared study timer + the F-1 slim-bar phase-border fix. Shipped LIVE (PR #64, merge 699477, migration 0023). All gates APPROVED; T-block + V-block 0 findings; first-run green CI.

## Action 1 — CHANGELOG entry

Appended under `## [Unreleased]`, keep-a-changelog sections, terse house style, declarative present-tense, user-facing, cited `(#64)`:

- **Added** (CHANGELOG.md:82): custom per-server study-timer lengths — any member sets Work (1–120) / Break (1–60) minutes, applies at next Start, live-syncs to all members, idle-only (reset to change).
- **Fixed** (CHANGELOG.md:106): F-1 slim-bar phase border restored on narrow screens (emerald Work / amber Break).

The wave-49 shared-timer bullet (CHANGELOG.md:81, #63) and DM bullets (#60, #61) left untouched. Two truthful bullets, well under the 5-bullet cap. No **Security** entry: durations are preventive-in-wave validation (Added coverage), not a shipped-vuln patch. No new headline invented — the timer feature bullet already exists; this is the "set your own lengths" increment.

## Action 2 — Milestone delta

M8 (`84e17739-af5e-4396-beb9-b6f3d6836fc4` — "Educator tools & deeper academics"). Both claimed tasks confirmed children of M8. L-2 done-marked the 2 wave-50 tasks before this count.

| | done | open | cancelled | total |
|---|---|---|---|---|
| before (L-2 mark) | 27 | 9 | 0 | 36 |
| after (L-2 mark) | 29 | 7 | 0 | 36 |

`open_count = 7 > 0` → M8 stays **`in_progress`**. No transition. Mechanical no-op branch — no ambiguity, no BOARD escalation (automatic mode). No `milestones` UPDATE, no `product-decisions.md` append. Open remainder: message-search + DM stragglers + f8fb8023 anti-csrf + further study-group slices. `open_count = 7 ≥ 3` → above the brain-fallback stockout threshold; not a `backlog-stockout` flag for N-1.

## Action 3 — README touchups

**Skipped.** No new env var, install step, CLI command, or breaking change. Migration 0023 (`server_study_timer += work_duration_ms / break_duration_ms`) and `PATCH /servers/:serverId/study-timer/config` are internal surfaces, not README-facing. Detailed changes stay in CHANGELOG per Action 3 guidance.

## Action 4 — Commit

FS docs (CHANGELOG only) committed and pushed to `main`: `docs: L-1 wave-50 closeout (changelog)` — SHA recorded in footer.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:82 (Added, #64)"
  - "CHANGELOG.md:106 (Fixed, #64)"
  - "milestones no-op: 84e17739 stays in_progress (open_count=7)"
  - "README.md commit: skipped (no user-facing surface)"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M8 (84e17739)", before: "in_progress (done=27/open=9)", after: "in_progress (done=29/open=7)"}
roadmap_skip_reason: ""
readme_sections_touched: []
note: "Milestone no-op (open_count=7>0); no BOARD (mechanical, automatic mode). No Security entry (preventive-in-wave validation). open_count>=3 -> not a backlog-stockout flag for N-1."
```
