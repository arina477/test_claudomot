# L-1 — Docs (wave-58)

> Block L (Learn), stage L-1. Runs concurrently with L-2. head-learn owns the block.

## Action 1 — CHANGELOG entry

Appended one bullet under `### Fixed` in `CHANGELOG.md` (line 113), citing `(#73)`.

Section rationale: this wave patched a **real, pre-existing, user-visible production bug** (a moderator/educator deleting another user's message did not tombstone it on the message author's own client until a refresh) → **Fixed** per L-1 Action 1's mapping (a bug fixed in this wave). Not Added/Changed (no new feature or modified behavior), not Security (no shipped vulnerability — this was a realtime-fan-out correctness defect, not an information-disclosure or auth gap).

Entry (present-tense, user-facing, StudyHall identity, no internal vocabulary):

> When an organizer or teaching assistant deletes someone else's message, it now disappears in real time for everyone viewing the channel — including the message's own author, who previously kept seeing their deleted message until a refresh. (#73)

Style: single headline bullet, matches the terse recent Fixed entries (#72, #65). File-level detail (payload.id match, idempotencyKey reconcile, outbox drain re-entrancy) stays in PR #73 / commit messages, not the CHANGELOG.

## Action 2 — Milestone delta

Distinct milestone touched by the claimed task (`a1dda389-0bd8-4ac4-afc4-89355db9c5ca`, milestone_id `84e17739-af5e-4396-beb9-b6f3d6836fc4`):

- **M8** (id `84e17739-af5e-4396-beb9-b6f3d6836fc4`).

L-2 confirmed the claimed task already `done` (bookkeeping applied). Post-state counts:

```
SELECT count(*) FILTER (WHERE status='done'), count(*) FILTER (WHERE status IN ('todo','in_progress','blocked'))
FROM tasks WHERE milestone_id='84e17739-af5e-4396-beb9-b6f3d6836fc4';
-> done_count = 39, open_count = 4
```

`open_count = 4 > 0` → M8 does **NOT** transition to `done`. **M8 in_progress → in_progress (39/43 done; tail remains).**

The 4 open are the known low-value tail (test debt / cosmetic / premature-at-zero-users). `open_count = 4 ≥ 3` → **not** a `backlog-stockout` flag under the brain fallback threshold (< 3 open remaining).

No DB write to M8 (mechanical no-op — no state change). Under `automatic` mode this is a mechanical, unambiguous milestone-progress step → **no BOARD** (no "really done?" judgment call; open_count > 0 forecloses closure mechanically). No product-decisions.md append (no transition occurred).

**M9 (Monetization) advance is founder-reserved (rule 17: pricing/business-model) — NOT an L-1 call. M9 untouched.** This carries the standing soft founder note from waves 55-57; it re-surfaces at N-1, not here.

## Action 3 — README touchups

**SKIPPED.** No new CLI command/flag, no new env var, no new install step, no breaking change. The wave's change is internal messaging realtime behavior (client delete-event matching + optimistic reconcile) — no user-facing README surface changed. Skip recorded.

## Action 4 — Commit

Single batched FS commit: `docs: L-1 wave-58 closeout (changelog)` → pushed to `main`. SHA recorded in footer after commit.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:113 (Fixed; #73)"
  - "milestones row: M8 84e17739 — no UPDATE (mechanical no-op; 39/43 done, open_count=4>0 → stays in_progress)"
  - "README.md: skipped (no user-facing CLI/env/install/breaking change)"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M8 (84e17739)", before: "in_progress", after: "in_progress"}
roadmap_skip_reason: ""
readme_sections_touched: []
note: >
  M8 stays in_progress: 39 done / 4 open. open_count=4>0 blocks mechanical closure;
  open_count>=3 → not a backlog-stockout flag. Mechanical no-op, no BOARD (automatic mode,
  no ambiguity). M9-Monetization advance is founder-reserved (rule 17) — untouched; standing
  soft founder note re-surfaces at N-1, not L-1. Commit SHA appended post-push.

head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Every active-block observation is captured at L-2 (delegated to knowledge-synthesizer,
    artifact-cited, blameless, count-bounded). The single shipped surface change — a realtime
    delete-fan-out fix — is reflected in exactly one terse user-facing CHANGELOG Fixed bullet
    (#73). Milestone delta is mechanical and correct (M8 stays in_progress on open_count=4).
    README skip is justified (no user-facing CLI/env/install/breaking surface). No blameful
    language, no over-detailed inventory, no principles bloat introduced at this stage.
  next_action: PROCEED_TO_L-2
```
