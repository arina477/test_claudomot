# L-1 — Docs (wave-82)

## Summary

Wave-82 fixed a transient-401 auth bounce (entering the DM view shortly after login
intermittently redirected a logged-in user off `/app` to the auth page). Internal
auth-client bug fix — one CHANGELOG **Fixed** entry; no milestone delta, no README change.

## Action 1 — CHANGELOG entry

Appended one **Fixed** bullet under `[Unreleased] › Fixed` in `CHANGELOG.md`:

> - Fixed a rare sign-in glitch where opening your messages right after logging in
>   could bounce you back to the login screen; the app now settles the sign-in and
>   only sends you to login if you're genuinely logged out. (#101)

Location: `CHANGELOG.md:147`. Style matches the terse house Fixed entries (user-facing,
present-tense, PR-cited). Headline + 1 bullet — well under the ≤5-bullet cap.

## Action 2 — Milestone delta: SKIPPED

Claimed task `0e58af8e-efed-43cb-b3eb-f1b962066c51` has `milestone_id IS NULL` (came off
the unassigned bug-fix queue; roadmap complete, 14/14 milestones done). Verified:

```
SELECT id, status, milestone_id FROM tasks WHERE id='0e58af8e-efed-43cb-b3eb-f1b962066c51';
→ 0e58af8e-efed-43cb-b3eb-f1b962066c51 | done | (NULL)
```

No milestone touched → milestone-delta sub-action skipped per L-1 Action 2 skip condition.

## Action 3 — README touchups: SKIPPED

No user-facing feature / CLI / env-var / install change — internal auth-client bug fix
only. README skip recorded per Action 3 skip condition.

## Action 4 — Commit

`docs: L-1 wave-82 closeout (changelog)` — SHA `a40bb089`, pushed to `main`.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:147 (Fixed entry, #101)"
  - "commit a40bb089 pushed to main"
changelog_entry_added: true
roadmap_milestones_progressed: []
roadmap_skip_reason: "claimed task 0e58af8e has milestone_id IS NULL (unassigned bug-fix queue; roadmap complete 14/14)"
readme_sections_touched: []
note: "Internal auth-client bug fix — README skip (no user-facing feature/CLI/env/install change). Milestone delta skip (no milestone assigned)."
```
