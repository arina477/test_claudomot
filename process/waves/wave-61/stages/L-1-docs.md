# L-1 — Docs (wave-61)

> Block L (Learn), stage L-1 (∥ L-2). Mode: automatic. head-learn owns.
> Wave-61: DM read-path throttle right-sizing + graceful 429 recovery. Seed 874bd233 (single-task bundle). Merged PR #76 → main e0e842e; api+web deployed SUCCESS; all gates APPROVED; T-8 LIVE prod probe PASS.

## Action 1 — CHANGELOG entry

**Section: Fixed** (genuine user-facing reliability fix — a legitimate-read 429 that showed up in normal use, plus a transient-429 recovery gap that previously required a manual refresh). Not Security: this is a rate-limit-sizing + client-resilience correctness fix, not an information-disclosure or auth patch. Not Added/Changed: the DM read routes and the client already existed; this fixes their observable failure behavior.

Entry appended at `CHANGELOG.md:115` under `### Fixed`, immediately after the wave-58 cross-client-delete bullet (#73):

> Opening your direct messages no longer trips a "too many requests" error during normal use, and if a request is briefly rate-limited it now recovers on its own instead of leaving a gap until you refresh. (#76)

House-style match: one line, declarative present tense, plain outcome-first language, StudyHall product voice, no stage codes / route names / throttle values, PR cited (#76). Length within cap (single bullet; no headline paragraph needed for a one-change wave). File-level detail (the `@Throttle(60/60s)` override on the 3 DM READ routes + client bounded exponential-backoff with Retry-After) stays in the PR/commit history, not the release note.

## Action 2 — Milestone delta

Distinct milestone touched via `tasks.milestone_id` on claimed task 874bd233: **M8 — Educator tools & deeper academics** (`84e17739-af5e-4396-beb9-b6f3d6836fc4`, `in_progress`).

L-2 already set 874bd233 → `done` (verified). Post-state count (live DB):

```
done_count=42  open_count=1  total=43
```

The 1 open task is **999a14d1** (`getDmCandidates cursor/pagination + load-more UX`, status `todo`) — the wave-56 **DO-NOT-AUTO-DRAIN** deferral (premature at zero users; deferral stands).

**Transition: M8 in_progress → in_progress (42/43 done; only do-not-drain 999a14d1 remains).**
- `open_count = 1 > 0` → milestone is NOT structurally complete → **do NOT transition to `done`.** 999a14d1 is a real open task, deliberately deferred, not cancelled — closing M8 would strand it.
- No DB write required (M8 stays `in_progress`; mechanical no-op). Under `automatic`, this is an unambiguous mechanical progression — no BOARD, no product-decisions append (no state change to record).
- `open_count = 1 < 3` (brain fallback threshold) → **backlog-stockout early-warning fires** — carried to N-1 (below).

### CRITICAL carry-forward for N-1 (head-next) — STOCKOUT / FOUNDER-CHECKPOINT

**M8's drainable tail is now EXHAUSTED.** 874bd233 was the last drainable M8 seed. The only remaining M8 task (999a14d1) is DO-NOT-AUTO-DRAIN. Consequently at wave-61 N-1:

- The next-claimable within M8 will go **NULL** while `unassigned_queue_depth > 0` (999a14d1 present but excluded) → the daily-checkpoint condition is likely to fire → route to the **FOUNDER**. This is the natural pause the engine has been driving toward across waves 59-60.
- Both high-value next directions are **FOUNDER-RESERVED and already FOREGROUNDED**:
  - **M12 — Offline-first moat** (`36378340`): highest-value autonomous next direction (the untouched differentiator half of live bet ad1a3685); blocked only on founder blessing + a rough `## Success metric` (currently `_TBD by founder_`) + an H3 horizon-jump.
  - **M9 — Monetization: freemium tiers** (`3e507bc0`): fully founder-reserved (pricing, rule 17); NOT board-decidable.
  - Both surfaced in plain language at `process/session/updates/checkpoint-2026-07-06-m8-tail-vs-m12-offline-first.md` ("engine is down to cleanup — which first, M9 or M12?") + `board-digest-2026-07-06.md`.
- **N-1 disposition (head-next decides the exact call):** first check the unassigned queue for ANY drainable item (a todo milestone seed, a decomposable active milestone). If none is genuinely drainable, this is a genuine founder-checkpoint — do NOT synthesize a filler wave, do NOT auto-drain 999a14d1. Flagged here so N-1 handles it correctly and does not preemptively pause or misroute.

This is a **forward flag for N-1**, not an L-block pause trigger. No measured pause condition (b/d/e/f) fires at L-1; L-block continues to N normally.

## Action 3 — README touchups

**SKIPPED.** No user-facing CLI command, flag, env var, install step, or breaking change. The wave is a backend throttle-config override + client fetch-retry behavior; nothing in the README's usage / env / quick-start / upgrade surface changed. Detailed change stays in CHANGELOG.

## Action 4 — Commit

FS docs committed + pushed to `main`: `docs: L-1 wave-61 closeout` (see footer for SHA). Milestone progression required no DB write (M8 stays in_progress), so no DB-side commit.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:115 (Fixed, #76)"
  - "milestone M8 84e17739: no write — stays in_progress (42/43; only do-not-drain 999a14d1 open)"
  - "README: skipped (no user-facing CLI/env/install/breaking change)"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M8 (84e17739)", before: "in_progress (41/2, wave-60 state pre-close)", after: "in_progress (42/1; drainable tail exhausted; only do-not-drain 999a14d1 remains)"}
roadmap_skip_reason: ""
readme_sections_touched: []
head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Every active block's changed surface is covered — the sole user-facing change (DM read-path
    429 elimination + auto-recovery) is captured as one terse, blameless, plain-language Fixed
    entry citing #76, matching house style. Milestone delta is mechanically correct: M8 stays
    in_progress because a real (deliberately deferred) open task remains; no premature close.
    The stockout / founder-checkpoint carry-forward is recorded PROMINENTLY for N-1. README skip
    is justified and recorded. No blame language; no silent block skip.
  next_action: PROCEED_TO_L-2
note: >
  STOCKOUT/FOUNDER-CHECKPOINT is the load-bearing carry-forward: M8 drainable tail exhausted;
  M9+M12 founder-reserved and already foregrounded; N-1 likely routes to founder via
  daily-checkpoint. Forward flag only — no L-block pause trigger fires.
```
