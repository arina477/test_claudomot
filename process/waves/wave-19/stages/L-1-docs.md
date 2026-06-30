# Wave 19 — L-1 Docs

> M3 file/image attachments (the LAST M3 feature). PR#31 (dbf6b25); migration 0009; api 8ef2c228 + web 8d3e0c36 deployed and LIVE. 3 tasks DONE (20db0c16, 7c39c9e3, cf1ae370). A /review caught + fixed a Critical (send-time IDOR + size-bypass) pre-merge. Runs ∥ L-2 — this stage does NOT touch tasks-table status or `*-PRINCIPLES.md`.

## Action 1 — CHANGELOG entry

2 bullets appended under `[Unreleased] → Added`, citing (#31), keep-a-changelog terse style (matched the 2-bullet wave-18 entry, not the verbose early ones).

- **CHANGELOG.md:43-44**
  - "Attach files and images to a message: pick from the composer (up to 10MB each), with an image thumbnail or file chip preview and a progress-and-retry indicator while it uploads. (#31)"
  - "Images render inline in the message and open full-size on click; other files show as a chip with name and size, so attachments are always there to grab. (#31)"

User-facing surface only (composer picker/preview + message-row inline-image/lightbox/file-chip render). The send-time IDOR + size-bypass fix was a pre-merge /review catch on a NEW surface (never shipped to users) → correctly NOT a Security entry; preventive authz on a new surface stays in Added per L-1 Action 1 guidance. The presign→PUT→confirm data plane is the mechanism behind the user-facing line, not its own bullet (length cap: headline + ≤5 bullets).

## Action 2 — Milestone delta (RECORD ONLY — no UPDATE)

Milestone touched via `tasks.milestone_id` on the 3 claimed tasks: **M3 (6198650e)**.

- **Census after L-2 done-marking:** 21 done / 6 open (was 18/6 at wave-18 close; +3 this wave: 20db0c16, 7c39c9e3, cf1ae370).
- **M3 is CLOSURE-ELIGIBLE.** All 3 `## Scope` success-metric features now LIVE: reactions (wave-13) / threads (wave-18) / attachments (wave-19). V-3 + jenny confirmed.
- **NOT closed here.** The milestone state-machine transition (`in_progress → done`) is an N-1 action per `claudomat-brain/ROADMAP/roadmap-lifecycle.md` § Milestone state transitions. L-1 leaves `milestones.status = in_progress`. No `UPDATE milestones` issued. No `product-decisions.md` close entry written (the transition is N-1's to record).
- **The 6 open child tasks do NOT block closure.** They are parked tech-debt that carries forward as independent backlog (invite-rotation, real-PG tier 02fa8011, presence perf/debt, mention parity, etc.) — scope-met closure is on the success-metric features, not on draining every child.

### NOTE FOR N-1
> M3 (6198650e) is closure-eligible — scope met (reactions/threads/attachments all LIVE; V-3 + jenny confirmed). **N-1 performs the `in_progress → done` close** and records it in `product-decisions.md` per roadmap-lifecycle. The 6 open child tasks are parked tech-debt — re-home as independent backlog (do NOT block the close).

## Action 3 — README touchups

**Skipped.** Attachments is a pure feature add: no setup step, no env var, no CLI surface, no quick-start change (storage already wired — Railway Buckets/FilesService reused, no new SDK/cred). The README "Live" prose narrative stops at server creation + invites and has not enumerated messaging / reactions / threads in waves 13-18 — appending attachments would be inconsistent with that established cut. Detailed change lives in CHANGELOG. Consistent with the wave-13→18 README-skip disposition.

## Action 4 — Commit

FS touchups only (CHANGELOG.md). Milestone progression NOT written (no DB UPDATE this stage). Commit `docs: L-1 wave-19 closeout (attachments changelog)`, pushed to `main`.

- Commit SHA: see footer `verdict_evidence`.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Every L-1 sub-action satisfied. CHANGELOG carries 2 terse user-facing bullets (#31)
    under Added, each naming a concrete shipped surface (composer picker/preview;
    message-row inline-image/lightbox/file-chip render) — the pre-merge IDOR+size-bypass
    /review catch was on a never-shipped new surface, so correctly NOT a Security entry.
    Milestone delta is RECORDED (M3 census 21/6, closure-eligible, scope met) but the
    in_progress->done transition is deliberately LEFT to N-1 per roadmap-lifecycle — no
    milestones UPDATE, no product-decisions close entry, no tasks-table touch (L-2 owns
    status, concurrent). README skip is justified and consistent with the wave-13..18 cut.
    No principles promotion in scope (L-2 owns that, concurrent).
  next_action: PROCEED_TO_L-block-exit

l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:43-44 (2 bullets, #31, Added)"
  - "milestones row UPDATE: NONE — M3 closure-eligible, transition deferred to N-1 (roadmap-lifecycle)"
  - "README.md: not touched (skip recorded)"
changelog_entry_added: true
roadmap_milestones_progressed: []      # no transition this stage; N-1 closes M3
roadmap_milestone_recorded: [{milestone: "M3 (6198650e)", census: "21 done / 6 open", closure_eligible: true, transition_owner: "N-1"}]
roadmap_skip_reason: "milestone touched (M3) but state-machine transition is N-1's; L-1 records delta only, no UPDATE"
readme_sections_touched: []
note: "M3 CLOSURE-ELIGIBLE — scope met (reactions w13 / threads w18 / attachments w19 all LIVE; V-3 + jenny confirmed). N-1 closes M3 in_progress->done + records in product-decisions; 6 open children are parked tech-debt that carry forward as independent backlog and do NOT block closure. Tasks-table status untouched here (L-2 owns it, concurrent)."
```
