# L-1 — Docs (wave-26)

**Wave:** presence dots on message-row author avatars. Shared `PresenceDot` component (single styling source, emerald token — removed member-panel hard-coded-hex duplication); each message author's avatar shows a live presence dot from the existing `/presence` store; unknown authors show no dot; member panel refactored onto the shared component. A live-E2E-caught prod bug (self excluded from the presence store → author dots never rendered) fixed via a self-presence seed. Merges: #38 (feature) + #39 (self-presence fix). Live on prod (web 4a703d92, api 539c476d). All gates APPROVE.

## Action 1 — CHANGELOG entry

Appended to `## [Unreleased]`:

- **Added** (CHANGELOG.md:57, `#38`): "Live presence dots on message author avatars: every message now shows a small green dot on the author's avatar when that person is online, so you can see at a glance who's around in a channel."
- **Fixed** (CHANGELOG.md:63, `#39`): "Presence dots now show for your own messages too, so you no longer appear offline on the very messages you just sent."

Section routing: new feature → **Added**. The self-presence-seed bug was caught by live E2E **within this same wave** (not a prior shipped vuln patched after the fact) and is a behavior bug-fix → **Fixed**, not **Security**. Terse, present-tense, user-facing; PR-cited. No headline paragraph (fits under existing keep-a-changelog section, consistent with wave-25 entry).

## Action 2 — Milestone delta (RECORD-only, no transition)

Milestone touched via claimed task `10b9d18e-5071-41dc-85de-ef257b9dfde0` (status `done`, verified live): **M5 — Academic tooling: assignments** (`a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d`).

Live DB census (`SELECT count(*) FILTER …`): **8 done / 9 open / 0 cancelled / 17 total** → `open_count = 9 ≠ 0` → **NO** `milestones` UPDATE. M5 stays `in_progress`.

Mechanical non-close, no judgment ambiguity → no BOARD escalation under `automatic` (Action 2 mode-routing applies only to genuine "really done?" judgment calls; this is a structural non-close). No `product-decisions.md` append (append only on transition).

M5 is multi-wave: the reminders arc is the sole M5-close blocker, cred-blocked on the founder's Resend API key (already escalated). Remaining 9 open under M5: deferred DM/member-mention/hover presence sibling (`fdb444fc`), presence perf (`6a546c7b`), mention-split + integration/assignments debt, re-homed debt, and cross-cutting items.

**Backlog-stockout:** 9 open ≥ 3 threshold → **no** stockout flag for N-1.

## Action 3 — README (SKIP)

No user-facing README-level change this wave: no new CLI/flag, no new env var, no new install step, no breaking change. Presence-dot rendering is in-app behavior → belongs in CHANGELOG only. Consistent with the w13–25 cut. Skip recorded.

## Action 4 — Commit

`docs: L-1 wave-26 closeout (changelog)` → pushed direct to `main` (project allows direct doc commits).

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:57 (### Added, #38)"
  - "CHANGELOG.md:63 (### Fixed, #39)"
  - "milestones census M5 a5232e16: 8 done / 9 open — NO UPDATE (open_count!=0)"
  - "commit: <sha-filled-post-commit>"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M5 (a5232e16 — Academic tooling: assignments)", before: "7 done / in_progress", after: "8 done / in_progress"}
roadmap_skip_reason: ""
readme_sections_touched: []
note: "M5 stays in_progress — presence dots (10b9d18e) landed 8th done task of 17; open_count=9 (reminders arc Resend-key-blocked is sole M5-close blocker, already escalated; deferred DM/hover sibling fdb444fc + perf 6a546c7b + mention-split/assignments debt + cross-cutting remain). 9 open >= 3 -> no backlog-stockout. README skipped (in-app behavior only). PRINCIPLES untouched (L-2 lane)."

head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Every L-1 exit checkbox ticked from live artifacts, not inference. CHANGELOG carries one Added (#38) + one Fixed (#39) bullet — terse, present-tense, user-facing, PR-cited, under the length cap. Doc-delta coverage is complete: the only shipped surface change is in-app presence rendering, correctly routed to CHANGELOG; no route/endpoint/env-var changed, so README skip is correct and recorded. Milestone delta verified against the live DB (M5 census 8 done / 9 open) — mechanical non-close, no transition, no false milestone-close; multi-wave M5 close remains blocked on the founder's Resend key. Backlog-stockout correctly not flagged (9 >= 3). Observations describe what shipped, no blame.
    next_action: PROCEED_TO_L-2
```
