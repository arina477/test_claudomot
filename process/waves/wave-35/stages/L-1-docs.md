# L-1 — Docs (wave-35)

**Block:** L (Learn), stage L-1 (∥ L-2). Wave-35 = M7 privacy controls, shipped LIVE, V-block APPROVED (Karen + jenny).
**Head:** head-learn (owns L-block; gate verdict in footer).
**Mode:** automatic.

## Action 1 — CHANGELOG entry

Appended 4 bullets to `CHANGELOG.md` `## [Unreleased]` → `### Added` (**lines 62-65**), all citing `(#49)`. Terse house-style match (one line per change, outcome-first, user-facing). Authored by technical-writer, gate-reviewed by head-learn.

- Privacy controls: choose who sees your profile / who can message you; a student set to **Hidden** is removed from server member lists for everyone including organizers (enforced server-side, not visually hidden).
- Export your account data as JSON (view + download).
- Production error tracking (PII-scrubbed: no student emails, message contents, or tokens).
- New `/privacy` + `/terms` pages plus empty / loading / error states across surfaces.

Within the ≤5-bullet cap. No Changed/Fixed/Removed/Security entries this wave (V-2 returned 0 blocking findings; no shipped-vuln patch).

## Action 2 — Milestone delta

Touched milestone: **M7 (6e2f68d8) — Privacy controls, notifications & launch polish** [`in_progress`].

Post-L-2-done-marking counts (`tasks WHERE milestone_id=6e2f68d8`):

| done | open | cancelled |
|------|------|-----------|
| 4 | 5 | 0 |

`open_count = 5 > 0` → **M7 does NOT transition to done.** Mechanical, unambiguous (open work remains) — no BOARD escalation under automatic mode. M7 **progresses**: settings-privacy (56a50862) + account data view/download (a4169fac) + Sentry api+web (d40ece71) + privacy/terms stubs & states (13b7ebfd) slices shipped LIVE.

Remaining M7 open work (5):
- `622a7bf3` — automated tests for M7 privacy endpoints (V-2 follow-up)
- `73e96a9d` — re-scope empty/error/loading-states requirement (V-2 follow-up)
- `b7feab30` — fix stub-page Last-updated date on /privacy + /terms (V-2 follow-up)
- `a1299e88` — verify Resend domain (parked, credential-blocked)
- `84e09891` — set Railway Bucket creds + verify avatar upload (parked, credential-blocked)

`open_count = 5` exceeds the brain fallback backlog threshold (<3 remaining) → no `backlog-stockout` flag. 3 of the 5 are seedable V-2 follow-ups; 2 are parked credential-blocked (do NOT auto-seed). N-1 picks up seed selection.

No `command-center/product/product-decisions.md` append — that log records milestone *transitions*, and M7 did not transition.

## Action 3 — README touchups

**Skipped.** No user-facing quick-start / env / install change. `SENTRY_DSN` / `VITE_SENTRY_DSN` are deploy-env only (Railway service env, not committed, not in README quick-start). Privacy controls surface in-app, no README-level affordance. Detail lives in CHANGELOG.

## Action 4 — Commit

FS docs (CHANGELOG.md + Sentry SDK-doc findings) committed as `docs: L-1 wave-35 closeout (changelog, sentry SDK findings)` and pushed to `main`. Sentry SDK-doc "Integration-Specific Findings" filled per the external-sdk-integration-rules L-1 trigger (`command-center/dev/SDK-Docs/Sentry/sentry.md`).

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:62-65 (4 bullets, ### Added, cite #49)"
  - "command-center/dev/SDK-Docs/Sentry/sentry.md § Integration-Specific Findings (filled)"
  - "milestones row UPDATE: none (M7 open_count=5 > 0, no transition)"
changelog_entry_added: true
roadmap_milestones_progressed: [{milestone: "M7 (6e2f68d8)", before: "in_progress (0 wave-35 done)", after: "in_progress (4 wave-35 slices done, 5 open)"}]
roadmap_skip_reason: ""
readme_sections_touched: []
note: "M7 progresses not closes; 3 seedable V-2 follow-ups + 2 parked cred-blocked remain. No product-decisions append (no transition)."

head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: { technical-writer: "CHANGELOG + Sentry SDK findings authored" }
  failed_checks: []
  rationale: >
    Every changed surface is documented: the 4 shipped privacy/observability slices land as
    4 terse user-facing CHANGELOG bullets within the cap, each citing #49, and the enforced
    (server-side) nature of profile-visibility Hidden is captured accurately. Sentry SDK doc
    deltas cover the v10 integration learnings. Milestone delta is mechanically correct — M7
    stays in_progress on open_count=5, no false close, no unwarranted escalation. Blameless,
    artifact-cited throughout.
  next_action: PROCEED_TO_L-block-exit
```
