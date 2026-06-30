# L-1 — Docs (wave-14)

> Block L (Learn), stage L-1. Runs concurrently with L-2 Distill. head-learn owns the block.
> Wave-14 shipped LIVE + verified: M3 real-time presence layer (`/presence` namespace + typing indicators + member-list panel).

## Action 0 — head-learn spawned

head-learn owns the L-block (spawned at L-1 entry, dies at L-2 exit). L-1 and L-2 run concurrently; this deliverable does NOT touch `tasks` status (L-2 owns task closure) or `*-PRINCIPLES.md` (L-2 distill).

## Action 1 — CHANGELOG entry — DONE

Appended 4 bullets under `## [Unreleased]` → `### Added`, citing `(#26)`. House style: terse, declarative, present-tense, user-facing (matched the terse recent entries, not the verbose foundation-era ones).

- **Range:** `CHANGELOG.md:34-37`
- **Section:** Added (all three shipped surfaces are new features; no existing feature was modified, so nothing in Changed).
- **V-3 fix routing:** the typing per-recipient fan-out correction (recipient sees the typer's name) was a within-wave correction on a brand-new surface (`/presence` never shipped before this wave), so it is folded into the Added presence/typing bullets — NOT logged in Fixed. (Same precedent as wave-13's reaction-on-deleted guard logged in Added.)
- **Membership-scoping (no-leak)** captured as a user-facing privacy bullet — preventive privacy on a new surface belongs in Added, not Security (Security is for shipped-then-patched vulnerabilities only).

CHANGELOG bullets added:

```
- Live presence in your study servers: see who's online or offline at a glance, with presence updating instantly as people come and go across all their open tabs. (#26)
- A member list in the channel view, grouped into Online and Offline with live status dots, so you always know who's around. (#26)
- Typing indicators show when someone in the channel is typing, naming who it is, so a reply never catches you by surprise. (#26)
- Presence and typing are shared only with people in your server, so who's online never leaks to anyone outside it. (#26)
```

## Action 2 — Milestone delta — RECORDED (no UPDATE)

Touched milestone: **M3 — Real-time messaging** (`6198650e-f4e0-44dc-9b0a-6550f01f9f82`, `in_progress`).

Census read live from DB (L-2 had already set the 3 wave-14 claimed tasks to `done`):

| metric | value |
|---|---|
| done_count | 10 |
| open_count | **7** |
| cancelled_count | 0 |

`open_count = 7 > 0` → **M3 stays `in_progress`. No `UPDATE milestones` issued.** Mechanical non-close, no judgment ambiguity → no mode escalation.

The 7 open tasks (none claimable by this wave's scope):
1. `10b9d18e` — presence dots on message-author rows + DM/member affordances (**deferred** from this bundle — WIP-limited).
2. `02fa8011` — real-Postgres integration test tier for presence/services (wave-14 V-2 non-blocking).
3. `6a546c7b` — presence perf: getCoMemberUserIds full-membership scan per connect (wave-14 V-2 non-blocking).
4. `d23a0740` — presence/members code-debt: displayName empty-fallback + unused (wave-14 V-2 non-blocking).
5. `25523fb0` — real-Postgres mid-transaction rollback test (parked tech-debt).
6. `46f16288` — browser E2E for authed create-server flow (parked tech-debt).
7. `d058283d` — rotate permanent server invite_code, owner-gated (parked tech-debt).

Plus M3 feature scope still unshipped beyond presence: mentions, attachments, thread replies. M3 is structurally and feature-wise incomplete; closing it now would be a premature-milestone-close anti-pattern.

`## Success metric` prose check: already finalized ("Two students in a channel exchange messages in real time (<1s delivery), with reactions, threads, and attachments working.") — no `_TBD_`, so no finalization edit. Skipped per Action 2.

**N-1 carry-forward flag:** active milestone M3 still has open feature scope (mentions/attachments/threads) — next-wave decomposition should author the next M3 bundle. 3 parked tech-debt tasks (25523fb0/46f16288/d058283d) + 3 wave-14 V-2 non-blocking (02fa8011/6a546c7b/d23a0740) + deferred author-dots (10b9d18e) remain as top-level M3 todos.

## Action 3 — README — SKIPPED

Pure feature wave. No user-facing setup / env var / CLI / install / breaking change. Nothing in README needs touching. Skip recorded.

## Action 4 — Commit — DONE

Single batched FS commit: `docs: L-1 wave-14 closeout (changelog)`. Pushed to `main`.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:34-37"
  - "milestones row read (no UPDATE): 6198650e-f4e0-44dc-9b0a-6550f01f9f82 stays in_progress (10 done / 7 open)"
changelog_entry_added: true
roadmap_milestones_progressed: []   # M3 progressed in done_count (7->10) but no status transition; stays in_progress
roadmap_skip_reason: "M3 open_count=7>0 (deferred author-dots + 3 V-2 non-blocking + 3 parked tech-debt; M3 feature scope mentions/attachments/threads unshipped) -> mechanical non-close, no UPDATE"
readme_sections_touched: []          # README skipped: pure feature, no user-facing setup/env/CLI change
note: "head-learn L-1. L-2 runs concurrently (owns tasks-status closure + principles). V-3 typing per-recipient fix logged in Added (within-wave fix on new surface, not Fixed). No-leak membership-scoping logged in Added (preventive privacy on new surface, not Security). N-1 flag: author next M3 bundle (mentions/attachments/threads); 6 carried tasks + deferred author-dots remain open under M3."
head_signoff:
  verdict: APPROVED
  stage: L-1-docs
  reviewers: {}
  failed_checks: []
  rationale: >
    Every L-1 exit checkbox ticks from concrete artifacts. CHANGELOG entry appended (CHANGELOG.md:34-37,
    headline-equivalent + 4 user-facing bullets, present-tense, cites #26, terse house style). Milestone delta
    recorded against live DB census (M3 10 done / 7 open) — mechanical non-close, no UPDATE, no ambiguity hence
    no mode escalation. README skip justified (pure feature, no user-facing setup/env/CLI surface changed).
    Doc deltas for the wave's changed shipped surfaces (presence, typing, member-list, no-leak scoping) are covered;
    T-9 already regenerated user-journey-map (L-1 does not redo journey work). Observations stay blameless and
    artifact-cited. Commit pushed to main.
  next_action: PROCEED_TO_block-exit
```
