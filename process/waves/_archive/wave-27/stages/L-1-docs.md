# L-1 — Docs (wave-27)

**Wave:** 27 — presence performance pair (behavior-preserving, no user-visible change).
**Shipped LIVE, all gates APPROVE.** Merges PR#40. Live: api `855f1ea1` (+index migration 0012) + web `328b1ae9`.
**Mode:** `automatic`.

## Action 1 — CHANGELOG entry

Added one bullet under `### Changed` (CHANGELOG.md:58), cited `(#40)`:

> - Faster presence tracking: indexed the co-member lookup and consolidated the message-list online-status subscription into a single list-level subscription (no visible change). (#40)

**Section rationale.** Behavior-preserving performance modification of the already-shipped presence feature (#26/#38) → **Changed** (existing feature modified), not **Added** (would overstate an internal perf change as a user feature). No shipped vulnerability patched → not **Security**. Explicit `(no visible change)` tag keeps the release-note honest — dots render identically. Terse single bullet, matched to the recent house-style entries (not the verbose historical ones). The two-spec detail (DB index `server_members(user_id)` migration 0012; message-list subscription O(rows×events)→O(events)) lives in PR#40 + commit messages, not the CHANGELOG.

## Action 2 — Milestone delta (RECORD-only, no DB write)

Both claimed tasks (`6a546c7b`, `07361daf`) already set `status='done'` at L-2.

Milestone **M5** (`a5232e16`) live census: **10 done / 8 open** → `open_count = 8 ≠ 0` → milestone does **NOT** close. **No `milestones` UPDATE issued.** M5 stays `in_progress`.

- Mechanical non-close with no judgment ambiguity → no BOARD escalation under `automatic`.
- Reminders arc (Resend-key-blocked) remains the **sole M5-close blocker**.
- Other open M5 children: deferred sibling `fdb444fc`, mid-word mention `ee6421a7`, invite rotation `d058283d`, cleanup `d23a0740`, plus cross-cutting.
- `8 open ≥ 3` → **no `backlog-stockout` flag** for N-1.
- **Carry (record-only):** the M5 "park-or-key" fork (park M5 vs. unblock the reminders arc by supplying the Resend key) is **founder-pending**. Recorded here for N-block visibility; no L-1 action.

## Action 3 — README (skipped)

No new env var / CLI command / install step / breaking change. Presence renders identically (internal performance only). Consistent with the w13–w26 README cut. Skip recorded.

## Action 4 — Commit

One batched FS commit, direct-pushed to `main`.
- Commit: `56eeedff2fc2a6c5a0622c590d612fa05393ba0b`
- Message: `docs: L-1 wave-27 closeout (changelog)`
- Push: `6183c63..56eeedf  main -> main` (6/6 required status checks expected).

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:58 (### Changed, 1 bullet, cited #40)"
  - "commit 56eeedff2fc2a6c5a0622c590d612fa05393ba0b pushed to main (6183c63..56eeedf)"
  - "milestones: NO UPDATE — M5 (a5232e16) 10 done / 8 open, open_count!=0, stays in_progress"
changelog_entry_added: true
roadmap_milestones_progressed:
  - milestone: M5 (a5232e16)
    before: "8 done / in_progress"
    after: "10 done / in_progress"
    transitioned: false
roadmap_skip_reason: ""
backlog_stockout_flag: false          # 8 open >= 3
readme_sections_touched: []
readme_skip_reason: "internal performance only; presence renders identically — no env var / CLI / install / breaking change"
note: "M5 park-or-key fork (park M5 vs supply Resend key to unblock reminders arc) is founder-pending — record-only carry for N-block. M5 stayed in_progress; no BOARD escalation (mechanical non-close, no judgment ambiguity)."
```
