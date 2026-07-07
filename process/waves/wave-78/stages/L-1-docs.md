# L-1 — Docs (wave-78)

**Owner:** head-learn (sub-agent). **Mode:** automatic. **Wave:** 78 (M13 leg-2 follow-up — member-profile-card UX polish). LIVE on merge 855e811. V-block APPROVED (karen + jenny + head-verifier, 0 blocking).

**Claimed tasks (both `done` per L-2):**
- `4be3b084-c86f-48f6-b3fc-fe9e95d60556` — Allow clearing academicRole back to unset
- `3b3530d8-f452-4e26-b50d-be2d3dabf384` — Distinguish hidden profile from transient network error on member card

---

## Action 1 — CHANGELOG entry

Appended **one bullet** to `CHANGELOG.md` **Unreleased › Changed** (line 115). The #96 portable-academic-identity feature is still in the Unreleased section (unreleased → Changed per L-1 Action 1 mapping "existing feature modified → Changed"; both wave-78 tasks refine that not-yet-released surface). Cited `(#97)`. Terse: one bullet, plain founder/user language, brand StudyHall — matches the terse historical entries, not the verbose ones.

Content: academic role can now be cleared back to unset; the member profile card now tells a genuinely-hidden profile apart from a temporary connection error (retry offered only for a real network/server error, never leaking why a profile is hidden).

## Action 2 — Milestone delta — **MECHANICAL, NO BOARD**

Milestone touched: **M13** (`b7400254-9c16-4b97-a898-2619b949fc5e`, "Institution partnerships & portable identity", `in_progress`).

Post-wave child-task counts (both claimed rows set `done` by L-2):
```
done_count = 10 | open_count = 0 | cancelled_count = 0
```

`open_count = 0` — but this is **NOT** a "milestone shipped" transition. The decision:

**M13's `## Approach` names three AUTONOMOUS engineering legs:**
1. Educator admin console + analytics — **shipped** (wave-76, 4 tasks).
2. Cross-server portable academic identity — **shipped** (wave-77, 4 tasks; polished wave-78, 2 tasks).
3. **Richer privacy/E2E posture — NOT built.** Listed in both `## Scope` and `## Approach`; zero child tasks ever decomposed for it.

Leg-3 is explicitly framed in the Approach prose as buildable-without-founder-credentials (mirroring how M9 shipped its substrate before real billing). It is therefore **autonomous engineering scope that is demonstrably NOT shipped** — the "unbuilt legs in `## Scope`" branch of L-1 Action 2, which is mechanical and requires NO escalation.

This is **not** the "structurally complete, only founder-reserved items remain" judgment call that would route to the BOARD under automatic mode. The only fenced (founder-reserved) items are the B2B2C go-to-market motion and the success metric (`_TBD_`) — but leg-3 is a *buildable* leg standing entirely separate from those. Buildable scope remains, so the milestone is not structurally complete.

**Decision: M13 stays `in_progress`. No milestone UPDATE. No BOARD convened. No `product-decisions.md` append** (that log records transitions to `done`; none occurred).

**N-1 hand-off intent:** open_count = 0 is a hard backlog stockout (below the < 3 fallback threshold). N-1 Action 7 fires **milestone-decomposition** on M13 for the next bundle = **leg-3 (richer privacy/E2E posture)**. The `todo`-milestone queue is EMPTY, so if M13 were ever to close, N-1 would instead fire the roadmap-planning ritual — but that is not this wave's path; decomposition of the remaining M13 leg comes first.

## Action 3 — README

**Skipped.** No CLI command / flag, no env var, no install step, no breaking change. Wave-78 is plan-gated UI polish on an existing profile-card surface — none of the four README triggers fired. Detailed change lives in CHANGELOG.

## Action 4 — Commit

FS docs committed + pushed to `main`. Message: `docs: L-1 wave-78 closeout (changelog, milestone delta)`.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:115 (Unreleased › Changed — #97 profile-card polish)"
  - "milestones row: NO UPDATE (M13 stays in_progress — leg-3 privacy/E2E unbuilt; mechanical, no BOARD)"
  - "README.md: skipped (no CLI/env/install/breaking-change trigger)"
changelog_entry_added: true
roadmap_milestones_progressed: []
roadmap_milestone_no_transition:
  - milestone: "M13 (b7400254-9c16-4b97-a898-2619b949fc5e)"
    status: in_progress
    reason: "open_count=0 but leg-3 (richer privacy/E2E posture) named in ## Scope + ## Approach is autonomous-buildable and never decomposed — scope demonstrably NOT shipped. Mechanical no-transition; NOT a structural-completeness BOARD judgment call."
    n1_intent: "backlog-stockout (open_count=0 < 3) → N-1 Action 7 fires milestone-decomposition on M13 for leg-3 bundle. todo-milestone queue EMPTY."
board_convened: false
readme_sections_touched: []
note: "Milestone-delta decided mechanically (unbuilt-leg branch). No BOARD, no founder deferral, no product-decisions append (no transition to done)."
```
