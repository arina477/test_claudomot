# L-1 — Docs (wave-39)

> Wave: settings-doorway user menu — closes wave-38 F1 (sidebar profile button was inert; avatar upload unreachable; no in-app logout).
> V-block: APPROVED (0 blocking). Task c208e91e already `done` (set by L-2).

## Action 1 — CHANGELOG entry

Appended two bullets under `[Unreleased] → Added` (CHANGELOG.md:72-73), citing PR #53.

Classification rationale: **Added**. The user menu is a net-new affordance — the log out button did not exist anywhere in the UI before, and the avatar-upload entry point was unreachable. Fixed is defensible (it closes the F1 gap) but the dominant character is net-new user-reachable capability, so it lands in Added, not Fixed.

- Line 72 — user menu doorway (profile/settings + avatar + privacy + log out).
- Line 73 — avatar upload now reachable end-to-end from the app (backend shipped #52; entry point shipped #53).

Length: 2 terse bullets, present-tense, no file-level detail — matches the disciplined historical entries.

## Action 2 — Milestone delta

Milestone touched: **M7 = 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007** ("Privacy controls, notifications & launch policy").

DB-verified counts (`WHERE milestone_id = M7`):

| done_count | open_count |
|---|---|
| 12 | 2 |

Open tasks (both remain):
- `a1299e88` — Verify a Resend domain for transactional email — **blocked**
- `7525b759` — Harden avatar endpoints against malformed/edge input — **todo**

`open_count = 2 > 0` → **M7 does NOT close. Stays `in_progress`.** No `milestones` UPDATE issued. Mechanical, no judgment call (open child tasks remain terminal-incomplete).

Progression note: the avatar feature is now fully user-reachable end-to-end (backend #52 → in-app entry #53), so launch-readiness advanced this wave. Remaining before M7 can close: Resend transactional-email domain verification (blocked, external) + LOW-severity avatar-endpoint hardening (todo). Neither is closed by this wave.

## Action 3 — README touchups

**SKIPPED.** No user-facing quick-start / env-var / CLI / install / breaking change this wave — a sidebar menu doorway does not alter setup, environment, or commands. CHANGELOG carries the change.

## Action 4 — Commit

`docs: L-1 wave-39 closeout (changelog)` — FS-side touchup (CHANGELOG only); pushed to main.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:72-73"
  - "milestones row: M7 6e2f68d8 NOT updated (open_count=2, stays in_progress)"
changelog_entry_added: true
changelog_line_range: "72-73"
roadmap_milestones_progressed:
  - {milestone: M7, before: in_progress, after: in_progress}
roadmap_skip_reason: ""
readme_skip: true
readme_sections_touched: []
commit_sha: "<filled post-commit>"
note: "M7 stays open: 12 done / 2 open (a1299e88 Resend-domain BLOCKED + 7525b759 avatar-hardening TODO). Avatar feature now user-reachable end-to-end; launch-readiness advanced."
head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    CHANGELOG entry appended under Added (2 terse bullets, PR #53), correctly
    classified as net-new affordance (in-app logout + reachable avatar upload
    did not exist before). Milestone delta is mechanical: M7 has 2 open child
    tasks (open_count>0) so it stays in_progress — no premature close. README
    skip is justified (no user-facing setup/env/CLI change). Blameless,
    artifact-cited, no bloat.
  next_action: PROCEED_TO_L-2
```
