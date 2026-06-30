# L-1 Docs — wave-22 (M5 assignments, bundle 1)

> Block: L (Learn). Stage L-1. Owner: head-learn (spawn-pattern). Mode: automatic.
> Claimed tasks (set done by L-2): 01fcefb8 (CRUD+status spine), 916ecff7 (panel/card UI), a5f25f9b (tests).
> Wave LIVE: PR#34 merge 108f4a3, HEAD 72b5a0f, migration 0010 applied (10→11), api 7ffaeaea + web 66f4c715, 388 api + 215 web tests green, V-block APPROVED (karen + jenny).

## Action 1 — CHANGELOG entry

Appended under `[Unreleased] → Added`, **CHANGELOG.md:47-50** (4 bullets, `(#34)`).

- Organizer posts an assignment (title/description/due-date/optional attachment), gated on manage-channels permission.
- Due-sorted listing with amber due-soon / red overdue chips.
- Per-member personal to-do/done toggle (one-per-member, private to each member).
- Organizer edit + remove (soft-delete hides from everyone's list).

**Classification = Added (not Security, not Fixed).** Per stage Action 1: the cross-server attachment IDOR (closed via anchored key-regex) is **preventive security on a NEW endpoint that never shipped vulnerable** → Added, not Security. Security section is reserved for shipped-then-patched vulnerabilities. Consistent with the wave-19 attachments-IDOR and wave-20/21 pre-merge-catch precedent.

**Length:** 4 bullets, no headline paragraph (the assignments feature reads cleanly as a 4-line release-note); under the ≤5-bullet cap. Matched the terse house style of #32/#33, not the verbose foundation entries.

## Action 2 — Milestone delta

Milestone touched: **M5 (a5232e16) — Academic tooling: assignments**, status `in_progress`.

Census (post-L-2 done-marking of the 3 claimed tasks):
```
done_count = 3   open_count = 11
```

- `open_count = 11 ≠ 0` → **NO `milestones` UPDATE. M5 STAYS `in_progress`** (mechanical non-close).
- M5 is multi-wave; bundle 1 of several. The 11 open = the reminders arc (cron + NotificationsModule + Resend email, DEFERRED) + 6 re-homed M3/M4 messaging/presence tech-debt rows + the 4 new V-2 follow-ons (4b397de0 / edbdea8f / 6f257c82 / 3ad35a42). None are this wave's scope and none block M5 closure-eligibility.
- `open_count = 11 ≥ 3` (brain-fallback threshold) → **NO backlog-stockout flag** for N-1. No roadmap-planning needed.
- No judgment call required (mechanical non-close, no ambiguity) → no BOARD route under automatic.

Delta recorded; no DB write.

## Action 3 — README touchups

**SKIPPED.** No new env var, CLI command, or install step landed — assignments reuse existing config (auth, storage, DB connection all already wired). No breaking change. Consistent with the waves 13-21 README cut. Recorded skip.

## Action 4 — Commit

FS touchup committed: CHANGELOG only (milestone delta is record-only, no DB write). Message: `docs: L-1 wave-22 closeout (changelog)`. Pushed direct to main (docs bypass under automatic).

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:47-50"
  - "milestones row UPDATE: NONE (M5 a5232e16 stays in_progress; open_count=11)"
  - "README.md: SKIPPED (no env/CLI/install/breaking surface)"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M5 (a5232e16)", before: "in_progress", after: "in_progress"}
roadmap_skip_reason: "M5 multi-wave; open_count=11 (>0) → mechanical non-close, no UPDATE; ≥3 → no backlog-stockout"
readme_sections_touched: []
note: "IDOR fix classified Added (preventive, new endpoint, never shipped vulnerable) per Action 1. No PRINCIPLES edits (L-2 lane; write-outside-L-block guard honored)."
```
