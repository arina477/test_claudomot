# L-1 Docs — wave-62 (StudyHall, M12 offline-first moat #1: offline DM read-cache)

**Owner:** head-learn (L-block gate). Mode: automatic. Ran inline, concurrent with L-2.
**Prereqs met:** V-block APPROVE (karen + jenny + head-verifier all APPROVED); P-2 spec read (DB seed 80c7c11f YAML head); milestone state read from DB; CHANGELOG house style read (`git log -p CHANGELOG.md`).

## Action 1 — CHANGELOG entry

Appended ONE bullet under **### Added** at `CHANGELOG.md:84`, `[Unreleased]`:

> - Read your direct messages offline: your conversation list and message history now stay readable even when you're offline or on a flaky connection, instead of going blank, and they sync back up when you reconnect. (#77)

- **Section = Added** (not Changed): a genuinely new user-facing capability (offline DM reads) extending the shipped M4 offline wedge to a second surface. Not a bug patch → not Fixed; no preventive-security surface → not Security.
- House-style match: plain-language present-tense, StudyHall identity, single bullet, `(#77)` PR cite, no stage codes, ≤ terse-entry length. Matches the wave-61 (#76) / wave-60 (#75) Added/Changed bullets.

## Action 2 — Milestone delta

Milestone touched (via `tasks.milestone_id` on the 3 claimed tasks): **M12 — Offline-first moat** (`36378340-0ea5-428e-bc94-03750fb103f6`), status `in_progress`.

Child-task count after L-2 marked the bundle done:

```
done_count=3  open_count=0  total=3
```

**Disposition: M12 in_progress → in_progress (NO transition, NO DB write).**

- `open_count=0` would mechanically trigger a `done` transition for a single-bundle milestone. M12 is NOT that — it is a LARGE, multi-bundle milestone. Its own `## Success metric` (read from DB) spans: full offline content coverage for **assignments, study-group data, and previously-loaded media**, PLUS a **conflict-resolution UI** reconciling zero-data-loss on reconnect. Offline DM reads is ONE slice (the cheapest pattern-prover, per P-0/P-4 framing + jenny V-1 honesty check).
- `open_count=0` from ONE decomposed bundle does NOT mean a large milestone is done. Closing M12 here would falsely claim the moat is shipped and strand its remaining scope.
- **Mode routing:** this is a mechanical, no-ambiguity disposition — the milestone's OWN recorded scope (Success metric prose) is the authority that its scope continues. Per L-1 Action 2 "mechanical milestone progress with no ambiguity runs under any mode without escalation" → no BOARD convened under automatic mode. Recorded in `command-center/product/product-decisions.md` (2026-07-06 wave-62 L-1 entry).

**CRITICAL carry-forward to N-1 (flagged prominently):**
M12's active queue now has **0 open child tasks** but its scope is **NOT shipped** → this is the N-1 "fire per-wave milestone-decomposition" case (N-1 Action 7 spawns milestone-decomposer for M12's NEXT bundle; this is NOT a backlog-stockout that routes to founder — M12 is the active in_progress milestone with unshipped scope).

**Bundle #2 MUST target OFFLINE ASSIGNMENTS (academic content — assignments / study-group data), NOT another social/messaging surface.** Rationale (recorded by ceo-reviewer + jenny at P-0/P-4, re-confirmed by jenny at V-1 `V-1-jenny.md:58-63`): M12's success metric centers on coursework/academic content; DMs were deliberately the cheapest pattern-prover first slice, not the headline. Extending offline reads to a second social surface would drift from the moat's actual metric. Deferred M12 items remaining: offline media/attachment blobs + conflict-resolution UI (both build ON the DM read-cache layer landed this wave).

## Action 3 — README touchups

**SKIPPED.** No user-facing CLI / env var / install step / breaking change. Offline DM reads is a transparent data-source change on the existing DM surface (a student sees the same DM screens; they just no longer go blank offline). Detailed change lives in CHANGELOG. Skip recorded here per Action 3 skip condition.

## Action 4 — Commit

FS docs committed + pushed to `main` (project allows direct doc commits; consistent with wave-61 L-1 4d9c394):

- Commit `4267606` — `docs: L-1 wave-62 closeout (changelog, milestone delta)` — touches `CHANGELOG.md` + `command-center/product/product-decisions.md`.
- Pushed `c2abc5b..4267606  main -> main` (push exit 0).
- No milestone DB write (Action 2 was a no-op transition); no README commit (Action 3 skipped).

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:84 (Added, #77)"
  - "milestones row UPDATE: none (M12 in_progress -> in_progress; no-op, mechanical no-ambiguity)"
  - "product-decisions.md append: wave-62 L-1 milestone delta"
  - "FS commit: 4267606 (pushed main c2abc5b..4267606)"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M12 — Offline-first moat (36378340)", before: in_progress, after: in_progress}
roadmap_skip_reason: ""
readme_sections_touched: []
note: >
  M12 first bundle (offline DM reads) shipped + done; milestone stays in_progress (large,
  multi-bundle; scope per its own Success metric = assignments/study-group data/media +
  conflict-resolution UI is NOT shipped). CRITICAL N-1 carry-forward: M12 active queue has
  0 open child tasks but scope unshipped -> N-1 fires per-wave milestone-decomposition;
  bundle #2 MUST target OFFLINE ASSIGNMENTS (academic content), NOT another social surface
  (ceo-reviewer + jenny). README skipped (offline behavior transparent).
```
