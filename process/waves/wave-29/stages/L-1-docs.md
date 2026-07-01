# L-1 — Docs (wave-29)

Head: head-learn (L-block gate). Mode: `automatic`. Wave-29 = presence/members code-debt cleanup (d23a0740), shipped LIVE, PR #42 (fd03d27), api+web deployed. All gates APPROVE.

## Action 1 — CHANGELOG entry

One **Fixed** bullet appended under `## [Unreleased] › ### Fixed` (CHANGELOG.md:66), citing (#42):

- Part 1 (displayName empty-fallback bug) → the user-visible edge fix: a member with an unusual-format email and no display name previously rendered as a blank name in the member list / presence; now falls back to a stable identifier. This is a **Fixed** (behavior correction of a shipped edge), not Added/Changed.
- Part 2 (unused internal `ServerMembers` response schema removed) → folded into the same bullet's "also removed an unused internal response schema" tail rather than a separate **Removed** bullet — it is internal dead-code with no user surface; a standalone Removed entry would overstate it. Terse, ≤2 clauses in one bullet, matches the house terse style.

No **Security** entry: no shipped vulnerability patched (the empty-name edge is a display bug, not a vuln).

## Action 2 — Milestone delta (RECORD-only; M5 does NOT close)

Claimed task d23a0740 already set `status='done'` at L-2. Milestone M5 (a5232e16) live census: **12 done / 6 open** → `open_count = 6 ≠ 0` → NO `milestones` UPDATE. M5 stays `in_progress`. Mechanical non-close, no judgment ambiguity → no BOARD/ceo escalation.

- 6 open tasks: reminders arc (Resend-key-blocked) + 5 leftover polish/hardening tasks.
- 6 open ≥ 3 → NO backlog-stockout flag for N-1.

**N-1 HEADS-UP (park-or-key fork may become mechanically forced):** M5 now has **0 seed candidates** — all 6 open M5 tasks carry a `wave_id` or `parent_task_id`, so none is a top-level unassigned seed. N-1 Action 7 decomposition WILL fire, and because M5's only unbuilt `## Scope` item is the Resend-blocked reminders arc, decomposition is expected to return `incomplete-scope`. This means the standing wave-27-sharpened park-or-key fork (A: provide Resend key → build reminders → close M5; B: PARK M5 + pivot to M6 voice/video) may be mechanically forced at N-block rather than remaining a record-only founder-pending carry. Flagged for head-next.

## Action 3 — F29-K7 — product-decisions log backfill (V-block carry)

`command-center/product/product-decisions.md` was MISSING the wave-28 under-floor override-ship entry (the log jumped from wave-27 override-ship (6th, line 329) straight to the wave-28 owner-ONLY RBAC decision (line 331→now 349), skipping the wave-28 P-1 floor-merge). Appended TWO append-only entries, format-matched to the w25/w26/w27 PRECEDENT-APPLICATION entries, dated 2026-07-01:

- **(a) Wave-28 P-1 floor-merge — PRECEDENT-APPLICATION override-ship (7th)** — product-decisions.md:331–336. Single-spec invite-code rotate d058283d; floor_merge_attempt=0; no fresh BOARD (standing wave-24 "do NOT re-litigate a Nth per-wave" ruling applied as precedent).
- **(b) Wave-29 P-1 floor-merge — PRECEDENT-APPLICATION override-ship (8th)** — product-decisions.md:337–342. Single-spec presence/members debt d23a0740; floor_merge_attempt=0; ceo-reviewer's sharpened M6-voice/video concrete alternative folded into the founder-digest A/B park-or-key fork (option B).

Both factual, dated 2026-07-01, format-matched (bracketed date header + `- Decision` / `- Why NOT a fresh BOARD` / `- Structural carry` / `- By:` bullets). No new BOARD convened; precedent-application only.

## Action 4 — README

**SKIPPED.** Backend/internal cleanup only — no new env var, CLI, flag, install step, or breaking change; no user-surface change (the empty-name edge fix renders through the existing member-list/presence UI with no new component). Consistent with the w13–28 README-skip cut for behavior-preserving/internal waves.

## Action 5 — Commit

`docs: L-1 wave-29 closeout (changelog + product-decisions override-ship backfill)` — direct-push to `main` (project allows direct doc commits). SHA recorded in footer.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:66 (Fixed — #42 empty-name fallback + unused schema removal)"
  - "product-decisions.md:331-336 (wave-28 P-1 floor-merge override-ship, 7th — backfill)"
  - "product-decisions.md:337-342 (wave-29 P-1 floor-merge override-ship, 8th — backfill)"
  - "milestones: NO UPDATE (M5 a5232e16 open_count=6 → stays in_progress)"
  - "commit: 6850e4a (docs: L-1 wave-29 closeout)"
changelog_entry_added: true
roadmap_milestones_progressed: [{milestone: "M5 (a5232e16)", before: "11 done / in_progress", after: "12 done / in_progress"}]
roadmap_skip_reason: ""
f29k7_backfilled: true
readme_sections_touched: []
note: >
  M5 stayed in_progress (open_count=6, mechanical non-close, no escalation). 6 open ≥ 3 → no backlog-stockout.
  N-1 HEADS-UP: M5 now has 0 seed candidates (all 6 open tasks carry wave_id/parent) → N-1 Action 7 decomposition
  will fire and is expected to return incomplete-scope (M5's only unbuilt ## Scope = Resend-blocked reminders).
  The wave-27-sharpened park-or-key fork (A: provide Resend key → build+close M5; B: PARK M5 → pivot to M6 voice/video)
  may become mechanically forced at N-block rather than remaining a record-only founder-pending carry. Flagged for head-next.
head_signoff:
  verdict: APPROVED
  stage: L-1-docs
  reviewers: {}
  failed_checks: []
  rationale: >
    Every L-1 exit checkbox ticked. CHANGELOG carries one honest terse Fixed bullet (part-1 edge fix + folded
    part-2 dead-code note), correctly classified Fixed not Security (no shipped vuln patched) and not Added
    (no new feature). Milestone delta is a mechanical RECORD-only non-close (M5 open_count=6≠0) — no judgment
    ambiguity, no BOARD/ceo escalation, M5 correctly left in_progress. F29-K7 backfill inserts the two missing
    override-ship entries in exact w25/w26/w27 precedent format, factual and dated, closing the log gap between
    w27 (6th) and the w28 RBAC decision. README skip is correct (behavior-preserving internal cleanup, no user
    surface). N-1 0-seed-candidate + park-or-key heads-up carried cleanly to head-next.
  next_action: PROCEED_TO_L-block-exit
```
