# L-1 — Docs (wave-25 closeout)

**Block:** L (Learn), stage L-1 (∥ L-2). Mode: `automatic`.
**Wave:** Mention token-parser parity + editMessage mention-update atomicity (M5 debt).
Merge commit `dbe55a2`, PR #37, LIVE on prod (api `b0251962` + web `25a010b0` SUCCESS).
V-block APPROVE by Karen + jenny + head-verifier.

## Action 1 — CHANGELOG entry (done)

Appended under `[Unreleased]`, keep-a-changelog format, matching terse house style (declarative, present-tense, user-facing, PR-cited):

- **`### Changed`** (CHANGELOG.md:56) — mention token-parser parity. `@bob.dev` (server-resolved `bob`) now renders the mention pill + `.dev` as plain text, where the whole `@bob.dev` previously rendered plain. Client and server share one mention-slug grammar (`packages/shared`), so they can't drift. Classified **Changed** (not Added): modifies already-shipped mentions feature #27.
- **`### Fixed`** (CHANGELOG.md:61) — editMessage mention-update atomicity. Editing a message updates its mentions all-or-nothing (single DB transaction); a mid-edit partial failure can no longer leave stale/half-updated mention rows. Classified **Fixed** (not Security): robustness of an in-app write path; no shipped vulnerability patched after the fact.

Both cite (#37). Total 2 bullets — within the ≤5-bullet + headline cap.

## Action 2 — Milestone delta (RECORD-only, no transition)

Claimed task `c18b8089-a7bb-442f-890f-66649d7f746a` (`status='done'`, set by L-2) → milestone **M5** (`a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d`, "Academic tooling: assignments", `in_progress`).

Live DB census (verified this stage):

```
M5 | in_progress | done_count=7 | open_count=9
```

- `open_count = 9 ≠ 0` → M5 does **NOT** close. **No `milestones` UPDATE.**
- Mechanical non-close, zero ambiguity → no `automatic`-mode BOARD escalation (`L-1-roadmap-delta` not fired).
- No state change → **no `product-decisions.md` append.**
- 9 open ≥ 3 threshold → **no `backlog-stockout` flag** for N-1.

M5 remains multi-wave: the reminders arc is the M5 headline still DEFERRED — the Resend API key is the sole M5-close blocker, already escalated to founder. Re-homed debt + cross-cutting tasks also remain among the 9 open.

## Action 3 — README (skipped)

Skip reason: nothing user-facing at README level changed this wave — no new CLI command/flag, no new env var, no new install step, no breaking change. Mention rendering + editMessage atomicity are in-app behavior. Consistent with the w13–24 README-skip cut. Detail lives in CHANGELOG + PR #37.

## Action 4 — Commit (done)

Changelog-only (README skipped). Direct-push to `main` (automatic mode allows direct doc commits; token has docs-only bypass).

- Commit `23eebf844b98c84e0cae9d622535709e8b47c53d` (`docs: L-1 wave-25 closeout (changelog)`)
- Pushed `main`: `c7a7695..23eebf8`

PRINCIPLES files untouched (that is the L-2 lane; L-1 write-scope is CHANGELOG / README / milestone DB only).

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:56 (### Changed — mention parity #37)"
  - "CHANGELOG.md:61 (### Fixed — editMessage atomicity #37)"
  - "commit: 23eebf844b98c84e0cae9d622535709e8b47c53d (docs: L-1 wave-25 closeout; pushed main c7a7695..23eebf8)"
  - "milestones row UPDATE: NONE (M5 a5232e16 census 7 done / 9 open → open_count≠0, mechanical non-close)"
changelog_entry_added: true
roadmap_milestones_progressed:
  - milestone: "M5 (a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d — Academic tooling: assignments)"
    before: "in_progress (6 done)"
    after: "in_progress (7 done)"
roadmap_skip_reason: ""
readme_sections_touched: []
note: "Milestone delta RECORD-only — no milestones UPDATE (open_count=9≠0, mechanical non-close, no judgment ambiguity → no automatic-mode BOARD escalation). No product-decisions append (no state change). 9 open ≥ 3 → no backlog-stockout flag. M5 headline (reminders arc) still DEFERRED — Resend API key sole M5-close blocker, already escalated to founder. README skipped (no user-facing CLI/env/install/breaking change; mention rendering is in-app behavior). PRINCIPLES untouched (L-2 lane)."
head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Every L-1 exit criterion met from concrete artifacts. CHANGELOG entry appended in
    terse house style, correctly bucketed (Changed for the #27-modification, Fixed for
    the atomicity robustness fix), both #37-cited, within the length cap. Milestone delta
    verified against the live DB (M5 7 done / 9 open) — correctly a record-only non-close,
    no spurious milestones UPDATE, no BOARD escalation (no ambiguity), no backlog flag
    (9 ≥ 3). README skip is justified — no user-facing surface at README level changed.
    Commit pushed to main. PRINCIPLES files untouched, keeping the L-2 promotion lane clean.
  next_action: PROCEED_TO_L-block-exit
```
