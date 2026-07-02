# L-1 — Docs (wave-37: persistent in-app notifications)

**Owner:** head-learn (L-block gate) · **Mode:** automatic · **V-block:** APPROVED (Karen + jenny)

## Action 1 — CHANGELOG entry

Appended 3 bullets under `## [Unreleased] → ### Added` in `CHANGELOG.md` (lines 66-68), citing `(#51)`, matching the terse keep-a-changelog house style (headline-first, present-tense, user-facing; no file-level inventory):

- In-app notifications: header bell + panel collecting @mentions and assignment-due reminders in one place.
- Cross-device / cross-session persistence; the bell counts only genuinely-unread.
- Per-notification + mark-all read, owner-scoped (you only ever see/clear your own; enforced server-side).

Content bucket: **Added** (new feature from spec contract). No Changed/Fixed/Security bullets — this wave shipped a net-new surface; the B-6 Phase-2 fixes (HIGH-1 method drift, HIGH-2 stale list) were fixed pre-merge on the same branch, so they are not prior-shipped regressions and do not earn a `### Fixed` entry.

## Action 2 — Milestone delta (M7 6e2f68d8)

Milestone touched: **M7 — Privacy controls, notifications & launch polish** (`6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007`, `status='in_progress'`).

Post L-2 done-marking, M7 child-task state:

| done_count | open_count | blocked_count |
|---|---|---|
| 10 | 2 | 2 |

`open_count = 2 > 0` → **M7 does NOT transition to done. It progresses** (in-app notifications was a major M7 slice — 3 tasks closed). No `milestones` UPDATE. Mechanical, no BOARD/ceo escalation required (no judgment ambiguity — the two open rows are structurally blocked, not a "is it really done?" call).

**The 2 remaining open tasks are BOTH `status='blocked'` (credential-blocked founder-ops):**
- `a1299e88` — Verify a Resend domain for transactional email (blocked)
- `84e09891` — Set Railway Bucket creds + verify avatar upload live (blocked)

**Flag for N-1 (milestone-disposition point):** M7's *buildable* scope is now complete — **zero unblocked buildable tasks remain**. The only path to closing M7 is founder credential-unblocking (Resend domain + Railway bucket) or an explicit disposition call. N-1 should treat this as a likely disposition point rather than auto-decomposing a new M7 bundle. Deploy-verify/canary is already satisfied by the wave's shipped C-2 (canary skipped <1000 DAU per project threshold); it is not a separate open row.

Product-decisions log: appended the M7-progresses (no-transition) note.

## Action 3 — README touchups

**SKIP.** No user-facing quick-start / install / env-var / CLI / breaking change. Notifications introduce no new environment variable or setup step (they ride the existing API + web + Postgres services and the pre-existing `mention.created` event path). Detailed change stays in CHANGELOG.

## Action 4 — Commit

FS docs (CHANGELOG + deliverables + observations + product-decisions) committed and pushed to `main` in the L-block closeout commit.

---
```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:66-68 (### Added, #51)"
  - "milestones row: M7 6e2f68d8 NO transition (open_count=2, both blocked) — progresses in-place"
  - "product-decisions.md: M7-progresses note appended"
changelog_entry_added: true
roadmap_milestones_progressed: [{milestone: "M7 6e2f68d8", before: in_progress, after: in_progress}]
roadmap_skip_reason: ""
readme_sections_touched: []
note: "M7 buildable scope complete; only 2 credential-blocked founder-ops remain (a1299e88 Resend, 84e09891 Railway bucket). Flagged for N-1 as a milestone-disposition point."

head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Every stage-exit check for L-1 Docs ticks. CHANGELOG carries a terse, user-facing,
    correctly-bucketed (Added) 3-bullet entry citing #51, matching house style. The
    milestone delta is mechanical and correct: M7 progresses (open_count=2>0), no
    transition, no escalation; the two remaining rows are credential-blocked founder-ops,
    which I surface to N-1 as a disposition point. README skip is justified (no user-facing
    quick-start/env change). Doc coverage matches the single shipped surface (the header
    bell + notifications panel); T-9 already regenerated the journey map, so L-1 does not
    redo it.
  next_action: PROCEED_TO_L-block-exit
```
