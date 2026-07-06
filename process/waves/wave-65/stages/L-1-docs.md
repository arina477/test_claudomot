# L-1 — Docs (wave-65)

> Block: L (Learn) 7th of 8. Stages L-1 ∥ L-2. Mode: automatic.
> Wave: M12 cold-offline WORKSPACE hydration (Dexie v4→v5 cachedServers + cachedServerDetails;
> ServerContext write-through/read-through). PR #80 → main `1ec98ef`. Single claimed task
> db3ade72. All gates APPROVED.

## Action 1 — CHANGELOG entry

Appended ONE **Added** bullet under `## [Unreleased]` → `### Added` at **CHANGELOG.md:87**, citing #80:

> Open the workspace offline on a cold start: your server list and each server's channels now load
> from a local cache even on a fresh launch with no connection, so previously-viewed servers,
> channels, and messages stay reachable instead of a blank screen — and refresh once you reconnect. (#80)

- **Added** not Changed: a genuinely new user-facing capability — cold-offline reachability of the
  workspace shell (rail + channel sidebar), the keystone that makes the three prior M12 offline
  surfaces (messages #77, academic content #78, attachment media #79) actually reachable on a COLD
  offline launch, where previously only a warm mid-session disconnect worked.
- Terse house style (headline + 0 sub-bullets), keep-a-changelog, StudyHall identity, no stage
  codes / file paths / agent names in founder-facing text.

## Action 2 — Milestone delta

M12 — Offline-first moat (`36378340-0ea5-428e-bc94-03750fb103f6`), status `in_progress`.

After L-2 marked db3ade72 `done`, the M12 child-task count:

```
done_count = 9 | open_count = 2 | total = 11
```

Remaining open (open_count = 2 > 0):
- `10e7543f-431f-44ac-8af0-3c0882ca9885` — **blocked** — serve assignment attachment media from
  offline cache (the descoped assignment-media leg).
- `6018bdee-1b99-47b2-8235-b3786c29c2d5` — **todo** — G2 offline empty-state copy-polish follow-up
  (correctly NOT closed by this wave).

Plus the milestone's success-metric prose still carries an unshipped **conflict-resolution UI**
clause (not a task row).

**Delta: M12 stays `in_progress`.** `open_count = 2 > 0` → mechanical hold. No transition, no DB
write to `milestones`, no BOARD escalation (no judgment ambiguity — the count is unambiguous), and
the `## Success metric` prose was NOT hand-edited. The offline READ-path surface is now essentially
complete — messages / DMs / academic / media / **workspace** all reachable cold; only the
conflict-resolution UI clause + the blocked assignment-media leg + minor copy polish remain.

## Action 3 — README touchups

**Skipped.** Wave-65 is internal offline behavior (IndexedDB cache read/write-through in the sync
layer + ServerContext). No new CLI command / flag, no new env var, no new install step, no breaking
change. Nothing user-facing at README level.

## Action 4 — Commit

FS docs (CHANGELOG only) committed + pushed to main: `docs: L-1 wave-65 closeout (changelog)`.
Milestone delta required no DB write (mechanical hold), so no Action-2 DB commit.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:87 (Added bullet, #80)"
  - "milestones 36378340: no UPDATE — open_count=2>0 mechanical hold, stays in_progress"
changelog_entry_added: true
roadmap_milestones_progressed:
  - milestone: "M12 — Offline-first moat (36378340)"
    before: in_progress
    after: in_progress   # mechanical hold; done=9/open=2/total=11
roadmap_skip_reason: ""
readme_sections_touched: []
note: "M12 offline READ-path surface essentially complete (messages/DMs/academic/media/workspace all cold-reachable); remaining: conflict-resolution UI clause + blocked assignment-media leg (10e7543f) + copy-polish follow-up (6018bdee). Success metric not hand-edited."
head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Single active block (L) with observation capture handled at L-2. CHANGELOG carries one terse,
    user-facing Added bullet citing #80, matching house style. Milestone delta is mechanical
    (open_count=2>0) — no transition, no hand-edit of the success metric, no unwarranted BOARD.
    README correctly skipped (internal-only change). Every check ticks.
  next_action: PROCEED_TO_N-1
```
