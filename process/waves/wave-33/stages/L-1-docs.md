# L-1 — Docs (wave-33)

**Wave:** 33 — malformed non-UUID route param → 400 (was 500), project-wide.
**Shipped:** LIVE. PR #46, merge e1a64f6, api deploy d69feba2. Task a2dd9f3d (done at L-2).
**Scope:** backend-only. No UI, no new env var, no new dependency, no schema change.
**Fixes:** wave-32 finding F-32-T-8-1, generalized project-wide via a bounded global `22P02` → `BadRequestException` filter across all UUID route params on 7 controllers.

## Action 1 — CHANGELOG entry

Classification: **Fixed** (shipped-behavior correction — a robustness fix; malformed link/id now returns 400 instead of a 500 server error). Appended under `## [Unreleased]` → `### Fixed`.

CHANGELOG.md lines 73–74 (2 bullets, cite #46):

> - A bad or mistyped link that used to trigger a server error now returns a clean "that's not a valid link" response instead — so a malformed id in the address bar or a stale bookmark no longer looks like the app is broken. (#46)
> - This applies everywhere ids appear in a link across the app, and the friendlier response is now consistent instead of surfacing an internal error. (#46)

Product language, terse (2 bullets, under the ≤5 cap). No internal vocabulary (no "UUID", "22P02", "controller", "exception filter") in the user-facing entry.

## Action 2 — Milestone delta (M6 · id 8702a335)

Resolved via `tasks.milestone_id` on claimed task a2dd9f3d → milestone M6 (Voice study rooms).

Child-task count after L-2 done-marking: **4 done / 0 open** (`open_count = 0`).

**Decision: M6 does NOT transition to `done`. Stays `in_progress`.**

Rationale — the mechanical `open_count = 0 → done` rule is deliberately NOT applied here because milestone *scope* is not shipped:
- M6 scope = voice (talk + screen-share + audio-fallback + occupancy).
- Talk (foundation + access-pass) and occupancy shipped in prior waves; the malformed-id hardening (this wave) is the last decomposed child.
- **Screen-share** and **audio-fallback** remain **UNDECOMPOSED** and **CREDENTIAL-BLOCKED** — LiveKit voice-service keys (`LIVEKIT_*`) are not yet set in Railway. No credential-independent child task can be authored against them.
- Structural completeness (0 open children) ≠ scope completeness. Closing M6 on `open_count = 0` alone would be a premature milestone close.

This is a resolved judgment call (brief-directed); no mode escalation was required — the disposition is "milestone partial / do-not-close," not an ambiguous done/not-done call.

**State written to DB:** none. M6 row remains `status='in_progress'` (no `UPDATE`). No transition appended to `product-decisions.md` (nothing transitioned).

### N-1 setup note (backlog-stockout + credential-blocked)

Flag for N-block:
- **M6 has 0 open child tasks** while `status='in_progress'` → backlog-stockout for the active milestone (below the < 3-open-tasks threshold; literally zero).
- Remaining M6 scope (screen-share, audio-fallback) is **credential-blocked** (LiveKit keys absent), so N-1 **cannot** decompose a credential-independent next bundle for M6.
- This forces the **N-block park-or-key fork** — **ceo-reviewer MANDATORY flag**: N-1 must fork rather than auto-decompose:
  - **PARK** M6 (mark blocked/parked, pivot to another milestone's queue), OR
  - **HOLD** for keys (wait on LiveKit credential provisioning before proceeding on M6).
- head-learn does NOT resolve this fork — it is set up here and handed to N-1 for the fork decision.

## Action 3 — README touchups

**SKIPPED.** No user-facing README surface changed — this is an internal error-handling/robustness fix. No new CLI command, flag, env var, install step, or breaking change. Skip recorded.

## Action 4 — Commit

FS doc touchups committed and pushed to `main`:
- `docs: L-1 wave-33 closeout (changelog)`

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:73-74"
  - "milestones row UPDATE: none (M6 8702a335 stays in_progress — scope incomplete + cred-blocked)"
  - "README.md commit: none (skipped — internal error-handling fix, no user-facing README surface)"
changelog_entry_added: true
changelog_section: Fixed
roadmap_milestones_progressed:
  - { milestone: "M6 (8702a335)", before: in_progress, after: in_progress }
roadmap_skip_reason: ""
readme_sections_touched: []
n1_setup:
  milestone: "M6 (8702a335)"
  open_child_tasks: 0
  condition: "backlog-stockout + credential-blocked (LiveKit keys absent)"
  fork_required: "park-or-key (ceo-reviewer MANDATORY flag) — N-1 cannot decompose a credential-independent next bundle"
note: >-
  M6 open_count=0 but NOT transitioned to done: screen-share + audio-fallback undecomposed and
  credential-blocked, so milestone scope is not shipped. Sets up the N-block park-or-key fork.
  README skipped (backend-only, no user-facing README change).
```
