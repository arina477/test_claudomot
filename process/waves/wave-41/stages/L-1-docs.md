# L-1 — Docs (wave-41 closeout)

**Wave:** 41 — Educator/Facilitator role + light moderation (member timeout + delete-any-message, rank-guarded)
**Block:** L (Learn), stage L-1 (∥ L-2). Mode: `automatic`. Owner: head-learn.
**Shipped:** LIVE (api moderation routes + mute-gate; web `index-L7b3GM-K.js`, delete-any affordance gated on `moderate_members`). PR #55 squash `5a5f79a`; V-3 fast-fix `ac243af`. V-block: Karen APPROVE + jenny APPROVE.

## Action 1 — CHANGELOG entry

Appended 2 bullets under `[Unreleased] › Added`, `CHANGELOG.md:74-75`, citing `(#55)`.

- Educator role — owner grants a moderation permission (timeout + delete-any) to a TA / study-group lead without ceding ownership.
- Rank-guard + server-side enforcement + affordance-visibility gate (educator acts only on lower-ranked members; controls render only for permission-holders).

Classification: **Added** (net-new feature from the spec contract). The delete-any-affordance visibility gate was a stale-deploy false-green caught by jenny and fixed in-wave at V-3 (`ac243af`) — it never shipped broken to users, so it is folded into the Added feature description, NOT a separate `Fixed` line (per L-1 Action 1: only a `bug-*` finding that shipped-then-patched earns a Fixed/Security line). Length: 2 bullets, terse house style (matches #51/#53 entries, not the verbose historical ones).

## Action 2 — Milestone delta

Touched milestone: **M8 — Educator tools & deeper academics** (`84e17739-af5e-4396-beb9-b6f3d6836fc4`, `in_progress`, H2). This is M8's FIRST slice.

Child-task terminal counts (`WHERE milestone_id = M8`):

| done | open (todo/in_progress/blocked) | cancelled | total |
|---|---|---|---|
| 2 | 2 | 0 | 4 |

- `done`: `6cf06f99` (educator role/RBAC), `6ddddc2d` (light moderation) — the two claimed tasks, marked `done` by L-2. Verified.
- `open` (todo): `8828484f` (polish: muted-member indicator padding), `ca43eb12` (delete-any UI E2E, second-client fan-out assertion).

**Verdict: M8 stays `in_progress`.** `open_count = 2 > 0` → not structurally complete. Mechanical, unambiguous — no BOARD / no escalation. **`## Success metric` left as `_TBD by founder_`** — a known founder-checkpoint item, explicitly NOT finalized here. No `milestones` UPDATE issued.

### Backlog assessment (Action 2 step 3)

PRODUCT-PRINCIPLES declares no explicit roadmap threshold → brain fallback `< 3 open tasks per milestone`. M8 `open_count = 2`, which is below the fallback line.

- **Flagged for N-1 as `backlog-stockout` (soft):** M8's per-milestone open count (2) is under threshold, and both open rows are polish/test-gap follow-ups rather than a net-new feature bundle — so N-1 should consider decomposing the next M8 feature bundle (scheduling / study-group / DMs / search per roadmap).
- **Mitigating context for N-1:** the global claimable pipeline is NOT starved — 14 unassigned `todo` + 1 unassigned `blocked` in the queue. The stockout is milestone-scoped, not pipeline-wide. N-1 owns final disposition (decompose vs. draw from unassigned queue).

### Seeding-stranding risk (flag for N-block — NOT fixed here)

Both open M8 rows (`8828484f`, `ca43eb12`) carry `wave_id = 6a583dad` (this closing wave) and `parent_task_id IS NULL` (both seeds). The N-2 seed selection consumes `wave_id IS NULL` rows; these two will **strand — never seedable** — unless their `wave_id` is nulled before N-2. This is the known V-2-follow-up-wave_id failure mode. **head-next / N-2 owns remediation** (out of L-1's docs lane); L-1 only surfaces it so it is not silently lost at handoff.

## Action 3 — README touchups

**SKIPPED.** The moderation feature adds no new env var, no new CLI command/flag, no new install step, no breaking change. README quick-start / env table / usage unchanged. Detail lives in CHANGELOG + PR #55. Skip recorded per Action 3 condition.

## Action 4 — Commit

FS touchups (CHANGELOG only) committed `docs: L-1 wave-41 closeout (changelog)` and pushed to `main` (direct doc commits allowed). SHA recorded in footer.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:74-75"
  - "milestones row UPDATE: none (M8 stays in_progress; open_count=2)"
  - "README.md commit: none (skipped)"
  - "commit SHA: 4b3cbf9 (pushed to main)"
changelog_entry_added: true
changelog_line_range: "CHANGELOG.md:74-75"
roadmap_milestones_progressed:
  - milestone: "M8 (84e17739)"
    before: in_progress
    after: in_progress
    note: "first slice; open_count=2; success-metric left _TBD by founder (checkpoint item)"
roadmap_skip_reason: ""
readme_sections_touched: []
flags_for_next_block:
  - kind: backlog-stockout
    scope: "M8 (84e17739)"
    detail: "open_count=2 < 3 fallback; both rows are polish/test follow-ups. Pipeline not globally starved (14 unassigned todo + 1 blocked). N-1 decides: decompose next M8 bundle vs. draw from unassigned queue."
  - kind: seed-stranding
    scope: "tasks 8828484f, ca43eb12"
    detail: "M8 open seeds carry wave_id=6a583dad (this wave); N-2 seeds only wave_id IS NULL. Will strand unless wave_id nulled before N-2. head-next/N-2 owns remediation."
note: "M8 first slice; success metric intentionally not finalized. L-2 runs in parallel; L-block exits once both L-1 and L-2 exit."
```
