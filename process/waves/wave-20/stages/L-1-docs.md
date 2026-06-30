# Wave 20 — L-1 Docs

> L-block, stage L-1 (runs ∥ L-2 distill). Scope: FS docs only — CHANGELOG, milestone delta (record-only), README judgment, commit. Tasks-table status + `*-PRINCIPLES.md` are L-2's concurrent ownership; untouched here.

## Wave-20 shipped surface (context)
M4 offline-first SPINE (founder wedge, first M4 wave): client Dexie IndexedDB store (cached reads + durable outbox), composer stays enabled offline, reconnect drains the outbox EXACTLY-ONCE + IN-ORDER via the server's idempotent POST, plus a NEW forward catch-up `GET ?after=` cursor. PR#32 (bff9f12). No schema migration. Deployed: api d26fe078 + web 2aac8438. 4 tasks DONE. exactly-once+in-order proven via fake-indexeddb.

## Action 1 — CHANGELOG entry

Added under `[Unreleased] → Added`, one bullet, keep-a-changelog style, declarative present-tense, user-facing, PR-cited. Matches the terse house pattern (w13–19 single/double-bullet feature entries).

- `CHANGELOG.md:45` — "Offline-first messaging — read your cached channels even when you're offline, keep composing while disconnected, and on reconnect your queued messages send exactly once and in the order you wrote them. (#32)"

Classified **Added** (new user-facing feature from spec contract). Not Fixed: the /review in-order gaps (drain re-entrancy / single-path / stop-on-failure) and the V-3 catch-up cursor-format bug were caught on a never-shipped surface this same wave — pre-merge catches, not patches to a prior release.

## Action 2 — Milestone delta (RECORD ONLY — no UPDATE)

Milestone touched (via `tasks.milestone_id` on the 4 claimed tasks): **M4 — Offline-first reliability (the wedge)** `eb2a1688-c6b5-416c-84b4-3ede41d07b4c`, status `in_progress`.

Census (`tasks WHERE milestone_id=eb2a1688`):

| done | open (todo/in_progress/blocked) | cancelled |
|---|---|---|
| 4 | 6 | 0 |

`open_count = 6` (≠ 0) → milestone does NOT transition. **M4 stays `in_progress`; NO `milestones` UPDATE issued.** Mechanical, unambiguous (open children remain) → no mode escalation / judgment call.

The 4 done = this wave's spine (idempotency contract 92d85e0e, Dexie store 7332a4b8, outbox integration 9a4ab31d, fake-indexeddb harness e29f6566).

The 6 open are **re-homed tech-debt parked under M4**, NOT the M4 spine continuation:
- d058283d — rotate permanent server invite_code (owner-gated regenerate)
- 10b9d18e — presence dots on author rows + DM/member affordances
- d23a0740 — presence/members code-debt (displayName fallback + unused ServerMembers wrapper)
- 02fa8011 — real-Postgres integration test tier for presence/services
- 6a546c7b — presence perf: getCoMemberUserIds full-membership scan per connect
- c18b8089 — mention token parser parity (client↔server) + edit-diff transaction

**M4 is multi-wave and NOT closure-eligible.** The 2nd M4 wave's user-facing UX — connection-state indicator, pending/failed message UI, catch-up pagination loop — is in the spec's OUT scope and is **undecomposed** (no seed candidate exists for it yet). N-1 decomposes the 2nd M4 bundle next.

## Action 3 — README touchups

**SKIPPED.** The README `## Live` prose (lines 9–17) is a frozen early snapshot — it stops at server-invite-join and already omits 7 waves of shipped messaging (real-time messaging, edits/reactions, presence, mentions, threads, attachments, w13–19). It is not a maintained capability list. Adding offline-first alone while the prose lags 7 waves would worsen, not fix, consistency. No CLI / env-var / install / breaking-change surface changed this wave. Consistent with the w13–19 README cut. CHANGELOG carries the user-facing record.

## Action 4 — Commit

FS touchups (CHANGELOG only) committed + pushed to `main`:
- message: `docs: L-1 wave-20 closeout (offline-first changelog)`
- SHA: see footer `verdict_evidence`

Tasks-table status untouched (L-2 owns it, concurrent). No `milestones` UPDATE (record-only).

## Note for N-1
M4 stays `in_progress` (4 done / 6 open; open children = parked tech-debt, do NOT block closure but keep M4 open). M4 is multi-wave — the SPINE (exactly-once+in-order outbox + Dexie store + forward `?after=` cursor) is LIVE; the **2nd M4 wave = connection-state indicator + pending/failed message UI + catch-up pagination loop** is undecomposed and is the next seed. N-1 decomposes the 2nd M4 bundle. The 6 re-homed debt tasks are independent backlog candidates.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:45"
  - "milestones row: NO UPDATE (M4 eb2a1688 stays in_progress; open_count=6)"
  - "FS commit: dd358553e24bc41e1e00153957db97e0020bf8bb (pushed origin/main)"
changelog_entry_added: true
roadmap_milestones_progressed: []          # M4 census 4 done / 6 open → no transition; record-only
roadmap_milestone_recorded:
  - {milestone: "M4 — Offline-first reliability (the wedge) eb2a1688", before: in_progress, after: in_progress, done: 4, open: 6, closure_eligible: false}
roadmap_skip_reason: ""                      # not skipped — delta recorded, no UPDATE (mechanical non-close)
readme_sections_touched: []                 # README "Live" prose is a frozen early snapshot; consistent w13-19 cut
note: "M4 multi-wave, NOT closure-eligible. SPINE live; 2nd M4 wave (connection-state indicator + pending/failed UI + catch-up pagination loop) undecomposed → N-1 decomposes next. 6 open children = re-homed tech-debt, independent backlog, non-blocking."
```
