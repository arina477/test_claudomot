# L-1 — Docs (wave-44)

**Block:** L (Learn) · **Stage:** L-1 (∥ L-2) · **Mode:** automatic · **Head:** head-learn

Wave-44 = M8 polish/hardening debt-clearing wave. Shipped LIVE (PR #58, squash 4522101), V-block APPROVED (Karen + jenny). No schema. Claimed bundle (all `done` by L-2): 8e54799a (class-scheduling 1024-responsive + a11y), 683fec9b (assignment-submissions polish + stale comment), 8d971bc2 (assignment unit coverage; attachment-integration deferred), 8828484f (muted-indicator padding), ca43eb12 (delete-any 2-client E2E), 0308cdf1 (scheduled-session DTO createdAt/updatedAt + scheduling unit tests).

---

## Action 1 — CHANGELOG entry

Appended **2 bullets under `### Fixed`** (`CHANGELOG.md:100-101`), tagged `(#58)`. This is a **Fixed** wave — the wave-43 MAJOR responsive defect **T6-F1** (class-scheduling detail was squeezed instead of an overlay on ≤1024) shipped and is now RESOLVED; the a11y refinements (Esc focus-restore, modal-stacking gate, detail-refresh) correct broken/missing behavior on a shipped surface, so they fold into Fixed alongside the responsive line rather than getting their own war-story bullets.

**Deliberately NOT changelog'd** (not user-facing surfaces):
- scheduled-session DTO `createdAt`/`updatedAt` (0308cdf1) — internal API-shape addition, no user-perceivable change.
- muted-indicator padding (8828484f), assignment-submissions stale-comment cleanup + polish (683fec9b), delete-any E2E (ca43eb12), 31 new unit tests (8d971bc2 + 0308cdf1) — test/internal hardening.

Length: 2 bullets, terse present-tense, matches the terse house style (not the verbose historical entries).

## Action 2 — Milestone delta

**Touched milestone:** M8 — Educator tools & deeper academics (`84e17739-af5e-4396-beb9-b6f3d6836fc4`), currently `in_progress`.

Child-task counts (after L-2 marked all 6 wave-44 tasks `done`):

```
done_count | open_count | cancelled_count | total
    14     |     0      |       0         |  14
```

**Decision: M8 stays `in_progress`. NO milestone UPDATE. NO BOARD escalation.**

Rationale — `open_count=0` would mechanically trigger a `status='done'` close under Action 2 step 2, **but the milestone's named scope is demonstrably NOT shipped.** M8 `## Scope` prose (verified in DB) enumerates: study-group tools (shared timers/Pomodoro, study sessions, whiteboard), direct messages + group DMs, and message search — none built. `## Success metric` remains `_TBD by founder_`. M8 is *structurally* complete (queue drained) but *scope*-incomplete. Closing it would be the error; keeping an in_progress milestone in_progress when its own Scope names unbuilt features is the **unambiguous, mechanical** branch — "Mechanical milestone progress with no ambiguity runs under any mode without escalation." No judgment call, therefore no `automatic`-mode BOARD, no `product-decisions.md` append (there is no transition to record).

The M8 discretionary phase (study-groups/DMs/search) is **un-decomposed and metric-barred**: milestone-decomposition cannot author the next M8 bundle until the founder supplies the success metric. An escalated founder-checkpoint was surfaced at wave-43 N-1 (`process/session/updates/checkpoint-2026-07-04-m8-discretionary.md`) and remains open (non-blocking).

## Action 3 — README touchups

**SKIPPED.** No new CLI command/flag, no new env var, no new install step, no breaking change. All wave-44 changes are UI-behavior fixes on already-documented surfaces. Detail lives in CHANGELOG + PR #58.

## Action 4 — Commit

`docs: L-1 wave-44 closeout (changelog)` — FS-side CHANGELOG touchup only. Pushed to `main` (project allows direct doc commits). No DB commit inside Action 2 (no milestone transition occurred).

---

## N-block flags (head-next / N-1)

**1. M8 has EXHAUSTED its metric-independent work.** 0 open child tasks, 0 seed candidates *within M8*. The discretionary M8 decompose (study-groups/DMs/search) is **metric-barred** — milestone-decomposition-ritual cannot fire for M8 until the founder answers the pending success-metric checkpoint (`checkpoint-2026-07-04-m8-discretionary.md`). This is the genuine end of debt-clearing M8 work.

**2. The loop does NOT face a no-seed stockout — do NOT pause on stockout grounds.** The unassigned queue holds **13 open tasks**, and at least **two are clean, unstranded, immediately-claimable seeds** (`wave_id IS NULL`, `parent_task_id IS NULL`, `milestone_id IS NULL`):
- `4e994e96` — Clean up pre-existing biome lint warnings (useTyping …)
- `67881a58` — Reconfigure Playwright MCP to bundled chromium for live …

N-1 has a next-claimable seed. The correct N-1 disposition is: seed from the unassigned cushion (NOT a founder-metric pause). The wave-43 seed-stranding note (tasks with non-null `wave_id`) does **not** apply to these two.

**3. Roadmap has 5 `todo` milestones queued** (M9 monetization, M10 compliance, M11 growth/discovery, M12 offline-first moat, M13 institution partnerships) — no roadmap-stockout; roadmap-planning-ritual not needed. If the founder never supplies the M8 metric, N-1's strategic option is to advance to a `todo` milestone (roadmap-planning / P-0 reframe), not pause — but that is head-next's call, not L-1's.

**4. Founder-checkpoint remains open (non-blocking):** M8 discretionary success-metric. Surfaced wave-43; not re-escalated here (no new trigger).

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:100-101 (2 bullets under Fixed, #58)"
  - "milestones row UPDATE: none — M8 (84e17739) stays in_progress, scope unshipped (mechanical no-op, no BOARD)"
  - "README.md: not touched (skip — no env/command/install/breaking change)"
changelog_entry_added: true
roadmap_milestones_progressed: []
roadmap_skip_reason: "M8 open_count=0 but Scope (study-groups/DMs/search) unshipped + success-metric _TBD_ — milestone NOT done; no transition to record. Mechanical no-op under automatic (no ambiguity → no BOARD)."
readme_sections_touched: []
note: >
  N-block: M8 metric-independent work EXHAUSTED (0 open M8 children, discretionary decompose metric-barred).
  NOT a no-seed stockout — 13 unassigned open, 2 clean claimable seeds (4e994e96, 67881a58). N-1 seeds from cushion;
  no founder-metric pause required on stockout grounds. 5 todo milestones queued (M9-M13). M8 discretionary
  founder-metric checkpoint remains open (non-blocking, surfaced wave-43).
```
