# L-1 — Docs (wave-57: DM→server nav papercut fix)

**Mode:** automatic. **head-learn gate:** L-block owner. **Wave:** 57.

## Action 1 — CHANGELOG entry

Appended to `### Fixed` under `## [Unreleased]` (keep-a-changelog). **Fixed**, not Added: this patches a pre-existing bug (wave-51 journey-map F-1) — a double-click papercut — that never shipped broken in a tagged release but was live in the app.

`CHANGELOG.md:112`:
> Returning to a study server from your direct-messages view now takes a single click: picking a server, or tapping Home, exits the DM view right away instead of needing a second click. (#72)

One line, user-facing, PR-cited. Under the length cap.

## Action 2 — Milestone delta

Touched milestone: **M8 — Educator tools & deeper academics** (`84e17739-af5e-4396-beb9-b6f3d6836fc4`), via `ff09c4c9`'s `milestone_id` FK.

Post-close counts (L-2 already set `ff09c4c9` done):

```sql
SELECT count(*) FILTER (WHERE status='done') done_count,
       count(*) FILTER (WHERE status IN ('todo','in_progress','blocked')) open_count
FROM tasks WHERE milestone_id='84e17739-af5e-4396-beb9-b6f3d6836fc4';
-- → done_count=38, open_count=5
```

`open_count = 5 > 0` → **M8 stays `in_progress`.** No milestone UPDATE, no `product-decisions.md` transition entry. Mechanical, unambiguous → no BOARD escalation. Milestone delta: `[{milestone: "M8", before: in_progress, after: in_progress}]`.

### CRITICAL for N-1 — the ACUTE M9 inflection (strong signal)

With `ff09c4c9` (the last genuine UX bug in the M8 tail) now done, **all genuinely-valuable M8 tail work is complete.** The remaining 5 open tasks are all low-value:

| Task | Nature | Value |
|---|---|---|
| `f8eb49c1` | typing-label UNIT TEST | pure test debt |
| `a1dda389` | delete-any-message E2E hardening | modest test-quality (moderation-test hardening) |
| `5bcbd27f` | DM token polish | cosmetic |
| `874bd233` | DM throttle / 429 | premature at ~zero users |
| `999a14d1` | deferred pagination-UX | DO NOT auto-drain (fenced out at wave-56 P-0 as premature) |

**None is high-value.** The **M9 — Monetization** decision (founder-reserved per rule 17; flagged soft since wave-55, strengthened wave-56) is now the **clearly-highest-value next move.** N-1 should re-surface it **forcefully** — not as a soft note this time; the inflection is acute now that no valuable M8 work remains.

If N-1 nonetheless seeds from the M8 tail rather than pausing for the M9 call, pick the **least-low-value** item: `a1dda389` (delete-any-message moderation-test E2E hardening) — the only one with any real quality signal. Do NOT auto-drain `999a14d1`. Do NOT close M8 (open>0; mechanical closure blocked).

## Action 3 — README touchups

**Skipped.** Nothing user-facing changed in a way README covers (no new CLI command/flag, no env var, no install step, no breaking change). The shipped behavior copy is captured in the CHANGELOG. Skip recorded.

## Action 4 — Commit

FS-side touchups (CHANGELOG + L-block deliverables + observations) committed as `docs: L-1 wave-57 closeout` and pushed to `main`.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:112 (### Fixed, #72)"
  - "milestones row UPDATE: none (M8 open_count=5 > 0, stays in_progress)"
  - "README.md: skipped (nothing README-covered changed)"
changelog_entry_added: true
roadmap_milestones_progressed: [{milestone: "M8", before: "in_progress", after: "in_progress"}]
roadmap_skip_reason: ""
readme_sections_touched: []
note: >
  ACUTE M9 inflection for N-1: last genuine M8 UX bug (ff09c4c9) is done; all 5 remaining
  M8 open tasks are low-value (test debt / cosmetic / premature-at-zero-users). M9-Monetization
  (founder-reserved, rule 17) is now the clearly-highest-value next move — N-1 must re-surface
  it forcefully. If N-1 seeds from tail anyway, pick a1dda389 (moderation-test hardening); never
  auto-drain 999a14d1. Do NOT close M8 (open=5).
head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Every L-1 exit checkbox ticked. CHANGELOG entry appended under Fixed (pre-existing bug
    patch, PR-cited, terse, user-facing). Milestone delta evaluated mechanically: M8
    done=38/open=5, stays in_progress, no transition, no escalation. README skip recorded
    with reason. Doc delta covers the one shipped surface (the DM->server nav flow), already
    reflected in T-9 journey-map F-1 FIXED. Acute M9 inflection recorded strongly for N-1.
  next_action: PROCEED_TO_N-1
```
