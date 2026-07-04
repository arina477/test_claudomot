# L-1 — Docs (wave-45 closeout)

**Wave:** 45 — M8 tech-debt hygiene (Playwright bundled-chromium runner fix + biome lint cleanup)
**Merge:** ae22380 (PR #59), web deployed + verified; V-block APPROVED (Karen + jenny both APPROVE)
**Mode:** automatic
**Head:** head-learn

---

## Action 1 — CHANGELOG entry

Developer-facing hygiene wave (test-infra + lint). **Nothing user-facing changed** — the biome cleanup is byte-identical output; the Playwright runner fix is CI/test tooling only. Recorded as a single terse `### Changed` "(no visible change)" line, consistent with the existing precedent (CHANGELOG lines 87–88, #40/#50). File-level detail (channel:undefined + PLAYWRIGHT_BROWSERS_PATH, the 6 non-null-assertion → cast conversions) lives in the commit/PR per Action 4 convention — not duplicated in the release note.

- **CHANGELOG.md:88** — `### Changed`, +1 bullet (#59):
  > The browser end-to-end tests now run on the project's bundled browser regardless of how they're launched, removing a per-run manual workaround; typing-label internals were tidied to clear lint warnings with byte-identical output (no visible change). (#59)

Not a `### Fixed` line: keep-a-changelog `Fixed` is for user-observable bug fixes; the E2E-runner blocker was developer/CI-facing (never shipped to users), so it belongs under Changed as an internal note. The runner blocker recurred across ~w16/22/23/25/26/38/42/43 — that recurrence is captured for L-2 to weigh as a candidate lesson, NOT surfaced in the user CHANGELOG.

## Action 2 — Milestone delta

Touched milestone: **M8 — Educator tools & deeper academics** (84e17739-af5e-4396-beb9-b6f3d6836fc4), `in_progress`.

Child-task counts at L-1 (before L-2 marks the 2 wave-45 tasks done):
- done_count = 14, open_count = 4, total = 18.
- The 4 open: the 2 wave-45 claimed tasks (67881a58 Playwright-MCP, 4e994e96 biome-lint — L-2 flips these to `done`) + the 2 NEW V-2 follow-ups (f8eb49c1 buildTypingLabel unit-test gap, a1dda389 delete-any fan-out E2E hardening).
- After L-2 done-marks: open_count = **2** (the two V-2 follow-ups, both `todo`).

**M8 stays `in_progress`** — `open_count > 0` (2 remaining). Additionally, M8's discretionary product scope (study-groups / DMs / search) is still unbuilt and its `## Success metric` reads `_TBD by founder_` — the milestone is not shippable regardless of structural task count. This is the mechanical no-op branch: **no `milestones` UPDATE, no `product-decisions.md` append, no BOARD/automatic-mode escalation** (no ambiguity — an unanswered founder metric bars any "milestone done" call outright).

roadmap_milestones_progressed: none (M8 held).

## Action 3 — README touchups

**SKIP.** No new CLI command/flag, no new env var, no new install step, no breaking change. Test-runner config (`playwright.config.ts` channel/browsers-path) + biome-only edits are internal — nothing README-surfaced changed.

## Action 4 — Commit

FS-side touchup only (CHANGELOG). One batched commit → `main` (project convention: process/doc artifacts commit directly to main).
- Commit: `docs: L-1 wave-45 closeout (changelog)`
- SHA: `90f42c583a64134bc81628a6208fc62a73b6339e` (pushed to main)

---

## N-block flags (for N-1 / head-next)

1. **M8 seed-candidate status: M8 HAS open seed candidates for wave-46.** The 2 new V-2 follow-ups f8eb49c1 (buildTypingLabel unit-test) + a1dda389 (delete-any fan-out E2E soft-check) are `wave_id=NULL` + `parent_task_id=NULL` + `milestone_id=84e17739` → top-level, seedable. This is **NOT** a backlog stockout; N-1 seeds from these + the 13 unassigned cushion. No no-seed founder-metric pause on stockout grounds.

2. **DEBT-WAVE GUARDRAIL — wave-46 must NOT be a 3rd consecutive debt-only wave.** Wave-44 (biome/Playwright cushion) and wave-45 (this one) were both hygiene/tech-debt. The P-0/P-1 BOARD guardrail: **if the founder's M8 success metric is still `_TBD by founder_` at wave-46 P-0, re-escalate the metric to the founder rather than auto-merging a third hygiene wave.** The seedable M8 follow-ups above are debt-shaped; letting them auto-merge into wave-46 would produce the 3rd-consecutive-debt outcome the guardrail forbids. Surface the M8 metric checkpoint to the founder at wave-46 P-0.

3. M8 discretionary founder-metric checkpoint stays **open** (non-blocking; first surfaced wave-43, overdue). Its resolution is the precondition for any M8 product-scope wave (study-groups / DMs / search).

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:88 (+1 bullet, #59, Changed / no-visible-change)"
  - "milestones row: M8 84e17739 held in_progress — no UPDATE (open_count>0 + metric _TBD_)"
  - "README.md: not touched (skip — no env/command/install/breaking change)"
changelog_entry_added: true
roadmap_milestones_progressed: []
roadmap_skip_reason: "M8 held in_progress: open_count=2 after L-2 done-marking + success metric _TBD by founder_; mechanical no-op, no BOARD"
readme_sections_touched: []
note: "Developer-facing hygiene wave, nothing user-facing. N-block flags: M8 HAS seedable follow-ups (f8eb49c1, a1dda389); wave-46 debt-wave guardrail — re-escalate M8 metric to founder rather than auto-merge a 3rd consecutive hygiene wave."
```
