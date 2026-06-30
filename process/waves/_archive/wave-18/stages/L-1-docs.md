# L-1 — Docs (wave-18 closeout)

> Block: L (Learn), stage L-1 (∥ L-2 concurrent). head-learn owns the block.
> Wave-18 shipped + merged + LIVE: M3 thread replies. PR#30 (16c72b6); migration 0008; api ce25ddc2 + web 594b0bdc deployed. 3 tasks DONE (497c2ae6, 6c008dd6, 0b728319).

## Action 1 — CHANGELOG entry

Wave-18 is USER-FACING (thread replies — a real new feature; waves 16/17 were test-infra SKIPs). First feature-facing entry in a few waves — entry ADDED.

- Section: **Added** (new feature from spec contract; no shipped-vuln patch → not Security).
- The pre-merge /review IDOR fix + realtime-delete gap were caught + fixed BEFORE merge (never shipped to users) → not a CHANGELOG **Fixed**/**Security** line.
- Format: keep-a-changelog, terse house style (declarative, user-facing, PR-cited), 2 bullets.
- Location: `CHANGELOG.md:41-42` under `[Unreleased] → Added`.

Entry text:
```
- Thread replies: reply in a thread off any message, with a reply-count affordance on the original and a thread panel that shows the parent message and its replies. (#30)
- Replies appear and disappear live for everyone viewing the thread, and a reply you send while offline is queued and sent once you're back online. (#30)
```

## Action 2 — Milestone delta

M3 (6198650e) — Real-time chat & collaboration.

- Census: **18 done / 6 open** (prior wave-15 closeout recorded 13 done / 8 open; wave-18 closed 3 tasks → 18 done, 6 open).
- The 6 open = parked tech-debt: invite-rotation, real-PG tier (02fa8011), presence perf/debt, mention parity (+ siblings). No blocking work; all explicitly deferred / debt.
- ATTACHMENTS — the last M3 success-metric feature — is NOT yet a task (undecomposed `## Scope` prose; N-1 decomposes it next).
- Decision: `open_count = 6 > 0` AND attachments unshipped → **M3 stays `in_progress`. No `UPDATE milestones`.** Mechanical non-close, no ambiguity → no mode-aware judgment escalation required.
- L-2 owns tasks-table status this wave (concurrent); L-1 recorded delta only, did not touch task rows.

## Action 3 — README touchups

SKIPPED. README is a developer/repo README (sections: Live / What this repo is / Quick start / How to start a wave / Modes / Conventions) with no feature-list. Threads adds no new setup step, env var, CLI command, or breaking change. Consistent with every prior wave's L-1 README disposition.

## Action 4 — Commit

FS touchups (CHANGELOG only) committed + pushed to main: `docs: L-1 wave-18 closeout (threads changelog)`. SHA recorded in footer.

## Note for N-1

ATTACHMENTS is the **last M3 success-metric feature** and is still undecomposed (`## Scope` prose, no task). N-1 should decompose it next. The 6 open M3 children are parked tech-debt (invite-rotation, real-PG tier 02fa8011, presence perf/debt, mention parity) — candidates for triage but not blocking. M3 does not close until attachments ships and open tech-debt is resolved/cancelled.

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:41-42"
  - "milestones row UPDATE: none (M3 6198650e stays in_progress; open_count=6 + attachments unshipped)"
  - "README.md: not touched (no feature-list; no setup/env/CLI change)"
changelog_entry_added: true
roadmap_milestones_progressed: [{milestone: "M3 (6198650e)", before: "in_progress", after: "in_progress"}]
roadmap_skip_reason: "M3 not closed — open_count=6 (parked tech-debt) + attachments (last success-metric feature) undecomposed; mechanical non-close, no UPDATE"
readme_sections_touched: []
note: "N-1: attachments is the last M3 feature → decompose next. 6 open M3 children are parked tech-debt (invite-rotation, real-PG tier 02fa8011, presence perf/debt, mention parity)."

head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    CHANGELOG entry is user-facing, terse, PR-cited (#30), in the correct Added section (no shipped-vuln → not Security; pre-merge IDOR/realtime-delete fixes never shipped → not Fixed). Milestone delta is mechanical and correctly non-closing: M3 has 6 open tech-debt children and the last success-metric feature (attachments) is undecomposed, so M3 stays in_progress with no DB UPDATE. README skip is correct — no feature-list, no setup/env/CLI surface changed. Tasks-table status untouched (L-2 owns it concurrently). All L-1 exit criteria met.
  next_action: PROCEED_TO_L-block-exit
```
