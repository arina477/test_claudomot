# L-1 — Docs (wave-15)

> Block: L (Learn), stage L-1. Runs concurrently with L-2 Distill.
> Owner: head-learn (sub-agent). L-2 owns tasks-table status + principles files; L-1 does NOT touch them.

## Wave-15 shipped surface — M3 @mentions (LIVE + verified)

@mention data plane (parse @username word-boundaried → resolve to server members only, non-member → plain → persist `message_mentions`, 0007 migration applied to prod), per-user realtime mention signal (author-excluded), `GET /me/mentions` (paginated, session-authz, IDOR-closed), composer @autocomplete member-picker (keyboard nav, canonical @username insert), mention pills (self=emerald / other=muted), unread-mention badge (clears on view).

Tasks done (set by L-2): `3d238446` (data plane), `cd585f04` (autocomplete), `c3f3f62a` (pills + unread). PR #27 (merge `fd86540`). Verified two-client live: mention realtime alive; my-mentions IDOR-closed.

## Action 1 — CHANGELOG entry

Appended 4 bullets under `[Unreleased] → Added` in `CHANGELOG.md`, citing `(#27)`. Terse present-tense user-facing, matching the wave-14 house style (no headline paragraph; ≤5 bullets). No Fixed/Security entry — preventive authz (member-only resolve, IDOR-closed my-mentions) shipped on a NEW surface this wave, so it lands in Added per the stage rule (Security section is for shipped-then-patched vulnerabilities only).

- **Range:** `CHANGELOG.md:38-41`
- Bullets: mention-to-member + live ping; @-autocomplete picker; mention pills (self=green) + unread badge clear-on-view; "my mentions" view (own-only / IDOR-closed).

## Action 2 — Milestone delta

Milestone touched: **M3 — Real-time messaging** (`6198650e-f4e0-44dc-9b0a-6550f01f9f82`), currently `in_progress`.

Census (DB, canonical):

```
done_count | open_count
        13 |          8
```

8 open child tasks (DB-authoritative, all `todo`):
`02fa8011`, `10b9d18e` (deferred author-dots), `25523fb0`, `46f16288`, `6a546c7b`, `c18b8089`, `d058283d`, `d23a0740`
— deferred author-dots + wave V-2 non-blocking follow-ups + parked tech-debt.

`open_count = 8 > 0` → **M3 stays `in_progress`. NO `UPDATE`** — mechanical non-close, no judgment call, no escalation.

M3 feature scope still unshipped (threads, attachments) → milestone is structurally incomplete, not just census-open. Success-metric prose already final (no `TBD`) → skip finalization.

N-1 flag: M3 still has open scope (threads/attachments) + 8 open child tasks; next-wave decomposition / triage candidate.

## Action 3 — README

**Skipped.** @mentions is a pure feature — no new CLI command/flag, no new env var, no new install step, no breaking change. No user-facing setup/env/CLI surface changed. Detailed change detail lives in CHANGELOG + PR #27.

## Action 4 — Commit

FS touchups (CHANGELOG only) committed `docs: L-1 wave-15 closeout (changelog)` and pushed to `main`.

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:38-41"
  - "milestones row UPDATE: NONE (M3 open_count=8>0, mechanical non-close)"
  - "README.md commit: NONE (skipped — no user-facing setup/env/CLI change)"
changelog_entry_added: true
roadmap_milestones_progressed: []
roadmap_skip_reason: "M3 (6198650e) census 13 done / 8 open — open_count>0, milestone stays in_progress; feature scope (threads/attachments) still unshipped; success-metric prose already final"
readme_sections_touched: []
note: "L-2 (concurrent) owns tasks-table status + principles files. L-1 touched only CHANGELOG.md. Two-client live verification + 0007 migration confirmed prior to wave close. N-1 flag: M3 open scope (threads/attachments) + 8 open child tasks for next-wave decomposition/triage."
head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Single shipped surface (M3 @mentions) is fully captured: CHANGELOG carries 4 terse user-facing
    Added bullets citing #27, covering every changed surface (mention data plane + per-user realtime
    signal, /me/mentions view, composer autocomplete, pills + unread badge). Milestone delta is
    mechanical and unambiguous — M3 census 13 done / 8 open, open_count>0 → stays in_progress with no
    UPDATE; the DB-authoritative open-task set was verified against the live tasks table (rule 15).
    No README surface changed; skip recorded with reason. No judgment call requiring mode-routing
    arose. Deliverable, evidence, and commit are clean.
  next_action: PROCEED_TO_L-2_EXIT
```
